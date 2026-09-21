export const entityScreens = { persona:'persona', topic:'content', product:'product', campaign:'growth', session:'live' } as const;
export type EntityKind = keyof typeof entityScreens;
export function entityHref(kind: EntityKind, id: string) {
  return `?screen=${entityScreens[kind]}&entity=${encodeURIComponent(`${kind}:${id}`)}`;
}
export function selectedEntityIndex(kind: EntityKind, ids: string[], search: string) {
  const entity = new URLSearchParams(search).get('entity');
  return Math.max(0, ids.findIndex(id=>entity===`${kind}:${id}`));
}
