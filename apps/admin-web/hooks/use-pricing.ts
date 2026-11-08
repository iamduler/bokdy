"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  activateBranchPricingProfile,
  createBranchPricingProfile,
  duplicateBranchPricingProfile,
  getPriceVersion,
  getPricingProfile,
  listBranchHolidays,
  listCalendarHolidays,
  listOrganizationHolidays,
  listBranchPricingProfiles,
  listPriceVersions,
  replaceBranchHolidays,
  replaceCalendarHolidays,
  replaceOrganizationHolidays,
  saveBranchPricingProfile,
  type BranchPricingProfile,
  type HolidayOverlayInput,
  type SaveBranchPricingProfileRequest,
} from "@/lib/api/pricing";

export const pricingKeys = {
  all: ["pricing"] as const,
  versions: (organizationId: string) =>
    [...pricingKeys.all, "versions", organizationId] as const,
  version: (organizationId: string, id: string) =>
    [...pricingKeys.all, "version", organizationId, id] as const,
  profiles: (organizationId: string, branchId: string) =>
    [...pricingKeys.all, "profiles", organizationId, branchId] as const,
  profile: (id: string) => [...pricingKeys.all, "profile", id] as const,
};

export function usePriceVersions(organizationId: string) {
  return useQuery({
    queryKey: pricingKeys.versions(organizationId),
    queryFn: () => listPriceVersions(organizationId),
    enabled: Boolean(organizationId),
  });
}

export function useBranchPricingProfiles(organizationId: string, branchId: string) {
  return useQuery({
    queryKey: pricingKeys.profiles(organizationId, branchId),
    queryFn: () => listBranchPricingProfiles(organizationId, branchId),
    enabled: Boolean(organizationId && branchId),
  });
}

function usePricingMutation(
  organizationId: string,
  branchId: string,
  mutationFn: (
    input: SaveBranchPricingProfileRequest & { profileId?: string },
  ) => Promise<BranchPricingProfile>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (profile) => {
      void organizationId;
      void branchId;
      void queryClient.invalidateQueries({ queryKey: pricingKeys.all });
      void queryClient.invalidateQueries({ queryKey: pricingKeys.profile(profile.id) });
    },
  });
}

export function useCreateBranchPricing(organizationId: string, branchId: string) {
  return usePricingMutation(organizationId, branchId, (input) =>
    createBranchPricingProfile(organizationId, branchId, input),
  );
}

export function useSaveBranchPricing(organizationId: string, branchId: string) {
  return usePricingMutation(organizationId, branchId, (input) =>
    saveBranchPricingProfile(organizationId, branchId, input.profileId ?? "", input),
  );
}

export function useDuplicateBranchPricing(organizationId: string, branchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) => duplicateBranchPricingProfile(organizationId, branchId, profileId),
    onSuccess: (profile) => {
      void queryClient.invalidateQueries({ queryKey: pricingKeys.all });
      void queryClient.invalidateQueries({ queryKey: pricingKeys.profile(profile.id) });
    },
  });
}

export function useBranchHolidays(organizationId: string, branchId: string) {
  return useQuery({
    queryKey: [...pricingKeys.all, "holidays", organizationId, branchId],
    queryFn: () => listBranchHolidays(organizationId, branchId),
    enabled: Boolean(organizationId && branchId),
  });
}

export function useReplaceBranchHolidays(organizationId: string, branchId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (holidays: HolidayOverlayInput[]) =>
      replaceBranchHolidays(organizationId, branchId, holidays),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pricingKeys.all });
    },
  });
}

export function useOrganizationHolidays(organizationId: string) {
  return useQuery({
    queryKey: [...pricingKeys.all, "org-holidays", organizationId],
    queryFn: () => listOrganizationHolidays(organizationId),
    enabled: Boolean(organizationId),
  });
}

export function useReplaceOrganizationHolidays(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (holidays: HolidayOverlayInput[]) => replaceOrganizationHolidays(organizationId, holidays),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pricingKeys.all });
    },
  });
}

export function useCalendarHolidays() {
  return useQuery({
    queryKey: [...pricingKeys.all, "calendar-holidays"],
    queryFn: () => listCalendarHolidays(),
  });
}

export function useReplaceCalendarHolidays() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (holidays: { holiday_on: string; name: string }[]) => replaceCalendarHolidays(holidays),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pricingKeys.all });
    },
  });
}

export function useActivateBranchPricing(organizationId: string, branchId: string) {
  return usePricingMutation(organizationId, branchId, (input) =>
    activateBranchPricingProfile(organizationId, branchId, input.profileId ?? "", input),
  );
}

export function usePricingProfile(id: string, organizationId?: string) {
  return useQuery({
    queryKey: pricingKeys.profile(id),
    queryFn: () => getPricingProfile(id, organizationId),
    enabled: Boolean(id),
  });
}

export function usePriceVersion(organizationId: string, id: string | undefined) {
  return useQuery({
    queryKey: pricingKeys.version(organizationId, id ?? ""),
    queryFn: () => getPriceVersion(organizationId, id ?? ""),
    enabled: Boolean(organizationId && id),
  });
}
