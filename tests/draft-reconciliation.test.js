import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcileDraft} from '../src/draft-reconciliation.js';

const prior=()=>[
 {id:'a',sourceId:'a',title:'手修正した仮設工事',duration:6,startDate:'2026-11-17',dependsOn:['b'],confirmed:true},
 {id:'b',sourceId:'b',title:'設備工事',duration:2,startDate:'',dependsOn:[],confirmed:true}
];
const generated=()=>[
 {id:'a',sourceId:'a',title:'自動認識の工程',duration:3,startDate:'',dependsOn:['b'],reason:'AIから抽出'},
 {id:'b',sourceId:'b',title:'設備工事',duration:2,startDate:'',dependsOn:[]}
];

test('confirmed user edits survive a repeated analysis without canvas changes',()=>{
 const out=reconcileDraft(prior(),generated(),false);
 assert.equal(out[0].title,'手修正した仮設工事');
 assert.equal(out[0].duration,6);
 assert.equal(out[0].startDate,'2026-11-17');
 assert.deepEqual(out[0].dependsOn,['b']);
 assert.equal(out[0].confirmed,true);
});
test('a changed canvas preserves edits but requires review again',()=>{
 const out=reconcileDraft(prior(),generated(),true);
 assert.equal(out[0].title,'手修正した仮設工事');
 assert.equal(out[0].duration,6);
 assert.equal(out[0].confirmed,false);
 assert.equal(out[0].needsReview,true);
 assert.ok(out[0].reason.includes('要再確認'));
});
test('deleted predecessor is removed with a warning',()=>{
 const onlyA=[generated()[0]];
 const out=reconcileDraft(prior(),onlyA,true);
 assert.deepEqual(out[0].dependsOn,[]);
 assert.equal(out[0].needsReview,true);
 assert.ok(out[0].reason.includes('削除'));
});
test('newly discovered tasks are unconfirmed without stale edits',()=>{
 const next=[...generated(),{id:'c',sourceId:'c',title:'新しい検査',duration:1,dependsOn:[]}];
 const out=reconcileDraft(prior(),next,false);
 assert.equal(out[2].title,'新しい検査');
 assert.equal(out[2].confirmed,false);
});
test('tasks removed from the source do not reappear',()=>{
 const next=[generated()[0]];
 const out=reconcileDraft(prior(),next,true);
 assert.equal(out.length,1);
 assert.equal(out[0].id,'a');
});
