"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

import { updateRecruitment } from "@/lib/recruitment/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EditRecruitmentFormProps {
  data: {
    id: string;
    title: string;
    registrationStart: string;
    registrationEnd: string;
    admissionTicketStart: string;
    admissionTicketEnd: string;
    writtenExamDate: string;
    interviewDate: string;
    sourceUrl: string;
    userNote: string;
  };
}

export function EditRecruitmentForm({ data }: EditRecruitmentFormProps) {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const [title, setTitle] = useState(data.title);
  const [registrationStart, setRegistrationStart] = useState(data.registrationStart);
  const [registrationEnd, setRegistrationEnd] = useState(data.registrationEnd);
  const [admissionTicketStart, setAdmissionTicketStart] = useState(data.admissionTicketStart);
  const [admissionTicketEnd, setAdmissionTicketEnd] = useState(data.admissionTicketEnd);
  const [writtenExamDate, setWrittenExamDate] = useState(data.writtenExamDate);
  const [interviewDate, setInterviewDate] = useState(data.interviewDate);
  const [sourceUrl, setSourceUrl] = useState(data.sourceUrl);
  const [userNote, setUserNote] = useState(data.userNote);

  return (
    <form action={updateRecruitment} className="space-y-6">
      <input type="hidden" name="id" value={data.id} />

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">
          报考标题 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="registrationStart">报名开始时间</Label>
          <Input
            id="registrationStart"
            name="registrationStart"
            type="date"
            value={registrationStart}
            onChange={(e) => setRegistrationStart(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="registrationEnd">报名结束时间</Label>
          <Input
            id="registrationEnd"
            name="registrationEnd"
            type="date"
            value={registrationEnd}
            onChange={(e) => setRegistrationEnd(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="admissionTicketStart">准考证打印开始</Label>
          <Input
            id="admissionTicketStart"
            name="admissionTicketStart"
            type="date"
            value={admissionTicketStart}
            onChange={(e) => setAdmissionTicketStart(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="admissionTicketEnd">准考证打印结束</Label>
          <Input
            id="admissionTicketEnd"
            name="admissionTicketEnd"
            type="date"
            value={admissionTicketEnd}
            onChange={(e) => setAdmissionTicketEnd(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="writtenExamDate">笔试时间</Label>
          <Input
            id="writtenExamDate"
            name="writtenExamDate"
            type="date"
            value={writtenExamDate}
            onChange={(e) => setWrittenExamDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="interviewDate">面试时间</Label>
          <Input
            id="interviewDate"
            name="interviewDate"
            type="date"
            value={interviewDate}
            onChange={(e) => setInterviewDate(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sourceUrl">报考链接</Label>
        <Input
          id="sourceUrl"
          name="sourceUrl"
          type="url"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="userNote">备注</Label>
        <Textarea
          id="userNote"
          name="userNote"
          rows={3}
          value={userNote}
          onChange={(e) => setUserNote(e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full">
        保存修改
      </Button>
    </form>
  );
}