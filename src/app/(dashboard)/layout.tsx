import { DashboardNav } from "@/components/layout/dashboard-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { getCurrentUser } from "@/lib/auth/session";
import { getActiveStages } from "@/lib/recruitment/queries";
import { RecruitmentReminderModal } from "@/components/recruitment-reminder-modal";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const avatar = user?.avatar ?? null;
  const initial = user?.email?.charAt(0).toUpperCase() ?? "用";

  const activeStages = await getActiveStages();

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <DashboardNav avatar={avatar} initial={initial} loggedIn={!!user} />
      <main className="container flex-1 py-6 sm:py-8">{children}</main>
      <SiteFooter />
      <RecruitmentReminderModal stages={activeStages} />
    </div>
  );
}