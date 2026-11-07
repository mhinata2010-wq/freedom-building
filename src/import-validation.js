/** Validate a FIELDNOTE JSON backup before changing the live project state. */
export function validateImportedProject(value) {
 const invalid=message=>{throw new Error('JSONを読み込めません: '+message)};
 const validId=id=>typeof id==='string'&&id.trim().length>0&&id.length<=128;
 const validNumber=n=>Number.isFinite(n)&&Math.abs(n)<=1000000;
 const dateValid=iso=>{
  if(typeof iso!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(iso))return false;
  const d=new Date(iso+'T12:00:00Z');
  return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===iso;
 };
 if(!value||typeof value!=='object'||Array.isArray(value))invalid('ルートはオブジェクトである必要があります');
 if(!Array.isArray(value.nodes)||!Array.isArray(value.edges))invalid('nodesとedgesは配列が必要です');
 if(value.nodes.length>500||value.edges.length>1000)invalid('図形または接続の上限を超えています');
 if(value.draft!==undefined&&!Array.isArray(value.draft))invalid('ドラフトが配列ではありません');
 const draft=value.draft||[];
 if(draft.length>100)invalid('ドラフトの工程数が多すぎます');
 if(value.projectStart!==undefined&&!dateValid(value.projectStart))invalid('計画開始日が不正です');
 const ids=new Set(),connections=new Set();
 for(const node of value.nodes){
  if(!node||typeof node!=='object'||Array.isArray(node)||!validId(node.id))invalid('無効な工程・図形IDがあります');
  if(ids.has(node.id))invalid('図形IDが重複しています: '+node.id);
  ids.add(node.id);
  if(!['task','note','text','pen'].includes(node.type))invalid('図形の種類が不正です: '+node.id);
  if(node.type==='pen'){
   if(!Array.isArray(node.points)||node.points.length<2||node.points.length>20000)invalid('手書き点の数が不正です: '+node.id);
   if(node.points.some(p=>!Array.isArray(p)||p.length!==2||!validNumber(p[0])||!validNumber(p[1])))invalid('手書き座標が不正です: '+node.id);
  }else{
   if(!validNumber(node.x)||!validNumber(node.y)||!validNumber(node.w)||!validNumber(node.h)||node.w<=0||node.h<=0||node.w>10000||node.h>10000)invalid('図形の座標・寸法が不正です: '+node.id);
   if(typeof node.text!=='string'||node.text.length>5000)invalid('本文が不正です: '+node.id);
  }
  if(node.duration!==undefined&&(!Number.isInteger(node.duration)||node.duration<1||node.duration>180))invalid('工期が不正です: '+node.id);
  if(node.startDate!==undefined&&node.startDate!==''&&!dateValid(node.startDate))invalid('工程日付が不正です: '+node.id);
 }
 for(const edge of value.edges){
  if(!edge||typeof edge!=='object'||Array.isArray(edge)||!validId(edge.id)||ids.has(edge.id))invalid('接続IDが不正または重複しています');
  ids.add(edge.id);
  if(!value.nodes.some(n=>n.id===edge.from)||!value.nodes.some(n=>n.id===edge.to)||edge.from===edge.to)invalid('接続先が存在しないか自己参照です: '+edge.id);
  const connection=edge.from+'\u0000'+edge.to;
  if(connections.has(connection))invalid('同じ矢印が重複しています: '+edge.id);
  connections.add(connection);
  if(edge.fromSide!==undefined&&!['top','right','bottom','left'].includes(edge.fromSide))invalid('接続元の方向が不正です');
  if(edge.toSide!==undefined&&!['top','right','bottom','left'].includes(edge.toSide))invalid('接続先の方向が不正です');
 }
 const draftIds=new Set();
 for(const t of draft){
  if(!t||typeof t!=='object'||Array.isArray(t)||!validId(t.id)||draftIds.has(t.id))invalid('ドラフトIDが不正または重複しています');
  draftIds.add(t.id);
  if(typeof t.title!=='string'||!t.title.trim()||t.title.length>200)invalid('工程名が不正です: '+t.id);
  if(!Number.isInteger(t.duration)||t.duration<1||t.duration>180)invalid('ドラフトの工期が不正です: '+t.id);
  if(t.dependsOn!==undefined&&(!Array.isArray(t.dependsOn)||t.dependsOn.some(id=>!validId(id))))invalid('先行工程の形式が不正です: '+t.id);
  if(t.startDate!==undefined&&t.startDate!==''&&!dateValid(t.startDate))invalid('ドラフト日付が不正です: '+t.id);
 }
 return {nodes:value.nodes.slice(),edges:value.edges.slice(),draft:draft.slice(),projectStart:value.projectStart};
}
