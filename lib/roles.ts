import type { Role } from "./accounts";

/** Where each role lands after signing in. */
export function homeFor(role: Role) {
  return role === "admin" ? "/admin" : role === "vendor" ? "/manage" : "/";
}
