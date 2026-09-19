import Lake
open Lake DSL

package «cedar-proof-demo» where

lean_lib CedarProofDemo where
  roots := #[`ReadOnlySql]
