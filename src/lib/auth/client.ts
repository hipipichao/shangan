"use client";

import type { CurrentUser } from "@/lib/auth/session";

export const authClient = {
  async getSession(): Promise<{ data: { user: CurrentUser | null } }> {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      const data = await res.json();
      return { data: { user: data.user ?? null } };
    } catch {
      return { data: { user: null } };
    }
  },
};