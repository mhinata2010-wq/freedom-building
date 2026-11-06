import {SIDES} from './connection.js';
import {parseISO, todayISO} from './scheduler.js';

const number = value => Number.isFinite(value) && Math.abs(value) <= 1e7;
const key = value => typeof value === 'string' && value.length > 0;
const unique = records => new Set(records.map(record => record.id)).size === records.length;

/** Validate before touching the live board; older saves may omit draft and date. */
export function readProjectData(data) {
  const {nodes, edges, draft = [], projectStart = todayISO(), stale = false} = data ?? {};
  const validNode = n => n && key(n.id) &&
    (n.type === 'pen'
      ? Array.isArray(n.points) && n.points.every(p => Array.isArray(p) && p.length === 2 && p.every(number))
      : ['task', 'note', 'text'].includes(n.type) && typeof n.text === 'string' &&
        [n.x, n.y, n.w, n.h].every(number) && n.w > 0 && n.h > 0);
  if (!Array.isArray(nodes) || !nodes.every(validNode) || !unique(nodes)) throw new Error('工程カード・注釈の形式が不正です');
  const ids = new Set(nodes.map(n => n.id));
  if (!Array.isArray(edges) || !edges.every(e => e && key(e.id) && ids.has(e.from) && ids.has(e.to) &&
    [e.fromSide,e.toSide].every(side => side == null || SIDES.includes(side)) &&
    (e.bend == null || (number(e.bend.dx) && number(e.bend.dy)))) || !unique(edges)) throw new Error('矢印の形式が不正です');
  if (!Array.isArray(draft) || !draft.every(t => t && key(t.id) && typeof t.title === 'string' &&
    Array.isArray(t.dependsOn) && t.dependsOn.every(key)) || !unique(draft) || !parseISO(projectStart)) throw new Error('工程表の形式が不正です');
  return {nodes, edges, draft, projectStart, stale: stale === true};
}
