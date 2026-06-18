import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type StaffAction = "list" | "create" | "delete";

type ManageStaffBody = {
  action?: StaffAction;
  user_id?: string;
  full_name?: string;
  email?: string;
  password?: string;
};

type StaffRoleRow = {
  user_id: string;
  full_name: string | null;
  role: "staff";
  created_at: string;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceKey) {
      return jsonResponse({ error: "Supabase function secrets are not configured." }, 500);
    }

    const authorization = req.headers.get("Authorization");
    if (!authorization) {
      return jsonResponse({ error: "Missing authorization header." }, 401);
    }

    const accessToken = authorization.replace(/^Bearer\s+/i, "").trim();
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser(accessToken);

    if (userError || !user) {
      return jsonResponse({ error: "Invalid admin session." }, 401);
    }

    const { data: callerRole, error: roleError } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleError || callerRole?.role !== "admin") {
      return jsonResponse({ error: "Admin role required." }, 403);
    }

    const adminClient = createClient(supabaseUrl, serviceKey);
    const body = (await req.json()) as ManageStaffBody;

    switch (body.action) {
      case "list": {
        const { data: roleRows, error: listError } = await adminClient
          .from("user_roles")
          .select("user_id, full_name, role, created_at")
          .eq("role", "staff")
          .order("created_at", { ascending: false });

        if (listError) {
          return jsonResponse({ error: listError.message }, 400);
        }

        const {
          data: { users },
          error: usersError,
        } = await adminClient.auth.admin.listUsers();

        if (usersError) {
          return jsonResponse({ error: usersError.message }, 400);
        }

        const nameByUserId = new Map(
          users.map((u) => [u.id, u.user_metadata?.name || u.raw_user_meta_data?.name]),
        );
        const emailByUserId = new Map(users.map((staffUser) => [staffUser.id, staffUser.email]));
        const staff = ((roleRows || []) as StaffRoleRow[]).map((roleRow) => ({
          user_id: roleRow.user_id,
          full_name: nameByUserId.get(roleRow.user_id) || roleRow.full_name || null,
          email: emailByUserId.get(roleRow.user_id) || null,
          created_at: roleRow.created_at,
        }));

        return jsonResponse({ success: true, staff });
      }

      case "create": {
        if (!body.full_name || !body.email || !body.password) {
          return jsonResponse({ error: "full_name, email, and password are required." }, 400);
        }

        const { data: created, error: createError } = await adminClient.auth.admin.createUser({
          email: body.email,
          password: body.password,
          email_confirm: true,
          user_metadata: { name: body.full_name },
        });

        if (createError || !created.user) {
          return jsonResponse(
            { error: createError?.message || "Failed to create staff user." },
            400,
          );
        }

        const { error: roleInsertError } = await adminClient.from("user_roles").upsert(
          {
            user_id: created.user.id,
            full_name: body.full_name,
            role: "staff",
          },
          { onConflict: "user_id" },
        );

        if (roleInsertError) {
          await adminClient.auth.admin.deleteUser(created.user.id);
          return jsonResponse({ error: roleInsertError.message }, 400);
        }

        return jsonResponse({ success: true, user_id: created.user.id });
      }

      case "delete": {
        if (!body.user_id) {
          return jsonResponse({ error: "user_id is required." }, 400);
        }

        const { error: roleDeleteError } = await adminClient
          .from("user_roles")
          .delete()
          .eq("user_id", body.user_id)
          .eq("role", "staff");

        if (roleDeleteError) {
          return jsonResponse({ error: roleDeleteError.message }, 400);
        }

        const { error: deleteError } = await adminClient.auth.admin.deleteUser(body.user_id);
        if (deleteError) {
          return jsonResponse({ error: deleteError.message }, 400);
        }

        return jsonResponse({ success: true });
      }

      default:
        return jsonResponse({ error: "Unsupported staff action." }, 400);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected staff management error";
    return jsonResponse({ error: message }, 500);
  }
});
