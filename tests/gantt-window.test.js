import test from 'node:test';
import assert from 'node:assert/strict';
import {computeGanttWindow,visibleGanttSegment,daysBetween} from '../src/gantt-window.js';

test('75 and 180 day plans have reachable later pages',()=>{
 const long=[{start:'2026-11-09',end:'2027-05-07'}];
 const first=computeGanttWindow(long,'2026-11-09',0);
 const last=computeGanttWindow(long,'2026-11-09',3);
 assert.equal(first.count,60);
 assert.ok(first.pageCount>=3);
 assert.ok(last.offset>=120);
 assert.ok(last.count>0);
});
test('a task continuing into a later page gets a visible segment',()=>{
 const part=visibleGanttSegment(57,75,60,60);
 assert.deepEqual({column:part.column,days:part.days,continuesBefore:part.continuesBefore},{column:0,days:16,continuesBefore:true});
});
test('outside-window tasks do not produce a bar',()=>{
 assert.equal(visibleGanttSegment(0,20,60,60),null);
 assert.equal(visibleGanttSegment(180,200,0,60),null);
});
test('explicit preparation before project start is included',()=>{
 const tasks=[{start:'2026-11-05',end:'2026-11-05'},{start:'2026-11-09',end:'2026-11-14'}];
 const window=computeGanttWindow(tasks,'2026-11-09');
 assert.equal(window.minDay,-4);
 assert.equal(window.offset,-4);
});
test('pages clamp without creating thousands of DOM columns',()=>{
 const tasks=[{start:'2026-11-09',end:'2028-05-01'}];
 const window=computeGanttWindow(tasks,'2026-11-09',99999);
 assert.ok(window.page>=0);
 assert.ok(window.count<=60);
 assert.equal(window.page,window.pageCount-1);
});
test('months and year boundaries retain exact offsets',()=>{
 assert.equal(daysBetween('2027-01-01','2026-12-31'),1);
 assert.equal(daysBetween('2026-11-05','2026-11-09'),-4);
});
