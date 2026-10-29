import { redirect } from "next/navigation";
import { Suspense } from "react";
import { VerifyEmailForm } from "./verify-email-form";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ email?: string; sent?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: PageProps) {
  const { email } = await searchParams;
  const user = await getCurrentUser();

  if (user?.emailVerified) {
    redirect("/");
  }

  return (
    <Suspense>
      <VerifyEmailForm email={email || ""} />
    </Suspense>
  );
}