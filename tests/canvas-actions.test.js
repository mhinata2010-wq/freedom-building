import test from 'node:test';
import assert from 'node:assert/strict';
import {centeredNotePosition,reconnectTarget} from '../src/canvas-actions.js';

const tasks=[
 {id:'a',type:'task',x:0,y:0,w:100,h:70},
 {id:'b',type:'task',x:200,y:0,w:100,h:70},
 {id:'c',type:'task',x:400,y:0,w:100,h:70},
 {id:'note',type:'note',x:400,y:150,w:200,h:120}
];
const edges=[{id:'ab',from:'a',to:'b'},{id:'bc',from:'b',to:'c'}];

test('one-click note is centered in the visible canvas at zoom 1',()=>{
 assert.deepEqual(centeredNotePosition({width:800,height:600},1,0,0),{x:290,y:238});
});
test('note remains centered after zooming and panning',()=>{
 assert.deepEqual(centeredNotePosition({width:800,height:600},2,100,80),{x:40,y:48});
});
test('arrow target can be changed without changing its ID and unrelated edges',()=>{
 const out=reconnectTarget(edges,tasks,'ab','c');
 assert.equal(out.ok,true);
 assert.equal(out.edges[0].id,'ab');
 assert.equal(out.edges[0].to,'c');
 assert.equal(out.edges[1],edges[1]);
 assert.equal(edges[0].to,'b');
});
test('invalid, self, note, or missing target cannot change arrow',()=>{
 for(const target of ['a','note','missing']){
  assert.equal(reconnectTarget(edges,tasks,'ab',target).ok,false);
 }
});
test('duplicate arrows cannot be created',()=>{
 const current=[{id:'ab',from:'a',to:'b'},{id:'ac',from:'a',to:'c'}];
 assert.equal(reconnectTarget(current,tasks,'ab','c').reason,'duplicate');
});
test('reconnecting to an ancestor does not allow dependency cycles',()=>{
 const result=reconnectTarget(edges,tasks,'bc','a');
 assert.equal(result.reason,'cycle');
});
test('dropping on same target does not make a new history entry',()=>{
 const result=reconnectTarget(edges,tasks,'ab','b');
 assert.equal(result.ok,true);
 assert.equal(result.unchanged,true);
});
