/** Pure scheduling functions, independent of the browser / AI provider. */
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
export function normalizeAiDraft(aiTasks,nodes,edges){
 if(!Array.isArray(aiTasks))throw new Error('認識結果の形式が不正です');
 const allowed=new Map(nodes.filter(n=>n.type!=='pen').map(n=>[n.id,n]));
 const used=new Set();const output=[];
 for(const item of aiTasks.slice(0,80)){
  const sourceId=String(item.sourceId||'');if(!allowed.has(sourceId)||used.has(sourceId))continue;used.add(sourceId);
  const title=String(item.title||'').trim().slice(0,100);if(!title)continue;
  const parsedDuration=Number(item.duration);const validDuration=Number.isInteger(parsedDuration)&&parsedDuration>=1&&parsedDuration<=180;
  const confidence=Math.max(0,Math.min(1,Number(item.confidence)||0));
  const dependsOn=Array.isArray(item.dependsOn)?item.dependsOn.filter(v=>typeof v==='string'&&v!==sourceId):[];
  const validStartDate=parseISO(String(item.startDate||''));
  output.push({id:sourceId,sourceId,title,duration:validDuration?parsedDuration:1,dependsOn,startDate:validStartDate?dateISO(validStartDate):'',confidence,reason:String(item.reason||'').slice(0,240),assignee:String(item.assignee||'').slice(0,60),needsReview:!validDuration||confidence<0.85||!validStartDate&&Boolean(item.startDate)});
 }
 const ids=new Set(output.map(t=>t.id));const edgesSet=new Set(edges.map(e=>`${e.from}:${e.to}`));
 for(const t of output){t.dependsOn=[...new Set(t.dependsOn)].filter(id=>ids.has(id));if(t.dependsOn.some(id=>!edgesSet.has(`${id}:${t.id}`))){t.needsReview=true;t.reason=[t.reason,'AIが推定した依存関係を要確認'].filter(Boolean).join(' / ')}}
 return output;
}
/** Block exporting schedules with broken or cyclic predecessor references. */
export function validateScheduleDependencies(rawTasks) {
 if (!Array.isArray(rawTasks)) return ['工程データが不正です'];
 const byId=new Map(), errors=new Set();
 for (const task of rawTasks) {
  if (!task || typeof task.id!=='string' || !task.id.trim()) {errors.add('工程IDが不正です');continue}
  if (byId.has(task.id)) errors.add(`工程IDが重複しています: ${task.id}`);
  byId.set(task.id,task);
 }
 const done=new Set(), visiting=new Set();
 function visit(id) {
  if (visiting.has(id)) {errors.add(`先行工程が循環しています: ${byId.get(id)?.title||id}`);return}
  if (done.has(id)) return;
  visiting.add(id);
  const task=byId.get(id);
  for (const dep of Array.isArray(task.dependsOn)?task.dependsOn:[]) {
   if (!byId.has(dep)) {errors.add(`存在しない先行工程: ${task.title||id} → ${dep}`);continue}
   visit(dep);
  }
  visiting.delete(id);
  done.add(id);
 }
 for (const id of byId.keys()) visit(id);
 return [...errors];
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
/** Merge nearby pen strokes into stable handwriting regions for vision analysis. */
export function groupInkStrokes(nodes){
 const strokes=nodes.filter(n=>n.type==='pen'&&Array.isArray(n.points)&&n.points.length>=2).map(n=>{
  const xs=n.points.map(p=>Number(p[0])).filter(Number.isFinite),ys=n.points.map(p=>Number(p[1])).filter(Number.isFinite);
  return xs.length&&ys.length?{id:n.id,minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys)}:null;
 }).filter(Boolean);
 const parent=strokes.map((_,i)=>i);function find(a){while(parent[a]!==a){parent[a]=parent[parent[a]];a=parent[a]}return a}
 for(let i=0;i<strokes.length;i++)for(let j=i+1;j<strokes.length;j++){
  const a=strokes[i],b=strokes[j];const dx=Math.max(0,a.minX-b.maxX,b.minX-a.maxX),dy=Math.max(0,a.minY-b.maxY,b.minY-a.maxY);
  if(dx<=32&&dy<=19)parent[find(j)]=find(i)
 }
 const groups=new Map();for(let i=0;i<strokes.length;i++){const k=find(i);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(strokes[i])}
 return [...groups.values()].map(group=>{
  const id='ink_'+group.map(s=>s.id).sort()[0],x=Math.min(...group.map(s=>s.minX)),y=Math.min(...group.map(s=>s.minY));
  return {id,type:'ink',x,y,w:Math.max(...group.map(s=>s.maxX))-x,h:Math.max(...group.map(s=>s.maxY))-y,text:'',strokeIds:group.map(s=>s.id)}
 });
}
export function scheduleToCSV(tasks){const h=['工程名','日数','開始日','終了日','先行工程','担当者','要確認'];const map=new Map(tasks.map(t=>[t.id,t.title]));const q=v=>{const raw=String(v??'');const safe=/^[\s\u200B\uFEFF]*[=+@-]/u.test(raw)?"'"+raw:raw;return '"'+safe.replaceAll('"','""')+'"'};return '\ufeff'+[h,...tasks.map(t=>[t.title,t.duration,t.start,t.end,t.dependsOn.map(d=>map.get(d)||d).join(' / '),t.assignee,(t.confirmed!==true||t.needsReview===true)?'要確認':''])].map(row=>row.map(q).join(',')).join('\r\n')+'\r\n'}
