"use client";

import { useMutation } from "@tanstack/react-query";

import { login, logout, register, type LoginInput, type RegisterInput } from "@/lib/api/auth";

export function useLogin() {
  return useMutation({ mutationFn: (input: LoginInput) => login(input) });
}

export function useRegister() {
  return useMutation({ mutationFn: (input: RegisterInput) => register(input) });
}

export function useLogout() {
  return useMutation({ mutationFn: () => logout() });
}
