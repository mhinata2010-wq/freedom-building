/** Dependency connectors. Pure helpers so geometry and cycle guards are testable. */
export const SIDES = ['left', 'right', 'top', 'bottom'];
const DIRECTIONS = {left: [-1,0], right: [1,0], top: [0,-1], bottom: [0,1]};
export function portPosition(node, side) {
  const x = Number(node.x), y = Number(node.y), w = Number(node.w), h = Number(node.h);
  switch (side) {
    case 'left': return {x, y:y+h/2};
    case 'right': return {x:x+w, y:y+h/2};
    case 'top': return {x:x+w/2, y};
    case 'bottom': return {x:x+w/2, y:y+h};
    default: throw new Error('Invalid connection port');
  }
}
export function incomingSide(source, target) {
  const dx=(source.x+source.w/2)-(target.x+target.w/2);
  const dy=(source.y+source.h/2)-(target.y+target.h/2);
  return Math.abs(dx)>=Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'top':'bottom');
}
export function curveBetween(from,to,fromSide='right',toSide='left') {
  const d=Math.max(28,Math.min(130,Math.hypot(to.x-from.x,to.y-from.y)*.38));
  const [sx,sy]=DIRECTIONS[fromSide]||DIRECTIONS.right;
  const [tx,ty]=DIRECTIONS[toSide]||DIRECTIONS.left;
  return `M${from.x} ${from.y} C${from.x+sx*d} ${from.y+sy*d},${to.x+tx*d} ${to.y+ty*d},${to.x} ${to.y}`;
}
export function dropTarget(nodes,point,fromId) {
  return [...nodes].reverse().find(n=>n.type==='task'&&n.id!==fromId&&point.x>=n.x&&point.x<=n.x+n.w&&point.y>=n.y&&point.y<=n.y+n.h)||null;
}
export function wouldCreateCycle(edges,from,to) {
  if(from===to)return true;
  const visited=new Set(),stack=[to];
  while(stack.length){const at=stack.pop();if(at===from)return true;if(visited.has(at))continue;visited.add(at);for(const edge of edges){if(edge.from===at)stack.push(edge.to)}}
  return false;
}

export function edgeAnchorSides(edge, source, target) {
  return {
    fromSide: edge.fromSide || incomingSide(target, source),
    toSide: edge.toSide || incomingSide(source, target)
  };
}
export function edgeAnchors(edge, source, target) {
  const sides=edgeAnchorSides(edge,source,target);
  return {start:portPosition(source,sides.fromSide),end:portPosition(target,sides.toSide),...sides};
}
export function edgeBendPoint(edge, source, target) {
  const {start,end}=edgeAnchors(edge,source,target);
  const mid={x:(start.x+end.x)/2,y:(start.y+end.y)/2};
  return {x:mid.x+Number(edge.bend?.dx||0),y:mid.y+Number(edge.bend?.dy||0)};
}
export function routedEdgePath(edge, source, target) {
  const {start,end,fromSide,toSide}=edgeAnchors(edge,source,target);
  if(!edge.bend||(!Number(edge.bend.dx)&&!Number(edge.bend.dy)))return curveBetween(start,end,fromSide,toSide);
  const bend=edgeBendPoint(edge,source,target);
  const startDist=Math.max(24,Math.min(90,Math.hypot(bend.x-start.x,bend.y-start.y)*.34));
  const endDist=Math.max(24,Math.min(90,Math.hypot(end.x-bend.x,end.y-bend.y)*.34));
  const [sx,sy]=DIRECTIONS[fromSide]||DIRECTIONS.right;
  const [tx,ty]=DIRECTIONS[toSide]||DIRECTIONS.left;
  const c1={x:start.x+sx*startDist,y:start.y+sy*startDist};
  const c2={x:start.x+(bend.x-start.x)*.72,y:start.y+(bend.y-start.y)*.72};
  const c3={x:bend.x+(end.x-bend.x)*.28,y:bend.y+(end.y-bend.y)*.28};
  const c4={x:end.x+tx*endDist,y:end.y+ty*endDist};
  return `M${start.x} ${start.y} C${c1.x} ${c1.y},${c2.x} ${c2.y},${bend.x} ${bend.y} C${c3.x} ${c3.y},${c4.x} ${c4.y},${end.x} ${end.y}`;
}
export function bendOffset(point, edge, source, target) {
  const {start,end}=edgeAnchors(edge,source,target);
  return {dx:point.x-(start.x+end.x)/2,dy:point.y-(start.y+end.y)/2};
}

/** Validate both creation and reconnection against the same graph rules. */
export function changeConnection(nodes, edges, candidate) {
  const source = nodes.find(n => n.id === candidate.from && n.type === 'task');
  const target = nodes.find(n => n.id === candidate.to && n.type === 'task');
  if (!source || !target) return {error: 'task'};
  const others = edges.filter(edge => edge.id !== candidate.id);
  if (others.some(edge => edge.from === source.id && edge.to === target.id)) return {error: 'duplicate'};
  if (wouldCreateCycle(others, source.id, target.id)) return {error: 'cycle'};
  return {edge: {
    ...candidate,
    fromSide: candidate.fromSide ?? incomingSide(target, source),
    toSide: candidate.toSide ?? incomingSide(source, target)
  }};
}
