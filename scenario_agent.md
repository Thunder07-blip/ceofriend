🧠 1. What is Scenario Agent?

A module that converts CEO questions → variable changes → new financial outcome

⚡ Core Idea
User Question
   ↓
Parse Intent (LLM)
   ↓
Modify Model Variables
   ↓
Recalculate Loss
   ↓
Explain Result
🧩 2. Where It Fits
Repo → Risk → Prediction → Impact
                          ↓
                    Scenario Agent
                          ↓
                      New Output
⚙️ 3. Folder Structure
/src/modules/scenarioAgent.ts
/src/utils/scenarioParser.ts
🔧 4. Step-by-Step Build
🟦 Step 1: Scenario Parser (LLM)
Input:
“What if I don’t fix payment service for 2 months?”
Output (structured JSON):
{
  "type": "delay_fix",
  "target": "payment",
  "time_multiplier": 2
}
Prompt (use this EXACT)
Convert the user's scenario into structured JSON.

Supported types:
- delay_fix
- traffic_spike
- fix_applied
- add_tests
- team_loss
- critical_system

Return JSON only.

User input: {input}
🟨 Step 2: Scenario Agent Logic
Core function
export function scenarioAgent(baseMetrics, scenario) {

  let modified = { ...baseMetrics };

  switch (scenario.type) {

    case "delay_fix":
      modified.F_exp *= scenario.time_multiplier;
      modified.P_fail = Math.min(1, modified.P_fail * 1.3);
      break;

    case "traffic_spike":
      modified.C_hour *= scenario.load_factor || 1.5;
      modified.P_fail *= 1.2;
      break;

    case "fix_applied":
      modified.P_fail *= 0.5;
      modified.F_exp *= 0.7;
      break;

    case "add_tests":
      modified.P_fail *= 0.7;
      modified.T_down = Math.max(1, modified.T_down - 1);
      break;

    case "team_loss":
      modified.P_fail *= 1.4;
      modified.F_exp *= 1.2;
      break;

    case "critical_system":
      modified.U_impact *= 1.5;
      modified.C_hour *= 1.5;
      break;
  }

  const newLoss = calculateLoss(modified);

  return {
    oldLoss: baseMetrics.E_loss,
    newLoss,
    change: newLoss - baseMetrics.E_loss
  };
}
🟥 Step 3: Hook into API
New endpoint
POST /api/scenario
Request:
{
  "question": "What if I delay fixing payment for 2 months?",
  "baseMetrics": {...}
}
Flow:
const scenario = await parseScenario(question);
const result = scenarioAgent(baseMetrics, scenario);
return result;
🟩 Step 4: Frontend UI
Add:
💬 Scenario Input Box
Ask: What happens if...
Output:
📊 Scenario Result

Old Loss: ₹1.2L  
New Loss: ₹2.8L  
Change: +133%

Reason:
- increased failure probability
- higher frequency
🧠 5. Explanation Layer (LLM)
Input:
{
  "oldLoss": 120000,
  "newLoss": 280000,
  "scenario": "delay_fix"
}
Output:

“Delaying fixes increases system instability, leading to more frequent failures and higher financial risk.”

⚠️ 6. IMPORTANT RULES
❌ Don’t do:
LLM calculating numbers
random logic
✅ Do:
LLM → understand scenario
your math → compute
🧪 7. Testing Cases
Test:
delay_fix → loss increases
fix_applied → loss decreases
traffic_spike → cost increases