import test from 'node:test';
import assert from 'node:assert/strict';
import {readProjectData} from '../src/project-data.js';

const card={id:'a',type:'task',x:0,y:0,w:222,h:115,text:'基礎工事'};
const data={nodes:[card],edges:[]};
test('older board data can omit draft and project start',()=>{
 assert.deepEqual(readProjectData(data).draft,[]);
});
test('malformed nested data is rejected before replacing the current board',()=>{
 assert.throws(()=>readProjectData({...data,nodes:[null]}),/工程カード/);
 assert.throws(()=>readProjectData({...data,edges:[{id:'e',from:'a',to:'missing'}]}),/矢印/);
 assert.throws(()=>readProjectData({...data,edges:[{id:'e',from:'a',to:'a',fromSide:'invalid'}]}),/矢印/);
 assert.throws(()=>readProjectData({...data,draft:[{id:'a',title:'基礎工事'}]}),/工程表/);
});
