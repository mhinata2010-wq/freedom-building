import test from 'node:test';
import assert from 'node:assert/strict';
import {shouldUseSpaceForPan} from '../src/keyboard.js';

const key=(props={})=>({key:' ',repeat:false,ctrlKey:false,metaKey:false,altKey:false,...props});
const element=(tagName,roleMatch=false)=>({tagName,closest:()=>roleMatch?{}:null,isContentEditable:false});

test('Space pan works on the canvas without active controls',()=>{
 assert.equal(shouldUseSpaceForPan(key(),element('BODY')),true);
 assert.equal(shouldUseSpaceForPan(key(),element('SVG')),true);
});
test('Space activates native tab and toolbar buttons instead of panning',()=>{
 for(const tag of ['BUTTON','A','SUMMARY','INPUT','TEXTAREA','SELECT'])assert.equal(shouldUseSpaceForPan(key(),element(tag)),false);
 assert.equal(shouldUseSpaceForPan(key(),element('DIV',true)),false);
});
test('Space pan ignores repeat, modifiers and unrelated keys',()=>{
 assert.equal(shouldUseSpaceForPan(key({repeat:true}),element('BODY')),false);
 assert.equal(shouldUseSpaceForPan(key({ctrlKey:true}),element('BODY')),false);
 assert.equal(shouldUseSpaceForPan(key({metaKey:true}),element('BODY')),false);
 assert.equal(shouldUseSpaceForPan(key({altKey:true}),element('BODY')),false);
 assert.equal(shouldUseSpaceForPan(key({key:'Enter'}),element('BODY')),false);
});
