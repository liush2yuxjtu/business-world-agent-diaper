import { defineEval } from "eve/evals";
import { satisfies } from "eve/evals/expect";

export default defineEval({
  description:
    "A scenario request stays modeled, does not mutate shared notes, and communicates that the result is not an observed market outcome.",
  tags: ["business-world", "scenario"],
  timeoutMs: 180_000,
  async test(t) {
    const turn = await t.send(
      "Run a direction-only scenario where content engagement improves 10%. Compare it with the current baseline, but do not change any real platform or durable notes.",
    );

    turn.calledTool("business_scenario_experiment");
    t.notCalledTool("business_world_update_notes");
    t.check(
      turn.message,
      satisfies(
        (message) =>
          /scenario|情景|modeled|模型|模拟|not.*observ|不是.*观测|预测/i.test(
            String(message),
          ),
        "keeps the scenario explicitly modeled rather than observed",
      ),
    );
    t.noFailedActions();
    t.succeeded();
  },
});
