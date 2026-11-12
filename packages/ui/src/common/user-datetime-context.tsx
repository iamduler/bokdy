"use client";

import { createContext, useContext, type ReactNode } from "react";

import { DEFAULT_USER_DATETIME, type UserDateTimePrefs } from "./user-datetime";

const UserDateTimeContext = createContext<UserDateTimePrefs>(DEFAULT_USER_DATETIME);

export function UserDateTimeProvider({
  value,
  children,
}: {
  value: UserDateTimePrefs;
  children: ReactNode;
}) {
  return <UserDateTimeContext.Provider value={value}>{children}</UserDateTimeContext.Provider>;
}

export function useUserDateTimePrefs() {
  return useContext(UserDateTimeContext);
}
