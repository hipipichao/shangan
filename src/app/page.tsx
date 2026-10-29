import { getCurrentUser } from "@/lib/auth/session";
import { getActiveStages } from "@/lib/recruitment/queries";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { ExamCountdown } from "@/components/exam-countdown";
import { RecruitmentReminderModal } from "@/components/recruitment-reminder-modal";

const SLOGANS = [
  {
    main: "星光不问赶路人，时光不负有心人",
    sub: "愿你笔锋所至，皆是星光",
  },
  {
    main: "千淘万漉虽辛苦，吹尽狂沙始到金",
    sub: "所有的努力，终会开花结果",
  },
  {
    main: "山高路远，看世界，也找自己",
    sub: "备考路上，你并不孤单",
  },
  {
    main: "日拱一卒，功不唐捐",
    sub: "每天进步一点点，上岸就在不远处",
  },
  {
    main: "追风赶月莫停留，平芜尽处是春山",
    sub: "再坚持一下，远方有春光等你",
  },
  {
    main: "博观而约取，厚积而薄发",
    sub: "积累的每一分，都将化作考场上的底气",
  },
  {
    main: "既然选择了远方，便只顾风雨兼程",
    sub: "上岸的路，一步一个脚印",
  },
  {
    main: "宝剑锋从磨砺出，梅花香自苦寒来",
    sub: "熬过这段时光，你会感谢现在的自己",
  },
  {
    main: "路虽远，行则将至；事虽难，做则必成",
    sub: "今天的坚持，是明天的底气",
  },
  {
    main: "种一棵树最好的时间是十年前，其次是现在",
    sub: "从今天开始，一切都来得及",
  },
];

export default async function RootPage() {
  const user = await getCurrentUser();
  const avatar = user?.avatar ?? null;
  const initial = user?.email?.charAt(0).toUpperCase() ?? "用";

  const slogan = SLOGANS[Math.floor(Math.random() * SLOGANS.length)];

  const activeStages = await getActiveStages();

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <DashboardNav avatar={avatar} initial={initial} loggedIn={!!user} />
      <main className="container flex-1 py-6 sm:py-10">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {user?.email ? `你好，${user.email.split("@")[0]}` : "欢迎来到岸上见"}
            </h1>
            <p className="mt-2 text-base text-muted-foreground">
              {user ? "今天也要加油备考哦" : "AI 公考备考助手，助你高效上岸"}
            </p>
          </div>

          <ExamCountdown />

          <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-8 text-center">
            <p className="text-2xl font-bold leading-relaxed text-brand-700 sm:text-3xl">
              {slogan.main}
            </p>
            <p className="mt-3 text-lg text-brand-600">{slogan.sub}</p>
            <p className="mt-1 text-sm text-brand-500">—— 岸上见，加油！</p>
          </div>
        </div>
      </main>
      <SiteFooter />
      <RecruitmentReminderModal stages={activeStages} />
    </div>
  );
}