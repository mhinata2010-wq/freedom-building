import test from 'node:test';
import assert from 'node:assert/strict';
import {validateImportedProject} from '../src/import-validation.js';

const backup=()=>({
 nodes:[
  {id:'a',type:'task',x:0,y:0,w:220,h:110,text:'現場調査\\n2日',duration:2},
  {id:'b',type:'note',x:250,y:0,w:220,h:100,text:'メモ'}
 ],
 edges:[{id:'e1',from:'a',to:'b'}],
 draft:[{id:'a',sourceId:'a',title:'現場調査',duration:2,dependsOn:[],confirmed:false}],
 projectStart:'2026-11-09'
});

test('valid project JSON keeps nodes, arrows and draft for round trip',()=>{
 const data=backup(),parsed=validateImportedProject(data);
 assert.equal(parsed.nodes.length,2);
 assert.equal(parsed.edges[0].to,'b');
 assert.equal(parsed.draft[0].title,'現場調査');
 assert.equal(parsed.projectStart,'2026-11-09');
});
test('null nodes and duplicate IDs are rejected without editing the input',()=>{
 const original=backup();const snapshot=JSON.stringify(original);
 assert.throws(()=>validateImportedProject({...original,nodes:[null]}));
 assert.throws(()=>validateImportedProject({...original,nodes:[original.nodes[0],original.nodes[0]]}));
 assert.equal(JSON.stringify(original),snapshot);
});
test('dangling and duplicated arrows cannot enter the canvas',()=>{
 const data=backup();
 assert.throws(()=>validateImportedProject({...data,edges:[{id:'x',from:'a',to:'missing'}]}));
 assert.throws(()=>validateImportedProject({...data,edges:[{id:'x',from:'a',to:'a'}]}));
 assert.throws(()=>validateImportedProject({...data,edges:[data.edges[0],data.edges[0]]}));
});
test('invalid dates, dimensions and draft durations are rejected',()=>{
 const data=backup();
 assert.throws(()=>validateImportedProject({...data,projectStart:'2026-02-31'}));
 assert.throws(()=>validateImportedProject({...data,nodes:[{...data.nodes[0],w:0}]}));
 assert.throws(()=>validateImportedProject({...data,draft:[{id:'a',title:'工事',duration:0}]}));
});
test('valid pen drawings remain compatible',()=>{
 const data=backup();
 const parsed=validateImportedProject({...data,nodes:[{id:'pen1',type:'pen',points:[[0,0],[20,15]]}],edges:[],draft:[]});
 assert.equal(parsed.nodes[0].points.length,2);
});
test('oversized and malformed arrays are rejected',()=>{
 const data=backup();
 assert.throws(()=>validateImportedProject({...data,nodes:new Array(501).fill(data.nodes[0])}));
 assert.throws(()=>validateImportedProject({...data,edges:'not-an-array'}));
 assert.throws(()=>validateImportedProject({...data,draft:'not-an-array'}));
});
