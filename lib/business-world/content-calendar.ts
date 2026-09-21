// Date-only arithmetic is independent of the browser's timezone and DST changes.
export function calendarWeek(anchor: string) {
  const date = new Date(`${anchor}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(anchor) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0,10)!==anchor) return [];
  date.setUTCDate(date.getUTCDate() - (date.getUTCDay()+6)%7);
  return Array.from({length:7},(_,i)=>{const day=new Date(date);day.setUTCDate(day.getUTCDate()+i);return day.toISOString().slice(0,10);});
}
export function shiftCalendarWeek(anchor: string, weeks: number) {
  const dates=calendarWeek(anchor); if(!dates.length)return '';
  const date=new Date(`${dates[0]}T12:00:00Z`);date.setUTCDate(date.getUTCDate()+weeks*7);return date.toISOString().slice(0,10);
}
export function localCalendarDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
