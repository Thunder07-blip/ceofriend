"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  TrendingUp,
  DollarSign,
  FileText,
  ChevronRight,
  Zap,
  GitFork,
  AlertTriangle,
  BarChart3,
  Building2,
  X,
  Check,
} from "lucide-react";
import type { CompanyContext, IndustryType, TeamSize, DeployFrequency } from "@/lib/types";

const INDUSTRY_OPTIONS: { value: IndustryType; label: string }[] = [
  { value: "saas", label: "SaaS / Software" },
  { value: "ecommerce", label: "E-Commerce / Retail" },
  { value: "fintech", label: "Fintech / Banking" },
  { value: "healthcare", label: "Healthcare / MedTech" },
  { value: "edtech", label: "EdTech / Education" },
  { value: "logistics", label: "Logistics / Supply Chain" },
  { value: "media", label: "Media / Entertainment" },
  { value: "other", label: "Other" },
];

const TEAM_SIZE_OPTIONS: { value: TeamSize; label: string }[] = [
  { value: "solo", label: "Solo (1 person)" },
  { value: "small", label: "Small (2–10)" },
  { value: "medium", label: "Medium (11–50)" },
  { value: "large", label: "Large (51–200)" },
  { value: "enterprise", label: "Enterprise (200+)" },
];

const DEPLOY_FREQ_OPTIONS: { value: DeployFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
];

const CRITICAL_SYSTEM_OPTIONS = [
  "payment", "auth", "database", "api", "search",
  "notification", "cart", "shipping", "billing", "security",
];

const DEFAULT_COMPANY: CompanyContext = {
  industry: "saas",
  description: "",
  yearlyTurnover: 0,
  teamSize: "small",
  criticalSystems: [],
  deployFrequency: "weekly",
};

