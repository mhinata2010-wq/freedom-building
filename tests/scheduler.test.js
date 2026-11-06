import test from 'node:test';import assert from 'node:assert/strict';import {addDays,durationFromText,extractDraft,normalizeAiDraft,scheduleTasks,scheduleToCSV,groupInkStrokes,normalizeWorkCalendar,isWorkingDay} from '../src/scheduler.js';
test('duration recognizes Japanese and English durations',()=>{assert.equal(durationFromText('基礎工事 ３日'),3);assert.equal(durationFromText('配線 2営業日'),2);assert.equal(durationFromText('inspection 4 days'),4);assert.equal(durationFromText('検査'),null)});
test('dates handle month end and leap day',()=>{assert.equal(addDays('2028-02-28',1),'2028-02-29');assert.equal(addDays('2026-11-30',1),'2026-12-01')});
test('extracts structured cards and explicit arrows only',()=>{const n=[{id:'a',type:'task',text:'基礎工事\n3日'},{id:'b',type:'task',text:'配線\n2日'},{id:'c',type:'note',text:'雨天に注意'}];const t=extractDraft(n,[{from:'a',to:'b'}]);assert.equal(t.length,2);assert.deepEqual(t[1].dependsOn,['a']);assert.equal(t[0].duration,3)});
test('schedules following tasks after predecessor completion',()=>{const n=[{id:'a',type:'task',text:'A\n3日'},{id:'b',type:'task',text:'B\n2日'}];const s=scheduleTasks(extractDraft(n,[{from:'a',to:'b'}]),'2026-11-05');assert.equal(s.tasks[0].end,'2026-11-07');assert.equal(s.tasks[1].start,'2026-11-08');assert.ok(scheduleToCSV(s.tasks).startsWith('\ufeff'))});
test('does not silently accept inferred AI dependency',()=>{const nodes=[{id:'a',type:'task',text:'A'},{id:'b',type:'note',text:'B'}];const ai=normalizeAiDraft([{sourceId:'a',title:'A',duration:2,dependsOn:[],confidence:1},{sourceId:'b',title:'B',duration:4,dependsOn:['a'],confidence:.9}],nodes,[]);assert.equal(ai[1].needsReview,true)});
test('cycle detection produces a warning without infinite recursion',()=>{const t=[{id:'a',title:'A',duration:1,dependsOn:['b']},{id:'b',title:'B',duration:1,dependsOn:['a']}];const s=scheduleTasks(t,'2026-11-05');assert.ok(s.warnings.length>0)});

test('nearby handwriting strokes are grouped with stable IDs',()=>{const n=[{id:'p1',type:'pen',points:[[10,10],[20,20]]},{id:'p2',type:'pen',points:[[24,12],[32,20]]},{id:'p3',type:'pen',points:[[600,700],[610,720]]}];const g=groupInkStrokes(n);assert.equal(g.length,2);assert.ok(g.some(x=>x.strokeIds.length===2));assert.deepEqual(groupInkStrokes(n),g)});

test('project calendar skips Sundays and moves dependent tasks',()=>{
 const tasks=[{id:'a',title:'A',duration:3,dependsOn:[]},{id:'b',title:'B',duration:2,dependsOn:['a']}];
 const schedule=scheduleTasks(tasks,'2026-11-07',{workdays:[1,2,3,4,5,6]});
 assert.deepEqual(schedule.tasks.map(t=>[t.start,t.end]),[['2026-11-07','2026-11-10'],['2026-11-11','2026-11-12']]);
 assert.equal(isWorkingDay('2026-11-08',{workdays:[1,2,3,4,5,6]}),false);
});
test('custom holiday shifts dates but legacy scheduling stays unchanged',()=>{
 const tasks=[{id:'a',title:'A',duration:3,dependsOn:[]},{id:'b',title:'B',duration:2,dependsOn:['a']}];
 const c={workdays:[1,2,3,4,5,6],holidays:['2026-11-10']};
 const schedule=scheduleTasks(tasks,'2026-11-07',c);
 assert.equal(schedule.tasks[0].end,'2026-11-11');assert.equal(schedule.tasks[1].start,'2026-11-12');
 assert.equal(scheduleTasks(tasks,'2026-11-07').tasks[0].end,'2026-11-09');
 assert.deepEqual(normalizeWorkCalendar(null).workdays,[0,1,2,3,4,5,6]);
});
test('start on a holiday is adjusted with warning and no workday is rejected',()=>{
 const s=scheduleTasks([{id:'a',title:'A',duration:1,dependsOn:[],startDate:'2026-11-08'}],'2026-11-07',{workdays:[1,2,3,4,5,6]});
 assert.equal(s.tasks[0].start,'2026-11-09');assert.ok(s.warnings.some(w=>w.includes('休工日')));
 assert.throws(()=>scheduleTasks([], '2026-11-07',{workdays:[]}),/稼働日/);
});
