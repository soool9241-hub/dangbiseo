"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    router.push("/dashboard");
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-teal-600">당비서</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          당뇨 관리의 든든한 비서
        </p>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg">로그인</CardTitle>
          <CardDescription>이메일과 비밀번호를 입력해주세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">이메일</Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">비밀번호</Label>
              <div className="relative">
                <Lock className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="mt-2 h-10 w-full bg-teal-600 text-white hover:bg-teal-700"
            >
              로그인
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col items-center gap-2 text-sm">
        <Link
          href="/signup"
          className="font-medium text-teal-600 hover:underline"
        >
          회원가입
        </Link>
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:underline"
        >
          둘러보기
        </Link>
      </div>
    </div>
  );
}