export default function LandingPage() {
  const [repoUrl, setRepoUrl] = useState("");
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [company, setCompany] = useState<CompanyContext>({ ...DEFAULT_COMPANY });
  const [hasCompanyContext, setHasCompanyContext] = useState(false);
  const router = useRouter();

  const handleAnalyze = () => {
    if (!repoUrl.trim()) {
      setError("Please enter a repository URL");
      return;
    }
    if (!repoUrl.includes("github.com")) {
      setError("Please enter a valid GitHub URL");
      return;
    }
    setError("");

    // If no context, open modal and stop
    if (!hasCompanyContext) {
      setShowModal(true);
      setError("Please provide your business context above to accurately map financial impact.");
      return;
    }

    // Store company context in sessionStorage so analysis page can send it
    sessionStorage.setItem("ceofriend_company", JSON.stringify(company));

    router.push(`/analysis?repo=${encodeURIComponent(repoUrl.trim())}`);
  };

  const handleSaveCompany = () => {
    if (company.yearlyTurnover <= 0 || company.criticalSystems.length === 0) {
      return; // Do not save if required fields are missing
    }
    setHasCompanyContext(true);
    setShowModal(false);
    setError(""); // Clear any "business context required" error
  };

  const handleClearCompany = () => {
    setCompany({ ...DEFAULT_COMPANY });
    setHasCompanyContext(false);
    setShowModal(false);
  };

  const toggleCriticalSystem = (system: string) => {
    setCompany((prev) => ({
      ...prev,
      criticalSystems: prev.criticalSystems.includes(system)
        ? prev.criticalSystems.filter((s) => s !== system)
        : [...prev.criticalSystems, system],
    }));
  };

  // ---- Inline styles ----
  const selectStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #1e2130",
    background: "#12141c",
    color: "#e8eaf0",
    fontSize: 14,
    outline: "none",
    appearance: "none" as const,
    WebkitAppearance: "none" as const,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #1e2130",
    background: "#12141c",
    color: "#e8eaf0",
    fontSize: 14,
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: "rgba(232,234,240,0.7)",
    marginBottom: 6,
    display: "block",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-inner">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Shield style={{ width: 28, height: 28, color: "#6366f1" }} />
            <span style={{ fontSize: 20, fontWeight: 700 }} className="gradient-text">CEOfriend</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 14, color: "rgba(232,234,240,0.5)" }}>
            <a href="#features" style={{ textDecoration: "none", color: "inherit" }}>Features</a>
            <a href="#how-it-works" style={{ textDecoration: "none", color: "inherit" }}>How It Works</a>
            <a href="https://github.com" target="_blank" rel="noopener" style={{ display: "flex", alignItems: "center", gap: 4, textDecoration: "none", color: "inherit" }}>
              <GitFork style={{ width: 16, height: 16 }} /> GitHub
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 120, paddingBottom: 40 }}>
        <div className="page-container" style={{ textAlign: "center" }}>
          <div className="animate-slide-up">
            {/* Badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 9999, border: "1px solid #1e2130", fontSize: 12, color: "rgba(232,234,240,0.6)", marginBottom: 32, background: "rgba(99, 102, 241, 0.08)" }}>
              <Zap style={{ width: 12, height: 12, color: "#6366f1" }} />
              AI-Powered Engineering Intelligence
            </div>

            {/* Main headline */}
            <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 24 }}>
              Predict Software Failures
              <br />
              <span className="gradient-text-money">Before They Cost You Money</span>
            </h1>

            <p style={{ fontSize: "clamp(1rem, 1.5vw, 1.25rem)", color: "rgba(232,234,240,0.5)", maxWidth: 640, margin: "0 auto 40px", lineHeight: 1.6 }}>
              Transform engineering activity into business intelligence. See where your system will fail next
              and how much it will cost — in language a CEO understands.
            </p>

            {/* Repo Input */}
            <div style={{ maxWidth: 560, margin: "0 auto" }}>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <GitFork style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", width: 20, height: 20, color: "rgba(232,234,240,0.25)" }} />
                  <input
                    id="repo-url-input"
                    type="url"
                    placeholder="https://github.com/owner/repo"
                    value={repoUrl}
                    onChange={(e) => { setRepoUrl(e.target.value); setError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                    style={{
                      width: "100%",
                      paddingLeft: 48,
                      paddingRight: 16,
                      paddingTop: 16,
                      paddingBottom: 16,
                      borderRadius: 12,
                      border: "1px solid #1e2130",
                      background: "#12141c",
                      color: "#e8eaf0",
                      fontSize: 15,
                      outline: "none",
                    }}
                  />
                </div>
                <button
                  id="analyze-button"
                  onClick={handleAnalyze}
                  className="animate-pulse-glow"
                  style={{
                    padding: "16px 32px",
                    borderRadius: 12,
                    fontWeight: 600,
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    border: "none",
                    cursor: "pointer",
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    fontSize: 15,
                    whiteSpace: "nowrap",
                  }}
                >
                  Analyze <ChevronRight style={{ width: 16, height: 16 }} />
                </button>
              </div>
              {error && (
                <p style={{ color: "#ef4444", fontSize: 13, marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
                  <AlertTriangle style={{ width: 12, height: 12 }} /> {error}
                </p>
              )}
            </div>

            {/* About Company Button */}
            <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <button
                id="about-company-btn"
                onClick={() => setShowModal(true)}
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,
                  fontWeight: 500,
                  color: hasCompanyContext ? "#10b981" : "rgba(232,234,240,0.6)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  border: hasCompanyContext ? "1px solid rgba(16,185,129,0.3)" : "1px solid #1e2130",
                  cursor: "pointer",
                  background: hasCompanyContext ? "rgba(16,185,129,0.08)" : "transparent",
                  fontSize: 13,
                  transition: "all 0.2s",
                }}
              >
                <Building2 style={{ width: 16, height: 16 }} />
                {hasCompanyContext ? (
                  <>
                    <Check style={{ width: 14, height: 14 }} /> Company Info Added
                  </>
                ) : (
                  "About Your Company (Required)"
                )}
              </button>
            </div>

            {/* Trust Signal */}
            <p style={{ fontSize: 12, color: "rgba(232,234,240,0.3)", marginTop: 16 }}>
              Works with any public GitHub repository • No sign-up required • Results in seconds
            </p>
          </div>


        </div>
      </section>

      {/* Features */}
      <section id="features" className="section">
        <div className="page-container">
          <h2 style={{ fontSize: "1.875rem", fontWeight: 700, textAlign: "center", marginBottom: 48 }}>
            Engineering Intelligence, <span className="gradient-text">CEO-Ready</span>
          </h2>
          <div className="features-grid">
            {[
              { icon: Shield, title: "Predictive Risk Analysis", desc: "Identify which components will fail in the next 90 days using deterministic scoring — not black-box AI." },
              { icon: DollarSign, title: "Financial Impact Mapping", desc: "Every technical risk translates to rupees. Know the cost before the outage happens." },
              { icon: FileText, title: "CEO-Ready Reports", desc: "Generate business-language reports with actionable recommendations. No jargon, just decisions." },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="glass-card" style={{ padding: 32, textAlign: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", background: "rgba(99, 102, 241, 0.1)" }}>
                  <Icon style={{ width: 24, height: 24, color: "#6366f1" }} />
                </div>
                <h3 style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 14, color: "rgba(232,234,240,0.45)", lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="section">
        <div className="page-container" style={{ maxWidth: 800 }}>
          <h2 style={{ fontSize: "1.875rem", fontWeight: 700, textAlign: "center", marginBottom: 48 }}>
            How <span className="gradient-text">CEOfriend</span> Works
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { step: "01", title: "Connect Repository", desc: "Paste your GitHub URL. We analyze commits, bugs, contributors, and test coverage." },
              { step: "02", title: "AI Analysis Pipeline", desc: "5 specialized agents score risk, predict failures, and map business impact — all deterministic." },
              { step: "03", title: "Get Business Intelligence", desc: "Receive a CEO-friendly report with financial exposure, prioritized risks, and action items." },
            ].map(({ step, title, desc }, i) => (
              <div key={i} className="glass-card step-card">
                <div className="step-number gradient-text">{step}</div>
                <div>
                  <h3 style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>{title}</h3>
                  <p style={{ fontSize: 14, color: "rgba(232,234,240,0.45)" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ textAlign: "center" }}>
        <h2 style={{ fontSize: "1.875rem", fontWeight: 700, marginBottom: 16 }}>
          Ready to <span className="gradient-text-money">Protect Your Revenue?</span>
        </h2>
        <p style={{ color: "rgba(232,234,240,0.45)", marginBottom: 32 }}>Analyze your first repository in seconds — completely free.</p>
        <button
          onClick={() => document.getElementById("repo-url-input")?.focus()}
          style={{
            padding: "16px 32px",
            borderRadius: 12,
            fontWeight: 600,
            color: "white",
            border: "none",
            cursor: "pointer",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            fontSize: 15,
          }}
        >
          Start Analysis Now
        </button>
      </section>

      {/* Footer */}
      <footer style={{ padding: "32px 24px", borderTop: "1px solid #1e2130", textAlign: "center", fontSize: 12, color: "rgba(232,234,240,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
          <Shield style={{ width: 16, height: 16, color: "#6366f1" }} />
          <span style={{ fontWeight: 600 }} className="gradient-text">CEOfriend</span>
        </div>
        <p>Predictive Engineering Intelligence Platform</p>
        <p style={{ marginTop: 4 }}>&ldquo;We predict software failures and translate them into financial risk.&rdquo;</p>
      </footer>

      {/* ====== COMPANY CONTEXT MODAL ====== */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(8px)",
            padding: 24,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div
            className="animate-slide-up"
            style={{
              background: "linear-gradient(135deg, #12141c, #1a1d28)",
              border: "1px solid #1e2130",
              borderRadius: 20,
              width: "100%",
              maxWidth: 540,
              maxHeight: "90vh",
              overflow: "auto",
              padding: 32,
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(99,102,241,0.15)" }}>
                  <Building2 style={{ width: 20, height: 20, color: "#6366f1" }} />
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700 }}>About Your Company</h2>
                  <p style={{ fontSize: 12, color: "rgba(232,234,240,0.4)" }}>Helps us personalize your risk report</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", color: "rgba(232,234,240,0.4)", cursor: "pointer", padding: 4 }}
              >
                <X style={{ width: 20, height: 20 }} />
              </button>
            </div>

            {/* Form Fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Industry */}
              <div>
                <label style={labelStyle}>Industry *</label>
                <select
                  value={company.industry}
                  onChange={(e) => setCompany({ ...company, industry: e.target.value as IndustryType })}
                  style={selectStyle}
                >
                  {INDUSTRY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Company Description */}
              <div>
                <label style={labelStyle}>Company Description</label>
                <textarea
                  placeholder="What does your company do? e.g. 'We are a B2B SaaS platform for inventory management serving 500+ warehouses across India'"
                  value={company.description}
                  onChange={(e) => setCompany({ ...company, description: e.target.value })}
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" as const, minHeight: 80 }}
                />
                <p style={{ fontSize: 11, color: "rgba(232,234,240,0.3)", marginTop: 4 }}>This helps the AI write a more relevant CEO report</p>
              </div>

              {/* Yearly Turnover */}
              <div>
                <label style={labelStyle}>Yearly Turnover (₹) *</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(232,234,240,0.3)", fontSize: 14 }}>₹</span>
                  <input
                    type="number"
                    placeholder="e.g. 10000000 (1 Crore)"
                    value={company.yearlyTurnover || ""}
                    onChange={(e) => setCompany({ ...company, yearlyTurnover: parseInt(e.target.value) || 0 })}
                    style={{ ...inputStyle, paddingLeft: 28 }}
                  />
                </div>
                <p style={{ fontSize: 11, color: "rgba(232,234,240,0.3)", marginTop: 4 }}>
                  Scales financial impact proportionally. {company.yearlyTurnover > 0 && (
                    <span style={{ color: "#f59e0b" }}>
                      ₹{company.yearlyTurnover.toLocaleString("en-IN")}
                      {company.yearlyTurnover >= 10000000 && ` (${(company.yearlyTurnover / 10000000).toFixed(1)} Cr)`}
                      {company.yearlyTurnover >= 100000 && company.yearlyTurnover < 10000000 && ` (${(company.yearlyTurnover / 100000).toFixed(1)} L)`}
                    </span>
                  )}
                </p>
              </div>

              {/* Team Size + Deploy Frequency (side by side) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={labelStyle}>Team Size</label>
                  <select
                    value={company.teamSize}
                    onChange={(e) => setCompany({ ...company, teamSize: e.target.value as TeamSize })}
                    style={selectStyle}
                  >
                    {TEAM_SIZE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Deploy Frequency</label>
                  <select
                    value={company.deployFrequency}
                    onChange={(e) => setCompany({ ...company, deployFrequency: e.target.value as DeployFrequency })}
                    style={selectStyle}
                  >
                    {DEPLOY_FREQ_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Critical Systems */}
              <div>
                <label style={labelStyle}>Critical Business Systems *</label>
                <p style={{ fontSize: 11, color: "rgba(232,234,240,0.3)", marginBottom: 10 }}>Select systems that are critical to your revenue — these get higher priority in the analysis</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {CRITICAL_SYSTEM_OPTIONS.map((system) => {
                    const isSelected = company.criticalSystems.includes(system);
                    return (
                      <button
                        key={system}
                        onClick={() => toggleCriticalSystem(system)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 500,
                          border: isSelected ? "1px solid rgba(99,102,241,0.5)" : "1px solid #1e2130",
                          background: isSelected ? "rgba(99,102,241,0.15)" : "transparent",
                          color: isSelected ? "#818cf8" : "rgba(232,234,240,0.5)",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          textTransform: "capitalize",
                        }}
                      >
                        {isSelected && <Check style={{ width: 12, height: 12, display: "inline", marginRight: 4, verticalAlign: "middle" }} />}
                        {system}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", gap: 12, marginTop: 28, justifyContent: "flex-end" }}>
              <button
                onClick={handleClearCompany}
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 500,
                  border: "1px solid #1e2130",
                  background: "transparent",
                  color: "rgba(232,234,240,0.5)",
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
              <button
                onClick={handleSaveCompany}
                disabled={company.yearlyTurnover <= 0 || company.criticalSystems.length === 0}
                style={{
                  padding: "10px 24px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  border: "none",
                  background: (company.yearlyTurnover <= 0 || company.criticalSystems.length === 0) ? "#1e2130" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  color: (company.yearlyTurnover <= 0 || company.criticalSystems.length === 0) ? "rgba(232,234,240,0.3)" : "white",
                  cursor: (company.yearlyTurnover <= 0 || company.criticalSystems.length === 0) ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Check style={{ width: 14, height: 14 }} /> Save Company Info
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
