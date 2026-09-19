---
description: Decide when Business World context is durable enough to persist as shared operating memory, and how to save it safely without storing secrets, personal data, transient chat, or unverified claims.
---

# Business memory

The durable shared memory surface is the Business World state's `notes` field.

Persist only information that is:
- stable enough to matter in later sessions;
- about the business/project, not a person's private profile;
- safe to share with operators of this Business World;
- clearly labeled when it is an assumption or pending verification.

Do not persist:
- passwords, tokens, credentials, private identifiers, or secrets;
- transient conversation details;
- simulated outputs presented as truth;
- a recommendation that has not been accepted as standing context.

To change durable notes, call `business_world_update_notes`. It always requires human approval. Read the current state before proposing replacement notes so useful context is not silently discarded.
