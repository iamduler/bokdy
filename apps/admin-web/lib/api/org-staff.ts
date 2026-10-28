import type { components } from "@bokdy/sdk/schema";

import { apiGo } from "@/lib/api/client";

export type StaffMember = components["schemas"]["StaffMember"];
export type StaffRole = components["schemas"]["StaffRole"];
export type StaffStatus = StaffMember["status"];
export type StaffRoleCode = StaffRole["code"];
export type InvitationSummary = components["schemas"]["InvitationSummary"];
export type Invitation = components["schemas"]["Invitation"];

export type InviteStaffInput = {
  email: string;
  role_code?: StaffRoleCode;
};

export type UpdateStaffInput = {
  title?: string;
  branch_id?: string | null;
};

function orgHeaders(organizationId: string): HeadersInit {
  return { "X-Organization-ID": organizationId };
}

function staffPath(organizationId: string, staffId?: string) {
  const base = `organizations/${encodeURIComponent(organizationId)}/staff`;
  return staffId ? `${base}/${encodeURIComponent(staffId)}` : base;
}

function invitationsPath(organizationId: string, invitationId?: string) {
  const base = `organizations/${encodeURIComponent(organizationId)}/invitations`;
  return invitationId ? `${base}/${encodeURIComponent(invitationId)}` : base;
}

export function listOrgStaff(organizationId: string) {
  return apiGo<StaffMember[]>(staffPath(organizationId), {
    headers: orgHeaders(organizationId),
  });
}

export function updateOrgStaff(
  organizationId: string,
  staffId: string,
  input: UpdateStaffInput,
) {
  return apiGo<StaffMember>(staffPath(organizationId, staffId), {
    method: "PATCH",
    headers: orgHeaders(organizationId),
    body: JSON.stringify(input),
  });
}

export function suspendOrgStaff(organizationId: string, staffId: string) {
  return apiGo<void>(`${staffPath(organizationId, staffId)}/suspend`, {
    method: "POST",
    headers: orgHeaders(organizationId),
  });
}

export function restoreOrgStaff(organizationId: string, staffId: string) {
  return apiGo<void>(`${staffPath(organizationId, staffId)}/restore`, {
    method: "POST",
    headers: orgHeaders(organizationId),
  });
}

export function removeOrgStaff(organizationId: string, staffId: string) {
  return apiGo<void>(staffPath(organizationId, staffId), {
    method: "DELETE",
    headers: orgHeaders(organizationId),
  });
}

export function assignOrgStaffRole(
  organizationId: string,
  staffId: string,
  role_code: StaffRoleCode,
) {
  return apiGo<void>(`${staffPath(organizationId, staffId)}/roles`, {
    method: "POST",
    headers: orgHeaders(organizationId),
    body: JSON.stringify({ role_code }),
  });
}

export function removeOrgStaffRole(
  organizationId: string,
  staffId: string,
  roleId: string,
) {
  return apiGo<void>(
    `${staffPath(organizationId, staffId)}/roles/${encodeURIComponent(roleId)}`,
    {
      method: "DELETE",
      headers: orgHeaders(organizationId),
    },
  );
}

export function listOrgInvitations(organizationId: string) {
  return apiGo<InvitationSummary[]>(invitationsPath(organizationId), {
    headers: orgHeaders(organizationId),
  });
}

export function inviteOrgStaff(organizationId: string, input: InviteStaffInput) {
  return apiGo<Invitation>(invitationsPath(organizationId), {
    method: "POST",
    headers: orgHeaders(organizationId),
    body: JSON.stringify(input),
  });
}

export function revokeOrgInvitation(organizationId: string, invitationId: string) {
  return apiGo<void>(`${invitationsPath(organizationId, invitationId)}/revoke`, {
    method: "POST",
    headers: orgHeaders(organizationId),
  });
}
