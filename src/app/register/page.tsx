import { redirect } from "next/navigation";
import { Suspense } from "react";
import { RegisterForm } from "./register-form";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/");
  }
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}