"use client";

import { useMutation } from "@tanstack/react-query";

import { login, logout, register, forgotPassword, resetPassword, type LoginInput, type RegisterInput, type ForgotPasswordInput, type ResetPasswordInput } from "@/lib/api/auth";

export function useLogin() {
  return useMutation({ mutationFn: (input: LoginInput) => login(input) });
}

export function useRegister() {
  return useMutation({ mutationFn: (input: RegisterInput) => register(input) });
}

export function useLogout() {
  return useMutation({ mutationFn: () => logout() });
}

export function useForgotPassword() {
  return useMutation({ mutationFn: (input: ForgotPasswordInput) => forgotPassword(input) });
}

export function useResetPassword() {
  return useMutation({ mutationFn: (input: ResetPasswordInput) => resetPassword(input) });
}
