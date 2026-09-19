import { defineSchedule } from "eve/schedules";

export default defineSchedule({
  cron: "0 0 * * *",
  markdown: [
    "Prepare the daily Business World brief.",
    "",
    "1. Call business_world_snapshot first.",
    "2. If the source is unavailable, stop and say exactly that; do not invent a brief.",
    "3. Separate observed/persisted facts, simulated values, and inference.",
    "4. Identify at most three material changes or decision points across content, live, ads, commerce, and personas.",
    "5. If a hypothesis needs deeper reasoning, delegate to diagnostician with the evidence already gathered.",
    "6. End with the next safe action. Do not mutate external systems and do not call approval-gated write tools.",
  ].join("\n"),
});
