"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  FileText,
  AlertTriangle,
  DollarSign,
  ArrowLeft,
  Printer,
  Clock,
  TrendingUp,
} from "lucide-react";
import type { PipelineResult } from "@/lib/types";

export default function ReportPage() {
  const [data, setData] = useState<PipelineResult | null>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = sessionStorage.getItem("ceofriend_result");
    if (stored) {
      setData(JSON.parse(stored));
    } else {
      router.push("/");
    }
  }, [router]);

  if (!data || !data.report) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "rgba(232,234,240,0.4)" }}>Loading report...</div>
      </div>
    );
  }

  const { report, riskData, impactData } = data;
  const healthScore = riskData?.repoHealth ?? 0;
  const healthColor = healthScore >= 70 ? "#10b981" : healthScore >= 40 ? "#f97316" : "#ef4444";
  const healthLabel = healthScore >= 70 ? "HEALTHY" : healthScore >= 40 ? "AT RISK" : "CRITICAL";

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Navbar */}
      <nav className="navbar no-print">
        <div className="navbar-inner">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button onClick={() => router.push("/dashboard")} style={{ color: "rgba(232,234,240,0.45)", background: "none", border: "none", cursor: "pointer", display: "flex" }}>
              <ArrowLeft style={{ width: 20, height: 20 }} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Shield style={{ width: 24, height: 24, color: "#6366f1" }} />
              <span style={{ fontWeight: 700 }} className="gradient-text">CEOfriend</span>
            </div>
          </div>
          <button
            id="print-report-btn"
            onClick={() => window.print()}
            style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, border: "1px solid #1e2130", background: "transparent", color: "#e8eaf0", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Printer style={{ width: 14, height: 14 }} /> Download PDF
          </button>
        </div>
      </nav>

      {/* Report Content */}
      <div style={{ flex: 1, padding: "96px 24px 48px", maxWidth: 800, margin: "0 auto", width: "100%" }}>
        {/* Report Header */}
        <div className="animate-slide-up" style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 9999, border: "1px solid rgba(99,102,241,0.3)", fontSize: 12, color: "#6366f1", marginBottom: 16, background: "rgba(99, 102, 241, 0.08)" }}>
            <FileText style={{ width: 12, height: 12 }} /> CEO Intelligence Report
          </div>
          <h1 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 900, marginBottom: 8 }}>
            System Health & <span className="gradient-text-money">Risk Report</span>
          </h1>
          <p style={{ color: "rgba(232,234,240,0.35)", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
            <Clock style={{ width: 12, height: 12 }} />{" "}
            Generated {new Date(report.generatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            <span>•</span>
            {data.repoData?.owner}/{data.repoData?.repo}
          </p>
        </div>

        {/* Health Score Banner */}
        <div className="glass-card animate-fade-in" style={{ padding: 32, textAlign: "center", marginBottom: 32 }}>
          <p style={{ fontSize: 13, color: "rgba(232,234,240,0.45)", marginBottom: 8 }}>Overall System Health</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <div style={{ fontSize: "4.5rem", fontWeight: 900, color: healthColor, lineHeight: 1 }}>
              {healthScore}
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 18, color: "rgba(232,234,240,0.25)" }}>/100</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: healthColor }}>{healthLabel}</div>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <section style={{ marginBottom: 32 }} className="animate-fade-in">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 4, height: 24, borderRadius: 4, background: "#ef4444" }} />
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Executive Summary</h2>
          </div>
          <div className="glass-card" style={{ padding: 24 }}>
            <p style={{ color: "rgba(232,234,240,0.75)", lineHeight: 1.7, fontSize: 16 }}>{report.summary}</p>
          </div>
        </section>

        {/* Key Risks */}
        <section style={{ marginBottom: 32 }} className="animate-fade-in">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 4, height: 24, borderRadius: 4, background: "#f97316" }} />
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Key Risks</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {report.keyRisks.map((risk, i) => {
              const levelColor = risk.riskLevel === "Critical" ? "#ef4444" : risk.riskLevel === "High" ? "#f97316" : "#eab308";
              const levelBg = risk.riskLevel === "Critical" ? "rgba(239,68,68,0.12)" : risk.riskLevel === "High" ? "rgba(249,115,22,0.12)" : "rgba(234,179,8,0.12)";
              return (
                <div key={i} className="glass-card" style={{ padding: 20, display: "flex", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: levelBg }}>
                    <AlertTriangle style={{ width: 20, height: 20, color: levelColor }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{risk.component}</span>
                      <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: levelBg, color: levelColor }}>{risk.riskLevel}</span>
                    </div>
                    <p style={{ fontSize: 13, color: "rgba(232,234,240,0.5)" }}>{risk.businessImpact}</p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: 14 }}>₹{risk.expectedLoss.toLocaleString("en-IN")}</span>
                    <p style={{ fontSize: 11, color: "rgba(232,234,240,0.25)" }}>expected loss</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Financial Impact */}
        <section style={{ marginBottom: 32 }} className="animate-fade-in">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 4, height: 24, borderRadius: 4, background: "#f59e0b" }} />
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Financial Impact</h2>
          </div>
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <DollarSign style={{ width: 32, height: 32, color: "#f59e0b" }} />
              <div>
                <p style={{ color: "rgba(232,234,240,0.45)", fontSize: 13 }}>Total Risk Exposure (90 days)</p>
                <p style={{ fontSize: "1.875rem", fontWeight: 900 }} className="gradient-text-money">₹{(impactData?.totalRiskExposure ?? 0).toLocaleString("en-IN")}</p>
              </div>
            </div>
            <p style={{ color: "rgba(232,234,240,0.65)", lineHeight: 1.7 }}>{report.financialImpact}</p>
          </div>
        </section>

        {/* Cost of Inaction */}
        <section style={{ marginBottom: 32 }} className="animate-fade-in">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 4, height: 24, borderRadius: 4, background: "#ef4444" }} />
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Cost of Inaction</h2>
          </div>
          <div style={{ padding: 24, borderRadius: 16, border: "2px solid rgba(239,68,68,0.2)", background: "rgba(239, 68, 68, 0.04)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <TrendingUp style={{ width: 24, height: 24, color: "#ef4444", flexShrink: 0, marginTop: 4 }} />
              <p style={{ color: "rgba(232,234,240,0.75)", lineHeight: 1.7, fontSize: 16, fontStyle: "italic" }}>{report.costOfInaction}</p>
            </div>
          </div>
        </section>

        {/* Recommendations */}
        <section style={{ marginBottom: 48 }} className="animate-fade-in">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 4, height: 24, borderRadius: 4, background: "#10b981" }} />
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Recommendations</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {report.recommendations.map((rec, i) => (
              <div key={i} className="glass-card" style={{ padding: 16, display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "rgba(16, 185, 129, 0.15)" }}>
                  <span style={{ color: "#10b981", fontWeight: 700, fontSize: 13 }}>{i + 1}</span>
                </div>
                <p style={{ color: "rgba(232,234,240,0.75)", lineHeight: 1.6, fontSize: 14 }}>{rec}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Report Footer */}
        <div style={{ textAlign: "center", borderTop: "1px solid #1e2130", paddingTop: 32 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
            <Shield style={{ width: 20, height: 20, color: "#6366f1" }} />
            <span style={{ fontWeight: 700 }} className="gradient-text">CEOfriend</span>
          </div>
          <p style={{ fontSize: 12, color: "rgba(232,234,240,0.25)" }}>
            Confidence: {report.confidence} • {data.repoData?.summary.analyzedFiles} files analyzed •
            Generated with deterministic scoring + AI explanation
          </p>
          <button
            className="no-print"
            onClick={() => window.print()}
            style={{ marginTop: 16, padding: "8px 24px", borderRadius: 8, fontSize: 13, border: "1px solid #1e2130", background: "transparent", color: "#e8eaf0", cursor: "pointer" }}
          >
            <Printer style={{ width: 14, height: 14, display: "inline", verticalAlign: "middle", marginRight: 6 }} /> Print / Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
