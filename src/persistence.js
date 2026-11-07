/** Pure persistence helpers so autosave and reload are testable without a browser. */
export function restoredProjectFlags(initial, loadedFromStorage=false) {
 const mode=typeof initial?.mode==='string' && ['ai','rules',''].includes(initial.mode)?initial.mode:'';
 const stale=typeof initial?.stale==='boolean'?initial.stale:Boolean(loadedFromStorage&&Array.isArray(initial?.draft)&&initial.draft.length);
 return {mode,stale};
}
export function serializeProjectState(state) {
 return JSON.stringify({nodes:state.nodes,edges:state.edges,draft:state.draft,projectStart:state.projectStart,mode:state.mode,stale:Boolean(state.stale)});
}
export function trySaveProject(storage,key,json) {
 try{storage.setItem(key,json);return true}catch{return false}
}
