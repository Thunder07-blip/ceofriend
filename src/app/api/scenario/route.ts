import { NextRequest } from "next/server";
import { parseScenario, explainScenario } from "@/utils/scenarioParser";
import { scenarioAgent } from "@/modules/scenarioAgent";

export async function POST(request: NextRequest) {
  try {
    const { question, baseMetrics } = await request.json();

    if (!question || !baseMetrics) {
      return Response.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const scenario = await parseScenario(question);
    if (!scenario) {
      return Response.json({ success: false, error: "Failed to parse scenario" }, { status: 500 });
    }

    const result = scenarioAgent(baseMetrics, scenario);
    const explanation = await explainScenario(result.oldLoss, result.newLoss, scenario.type);

    return Response.json({
      success: true,
      data: {
        ...result,
        explanation
      }
    });

  } catch (error) {
    console.error("[Scenario API] Error:", error);
    return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
