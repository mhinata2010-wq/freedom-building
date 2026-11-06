/** Deterministic scheduling functions, with no network or AI dependency. */
export function todayISO(now=new Date()) {return dateISO(now)}
export function dateISO(d) {return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
export function parseISO(value) {if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;const [y,m,d]=value.split('-').map(Number);const out=new Date(y,m-1,d);return dateISO(out)===value?out:null}
export function addDays(iso, days) {const d=parseISO(iso); if(!d)return iso;d.setDate(d.getDate()+days);return dateISO(d)}
export function durationFromText(text) {const v=String(text||'').replace(/[０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-65248));const match=v.match(/(?:^|[^0-9])([1-9]\d{0,2})\s*(?:営業日|日間|日|days?|d\b)/i);return match?Math.min(Number(match[1]),180):null}
function firstLine(text){return String(text||'').trim().split(/\n/)[0].replace(/\s*[（(]?\d+\s*(?:営業日|日間|日|days?)[)）]?\s*$/i,'').trim()}
export function extractDraft(nodes,edges){
 const candidates=nodes.filter(n=>n.type==='task'||(n.type==='text'&&durationFromText(n.text)!==null));
 const tasks=candidates.map((n,i)=>{const duration=Number.isInteger(n.duration)&&n.duration>=1?n.duration:durationFromText(n.text);const title=firstLine(n.text)||`工程 ${i+1}`;return {id:n.id,sourceId:n.id,title,duration:duration??1,dependsOn:[],startDate:parseISO(n.startDate)?n.startDate:'',confidence:duration==null?0.55:0.98,reason:duration==null?'日数の指定がないため、仮に1日としています':'カードの文字から抽出',assignee:'',needsReview:duration==null};});
 const lookup=new Map(tasks.map(t=>[t.sourceId,t]));for(const e of edges){const target=lookup.get(e.to);if(target&&lookup.has(e.from)&&e.from!==e.to&&!target.dependsOn.includes(e.from))target.dependsOn.push(e.from)}
 return tasks;
}
export function scheduleTasks(rawTasks, projectStartISO){
 const projectStart=parseISO(projectStartISO)?projectStartISO:todayISO();
 const valid=rawTasks.map(t=>({...t,dependsOn:[...new Set(Array.isArray(t.dependsOn)?t.dependsOn:[])]}));
 const map=new Map(valid.map(t=>[t.id,t]));const resolving=new Set(),resolved=new Map(),warnings=[];
 function visit(id){if(resolved.has(id))return resolved.get(id);const t=map.get(id);if(!t)return null;if(resolving.has(id)){warnings.push(`依存関係が循環しています: ${t.title}`);return null}resolving.add(id);let start=projectStart;for(const dep of t.dependsOn){if(!map.has(dep)){warnings.push(`${t.title}: 不明な先行工程があります`);continue}const prev=visit(dep);if(prev){const next=addDays(prev.end,1);if(next>start)start=next}}
 if(parseISO(t.startDate)){if(t.startDate<start&&t.dependsOn.length){warnings.push(`${t.title}: 指定開始日が先行工程と重複するため調整しました`)}else if(t.startDate>start)start=t.startDate}
 const duration=Number.isInteger(t.duration)&&t.duration>0&&t.duration<=180?t.duration:1;const out={...t,duration,start,end:addDays(start,duration-1),needsReview:!!t.needsReview};resolving.delete(id);resolved.set(id,out);return out}
 for(const t of valid)visit(t.id);
 return {tasks:valid.map(t=>resolved.get(t.id)).filter(Boolean),warnings,projectStart};
}
export function scheduleToCSV(tasks){const h=['工程名','日数','開始日','終了日','先行工程','担当者','要確認'];const map=new Map(tasks.map(t=>[t.id,t.title]));const q=v=>'"'+String(v??'').replaceAll('"','""')+'"';return '\ufeff'+[h,...tasks.map(t=>[t.title,t.duration,t.start,t.end,t.dependsOn.map(d=>map.get(d)||d).join(' / '),t.assignee,t.needsReview?'要確認':''])].map(row=>row.map(q).join(',')).join('\r\n')+'\r\n'}
