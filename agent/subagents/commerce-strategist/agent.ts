import { defineAgent } from "eve";

export default defineAgent({
  description:
    "Analyze Business World product, inventory, conversion, refund, repeat-purchase, and commerce evidence. Propose safe experiments and checks without editing a real store or inventing product facts.",
  model: "anthropic/claude-haiku-4.5",
});
