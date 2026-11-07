import test from 'node:test';
import assert from 'node:assert/strict';
import {extractDraft, scheduleTasks, scheduleToCSV, validateScheduleDependencies, updateTaskDurationText, durationFromText} from '../src/scheduler.js';
import {validateImportedProject} from '../src/import-validation.js';
import {reconcileDraft} from '../src/draft-reconciliation.js';
import {serializeProjectState, restoredProjectFlags, trySaveProject} from '../src/persistence.js';
import {computeGanttWindow, visibleGanttSegment} from '../src/gantt-window.js';
import {shouldUseSpaceForPan} from '../src/keyboard.js';

const t=(id,title,duration,dependsOn=[],startDate='')=>({id,sourceId:id,title,duration,dependsOn,startDate,confirmed:true,needsReview:false});
const weekday={workdays:[1,2,3,4,5],holidays:[]};

// Published example R01: 4 days + a week boundary + 3 days. The weekday setting
// and exact dates below are synthesized for regression testing, not actual job records.
// https://handyman.jp/blog/oono-y/192191
test('R01: four-day and three-day sequential renovation respects nonworking weekend',()=>{
 const items=[t('bath','浴室・洗面',4),t('kitchen','キッチン・内装',3,['bath'])];
 const plan=scheduleTasks(items,'2026-11-09',weekday);
 assert.equal(plan.tasks[0].start,'2026-11-09');
 assert.equal(plan.tasks[0].end,'2026-11-12');
 assert.equal(plan.tasks[1].start,'2026-11-13');
 assert.equal(plan.tasks[1].end,'2026-11-17');
});

// Published R02: five non-consecutive construction days in 2025; the test
// groups them as 1+2+2 periods, without inventing work-type allocations.
// https://kyodo.or.jp/jirei/reform-type/20496/
test('R02: published nonconsecutive dates remain distinct scheduling periods',()=>{
 const items=[t('p1','期間1',1,[],'2025-03-27'),t('p2','期間2',2,[],'2025-04-18'),t('p3','期間3',2,[],'2025-04-25')];
 const plan=scheduleTasks(items,'2025-03-27');
 assert.deepEqual(plan.tasks.map(x=>x.start),['2025-03-27','2025-04-18','2025-04-25']);
});
test('calendar excludes a declared site holiday',()=>{
 const plan=scheduleTasks([t('a','設備',3)],'2026-11-09',{workdays:[1,2,3,4,5],holidays:['2026-11-11']});
 assert.equal(plan.tasks[0].end,'2026-11-12');
});
test('preconstruction survey can precede construction start without losing date',()=>{
 const plan=scheduleTasks([t('survey','事前調査',1,[],'2026-11-05')],'2026-11-09');
 assert.equal(plan.tasks[0].start,'2026-11-05');
});
test('unresolvable cyclic and dangling dependencies are flagged before distribution',()=>{
 const cycles=[t('a','A',1,['b']),t('b','B',1,['a'])];
 assert.ok(validateScheduleDependencies(cycles).some(x=>x.includes('循環')));
 assert.ok(validateScheduleDependencies([t('a','A',1,['missing'])]).some(x=>x.includes('存在しない')));
});
test('CSV escapes formulas and distinguishes unconfirmed tasks',()=>{
 const csv=scheduleToCSV([{
  ...t('a','=1+1',1),confirmed:false,assignee:' @工程担当',start:'2026-11-09',end:'2026-11-09'
 }]);
 assert.ok(csv.includes("'=1+1"));
 assert.ok(csv.includes("' @工程担当"));
 assert.ok(csv.includes('"要確認"'));
 assert.ok(csv.startsWith('\ufeff'));
});
test('a manual duration edit preserves the construction notes',()=>{
 const original='外壁仕上げ\n2日\n雨天後は乾燥確認';
 assert.equal(updateTaskDurationText(original,4),'外壁仕上げ\n4日\n雨天後は乾燥確認');
});
test('draft reanalysis retains user adjustments and reopens confirmation',()=>{
 const old=[{...t('a','調整済み',5),confirmed:true}];
 const fresh=[t('a','AI元データ',2)];
 const next=reconcileDraft(old,fresh,true)[0];
 assert.equal(next.title,'調整済み');
 assert.equal(next.duration,5);
 assert.equal(next.confirmed,false);
});
test('import rejects duplicate identifiers and preserves the work calendar',()=>{
 const project={nodes:[{id:'a',type:'task',x:0,y:0,w:220,h:100,text:'現場確認',duration:1}],edges:[],draft:[],projectStart:'2026-11-09',workCalendar:weekday};
 assert.deepEqual(validateImportedProject(project).workCalendar,weekday);
 assert.throws(()=>validateImportedProject({...project,nodes:[...project.nodes,...project.nodes]}));
});
test('project backups preserve holidays and stale analysis state',()=>{
 const project={nodes:[],edges:[],draft:[],projectStart:'2026-11-09',workCalendar:weekday,mode:'rules',stale:true};
 const recovered=JSON.parse(serializeProjectState(project));
 assert.deepEqual(recovered.workCalendar,weekday);
 assert.equal(restoredProjectFlags(recovered,true).stale,true);
});
test('save failures are reported without reporting success',()=>{
 assert.equal(trySaveProject({setItem(){throw new Error('storage unavailable')}},'fieldnote','{}'),false);
});
test('Gantt after day 60 is reachable without rendering more than 60 columns',()=>{
 const tasks=[{start:'2026-11-09',end:'2027-02-09'}];
 const page=computeGanttWindow(tasks,'2026-11-09',1,60);
 const segment=visibleGanttSegment(60,90,page.offset,page.count);
 assert.equal(page.page,1);
 assert.ok(page.count<=60);
 assert.equal(segment.column,0);
});
test('Space activates a focused button instead of stealing the event for canvas panning',()=>{
 const element={tagName:'BUTTON',isContentEditable:false,closest:()=>null};
 assert.equal(shouldUseSpaceForPan({key:' ',repeat:false},element),false);
});
test.todo('E2E: recheck modified tabs and CSV downloads in an actual browser (#140, #18)');
test.todo('External: verify CSV formula protection in spreadsheet applications (#336)');
test.todo('Domain: decide partial-day and 200-day duration semantics (#345, #347)');
