import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
let ready: Promise<void> | null=null;
async function ensureSchema(){
  if(!ready)ready=(async()=>{await db.execute(sql`CREATE TABLE IF NOT EXISTS business_world_workspace (owner_id text PRIMARY KEY, revision bigint NOT NULL, state jsonb NOT NULL, updated_at timestamptz NOT NULL)`);})().catch(error=>{ready=null;throw error;});
  await ready;
}
type Row={revision:unknown;state:unknown;updated_at:unknown};
export async function readPostgresWorkspace(owner:string):Promise<Row|undefined>{
  await ensureSchema();
  const result=await db.execute(sql`SELECT revision,state,updated_at FROM business_world_workspace WHERE owner_id=${owner}`);
  return result.rows[0] as Row|undefined;
}
/** A single compare-and-swap statement prevents lost updates across workers. */
export async function writePostgresWorkspace(owner:string,revision:number,state:unknown,now:string):Promise<Row|undefined>{
  await ensureSchema();
  const result=await db.execute(sql`INSERT INTO business_world_workspace(owner_id,revision,state,updated_at) VALUES (${owner},${revision+1},${JSON.stringify(state)}::jsonb,${now}::timestamptz) ON CONFLICT(owner_id) DO UPDATE SET revision=excluded.revision,state=excluded.state,updated_at=excluded.updated_at WHERE business_world_workspace.revision=${revision} RETURNING revision,state,updated_at`);
  return result.rows[0] as Row|undefined;
}
