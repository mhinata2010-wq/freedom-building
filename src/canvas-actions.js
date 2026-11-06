import {incomingSide,wouldCreateCycle} from './connection.js';

export function centeredNotePosition(viewport, zoom, panX, panY, width=220, height=124) {
  const z=Number.isFinite(zoom)&&zoom>0?zoom:1;
  const w=Math.max(0,Number(viewport?.width)||0),h=Math.max(0,Number(viewport?.height)||0);
  return {x:Math.round((w/2-panX)/z-width/2),y:Math.round((h/2-panY)/z-height/2)};
}

export function reconnectTarget(edges,nodes,edgeId,toId) {
  const current=edges.find(edge=>edge.id===edgeId);
  const target=nodes.find(node=>node.id===toId&&node.type==='task');
  if(!current||!target) return {ok:false,reason:'invalid'};
  if(current.from===toId) return {ok:false,reason:'self'};
  if(current.to===toId) return {ok:true,unchanged:true,edges};
  if(edges.some(edge=>edge.id!==edgeId&&edge.from===current.from&&edge.to===toId)) return {ok:false,reason:'duplicate'};
  if(wouldCreateCycle(edges.filter(edge=>edge.id!==edgeId),current.from,toId)) return {ok:false,reason:'cycle'};
  const source=nodes.find(node=>node.id===current.from);
  if(!source) return {ok:false,reason:'invalid'};
  return {ok:true,unchanged:false,edges:edges.map(edge=>edge.id===edgeId?{...edge,to:toId,toSide:incomingSide(source,target)}:edge)};
}
