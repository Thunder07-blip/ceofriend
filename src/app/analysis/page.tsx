"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Shield,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FileSearch,
  Brain,
  TrendingUp,
  DollarSign,
  FileText,
} from "lucide-react";
import type { PipelineResult } from "@/lib/types";

const STAGES = [
  { id: "connect", label: "Connecting to repository...", icon: FileSearch },
  { id: "repo", label: "Analyzing repository structure & history...", icon: FileSearch },
  { id: "risk", label: "Calculating risk scores for each component...", icon: Brain },
  { id: "predict", label: "Predicting failure probability (90-day forecast)...", icon: TrendingUp },
  { id: "impact", label: "Mapping technical risks to financial impact...", icon: DollarSign },
  { id: "report", label: "Generating CEO-friendly business report...", icon: FileText },
];

function AnalysisContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const repoUrl = searchParams.get("repo") || "";

  const [currentStage, setCurrentStage] = useState(0);
  const [stageStatuses, setStageStatuses] = useState<("pending" | "active" | "done" | "error")[]>(
    STAGES.map(() => "pending")
  );
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({ files: 0, risks: 0, loss: "₹0" });
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!repoUrl || hasStarted.current) return;
    hasStarted.current = true;

    const runAnalysis = async () => {
      const stageTimer = animateStages();

      try {
        // Read company context if the CEO provided it
        const companyRaw = sessionStorage.getItem("ceofriend_company");
        const companyContext = companyRaw ? JSON.parse(companyRaw) : null;

        const res = await fetch("/api/analyze-repo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repoUrl, companyContext }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Analysis failed");
        }

        clearInterval(stageTimer);
        setResult(data.data);
        setStageStatuses(STAGES.map(() => "done"));
        setCurrentStage(STAGES.length);

        const pipeline = data.data as PipelineResult;
        setMetrics({
          files: pipeline.repoData?.files.length || 0,
          risks: pipeline.riskData?.files.filter((f: { riskScore: number }) => f.riskScore >= 60).length || 0,
          loss: pipeline.impactData ? `₹${pipeline.impactData.totalRiskExposure.toLocaleString("en-IN")}` : "₹0",
        });

        sessionStorage.setItem("ceofriend_result", JSON.stringify(data.data));
        setTimeout(() => router.push("/dashboard"), 2500);
      } catch (err) {
        clearInterval(stageTimer);
        setError(err instanceof Error ? err.message : "An error occurred");
        setStageStatuses((prev) => {
          const next = [...prev];
          const activeIdx = next.findIndex((s) => s === "active");
          if (activeIdx >= 0) next[activeIdx] = "error";
          return next;
        });
      }
    };

    const animateStages = () => {
      let stage = 0;
      setStageStatuses((prev) => {
        const next = [...prev];
        next[0] = "active";
        return next;
      });

      return setInterval(() => {
        stage++;
        if (stage < STAGES.length) {
          setCurrentStage(stage);
          setStageStatuses((prev) => {
            const next = [...prev];
            if (stage > 0) next[stage - 1] = "done";
            next[stage] = "active";
            return next;
          });
          setMetrics((prev) => ({
            files: Math.min(prev.files + Math.floor(Math.random() * 5) + 1, 20),
            risks: Math.min(prev.risks + Math.floor(Math.random() * 2), 5),
            loss: `₹${((prev.files + 1) * 30000).toLocaleString("en-IN")}`,
          }));
        }
      }, 2000);
    };

    runAnalysis();
  }, [repoUrl, router]);

  if (!repoUrl) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <AlertTriangle style={{ width: 48, height: 48, color: "#f97316", margin: "0 auto 16px" }} />
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No Repository Specified</h1>
          <p style={{ color: "rgba(232,234,240,0.45)", marginBottom: 16 }}>Please go back and enter a repository URL.</p>
          <button onClick={() => router.push("/")} style={{ padding: "8px 24px", borderRadius: 8, background: "#6366f1", color: "white", border: "none", cursor: "pointer" }}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-inner">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Shield style={{ width: 24, height: 24, color: "#6366f1" }} />
            <span style={{ fontWeight: 700 }} className="gradient-text">CEOfriend</span>
            <span style={{ color: "rgba(232,234,240,0.25)", marginLeft: 16, fontSize: 13 }}>Analyzing...</span>
          </div>
        </div>
      </nav>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "96px 24px 48px" }}>
        {/* Header */}
        <div className="animate-fade-in" style={{ textAlign: "center", marginBottom: 48 }}>
          <div className="animate-pulse-glow" style={{ width: 64, height: 64, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", background: "rgba(99, 102, 241, 0.15)" }}>
            <Brain style={{ width: 32, height: 32, color: "#6366f1" }} />
          </div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, marginBottom: 8 }}>Analyzing Your System</h1>
          <p style={{ color: "rgba(232,234,240,0.4)", fontSize: 13, fontFamily: "monospace" }}>{repoUrl}</p>
        </div>

        {/* Live Metrics */}
        <div className="metrics-grid" style={{ marginBottom: 48, maxWidth: 420, width: "100%" }}>
          {[
            { label: "Files Analyzed", value: metrics.files, color: "#6366f1" },
            { label: "High-Risk", value: metrics.risks, color: "#f97316" },
            { label: "Est. Exposure", value: metrics.loss, color: "#f59e0b" },
          ].map(({ label, value, color }, i) => (
            <div key={i} className="glass-card" style={{ padding: 16, textAlign: "center" }}>
              <div className="animate-count" style={{ fontSize: "1.5rem", fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: 11, color: "rgba(232,234,240,0.35)", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Stage Progress */}
        <div style={{ maxWidth: 520, width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
          {STAGES.map((stage, i) => {
            const status = stageStatuses[i];
            const Icon = stage.icon;

            const containerStyle: React.CSSProperties = {
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 12,
              borderRadius: 12,
              transition: "all 0.5s",
              opacity: status === "active" ? 1 : status === "done" ? 0.5 : status === "error" ? 1 : 0.25,
              border: status === "active" ? "1px solid #6366f1" : status === "error" ? "1px solid rgba(239,68,68,0.3)" : "1px solid transparent",
              background: status === "active" ? "linear-gradient(135deg, rgba(18,20,28,0.95), rgba(26,29,40,0.8))" : status === "error" ? "rgba(239,68,68,0.05)" : "transparent",
            };

            const iconBg =
              status === "done" ? "rgba(16, 185, 129, 0.15)"
              : status === "error" ? "rgba(239, 68, 68, 0.15)"
              : status === "active" ? "rgba(99, 102, 241, 0.15)"
              : "transparent";

            return (
              <div key={stage.id} style={containerStyle}>
                <div style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: iconBg }}>
                  {status === "done" ? (
                    <CheckCircle2 style={{ width: 16, height: 16, color: "#10b981" }} />
                  ) : status === "error" ? (
                    <AlertTriangle style={{ width: 16, height: 16, color: "#ef4444" }} />
                  ) : status === "active" ? (
                    <Loader2 style={{ width: 16, height: 16, color: "#6366f1", animation: "spin 1s linear infinite" }} />
                  ) : (
                    <Icon style={{ width: 16, height: 16, color: "rgba(232,234,240,0.25)" }} />
                  )}
                </div>
                <span style={{ fontSize: 13, color: status === "active" ? "#e8eaf0" : status === "done" ? "rgba(232,234,240,0.5)" : "rgba(232,234,240,0.25)" }}>
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Error State */}
        {error && (
          <div className="glass-card" style={{ marginTop: 32, padding: 16, maxWidth: 520, width: "100%", borderColor: "rgba(239,68,68,0.3)" }}>
            <p style={{ color: "#ef4444", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Analysis Error</p>
            <p style={{ color: "rgba(232,234,240,0.5)", fontSize: 13 }}>{error}</p>
            <button
              onClick={() => router.push("/")}
              style={{ marginTop: 12, padding: "8px 16px", borderRadius: 8, background: "#12141c", border: "1px solid #1e2130", color: "#e8eaf0", fontSize: 13, cursor: "pointer" }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Success State */}
        {result && !error && (
          <div className="animate-fade-in" style={{ marginTop: 32, textAlign: "center" }}>
            <CheckCircle2 style={{ width: 48, height: 48, color: "#10b981", margin: "0 auto 12px" }} />
            <p style={{ color: "#10b981", fontWeight: 600, marginBottom: 4 }}>Analysis Complete!</p>
            <p style={{ color: "rgba(232,234,240,0.45)", fontSize: 13 }}>Redirecting to dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 style={{ width: 32, height: 32, color: "#6366f1", animation: "spin 1s linear infinite" }} />
      </div>
    }>
      <AnalysisContent />
    </Suspense>
  );
}
