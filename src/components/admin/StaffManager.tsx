import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type StaffUser = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
};

type ManageStaffResponse = {
  success?: boolean;
  user_id?: string;
  staff?: StaffUser[];
  error?: string;
};

async function invokeManageStaff(body: Record<string, unknown>) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  const accessToken = session?.access_token;
  if (sessionError || !accessToken) {
    throw new Error("Admin session is missing. Please sign in again.");
  }

  const { data, error } = await supabase.functions.invoke<ManageStaffResponse>("manage-staff", {
    body,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export function StaffManager() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const {
    data: staff,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-staff"],
    queryFn: async () => {
      const result = await invokeManageStaff({ action: "list" });
      return result?.staff || [];
    },
  });

  const createStaffMutation = useMutation({
    mutationFn: async () =>
      invokeManageStaff({
        action: "create",
        full_name: fullName.trim(),
        email: email.trim(),
        password,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
      toast.success("Staff account created.");
      setIsCreateOpen(false);
      setFullName("");
      setEmail("");
      setPassword("");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create staff account.");
    },
  });

  const deleteStaffMutation = useMutation({
    mutationFn: async (userId: string) =>
      invokeManageStaff({
        action: "delete",
        user_id: userId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
      toast.success("Staff account deleted.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete staff account.");
    },
  });

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();

    if (!fullName.trim() || !email.trim() || password.length < 8) {
      toast.error("Enter a full name, valid email, and password with at least 8 characters.");
      return;
    }

    await createStaffMutation.mutateAsync();
  }

  async function handleDelete(staffUser: StaffUser) {
    const label = staffUser.full_name || staffUser.email || staffUser.user_id;
    if (!window.confirm(`Delete staff account ${label}?`)) return;
    await deleteStaffMutation.mutateAsync(staffUser.user_id);
  }

  return (
    <>
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold">Staff Management</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Create staff sign-ins and manage staff account access.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Staff
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-20 text-center flex flex-col items-center gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading staff accounts...</p>
            </div>
          ) : isError ? (
            <div className="py-20 text-center text-destructive border border-dashed border-destructive/20 rounded-xl bg-destructive/5">
              <p className="font-semibold">Error loading staff</p>
              <p className="text-sm mt-1">{error?.message || "Unknown error occurred"}</p>
            </div>
          ) : !staff || staff.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-border rounded-xl bg-secondary/10">
              <p className="font-semibold">No staff accounts yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add a staff account so they can sign in through the law firm portal.
              </p>
            </div>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden bg-background">
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader className="bg-secondary/40">
                    <TableRow>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.map((staffUser) => (
                      <TableRow key={staffUser.user_id} className="hover:bg-secondary/25">
                        <TableCell className="font-medium">
                          {staffUser.full_name || "Unnamed Staff"}
                        </TableCell>
                        <TableCell>{staffUser.email || "No email"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">staff</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(staffUser.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(staffUser)}
                            disabled={deleteStaffMutation.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md bg-background border border-border">
          <DialogHeader>
            <DialogTitle>Create Staff Account</DialogTitle>
            <DialogDescription>
              Staff will sign in with this email and temporary password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="staff-full-name">Full name</Label>
              <Input
                id="staff-full-name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Receptionist name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="staff-email">Email</Label>
              <Input
                id="staff-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="staff@clinic.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="staff-password">Password</Label>
              <Input
                id="staff-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
            <DialogFooter className="pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createStaffMutation.isPending}>
                <UserPlus className="h-4 w-4 mr-1" />
                {createStaffMutation.isPending ? "Creating..." : "Create Staff"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
