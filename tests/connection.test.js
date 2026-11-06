import test from 'node:test';
import assert from 'node:assert/strict';
import {portPosition,dropTarget,incomingSide,curveBetween,wouldCreateCycle,edgeAnchors,edgeBendPoint,bendOffset,routedEdgePath} from '../src/connection.js';
const a={id:'a',type:'task',x:10,y:20,w:200,h:100};
const b={id:'b',type:'task',x:350,y:30,w:200,h:100};
test('ports are anchored to all four sides',()=>{
 assert.deepEqual(portPosition(a,'left'),{x:10,y:70});
 assert.deepEqual(portPosition(a,'right'),{x:210,y:70});
 assert.deepEqual(portPosition(a,'top'),{x:110,y:20});
 assert.deepEqual(portPosition(a,'bottom'),{x:110,y:120});
});
test('drop target accepts only other task rectangles',()=>{
 assert.equal(dropTarget([a,b],{x:450,y:60},a.id)?.id,'b');
 assert.equal(dropTarget([a,b],{x:30,y:50},a.id),null);
 assert.equal(dropTarget([a,{...b,type:'note'}],{x:400,y:40},a.id),null);
});
test('arrow curves remain attached to correct card edges',()=>{
 const side=incomingSide(a,b);
 assert.equal(side,'left');
 const d=curveBetween(portPosition(a,'right'),portPosition(b,side),'right',side);
 assert.match(d,/^M210 70 C/);
 assert.match(d,/,350 80$/);
});
test('cycle guard blocks indirect and direct loops',()=>{
 const edges=[{from:'a',to:'b'},{from:'b',to:'c'}];
 assert.equal(wouldCreateCycle(edges,'c','a'),true);
 assert.equal(wouldCreateCycle(edges,'c','b'),true);
 assert.equal(wouldCreateCycle(edges,'c','c'),true);
 assert.equal(wouldCreateCycle(edges,'c','d'),false);
});

test('movable edge bend stays relative to card midpoint',()=>{
 const edge={from:'a',to:'b',fromSide:'right',toSide:'left',bend:{dx:30,dy:40}};
 const bend=edgeBendPoint(edge,a,b);assert.deepEqual(bend,{x:310,y:115});
 const offset=bendOffset({x:330,y:95},edge,a,b);assert.deepEqual(offset,{dx:50,dy:20});
 const anchors=edgeAnchors(edge,a,b);assert.deepEqual(anchors.start,{x:210,y:70});assert.deepEqual(anchors.end,{x:350,y:80});
 assert.match(routedEdgePath(edge,a,b),/^M210 70 C/);
});
