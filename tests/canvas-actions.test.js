import test from 'node:test';
import assert from 'node:assert/strict';
import {centeredNotePosition,reconnectTarget,shouldDeleteDetachedArrow} from '../src/canvas-actions.js';

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

test('intentional drag onto empty canvas deletes the existing connection',()=>{
 assert.equal(shouldDeleteDetachedArrow('pointerup',{x:100,y:100},{x:170,y:150},false),true);
});
test('dropping on a valid task does not delete the connection',()=>{
 assert.equal(shouldDeleteDetachedArrow('pointerup',{x:100,y:100},{x:170,y:150},true),false);
});
test('clicks, tiny moves and cancelled drags preserve the arrow',()=>{
 assert.equal(shouldDeleteDetachedArrow('pointerup',{x:100,y:100},{x:100,y:100},false),false);
 assert.equal(shouldDeleteDetachedArrow('pointerup',{x:100,y:100},{x:110,y:106},false),false);
 assert.equal(shouldDeleteDetachedArrow('pointercancel',{x:100,y:100},{x:180,y:180},false),false);
 assert.equal(shouldDeleteDetachedArrow('pointerup',null,{x:180,y:180},false),false);
});
test('screen pixel deletion threshold is independent of zoom',()=>{
 assert.equal(shouldDeleteDetachedArrow('pointerup',{x:0,y:0},{x:14,y:0},false),true);
 assert.equal(shouldDeleteDetachedArrow('pointerup',{x:0,y:0},{x:13,y:0},false),false);
});
