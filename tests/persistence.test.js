import test from 'node:test';
import assert from 'node:assert/strict';
import {restoredProjectFlags,serializeProjectState,trySaveProject} from '../src/persistence.js';

const example=()=>({nodes:[{id:'a',type:'task',text:'施工'}],edges:[],draft:[{id:'a',title:'施工',duration:1}],projectStart:'2026-11-09',mode:'rules',stale:true});

test('stale draft and analysis mode survive serialization and reload',()=>{
 const result=JSON.parse(serializeProjectState(example()));
 assert.equal(restoredProjectFlags(result,true).stale,true);
 assert.equal(restoredProjectFlags(result,true).mode,'rules');
});
test('legacy projects with draft and no flag are conservatively stale',()=>{
 assert.equal(restoredProjectFlags({draft:[{id:'x'}]},true).stale,true);
 assert.equal(restoredProjectFlags({draft:[]},true).stale,false);
 assert.equal(restoredProjectFlags({draft:[{id:'x'}]},false).stale,false);
});
test('explicit false stale state is preserved after reload',()=>{
 assert.equal(restoredProjectFlags({...example(),stale:false},true).stale,false);
});
test('failed localStorage writes return false without pretending success',()=>{
 const storage={setItem(){throw new Error('QuotaExceededError')}};
 assert.equal(trySaveProject(storage,'fieldnote_mvp_v1','{}'),false);
});
test('successful localStorage writes preserve full state',()=>{
 const store=new Map(),storage={setItem:(k,v)=>store.set(k,v)};
 const json=serializeProjectState(example());
 assert.equal(trySaveProject(storage,'fieldnote_mvp_v1',json),true);
 assert.equal(JSON.parse(store.get('fieldnote_mvp_v1')).stale,true);
});

test('work calendar is retained with the saved snapshot',()=>{
 const input={...example(),workCalendar:{workdays:[1,2,3,4,5],holidays:['2026-11-11']}};
 assert.deepEqual(JSON.parse(serializeProjectState(input)).workCalendar,input.workCalendar);
});
