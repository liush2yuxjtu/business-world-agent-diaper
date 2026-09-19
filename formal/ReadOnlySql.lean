inductive SqlAction where
  | select
  | delete
  | other
  deriving DecidableEq

/--
A tiny executable mirror of the Cedar demo policy:
SELECT is allowed; DELETE and every unsupported action are denied.
This theorem proves the rule-level invariant shown in the UI.
It does not claim that natural-language-to-SQL interpretation is formally verified.
-/
def cedarAllows : SqlAction → Bool
  | .select => true
  | .delete => false
  | .other => false

theorem read_only_policy_sound
    (action : SqlAction)
    (h : cedarAllows action = true) :
    action = .select := by
  cases action <;> simp [cedarAllows] at h ⊢
