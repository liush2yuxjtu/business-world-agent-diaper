import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";
import {
  getBusinessWorldState,
  saveBusinessWorldState,
} from "@/lib/business-world/real-service";

export default defineTool({
  approval: always(),
  description:
    "Persist a durable Business World operating note onto the current state. This changes shared project state, so it always requires human approval. Do not use it for secrets or personal data.",
  inputSchema: z.object({
    notes: z.string().trim().min(1).max(4000),
    reason: z
      .string()
      .trim()
      .min(3)
      .max(500)
      .describe("Why this durable note should replace the current Business World note."),
  }),
  async execute({ notes, reason }) {
    const current = await getBusinessWorldState();

    if (!current) {
      return {
        success: false,
        error: "Business World state is unavailable; no durable note was written.",
      };
    }

    const saved = await saveBusinessWorldState({
      sourceLabel: current.sourceLabel,
      sourceType: current.sourceType,
      observedAt: current.observedAt,
      payload: {
        ...current.payload,
        notes,
      },
    });

    return {
      success: true,
      reason,
      stateId: saved.id,
      sourceLabel: saved.sourceLabel,
      updatedAt: saved.updatedAt,
    };
  },
});
