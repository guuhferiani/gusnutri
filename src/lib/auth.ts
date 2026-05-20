import { createAuthClient } from "better-auth/react"

const AUTH_URL = import.meta.env.VITE_AUTH_URL;

console.log("GusNutri Auth Debug:", {
  url: AUTH_URL,
  env: import.meta.env
});

export const authClient = createAuthClient({
    baseURL: AUTH_URL
})

export const { signIn, signUp, useSession, signOut } = authClient;
