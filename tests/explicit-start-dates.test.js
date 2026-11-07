import test from 'node:test';
import assert from 'node:assert/strict';
import {scheduleTasks} from '../src/scheduler.js';

const task=(id,duration=1,dependsOn=[],startDate='')=>({id,title:id,duration,dependsOn,startDate});

test('a preparatory task may start before the project baseline',()=>{
 const s=scheduleTasks([task('survey',1,[],'2026-11-05')],'2026-11-09');
 assert.equal(s.tasks[0].start,'2026-11-05');
 assert.equal(s.tasks[0].end,'2026-11-05');
 assert.equal(s.warnings.length,0);
});
test('dependencies override early manually requested dates with a warning',()=>{
 const s=scheduleTasks([task('a',3),task('b',2,['a'],'2026-11-08')],'2026-11-09');
 assert.equal(s.tasks[1].start,'2026-11-12');
 assert.ok(s.warnings.length>0);
});
test('a later explicit start date is respected',()=>{
 const s=scheduleTasks([task('a',2,[],'2026-11-20')],'2026-11-09');
 assert.equal(s.tasks[0].start,'2026-11-20');
});
test('early preparatory start works across year boundary',()=>{
 const s=scheduleTasks([task('survey',1,[],'2026-12-28')],'2027-01-05');
 assert.equal(s.tasks[0].start,'2026-12-28');
});
