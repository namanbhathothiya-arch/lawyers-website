import { describe, expect, it } from "vitest";

import {
  canAccessAdminPortal,
  canAccessStaffPortal,
  getPostLoginPath,
  getUnauthorizedAdminRedirect,
  getUnauthorizedStaffRedirect,
} from "./role-routing";

describe("role routing", () => {
  it("routes authenticated users to the correct portal after login", () => {
    expect(getPostLoginPath("admin")).toBe("/admin");
    expect(getPostLoginPath("staff")).toBe("/staff");
    expect(getPostLoginPath("doctor")).toBe("/admin/login");
    expect(getPostLoginPath(null)).toBe("/admin/login");
  });

  it("protects admin routes from staff users", () => {
    expect(canAccessAdminPortal("admin")).toBe(true);
    expect(canAccessAdminPortal("staff")).toBe(false);
    expect(getUnauthorizedAdminRedirect("staff")).toBe("/staff");
  });

  it("allows staff and admin into the staff portal", () => {
    expect(canAccessStaffPortal("staff")).toBe(true);
    expect(canAccessStaffPortal("admin")).toBe(true);
    expect(canAccessStaffPortal("doctor")).toBe(false);
    expect(getUnauthorizedStaffRedirect("doctor")).toBe("/admin/login");
    expect(getUnauthorizedStaffRedirect("admin")).toBe("/admin");
  });
});
