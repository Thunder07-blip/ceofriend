"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Wrench,
  AlertTriangle,
  Check,
  ExternalLink,
  Loader2,
  Zap,
  ArrowLeft,
  GitPullRequest,
} from "lucide-react";
import dynamic from "next/dynamic";
import type { PipelineResult } from "@/lib/types";

// Dynamically import Monaco to avoid SSR issues
const DiffEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.DiffEditor),
  { ssr: false, loading: () => <div style={{ height: 350, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(232,234,240,0.3)" }}>Loading editor...</div> }
);

interface HealedFile {
  file: string;
  original: string;
  patched: string;
  bug: {
    start_line: number;
    end_line: number;
    bug_type: string;
    reason: string;
  };
  diff: string;
  sha: string;
  prUrl?: string;
  prLoading?: boolean;
  noBug?: boolean;
  message?: string;
}

type HealStatus = "idle" | "loading" | "done" | "error" | "no-bug";

interface FileEntry {
  file: string;
  predictedRisk: number;
  expectedLoss: number;
  status: HealStatus;
  healData?: HealedFile;
  errorMsg?: string;
}

export default function HealerPage() {
  const [data, setData] = useState<PipelineResult | null>(null);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [healAllLoading, setHealAllLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const stored = sessionStorage.getItem("ceofriend_result");
    if (stored) {
      const parsed: PipelineResult = JSON.parse(stored);
      setData(parsed);

      // Select top 3 risky files
      const topFiles = (parsed.impactData?.files || [])
        .slice(0, 3)
        .map((f) => ({
          file: f.file,
          predictedRisk: f.predictedRisk,
          expectedLoss: f.expectedLoss,
          status: "idle" as HealStatus,
        }));
      setFiles(topFiles);
    } else {
      router.push("/");
    }
  }, [router]);

  const owner = data?.repoData?.owner || "";
  const repo = data?.repoData?.repo || "";

  const healSingleFile = async (index: number) => {
    const updated = [...files];
    updated[index].status = "loading";
    setFiles(updated);

    try {
      const res = await fetch("/api/healer/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo, filePath: files[index].file }),
      });
      const resData = await res.json();

      if (!resData.success) {
        updated[index].status = "error";
        updated[index].errorMsg = resData.error;
      } else if (resData.data.noBug) {
        updated[index].status = "no-bug";
        updated[index].healData = resData.data;
      } else {
        updated[index].status = "done";
        updated[index].healData = resData.data;
      }
    } catch {
      updated[index].status = "error";
      updated[index].errorMsg = "Network error";
    }

    setFiles([...updated]);
  };

  const healAll = async () => {
    setHealAllLoading(true);
    for (let i = 0; i < files.length; i++) {
      if (files[i].status === "idle") {
        await healSingleFile(i);
      }
    }
    setHealAllLoading(false);
  };

  const raisePR = async (index: number) => {
    const f = files[index];
    if (!f.healData || f.healData.noBug) return;

    const updated = [...files];
    updated[index].healData!.prLoading = true;
    setFiles([...updated]);

    try {
      const res = await fetch("/api/healer/pr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          filePath: f.file,
          patchedContent: f.healData.patched,
          fileSha: f.healData.sha,
          bugType: f.healData.bug.bug_type,
        }),
      });
      const resData = await res.json();

      if (resData.success) {
        updated[index].healData!.prUrl = resData.data.prUrl;
      } else {
        alert(resData.error || "Failed to create PR");
      }
    } catch {
      alert("Network error creating PR");
    }

    updated[index].healData!.prLoading = false;
    setFiles([...updated]);
  };

  const raiseAllPRs = async () => {
    for (let i = 0; i < files.length; i++) {
      if (files[i].status === "done" && files[i].healData && !files[i].healData!.prUrl) {
        await raisePR(i);
      }
    }
  };

  if (!data) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "rgba(232,234,240,0.4)" }}>Loading healer...</div>
      </div>
    );
  }

  const hasHealedFiles = files.some((f) => f.status === "done");
  const hasUnPRdFiles = files.some((f) => f.status === "done" && f.healData && !f.healData.prUrl);

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
            <span style={{ fontSize: 12, color: "rgba(232,234,240,0.35)", fontFamily: "monospace" }}>{owner}/{repo}</span>
            <button
              onClick={() => router.push("/dashboard")}
              style={{
                padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                color: "rgba(232,234,240,0.6)", display: "flex", alignItems: "center", gap: 6,
                border: "1px solid rgba(232,234,240,0.1)", cursor: "pointer", background: "transparent",
              }}
            >
              <ArrowLeft style={{ width: 14, height: 14 }} /> Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="page-container" style={{ flex: 1, paddingTop: 88, paddingBottom: 40 }}>
        {/* Header */}
        <div className="animate-fade-in" style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <Wrench style={{ width: 28, height: 28, color: "#10b981" }} />
            <h1 style={{ fontSize: 28, fontWeight: 800 }}>
              <span className="gradient-text">Repo Healer</span>
            </h1>
          </div>
          <p style={{ color: "rgba(232,234,240,0.5)", fontSize: 14 }}>
            AI-powered bug detection and fix generation for your riskiest files. Review diffs before raising PRs.
          </p>
        </div>

        {/* Heal All Button */}
        <div className="animate-slide-up" style={{ marginBottom: 24 }}>
          <button
            onClick={healAll}
            disabled={healAllLoading || files.every((f) => f.status !== "idle")}
            style={{
              padding: "14px 28px", borderRadius: 12, border: "none", fontWeight: 700, fontSize: 15,
              color: "#fff", cursor: healAllLoading ? "not-allowed" : "pointer",
              background: healAllLoading ? "rgba(16,185,129,0.4)" : "linear-gradient(135deg, #10b981, #059669)",
              display: "inline-flex", alignItems: "center", gap: 10,
              boxShadow: healAllLoading ? "none" : "0 0 20px rgba(16,185,129,0.25)",
            }}
          >
            {healAllLoading ? (
              <><Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} /> Healing...</>
            ) : (
              <><Zap style={{ width: 18, height: 18 }} /> Heal All Files ({files.filter(f => f.status === "idle").length})</>
            )}
          </button>
        </div>

        {/* File Cards */}
        {files.map((f, i) => (
          <div key={i} className="glass-card animate-fade-in" style={{ marginBottom: 20, overflow: "hidden" }}>
            {/* File Header */}
            <div style={{
              padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
              borderBottom: f.status === "done" ? "1px solid rgba(30,33,48,0.8)" : "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: f.status === "done" ? "#10b981" : f.status === "error" ? "#ef4444" : f.status === "loading" ? "#f59e0b" : f.status === "no-bug" ? "#22c55e" : "rgba(232,234,240,0.2)",
                }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{f.file.split("/").pop()}</div>
                  <div style={{ fontSize: 11, color: "rgba(232,234,240,0.35)" }}>{f.file}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: "rgba(232,234,240,0.4)" }}>Risk</div>
                  <div style={{ fontWeight: 700, color: f.predictedRisk >= 60 ? "#ef4444" : "#f97316" }}>{f.predictedRisk}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: "rgba(232,234,240,0.4)" }}>Loss</div>
                  <div style={{ fontWeight: 600, color: "#f59e0b" }}>₹{f.expectedLoss.toLocaleString("en-IN")}</div>
                </div>
                {f.status === "idle" && (
                  <button
                    onClick={() => healSingleFile(i)}
                    style={{
                      padding: "8px 16px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 600,
                      color: "#fff", cursor: "pointer", background: "#10b981",
                      display: "flex", alignItems: "center", gap: 6,
                    }}
                  >
                    <Wrench style={{ width: 14, height: 14 }} /> Heal
                  </button>
                )}
                {f.status === "loading" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#f59e0b", fontSize: 13 }}>
                    <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> Analyzing...
                  </div>
                )}
                {f.status === "no-bug" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#22c55e", fontSize: 13 }}>
                    <Check style={{ width: 14, height: 14 }} /> Clean
                  </div>
                )}
                {f.status === "error" && (
                  <div style={{ color: "#ef4444", fontSize: 12 }}>{f.errorMsg}</div>
                )}
              </div>
            </div>

            {/* Expanded: Bug Info + Diff + PR */}
            {f.status === "done" && f.healData && !f.healData.noBug && (
              <div style={{ padding: 24 }}>
                {/* Bug Info */}
                <div style={{
                  background: "rgba(239,68,68,0.08)", borderLeft: "4px solid #ef4444",
                  padding: "12px 16px", borderRadius: 8, marginBottom: 16,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <AlertTriangle style={{ width: 16, height: 16, color: "#ef4444" }} />
                    <span style={{ fontWeight: 700, color: "#ef4444", fontSize: 14 }}>{f.healData.bug.bug_type}</span>
                    <span style={{ fontSize: 12, color: "rgba(232,234,240,0.4)" }}>
                      Lines {f.healData.bug.start_line}–{f.healData.bug.end_line}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: "rgba(232,234,240,0.7)", margin: 0 }}>
                    {f.healData.bug.reason}
                  </p>
                </div>

                {/* Monaco Diff Editor */}
                <div style={{
                  border: "1px solid rgba(30,33,48,0.8)", borderRadius: 10, overflow: "hidden", marginBottom: 16,
                }}>
                  <div style={{ padding: "8px 16px", background: "rgba(18,20,28,0.9)", borderBottom: "1px solid rgba(30,33,48,0.8)", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "rgba(232,234,240,0.4)" }}>Diff Viewer</span>
                    <span style={{ fontSize: 11, color: "rgba(239,68,68,0.6)" }}>● Removed</span>
                    <span style={{ fontSize: 11, color: "rgba(16,185,129,0.6)" }}>● Added</span>
                  </div>
                  <DiffEditor
                    height={350}
                    language={f.file.endsWith(".ts") || f.file.endsWith(".tsx") ? "typescript" : f.file.endsWith(".py") ? "python" : "javascript"}
                    original={f.healData.original}
                    modified={f.healData.patched}
                    theme="vs-dark"
                    options={{
                      readOnly: true,
                      renderSideBySide: true,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 13,
                    }}
                  />
                </div>

                {/* PR Button */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {f.healData.prUrl ? (
                    <a
                      href={f.healData.prUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                        color: "#fff", background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none",
                      }}
                    >
                      <ExternalLink style={{ width: 14, height: 14 }} /> View PR
                    </a>
                  ) : (
                    <button
                      onClick={() => raisePR(i)}
                      disabled={f.healData.prLoading}
                      style={{
                        padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                        color: "#fff", border: "none", cursor: f.healData.prLoading ? "not-allowed" : "pointer",
                        background: f.healData.prLoading ? "rgba(99,102,241,0.4)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        display: "flex", alignItems: "center", gap: 8,
                      }}
                    >
                      {f.healData.prLoading ? (
                        <><Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> Creating PR...</>
                      ) : (
                        <><GitPullRequest style={{ width: 14, height: 14 }} /> Raise PR</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Bottom: Raise All PRs */}
        {hasHealedFiles && hasUnPRdFiles && (
          <div style={{ marginTop: 32, textAlign: "center" }}>
            <button
              onClick={raiseAllPRs}
              style={{
                padding: "14px 32px", borderRadius: 12, fontWeight: 700, fontSize: 15,
                color: "#fff", display: "inline-flex", alignItems: "center", gap: 10,
                border: "none", cursor: "pointer",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                boxShadow: "0 0 20px rgba(99,102,241,0.25)",
              }}
            >
              <GitPullRequest style={{ width: 18, height: 18 }} /> Raise All Remaining PRs
            </button>
          </div>
        )}
      </div>

      {/* Spinner animation */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
