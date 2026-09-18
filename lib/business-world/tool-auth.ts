import type { SessionContext } from "eve/context";
import { BusinessWorldError, workspaceOwner } from "./workspace-service";
export function toolOwner(ctx:SessionContext){
  const caller=ctx?.session?.auth?.current;
  if(caller?.principalType!=="user"||!caller.principalId)throw new BusinessWorldError("authentication-required");
  return workspaceOwner(caller.principalId);
}
