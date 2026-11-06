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

test('rapidly saved projects remain isolated after reopening storage',()=>{
  const storage=createMemoryStorage(),store=makeStore(storage);
  const a=store.bootstrap(blank()).project, b=store.create('別の現場',blank());
  store.setCurrent(a.id);
  store.save(a.id,{...blank(),stale:true,nodes:[{id:'first',type:'task'}]});
  store.setCurrent(b.id);
  store.save(b.id,{...blank(),nodes:[{id:'second',type:'task'}]});
  const reopened=makeStore(storage);
  assert.equal(reopened.bootstrap(blank()).project.id,b.id);
  assert.equal(reopened.load(a.id).nodes[0].id,'first');
  assert.equal(reopened.load(a.id).stale,true);
  assert.equal(reopened.load(b.id).nodes[0].id,'second');
});

test('deleting the last migrated project does not reimport legacy data',()=>{
  const raw=JSON.stringify(blank()),storage=createMemoryStorage({fieldnote_mvp_v1:raw});
  const store=makeStore(storage), {project}=store.bootstrap(blank());
  store.remove(project.id);
  assert.equal(makeStore(storage).bootstrap(blank()).project,null);
  assert.equal(storage.getItem('fieldnote_mvp_v1'),raw);
});

test('a failed index write does not leave an orphaned new project',()=>{
  const storage=createMemoryStorage(), write=storage.setItem;
  storage.setItem=(key,value)=>{if(key==='fieldnote_projects_v2')throw new Error('Quota exceeded');write(key,value)};
  assert.throws(()=>makeStore(storage).create('案件',blank()),/Quota/);
  assert.deepEqual(storage.dump(),{});
});

test('a damaged project index is not overwritten during startup',()=>{
  const storage=createMemoryStorage({fieldnote_projects_v2:'[null]'});
  assert.throws(()=>makeStore(storage).bootstrap(blank()),/invalid project index/);
  assert.equal(storage.getItem('fieldnote_projects_v2'),'[null]');
});

test('board saves stay atomic and do not need a second index write',()=>{
  const storage=createMemoryStorage(), store=makeStore(storage);
  const {project}=store.bootstrap(blank());
  const write=storage.setItem;
  storage.setItem=(key,value)=>{
    if(key==='fieldnote_projects_v2')throw new Error('index cannot be written');
    write(key,value);
  };
  store.save(project.id,{...blank(),nodes:[{id:'updated',type:'task'}]});
  assert.equal(makeStore(storage).list()[0].tasks,1);
  assert.notEqual(store.list()[0].updatedAt,project.updatedAt);
});
