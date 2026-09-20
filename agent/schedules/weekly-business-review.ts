import { defineSchedule } from "eve/schedules";

export default defineSchedule({
  cron: "0 0 * * 1",
  markdown: [
    "Prepare the weekly Business World review.",
    "",
    "1. Read business_world_snapshot and the narrow domain tools needed for the review.",
    "2. State the source mode and freshness before interpreting any metric.",
    "3. Ask diagnostician to test the strongest operating hypothesis against the evidence.",
    "4. Ask the relevant specialist only when its domain is material.",
    "5. Summarize what is verified, what remains simulated, what is inferred, and what should be tested next.",
    "6. Do not change budgets, publish content, edit external systems, or persist shared notes.",
  ].join("\n"),
});
