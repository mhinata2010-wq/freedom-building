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

export function arrowRetargetError(edges,edge,targetId) {
  const others=edges.filter(other=>other.id!==edge.id);
  if(others.some(other=>other.from===edge.from&&other.to===targetId))return 'duplicate';
  return wouldCreateCycle(others,edge.from,targetId)?'cycle':null;
}
