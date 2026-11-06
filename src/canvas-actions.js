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

/**
 * Delete a dependency only on an intentional endpoint drag released off tasks.
 * The distance is in screen pixels so zoom doesn't change the gesture threshold.
 */
export function shouldDeleteDetachedArrow(eventType,start,end,hasTaskTarget,threshold=14){
 if(eventType!=='pointerup'||hasTaskTarget||!start||!end)return false;
 const distance=Math.hypot(end.x-start.x,end.y-start.y);
 return Number.isFinite(distance)&&distance>=threshold;
}

const renovationSteps = [
  ['現地調査・採寸', 1],
  ['養生・準備', 1],
  ['解体・撤去', 2],
  ['下地・設備工事', 3],
  ['内装仕上げ', 3],
  ['検査・引き渡し', 1],
];

export function createRenovationTemplate(nextId, x, y) {
  const nodes = renovationSteps.map(([name, duration], index) => {
    const row = Math.floor(index / 2);
    const column = row % 2 ? 1 - index % 2 : index % 2;
    return {
      id: nextId(), type: 'task', x: x + column * 286, y: y + row * 162,
      w: 222, h: 115, text: `${name}\n${duration}日`, duration, color: '#2563eb',
    };
  });
  const edges = nodes.slice(1).map((node, index) => ({
    id: nextId(), from: nodes[index].id, to: node.id,
  }));
  return {nodes, edges};
}
