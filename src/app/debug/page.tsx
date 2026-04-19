"use client";

import { useEffect, useState } from "react";

type MemoryInfo = {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
};

type PerfWithMemory = Performance & { memory?: MemoryInfo };

export default function DebugPage() {
  const [info, setInfo] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const orig = window.onerror;
    window.onerror = (msg, src, line) => {
      setErrors((e) => [...e.slice(-9), `${msg} @ ${src}:${line}`]);
      return false;
    };
    const onReject = (e: PromiseRejectionEvent) => {
      setErrors((errs) => [...errs.slice(-9), `Promise: ${String(e.reason)}`]);
    };
    window.addEventListener("unhandledrejection", onReject);
    return () => {
      window.onerror = orig;
      window.removeEventListener("unhandledrejection", onReject);
    };
  }, []);

  useEffect(() => {
    const update = () => {
      const nav = navigator;
      const perf = performance as PerfWithMemory;
      const mem = perf.memory;
      const next: Record<string, string> = {
        UA: nav.userAgent,
        화면: `${window.innerWidth} x ${window.innerHeight}`,
        DPR: String(window.devicePixelRatio),
        온라인: String(nav.onLine),
        "메모리(MB)": mem
          ? `사용 ${Math.round(mem.usedJSHeapSize / 1048576)} / 총 ${Math.round(mem.totalJSHeapSize / 1048576)} / 한도 ${Math.round(mem.jsHeapSizeLimit / 1048576)}`
          : "(이 브라우저는 메모리 정보 미지원)",
        URL: window.location.href,
        시각: new Date().toLocaleTimeString(),
        틱: String(tick),
      };
      setInfo(next);
    };
    update();
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [tick]);

  return (
    <div style={{ padding: 16, fontFamily: "monospace", fontSize: 12, lineHeight: 1.6 }}>
      <h1 style={{ fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>📱 디버그 정보</h1>

      <div style={{ background: "#f3f4f6", padding: 12, borderRadius: 8, marginBottom: 12 }}>
        {Object.entries(info).map(([k, v]) => (
          <div key={k} style={{ marginBottom: 6, wordBreak: "break-all" }}>
            <strong>{k}:</strong> {v}
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 14, fontWeight: "bold", marginBottom: 8 }}>
        🚨 에러 ({errors.length})
      </h2>
      <div style={{ background: errors.length ? "#fee2e2" : "#f3f4f6", padding: 12, borderRadius: 8, minHeight: 80 }}>
        {errors.length === 0 ? (
          <span style={{ color: "#16a34a" }}>에러 없음 ✓</span>
        ) : (
          errors.map((e, i) => (
            <div key={i} style={{ marginBottom: 8, color: "#991b1b", wordBreak: "break-all" }}>
              {e}
            </div>
          ))
        )}
      </div>

      <p style={{ marginTop: 16, color: "#6b7280" }}>
        이 페이지를 열어두고 다른 탭에서 멈춤 재현 → 다시 이 페이지로 와서 메모리·에러 확인
      </p>
    </div>
  );
}
