import test from 'node:test';
import assert from 'node:assert/strict';
import {createMemoryStorage,createProjectStore} from '../src/projects.js';

const blank=()=>({nodes:[],edges:[],draft:[],projectStart:'2026-11-06'});
let serial=0;
const makeStore=(storage=createMemoryStorage())=>createProjectStore(storage,{now:()=>`2026-11-06T00:00:0${serial++}Z`,makeId:()=>`p${serial++}`});

test('bootstraps one local project and persists board data',()=>{
  serial=0;const storage=createMemoryStorage(),store=makeStore(storage),boot=store.bootstrap(blank());
  assert.equal(store.list().length,1);assert.equal(boot.project.name,'新しい工程計画');
  const data=blank();data.nodes.push({id:'a',type:'task'});store.save(boot.project.id,data);
  assert.equal(store.load(boot.project.id).nodes.length,1);assert.equal(store.list()[0].tasks,1);
});

test('creates, duplicates, renames and deletes projects',()=>{
  serial=0;const store=makeStore();const first=store.bootstrap(blank()).project;
  const second=store.create('ホテル改修',blank());store.rename(second.id,'ホテル改修 2期');
  const copy=store.duplicate(second.id);assert.equal(copy.name,'ホテル改修 2期 のコピー');
  assert.equal(store.list().length,3);store.remove(first.id);assert.equal(store.list().length,2);
});

test('migrates legacy single-board storage without deleting it',()=>{
  serial=0;const legacy={...blank(),nodes:[{id:'legacy',type:'task'}]};
  const storage=createMemoryStorage({fieldnote_mvp_v1:JSON.stringify(legacy)});const boot=makeStore(storage).bootstrap(blank());
  assert.equal(boot.migrated,true);assert.equal(boot.data.nodes[0].id,'legacy');assert.ok(storage.getItem('fieldnote_mvp_v1'));
});
