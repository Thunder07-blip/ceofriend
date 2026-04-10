"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Heart,
  FileText,
  ArrowRight,
  BarChart3,
  Minus,
  FileSearch,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import type { PipelineResult } from "@/lib/types";

export default function DashboardPage() {
  const [data, setData] = useState<PipelineResult | null>(null);
  
  // New States for Scenario Agent
  const [scenarioInput, setScenarioInput] = useState("");
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const [scenarioResult, setScenarioResult] = useState<{
    oldLoss: number;
    newLoss: number;
    change: number;
    changePercent: number;
    explanation: string;
  } | null>(null);

  const router = useRouter();

  const handleScenarioSubmit = async () => {
    if (!scenarioInput.trim() || !data?.impactData?.files[0]) return;
    setScenarioLoading(true);
    setScenarioResult(null);

    const topFile = data.impactData.files[0];
    const baseMetrics = {
      failureProbability: topFile.failureProbability,
      impactPerHour: topFile.impactPerHour,
      expectedDowntime: topFile.expectedDowntime,
      userImpactFactor: topFile.userImpactFactor,
      failureFrequency: topFile.failureFrequency,
      expectedLoss: topFile.expectedLoss,
    };

    try {
      const res = await fetch("/api/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: scenarioInput, baseMetrics }),
      });
      const resData = await res.json();
      if (resData.success) {
        setScenarioResult(resData.data);
      } else {
        alert(resData.error || "Failed to simulate scenario");
      }
    } catch (err) {
      console.error(err);
      alert("Error simulating scenario");
    } finally {
      setScenarioLoading(false);
    }
  };

  useEffect(() => {
    const stored = sessionStorage.getItem("ceofriend_result");
    if (stored) {
      setData(JSON.parse(stored));
    } else {
      router.push("/");
    }
  }, [router]);

  if (!data) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "rgba(232,234,240,0.4)" }}>Loading dashboard...</div>
      </div>
    );
  }

  const healthScore = data.riskData?.repoHealth ?? 0;
  const totalExposure = data.impactData?.totalRiskExposure ?? 0;
  const highRiskCount = data.riskData?.files.filter((f) => f.riskScore >= 60).length ?? 0;
  const filesAnalyzed = data.repoData?.files.length ?? 0;
  const riskLevel = healthScore >= 70 ? "LOW" : healthScore >= 40 ? "HIGH" : "CRITICAL";
  const riskColor = healthScore >= 70 ? "#10b981" : healthScore >= 40 ? "#f97316" : "#ef4444";
  const riskBg = healthScore >= 70 ? "rgba(16, 185, 129, 0.1)" : healthScore >= 40 ? "rgba(249, 115, 22, 0.1)" : "rgba(239, 68, 68, 0.1)";

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-inner">
          <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => router.push("/")}>
            <Shield style={{ width: 24, height: 24, color: "#6366f1" }} />
            <span style={{ fontWeight: 700 }} className="gradient-text">CEOfriend</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 12, color: "rgba(232,234,240,0.35)", fontFamily: "monospace" }}>{data.repoData?.owner}/{data.repoData?.repo}</span>
            <button
              id="view-report-btn"
              onClick={() => router.push("/report")}
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                color: "white",
                display: "flex",
                alignItems: "center",
                gap: 6,
                border: "none",
                cursor: "pointer",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              }}
            >
              <FileText style={{ width: 14, height: 14 }} /> CEO Report
            </button>
            <button
              id="heal-repo-btn"
              onClick={() => router.push("/healer")}
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                color: "white",
                display: "flex",
                alignItems: "center",
                gap: 6,
                border: "none",
                cursor: "pointer",
                background: "linear-gradient(135deg, #10b981, #059669)",
              }}
            >
              <Wrench style={{ width: 14, height: 14 }} /> Heal Repo
            </button>
          </div>
        </div>
      </nav>

      <div className="page-container" style={{ flex: 1, paddingTop: 88, paddingBottom: 40 }}>
        {/* Error Banner */}
        {data.errors.length > 0 && (
          <div className="glass-card animate-fade-in" style={{ padding: 16, marginBottom: 24, borderColor: "rgba(249,115,22,0.3)" }}>
            <p style={{ color: "#f97316", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>⚠️ Partial Results</p>
            <p style={{ color: "rgba(232,234,240,0.45)", fontSize: 12 }}>
              Some analysis stages encountered issues: {data.errors.map((e) => e.stage).join(", ")}. Results shown may be incomplete.
            </p>
          </div>
        )}

        {/* Stat Strip: Files Analyzed + High Risk Files */}
        <div className="animate-slide-up" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20, marginBottom: 24 }}>
          {/* Files Analyzed */}
          <div className="glass-card" style={{ padding: 24, display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(99,102,241,0.1)", flexShrink: 0 }}>
              <FileSearch style={{ width: 24, height: 24, color: "#6366f1" }} />
            </div>
            <div>
              <div style={{ fontSize: "2.25rem", fontWeight: 900, color: "#6366f1", lineHeight: 1 }}>{filesAnalyzed}</div>
              <div style={{ fontSize: 13, color: "rgba(232,234,240,0.45)", marginTop: 4 }}>Files Analyzed</div>
              <div style={{ fontSize: 11, color: "rgba(232,234,240,0.3)", marginTop: 2 }}>out of {data.repoData?.summary.totalCommits ?? 0} total commits scanned</div>
            </div>
          </div>

          {/* High Risk Files */}
          <div className="glass-card" style={{ padding: 24, display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(239,68,68,0.1)", flexShrink: 0 }}>
              <ShieldAlert style={{ width: 24, height: 24, color: "#ef4444" }} />
            </div>
            <div>
              <div style={{ fontSize: "2.25rem", fontWeight: 900, color: "#ef4444", lineHeight: 1 }}>{highRiskCount}</div>
              <div style={{ fontSize: 13, color: "rgba(232,234,240,0.45)", marginTop: 4 }}>High Risk Files</div>
              <div style={{ fontSize: 11, color: "rgba(232,234,240,0.3)", marginTop: 2 }}>risk score ≥ 60 out of {filesAnalyzed} analyzed</div>
            </div>
          </div>
        </div>

        {/* Top Metrics */}
        <div className="metrics-grid animate-slide-up" style={{ marginBottom: 32 }}>
          {/* Health Score */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(232,234,240,0.45)", fontSize: 13, marginBottom: 16 }}>
              <Heart style={{ width: 16, height: 16 }} /> System Health Score
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <span style={{ fontSize: "3rem", fontWeight: 900, color: riskColor, lineHeight: 1 }}>{healthScore}</span>
              <span style={{ fontSize: 18, color: "rgba(232,234,240,0.25)", marginBottom: 4 }}>/100</span>
            </div>
            <div className="health-bar">
              <div className="health-bar-fill" style={{ width: `${healthScore}%`, background: riskColor }} />
            </div>
          </div>

          {/* Risk Level */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(232,234,240,0.45)", fontSize: 13, marginBottom: 16 }}>
              <AlertTriangle style={{ width: 16, height: 16 }} /> Risk Level
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 12, fontSize: "1.5rem", fontWeight: 900, color: riskColor, background: riskBg }}>
              {riskLevel === "CRITICAL" && <AlertTriangle style={{ width: 24, height: 24 }} />}
              {riskLevel}
            </div>
            <p style={{ fontSize: 12, color: "rgba(232,234,240,0.35)", marginTop: 12 }}>
              {highRiskCount} high-risk component{highRiskCount !== 1 ? "s" : ""} detected
            </p>
          </div>

          {/* Financial Exposure */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(232,234,240,0.45)", fontSize: 13, marginBottom: 16 }}>
              <DollarSign style={{ width: 16, height: 16 }} /> Potential Loss (90 days)
            </div>
            <div style={{ fontSize: "2.75rem", fontWeight: 900, lineHeight: 1 }} className="gradient-text-money">
              ₹{totalExposure.toLocaleString("en-IN")}
            </div>
            <p style={{ fontSize: 12, color: "rgba(232,234,240,0.35)", marginTop: 12 }}>Combined exposure across all components</p>
          </div>
        </div>

        {/* Key Insight */}
        {data.impactData && data.impactData.files.length > 0 && (
          <div className="glass-card animate-fade-in" style={{ padding: 24, marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <BarChart3 style={{ width: 20, height: 20, color: "#6366f1" }} />
              <span style={{ fontWeight: 600, fontSize: 15 }}>Key Insight</span>
            </div>
            <p style={{ color: "rgba(232,234,240,0.65)", lineHeight: 1.7, fontSize: 14 }}>
              <span style={{ fontWeight: 600, color: "#f97316" }}>{data.impactData.files[0].file}</span> contributes the most risk, with an expected financial impact of{" "}
              <span style={{ fontWeight: 600 }} className="gradient-text-money">₹{data.impactData.files[0].expectedLoss.toLocaleString("en-IN")}</span>.
              {" "}This component handles <span style={{ color: "#6366f1" }}>{data.impactData.files[0].businessFunction}</span> and has a{" "}
              <span style={{ color: "#f97316" }}>{(data.impactData.files[0].failureProbability * 100).toFixed(0)}%</span> failure probability.
            </p>
          </div>
        )}
        {/* Scenario Agent Box */}
        {data.impactData && data.impactData.files.length > 0 && (
          <div className="glass-card animate-slide-up" style={{ padding: 24, marginBottom: 32, borderColor: "rgba(99,102,241,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <ShieldAlert style={{ width: 20, height: 20, color: "#6366f1" }} />
              <span style={{ fontWeight: 600, fontSize: 16, color: "#e8eaf0" }}>Scenario Agent ("What if...")</span>
            </div>
            
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
              <input 
                type="text" 
                placeholder="e.g. What if I don't fix payment service for 2 months?" 
                value={scenarioInput}
                onChange={(e) => setScenarioInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleScenarioSubmit()}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "1px solid rgba(232,234,240,0.1)",
                  background: "rgba(30,33,48,0.5)",
                  color: "#fff",
                  fontSize: 14,
                  outline: "none"
                }}
              />
              <button 
                onClick={handleScenarioSubmit}
                disabled={scenarioLoading || !scenarioInput.trim()}
                style={{
                  padding: "12px 24px",
                  borderRadius: 10,
                  border: "none",
                  background: scenarioLoading || !scenarioInput.trim() ? "rgba(99,102,241,0.5)" : "#6366f1",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: scenarioLoading || !scenarioInput.trim() ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}
              >
                {scenarioLoading ? "Simulating..." : "Simulate"}
              </button>
            </div>

            {scenarioResult && (
              <div style={{ marginTop: 24, padding: 20, background: "rgba(10,12,18,0.3)", borderRadius: 12, border: "1px dashed rgba(232,234,240,0.1)" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 32, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "rgba(232,234,240,0.4)" }}>Old Expected Loss</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "rgba(232,234,240,0.7)" }}>₹{scenarioResult.oldLoss.toLocaleString("en-IN")}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "rgba(232,234,240,0.4)" }}>New Expected Loss</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: scenarioResult.newLoss > scenarioResult.oldLoss ? "#ef4444" : "#10b981" }}>
                      ₹{scenarioResult.newLoss.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "rgba(232,234,240,0.4)" }}>Change</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: scenarioResult.changePercent > 0 ? "#ef4444" : "#22c55e" }}>
                      {scenarioResult.changePercent > 0 ? "+" : ""}{scenarioResult.changePercent}%
                    </div>
                  </div>
                </div>
                <div style={{ background: "rgba(99,102,241,0.1)", padding: "16px 20px", borderRadius: 8, borderLeft: "4px solid #6366f1" }}>
                  <p style={{ margin: 0, fontSize: 14, color: "rgba(232,234,240,0.85)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    <strong style={{ color: "#fff", display: "block", marginBottom: 8 }}>CEO Summary: </strong>
                    {scenarioResult.explanation}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Risk Components Table */}
        <div className="glass-card animate-fade-in" style={{ overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid #1e2130", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontWeight: 600, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle style={{ width: 18, height: 18, color: "#f97316" }} /> Risk Components
            </h2>
            <span style={{ fontSize: 12, color: "rgba(232,234,240,0.35)" }}>{data.riskData?.files.length || 0} files analyzed</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="risk-table">
              <thead>
                <tr>
                  <th style={{ minWidth: 200 }}>Component</th>
                  <th className="col-score">Risk Score</th>
                  <th className="col-trend">Trend</th>
                  <th className="col-prob">Failure Prob.</th>
                  <th className="col-loss" style={{ minWidth: 120 }}>Expected Loss</th>
                </tr>
              </thead>
              <tbody>
                {(data.impactData?.files || []).slice(0, 10).map((file, i) => {
                  const prediction = data.predictionData?.files.find((p) => p.file === file.file);
                  const scoreColor =
                    file.predictedRisk >= 80 ? "#ef4444"
                    : file.predictedRisk >= 60 ? "#f97316"
                    : file.predictedRisk >= 40 ? "#eab308"
                    : "#22c55e";
                  const TrendIcon = prediction?.riskTrend === "increasing" ? TrendingUp : prediction?.riskTrend === "decreasing" ? TrendingDown : Minus;
                  const trendColor = prediction?.riskTrend === "increasing" ? "#ef4444" : prediction?.riskTrend === "decreasing" ? "#10b981" : "rgba(232,234,240,0.3)";

                  return (
                    <tr key={i}>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{file.file.split("/").pop()}</div>
                        <div style={{ fontSize: 11, color: "rgba(232,234,240,0.35)", marginTop: 2 }}>{file.businessFunction}</div>
                      </td>
                      <td className="col-score">
                        <span style={{ fontWeight: 700, color: scoreColor }}>{file.predictedRisk}</span>
                      </td>
                      <td className="col-trend">
                        <TrendIcon style={{ width: 16, height: 16, color: trendColor, margin: "0 auto", display: "block" }} />
                      </td>
                      <td className="col-prob">
                        <span style={{ color: scoreColor }}>{(file.failureProbability * 100).toFixed(0)}%</span>
                      </td>
                      <td className="col-loss">
                        <span style={{ fontWeight: 600, color: "#f59e0b" }}>₹{file.expectedLoss.toLocaleString("en-IN")}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{ marginTop: 40, textAlign: "center", display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
          <button
            onClick={() => router.push("/report")}
            style={{
              padding: "14px 32px",
              borderRadius: 12,
              fontWeight: 600,
              color: "white",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              border: "none",
              cursor: "pointer",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              fontSize: 15,
            }}
          >
            View Full CEO Report <ArrowRight style={{ width: 16, height: 16 }} />
          </button>
          <button
            onClick={() => router.push("/healer")}
            style={{
              padding: "14px 32px",
              borderRadius: 12,
              fontWeight: 600,
              color: "white",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              border: "none",
              cursor: "pointer",
              background: "linear-gradient(135deg, #10b981, #059669)",
              fontSize: 15,
            }}
          >
            <Wrench style={{ width: 16, height: 16 }} /> Heal Repo
          </button>
        </div>
      </div>
    </div>
  );
}
