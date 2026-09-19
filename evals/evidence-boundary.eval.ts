import { defineEval } from "eve/evals";
import { satisfies } from "eve/evals/expect";

export default defineEval({
  description:
    "Business World answers read evidence first and keep simulated, persisted, and inferred claims separate.",
  tags: ["business-world", "evidence"],
  timeoutMs: 180_000,
  async test(t) {
    const turn = await t.send(
      "Read the current Business World and tell me what is actually supported versus simulated or inferred. Do not change any state.",
    );

    turn.calledTool("business_world_snapshot");
    t.notCalledTool("business_world_update_notes");
    t.check(
      turn.message,
      satisfies(
        (message) => /simulat|模拟|来源|source|persist|观测|observed|推断|infer/i.test(String(message)),
        "labels the evidence boundary instead of presenting all values as observed truth",
      ),
    );
    t.noFailedActions();
    t.succeeded();
  },
});
