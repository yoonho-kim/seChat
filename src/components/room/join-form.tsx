"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type JoinStep = 1 | 2 | 3 | 4;

const stepMeta: Record<JoinStep, { title: string; description: string }> = {
  1: {
    title: "상담방 코드 입력",
    description: "먼저 안내받은 4자리 상담방 코드를 입력해 주세요.",
  },
  2: {
    title: "역할 선택",
    description: "채팅방에서 사용할 역할을 선택해 주세요.",
  },
  3: {
    title: "표시 이름 입력",
    description: "대화에 표시될 이름을 입력해 주세요.",
  },
  4: {
    title: "입장 전 안내사항",
    description: "아래 내용을 확인한 뒤 입장해 주세요.",
  },
};

const roleOptions = [
  {
    value: "counselor",
    label: "상담사",
    description: "상담 일정 및 관련 안내를 진행합니다.",
  },
  {
    value: "client",
    label: "내담자",
    description: "상담 일정 조율 및 문의를 진행합니다.",
  },
] as const;

const notices = [
  "채팅방에서는 일정 조율 또는 간단한 상담과 관련된 문의만 가능합니다.",
  "상담이나 고민은 확인되면 불가능합니다.",
  "관리자의 판단하에 채팅방은 상담이 완료되면 폐기됩니다. (기록 저장되지 않음)",
  "관리자가 일정 및 관련 문의 확인을 위해 채팅 기록 열람이 가능합니다.",
  "전화번호나 개인정보는 작성할 수 없습니다.",
];

export function JoinForm() {
  const router = useRouter();
  const [step, setStep] = useState<JoinStep>(1);
  const [code, setCode] = useState("");
  const [role, setRole] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  function validateStep(currentStep: JoinStep) {
    if (currentStep === 1 && code.length !== 4) {
      toast.error("상담방 코드를 4자리로 입력해 주세요");
      return false;
    }

    if (currentStep === 2 && !role) {
      toast.error("역할을 선택해 주세요");
      return false;
    }

    if (currentStep === 3 && !displayName.trim()) {
      toast.error("표시 이름을 입력해 주세요");
      return false;
    }

    return true;
  }

  const canProceed =
    step === 1
      ? code.length === 4
      : step === 2
        ? Boolean(role)
        : step === 3
          ? Boolean(displayName.trim())
          : true;

  async function submitJoin() {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          role,
          displayName: displayName.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "상담방 입장에 실패했습니다");
        return;
      }

      router.push(`/chat/${data.roomId}`);
    } catch {
      toast.error("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (step < 4) {
      if (!validateStep(step)) return;
      setStep((prev) => Math.min(prev + 1, 4) as JoinStep);
      return;
    }

    await submitJoin();
  }

  function handleBack() {
    setStep((prev) => Math.max(prev - 1, 1) as JoinStep);
  }

  return (
    <section className="w-full max-w-[680px] space-y-8">
      <header className="space-y-4 border-b border-border/55 pb-6">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>입장 단계 {step}/4</span>
          <span>{stepMeta[step].title}</span>
        </div>
        <div className="h-px w-full bg-border/60">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
        <h2 className="text-[1.55rem] leading-snug text-foreground">
          {stepMeta[step].title}
        </h2>
        <p className="m-0 text-[0.98rem] leading-relaxed text-muted-foreground">
          {stepMeta[step].description}
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        {step === 1 && (
          <div className="space-y-1">
            <Input
              id="code"
              type="text"
              maxLength={4}
              inputMode="numeric"
              pattern="[0-9]{4}"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="1234"
              aria-label="상담방 코드"
              className="h-14 rounded-none border-0 border-b border-border/70 bg-transparent px-0 text-center text-[1.6rem] tracking-[0.22em] focus-visible:border-primary focus-visible:ring-0"
              autoFocus
              required
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-2">
            <div className="grid divide-y divide-border/55 border-y border-border/55">
              {roleOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRole(option.value)}
                  aria-pressed={role === option.value}
                  className={cn(
                    "flex items-start justify-between gap-3 border-l-2 py-4 pr-1 text-left transition-colors",
                    role === option.value
                      ? "border-primary bg-primary/[0.045] pl-3 text-foreground"
                      : "border-transparent pl-4 text-foreground/70 hover:text-foreground"
                  )}
                >
                  <span>
                    <span className="block text-base font-medium">
                      {option.label}
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {option.description}
                    </span>
                  </span>
                  {role === option.value && (
                    <span className="shrink-0 text-xs font-medium text-primary">
                      선택됨
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-1">
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="이름을 입력하세요"
              maxLength={100}
              aria-label="표시 이름"
              className="h-12 rounded-none border-0 border-b border-border/70 bg-transparent px-0 text-base focus-visible:border-primary focus-visible:ring-0"
              autoFocus
              required
            />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-2">
            <ul className="space-y-2 pl-5 text-[0.98rem] leading-relaxed text-foreground/90">
              {notices.map((notice) => (
                <li key={notice} className="list-disc">
                  {notice}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center gap-3 border-t border-border/55 pt-5">
          {step > 1 && (
            <Button
              type="button"
              variant="ghost"
              className="h-10 px-2 text-muted-foreground hover:text-foreground"
              onClick={handleBack}
            >
              이전
            </Button>
          )}
          <Button
            type="submit"
            className={cn(
              "h-10 px-6",
              step > 1 ? "ml-auto" : "w-full"
            )}
            disabled={loading || !canProceed}
          >
            {step === 4 ? (loading ? "입장 중..." : "입장하기") : "다음"}
          </Button>
        </div>
      </form>
    </section>
  );
}
