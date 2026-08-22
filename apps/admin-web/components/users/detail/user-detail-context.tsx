"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { UserAudience } from "@/lib/api/admin-users";

export type UserDetailRecord = {
  id: string;
  public_id: string;
  email?: string;
  display_name?: string;
  full_name?: string;
  phone?: string;
  status: string;
  is_system_admin: boolean;
  last_login_at?: string | null;
  email_verified_at?: string | null;
  phone_verified_at?: string | null;
  created_at?: string;
  staff_role?: string;
  staff_title?: string;
  primary_organization?: { id: string; name?: string; code?: string };
};

type UserDetailContextValue = {
  user: UserDetailRecord;
  userId: string;
  audience: UserAudience;
};

const UserDetailContext = createContext<UserDetailContextValue | null>(null);

export function UserDetailProvider({
  user,
  userId,
  audience,
  children,
}: UserDetailContextValue & { children: ReactNode }) {
  return (
    <UserDetailContext.Provider value={{ user, userId, audience }}>
      {children}
    </UserDetailContext.Provider>
  );
}

export function useUserDetail() {
  const ctx = useContext(UserDetailContext);
  if (!ctx) throw new Error("useUserDetail must be used within UserDetailProvider");
  return ctx;
}

export function userDisplayName(user: UserDetailRecord) {
  return user.display_name || user.full_name || user.email || user.public_id;
}
