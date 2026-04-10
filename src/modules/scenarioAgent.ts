import { ParsedScenario } from "../utils/scenarioParser";

export interface BaseMetrics {
  failureProbability: number;
  impactPerHour: number;
  expectedDowntime: number;
  userImpactFactor: number;
  failureFrequency: number;
  expectedLoss: number;
}

function calculateLoss(metrics: BaseMetrics): number {
  return Math.round(
    metrics.failureProbability *
      metrics.impactPerHour *
      metrics.expectedDowntime *
      metrics.userImpactFactor *
      metrics.failureFrequency
  );
}

export function scenarioAgent(baseMetrics: BaseMetrics, scenario: ParsedScenario) {
  let modified = { ...baseMetrics };

  switch (scenario.type) {
    case "delay_fix":
      modified.failureFrequency *= scenario.time_multiplier || 1.5;
      modified.failureProbability = Math.min(1, modified.failureProbability * 1.3);
      break;

    case "traffic_spike":
      modified.impactPerHour *= scenario.load_factor || 1.5;
      modified.failureProbability = Math.min(1, modified.failureProbability * 1.2);
      break;

    case "fix_applied":
      modified.failureProbability *= 0.5;
      modified.failureFrequency *= 0.7;
      break;

    case "add_tests":
      modified.failureProbability *= 0.7;
      modified.expectedDowntime = Math.max(1, modified.expectedDowntime - 1);
      break;

    case "team_loss":
      modified.failureProbability = Math.min(1, modified.failureProbability * 1.4);
      modified.failureFrequency *= 1.2;
      break;

    case "critical_system":
      modified.userImpactFactor *= 1.5;
      modified.impactPerHour *= 1.5;
      break;
  }

  const newLoss = calculateLoss(modified);
  const oldLoss = baseMetrics.expectedLoss || calculateLoss(baseMetrics);
  const changePercent = oldLoss > 0 ? ((newLoss - oldLoss) / oldLoss) * 100 : 0;

  return {
    oldLoss,
    newLoss,
    change: newLoss - oldLoss,
    changePercent: Math.round(changePercent)
  };
}
