/** Build bounded Gantt pages without silently truncating long schedules. */
export function daysBetween(iso,base) {
 const a=new Date(iso+'T12:00:00Z'),b=new Date(base+'T12:00:00Z');
 return Math.round((a.getTime()-b.getTime())/86400000);
}
export function computeGanttWindow(tasks,projectStart,requestedPage=0,pageSize=60) {
 const starts=tasks.map(t=>daysBetween(t.start,projectStart));
 const ends=tasks.map(t=>daysBetween(t.end,projectStart));
 const minDay=Math.min(0,...starts);
 const maxExclusive=Math.max(15,...ends.map(d=>d+3));
 const total=Math.max(15,maxExclusive-minDay);
 const pageCount=Math.ceil(total/pageSize);
 const page=Math.max(0,Math.min(pageCount-1,Number.isInteger(requestedPage)?requestedPage:0));
 const offset=minDay+page*pageSize;
 const count=Math.min(pageSize,total-page*pageSize);
 return {page,pageCount,offset,count,total,minDay,maxExclusive};
}
export function visibleGanttSegment(startDay,endDay,offset,count) {
 const from=Math.max(startDay,offset),to=Math.min(endDay,offset+count-1);
 if(!Number.isFinite(from)||!Number.isFinite(to)||from>to)return null;
 return {column:from-offset,days:to-from+1,continuesBefore:startDay<offset,continuesAfter:endDay>offset+count-1};
}
