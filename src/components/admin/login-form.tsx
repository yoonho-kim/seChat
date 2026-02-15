"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "로그인에 실패했습니다");
        return;
      }

      router.push("/admin/dashboard");
    } catch {
      toast.error("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="w-full max-w-md space-y-8">
      <header className="space-y-3 border-b border-border/55 pb-6">
        <h1 className="text-[1.7rem] leading-snug text-foreground">
          관리자 로그인
        </h1>
        <p className="m-0 text-[0.98rem] text-muted-foreground">
          상담방 관리를 위해 로그인하세요
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@sechat.com"
            className="h-11 rounded-none border-0 border-b border-border/70 bg-transparent px-0 focus-visible:border-primary focus-visible:ring-0"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">비밀번호</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 rounded-none border-0 border-b border-border/70 bg-transparent px-0 focus-visible:border-primary focus-visible:ring-0"
            required
          />
        </div>
        <Button type="submit" className="h-10 w-full" disabled={loading}>
          {loading ? "로그인 중..." : "로그인"}
        </Button>
      </form>
    </section>
  );
}
