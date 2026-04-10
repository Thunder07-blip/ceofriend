import { orchestrate } from "./src/lib/orchestrator";
import { CompanyContext } from "./src/lib/types";

async function main() {
  const companyContext: CompanyContext = {
    industry: "saas",
    description: "test",
    yearlyTurnover: 10000000,
    teamSize: "medium",
    criticalSystems: ["payment", "auth"],
    deployFrequency: "weekly"
  };
  

  try {
    const result = await orchestrate("https://github.com/Thunder07-blip/Build-a-Thon", companyContext);
    
    console.log("Health:", result.riskData?.repoHealth);
    console.log("Total Loss:", result.impactData?.totalRiskExposure);
    console.log("Errors:", result.errors);
    
    if (result.riskData) {
      console.log("\nTop 5 Files by Risk:");
      for (const f of result.riskData.files.slice(0, 5)) {
        console.log(`- ${f.file}: Score=${f.riskScore}, Breakdown:`, f.breakdown);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

main();
