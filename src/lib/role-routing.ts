export type PortalRole = "admin" | "lawyer" | "staff" | string | null | undefined;

export function getPostLoginPath(role: PortalRole) {
  if (role === "staff") return "/staff";
  if (role === "admin") return "/admin";
  return "/admin/login";
}

export function canAccessAdminPortal(role: PortalRole) {
  return role === "admin";
}

export function canAccessStaffPortal(role: PortalRole) {
  return role === "staff" || role === "admin";
}

export function getUnauthorizedAdminRedirect(role: PortalRole) {
  return role === "staff" ? "/staff" : "/admin/login";
}

export function getUnauthorizedStaffRedirect(role: PortalRole) {
  return role === "admin" ? "/admin" : "/admin/login";
}
