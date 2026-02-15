import Link from "next/link";
import { JoinForm } from "@/components/room/join-form";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <div className="reading-container flex min-h-screen flex-col items-center justify-center gap-12">
        <div className="text-center">
          <h1 className="mb-3 mt-0 text-4xl">SeChat</h1>
          <p className="mx-auto max-w-[42ch] text-muted-foreground">
            상담 일정 조율과 관련 문의를 위한 채팅입니다. 단계별로 천천히 입력하고 입장해 주세요.
          </p>
        </div>
        <JoinForm />
        <Link
          href="/admin/login"
          className="text-sm text-muted-foreground hover:underline"
        >
          관리자 로그인
        </Link>
      </div>
    </main>
  );
}
