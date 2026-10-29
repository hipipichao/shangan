import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/");
  }
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}