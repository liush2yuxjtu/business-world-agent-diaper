import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Analyze Business World growth and ad evidence and propose bounded experiments around budget efficiency, creative signals, acquisition, and conversion. Use only after the caller supplies current provenance and metrics. Never change a real ad account.",
  model: "anthropic/claude-haiku-4.5",
});
