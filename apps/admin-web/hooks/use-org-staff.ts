"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  assignOrgStaffRole,
  inviteOrgStaff,
  listOrgInvitations,
  listOrgStaff,
  removeOrgStaff,
  removeOrgStaffRole,
  restoreOrgStaff,
  revokeOrgInvitation,
  suspendOrgStaff,
  updateOrgStaff,
  type InviteStaffInput,
  type StaffRoleCode,
  type UpdateStaffInput,
} from "@/lib/api/org-staff";

export const orgStaffKeys = {
  all: ["org-staff"] as const,
  staff: (organizationId: string) =>
    [...orgStaffKeys.all, "staff", organizationId] as const,
  invitations: (organizationId: string) =>
    [...orgStaffKeys.all, "invitations", organizationId] as const,
};

function useInvalidateOrgStaff(organizationId: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: orgStaffKeys.staff(organizationId) });
    void queryClient.invalidateQueries({
      queryKey: orgStaffKeys.invitations(organizationId),
    });
  };
}

export function useOrgStaff(organizationId: string) {
  return useQuery({
    queryKey: orgStaffKeys.staff(organizationId),
    queryFn: () => listOrgStaff(organizationId),
    enabled: Boolean(organizationId),
  });
}

export function useOrgInvitations(organizationId: string) {
  return useQuery({
    queryKey: orgStaffKeys.invitations(organizationId),
    queryFn: () => listOrgInvitations(organizationId),
    enabled: Boolean(organizationId),
  });
}

export function useInviteOrgStaff(organizationId: string) {
  const invalidate = useInvalidateOrgStaff(organizationId);
  return useMutation({
    mutationFn: (input: InviteStaffInput) => inviteOrgStaff(organizationId, input),
    onSuccess: invalidate,
  });
}

export function useUpdateOrgStaff(organizationId: string) {
  const invalidate = useInvalidateOrgStaff(organizationId);
  return useMutation({
    mutationFn: ({ staffId, input }: { staffId: string; input: UpdateStaffInput }) =>
      updateOrgStaff(organizationId, staffId, input),
    onSuccess: invalidate,
  });
}

export function useSuspendOrgStaff(organizationId: string) {
  const invalidate = useInvalidateOrgStaff(organizationId);
  return useMutation({
    mutationFn: (staffId: string) => suspendOrgStaff(organizationId, staffId),
    onSuccess: invalidate,
  });
}

export function useRestoreOrgStaff(organizationId: string) {
  const invalidate = useInvalidateOrgStaff(organizationId);
  return useMutation({
    mutationFn: (staffId: string) => restoreOrgStaff(organizationId, staffId),
    onSuccess: invalidate,
  });
}

export function useRemoveOrgStaff(organizationId: string) {
  const invalidate = useInvalidateOrgStaff(organizationId);
  return useMutation({
    mutationFn: (staffId: string) => removeOrgStaff(organizationId, staffId),
    onSuccess: invalidate,
  });
}

export function useAssignOrgStaffRole(organizationId: string) {
  const invalidate = useInvalidateOrgStaff(organizationId);
  return useMutation({
    mutationFn: ({
      staffId,
      roleCode,
    }: {
      staffId: string;
      roleCode: StaffRoleCode;
    }) => assignOrgStaffRole(organizationId, staffId, roleCode),
    onSuccess: invalidate,
  });
}

export function useRemoveOrgStaffRole(organizationId: string) {
  const invalidate = useInvalidateOrgStaff(organizationId);
  return useMutation({
    mutationFn: ({ staffId, roleId }: { staffId: string; roleId: string }) =>
      removeOrgStaffRole(organizationId, staffId, roleId),
    onSuccess: invalidate,
  });
}

export function useRevokeOrgInvitation(organizationId: string) {
  const invalidate = useInvalidateOrgStaff(organizationId);
  return useMutation({
    mutationFn: (invitationId: string) =>
      revokeOrgInvitation(organizationId, invitationId),
    onSuccess: invalidate,
  });
}
