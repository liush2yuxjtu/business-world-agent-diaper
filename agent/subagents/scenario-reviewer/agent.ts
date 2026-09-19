import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Independently review a Business World scenario before it influences a decision. Check baseline provenance, assumptions, linear-model limitations, operational constraints, and whether the conclusion overstates what the scenario proves.",
  model: "anthropic/claude-haiku-4.5",
});
