import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NewRecruitmentForm } from "./recruitment-form";

export default function NewRecruitmentPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" aria-label="返回">
          <Link href="/recruitments">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            添加报考日程
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            手动填写报名、笔试、面试等关键时间节点
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">报考信息</CardTitle>
        </CardHeader>
        <CardContent>
          <NewRecruitmentForm />
        </CardContent>
      </Card>
    </div>
  );
}