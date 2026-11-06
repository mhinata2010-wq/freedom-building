import {todayISO,addDays,extractDraft,scheduleTasks,scheduleToCSV,parseISO} from './scheduler.js';
import {SIDES,portPosition,incomingSide,curveBetween,dropTarget,changeConnection,wouldCreateCycle,edgeAnchors,edgeBendPoint,bendOffset,routedEdgePath} from './connection.js';
import {initCanvasDock} from './toolbar.js';
import {createProjectStore,createMemoryStorage} from './projects.js';
import {readProjectData} from './project-data.js';
const NS='http://www.w3.org/2000/svg';
const $=s=>document.querySelector(s);const $$=s=>[...document.querySelectorAll(s)];
const icons={cursor:'<path d="m5 3 13 9-7 1-3 7-3-17Z"/>',hand:'<path d="M8 13V6a2 2 0 0 1 4 0v5-7a2 2 0 0 1 4 0v7-5a2 2 0 0 1 4 0v9a7 7 0 0 1-7 7h-1a7 7 0 0 1-5.6-2.8L3 14a2 2 0 0 1 3-3z"/>',square:'<rect x="4" y="4" width="16" height="16" rx="3"/>',note:'<path d="M4 3h16v13l-5 5H4z"/><path d="M15 21v-5h5"/>',type:'<path d="M4 7V4h16v3M12 4v16m-4 0h8"/>',pen:'<path d="m4 20 4-.8L19 8l-3-3L5 16zM14 7l3 3"/>',arrow:'<path d="M4 17 20 7m-8-1h8v8"/>',help:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 5 2c-1 .8-2 1-2 3m0 3h.01"/>',plus:'<path d="M12 5v14M5 12h14"/>',minus:'<path d="M5 12h14"/>',undo:'<path d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-2"/>',redo:'<path d="m15 14 5-5-5-5m5 5H10a6 6 0 0 0 0 12h2"/>',download:'<path d="M12 3v13m-5-5 5 5 5-5M4 18v3h16v-3"/>',sparkles:'<path d="m12 3 1.9 6.1L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9L12 3ZM20 18l.7 1.3L22 20l-1.3.7L20 22l-.7-1.3L18 20l1.3-.7L20 18Z"/>',layers:'<path d="m12 2 9 5-9 5-9-5 9-5Zm-9 10 9 5 9-5M3 17l9 5 9-5"/>',lightbulb:'<path d="M9 18h6m-5 3h4m-4-5a7 7 0 1 1 4 0l-.4 2h-3.2L10 16z"/>',pen_tool:'<path d="m12 2 5 6-5 6-5-6 5-6ZM5 21h14M7 17l-2 4m12-4 2 4M12 14v7"/>',chart:'<path d="M3 5h18M3 11h18M3 17h18M7 3v18m4-14h6m-6 6h9m-9 6h6"/>',expand:'<path d="M8 3H3v5m0-5 6 6m7 12h5v-5m0 5-6-6M3 16v5h5m-5 0 6-6m12-7V3h-5m5 0-6 6"/>',maximize:'<path d="M7 3H3v4m14-4h4v4M3 17v4h4m14-4v4h-4"/>',close:'<path d="M5 5 19 19M19 5 5 19"/>',shield:'<path d="M12 2 4 5v6c0 5 3.3 8.2 8 11 4.7-2.8 8-6 8-11V5zM9 12l2 2 4-4"/>',trash:'<path d="M4 7h16m-10 0V4h4v3m-8 0 1 14h10l1-14M10 11v6m4-6v6"/>',copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M5 16H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1"/>',check:'<path d="M4 12 9 17 20 6"/>',alert:'<circle cx="12" cy="12" r="9"/><path d="M12 7v6m0 4h.01"/>',calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1"/><path d="m3 17 6-6 4 4 2-2 6 6"/>',file:'<path d="M6 3h8l5 5v13H6zM14 3v6h5"/>',grid:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/>',chevrons_down:'<path d="m7 10 5 5 5-5M7 5l5 5 5-5"/>',folder:'<path d="M3 6h7l2 2h9v11H3z"/>',home:'<path d="m3 11 9-8 9 8v10h-6v-6H9v6H3z"/>',more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>'};
function ico(name){return `<span class="icon"><svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]||icons.square}</svg></span>`}
function injectIcons(){for(const e of $$('[data-icon]')){e.insertAdjacentHTML('afterbegin',ico((e.dataset.icon||'').replaceAll('-','_')))}}
const id=()=>`n_${Math.random().toString(36).slice(2,9)}`;const clone=v=>JSON.parse(JSON.stringify(v));const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const demo=()=>({nodes:[{id:'site',type:'task',x:70,y:60,w:225,h:118,text:'現場調査\n2日',duration:2,color:'#2563eb'},{id:'base',type:'task',x:385,y:60,w:225,h:118,text:'基礎工事\n4日',duration:4,color:'#2563eb'},{id:'frame',type:'task',x:700,y:60,w:225,h:118,text:'建方・躯体\n3日',duration:3,color:'#2563eb'},{id:'pipes',type:'task',x:700,y:275,w:225,h:118,text:'電気・配管\n2日',duration:2,color:'#0d9488'},{id:'memo',type:'note',x:75,y:290,w:245,h:134,text:'現場メモ\n雨の日は工程を調整\n資材搬入を事前確認',color:'#f59e0b'}],edges:[{id:'e1',from:'site',to:'base'},{id:'e2',from:'base',to:'frame'},{id:'e3',from:'base',to:'pipes'}],draft:[],projectStart:todayISO()});
const blankProject=()=>({nodes:[],edges:[],draft:[],projectStart:todayISO()});
let projectStore, storageUnavailable=false;
try {
  projectStore=createProjectStore(localStorage);
  projectStore.bootstrap(demo());
} catch {
  storageUnavailable=true;
  projectStore=createProjectStore(createMemoryStorage());
  projectStore.bootstrap(demo());
}
let currentProjectId=null, dirty=false;
const initial=blankProject();
let state={...initial,tool:'select',selected:null,edgeFrom:null,zoom:1,panX:0,panY:0,view:'canvas',screen:'projects',warnings:[],drag:null,history:[],future:[],space:false,fitted:false,stale:false};
let toastTimeout;const board=$('#board'),world=$('#viewport'),shapes=$('#shapes'),edgesEl=$('#edges'),selection=$('#selection'),holder=$('#stageHolder');
function toast(msg){if($('#modalBackdrop').open){$('#modalMessage').textContent=msg;return}const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>t.classList.remove('show'),3200)}
function serialize(){return JSON.stringify({nodes:state.nodes,edges:state.edges,draft:state.draft,projectStart:state.projectStart,stale:state.stale})}
function save(){
  if(!dirty)return true;
  try {
    projectStore.save(currentProjectId,JSON.parse(serialize()));
    dirty=false;
    $('#saveStatus').textContent=storageUnavailable?'一時保存のみ':'自動保存済み';
    return true;
  } catch {
    $('#saveStatus').textContent='未保存';
    toast('保存できません。空き容量やブラウザ設定を確認し、必要に応じてJSONを書き出してください。');
    return false;
  }
}
function currentProject(){return projectStore.current()}
function updateProjectChrome(){
  const projects=state.screen==='projects';
  const name=projects?'プロジェクト一覧':projectAction(()=>projectStore.get(currentProjectId)?.name);
  $('#currentProjectName').textContent=name??'工程計画';
  $('#projectSubtitle').textContent=projects?'プロジェクトを選択して工程を編集':'キャンバス上で工程のアイデアを整理';
  document.title=`${name??'工程計画'} | FIELDNOTE`;
}
function resetTransient(){
  lastCardClick=null;
  Object.assign(state,{tool:'select',selected:null,edgeFrom:null,zoom:1,panX:0,panY:0,view:'canvas',drag:null,history:[],future:[],space:false});
}
function projectAction(action){
  try{return action()}catch(error){toast('操作を完了できません: '+error.message);return null}
}
function openProject(id,view='canvas'){
  if(!save())return;
  projectAction(()=>{
    const raw=projectStore.load(id);
    if(!raw)throw new Error('プロジェクトデータを読み込めません');
    const data=readProjectData(raw);
    if(!projectStore.setCurrent(id))throw new Error('プロジェクトが見つかりません');
    currentProjectId=id;
    Object.assign(state,data);
    resetTransient();
    $('#saveStatus').textContent=storageUnavailable?'一時保存のみ':'自動保存済み';
    state.screen='workspace';state.view=view;
    render();
    state.fitted=view==='canvas';
    if(state.fitted)fitBoard();
    $(view==='canvas'?'#canvasTab':'#ganttTab').focus();
  });
}
function createProject(){
  if(!save())return;
  projectAction(()=>{
    const p=projectStore.create(`工程計画 ${projectStore.list().length+1}`,blankProject());
    openProject(p.id);
  });
}
function formatUpdated(iso){try{return new Intl.DateTimeFormat('ja-JP',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(iso))}catch{return ''}}
function renderProjects(filter=''){const grid=$('#projectGrid');if(!grid)return;const q=String(filter||'').trim().toLowerCase();const projects=(projectAction(()=>projectStore.list())??[]).filter(p=>!q||p.name.toLowerCase().includes(q));$('#projectCount').textContent=`${projects.length}件`;grid.innerHTML=projects.map((p,i)=>`<article class="project-tile" style="--project-index:${i}" data-project="${escapeHtml(p.id)}"><button class="project-open" data-project-action="open" aria-label="${escapeHtml(p.name)}を開く"><div class="project-thumb"><span class="thumb-grid"></span><span class="thumb-node one"></span><span class="thumb-node two"></span><span class="thumb-line"></span></div><div class="project-tile-body"><div><h3>${escapeHtml(p.name)}</h3><p>${Number(p.tasks)||0}工程 · ${Number(p.edges)||0}接続 · 更新 ${escapeHtml(formatUpdated(p.updatedAt))}</p></div><span class="project-arrow">→</span></div></button><div class="project-tile-actions"><button data-project-action="rename">${ico('pen')}名前変更</button><button data-project-action="duplicate">${ico('copy')}複製</button><button data-project-action="delete" class="danger">${ico('trash')}削除</button></div></article>`).join('')||'<div class="projects-empty">一致するプロジェクトがありません。</div>';
}
function renameProject(project){
  showModal('プロジェクト名を変更',`
    <form id="renameProjectForm">
      <div class="field"><label for="renameProjectInput">プロジェクト名</label>
      <input id="renameProjectInput" value="${escapeHtml(project.name)}" maxlength="80" required></div>
      <div class="modal-actions"><button type="button" class="button secondary" id="renameCancel">キャンセル</button>
      <button class="button primary">保存</button></div>
    </form>`);
  $('#renameCancel').addEventListener('click',closeModal);
  $('#renameProjectForm').addEventListener('submit',event=>{
    event.preventDefault();
    const name=$('#renameProjectInput').value.trim();
    if(!name){toast('プロジェクト名を入力してください');return}
    if(!projectAction(()=>projectStore.rename(project.id,name)))return;
    closeModal();
    renderProjects($('#projectSearch').value);
    focusProjectCard(project.id);
  });
}
function confirmDeleteProject(project){
  showModal('プロジェクトを削除',`
    <p class="modal-note">「${escapeHtml(project.name)}」をこのブラウザから削除します。この操作は元に戻せません。</p>
    <div class="modal-actions"><button class="button secondary" id="deleteProjectCancel">キャンセル</button>
    <button class="button primary" id="deleteProjectConfirm">削除する</button></div>`);
  $('#deleteProjectCancel').addEventListener('click',closeModal);
  $('#deleteProjectConfirm').addEventListener('click',()=>{
    if(!projectAction(()=>projectStore.remove(project.id)))return;
    if(currentProjectId===project.id)currentProjectId=null;
    closeModal();render();$('#createProjectBtn').focus();
    toast('プロジェクトを削除しました');
  });
}
function onProjectGridClick(event){
  const button=event.target.closest('button[data-project-action]');
  if(!button)return;
  const id=button.closest('[data-project]').dataset.project;
  const action=button.dataset.projectAction;
  if(action==='open'){openProject(id);return}
  const project=projectAction(()=>projectStore.list().find(p=>p.id===id));
  if(!project)return;
  if(action==='rename')renameProject(project);
  if(action==='delete')confirmDeleteProject(project);
  if(action==='duplicate'){
    const copy=projectAction(()=>projectStore.duplicate(id));
    if(!copy){toast('複製できません。元のプロジェクトデータを確認してください。');return}
    renderProjects($('#projectSearch').value);
    focusProjectCard(copy.id);
    toast('プロジェクトを複製しました');
  }
}
function focusProjectCard(id){
  ($$('[data-project-action=open]').find(b=>b.closest('[data-project]').dataset.project===id)??$('#projectSearch')).focus();
}
function showProjects(){
  cancelDrag();
  if(!save())return;
  state.screen='projects';render();
}
function commit(before,keepInspector=false){
  if(before===serialize())return;
  const previous=JSON.parse(before);
  if(state.draft.length&&JSON.stringify(extractDraft(previous.nodes,previous.edges))!==JSON.stringify(extractDraft(state.nodes,state.edges)))state.stale=true;
  state.history.push(before);
  if(state.history.length>70)state.history.shift();
  state.future=[];
  dirty=true;save();render(keepInspector);
}
function mutate(callback,keepInspector=false){const old=serialize();callback();commit(old,keepInspector)}
function restoreHistory(from,to){
  cancelDrag();
  if(!from.length)return;
  to.push(serialize());
  Object.assign(state,JSON.parse(from.pop()),{selected:null,edgeFrom:null});
  dirty=true;save();render();
}
function undo(){restoreHistory(state.history,state.future)}
function redo(){restoreHistory(state.future,state.history)}
function svg(tag,attrs={},parent){const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs)){if(v!==null&&v!==undefined)e.setAttribute(k,String(v))}if(parent)parent.appendChild(e);return e}
function txt(parent,str,x,y,cls,fill){const el=svg('text',{x,y,class:cls,fill},parent);el.textContent=str;return el}
function nodeById(i){return state.nodes.find(n=>n.id===i)}
function edgeById(i){return state.edges.find(e=>e.id===i)}
function getScreenPoint(e){const r=board.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top}}
function toWorld(e){const s=getScreenPoint(e);return {x:(s.x-state.panX)/state.zoom,y:(s.y-state.panY)/state.zoom}}
function transform(){world.setAttribute('transform',`translate(${state.panX} ${state.panY}) scale(${state.zoom})`);$('#zoomText').textContent=`${Math.round(state.zoom*100)}%`}
function previewConnector(){const d=state.drag;if(!d||d.mode!=='connect')return;const source=nodeById(d.from);if(!source)return;const target=d.targetId?nodeById(d.targetId):null;const endSide=target?incomingSide(source,target):({left:'right',right:'left',top:'bottom',bottom:'top'}[d.side]);const end=target?portPosition(target,endSide):d.point;svg('path',{d:curveBetween(portPosition(source,d.side),end,d.side,endSide),class:'svg-connector-preview','marker-end':'url(#arrowHead)'},edgesEl)}
function previewEdgeRelink(){const d=state.drag;if(!d||d.mode!=='edge-relink')return;const edge=edgeById(d.edgeId);if(!edge)return;const a=nodeById(edge.from),b=nodeById(edge.to);if(!a||!b)return;let source,target,fromSide,toSide,startPoint,endPoint;if(d.end==='to'){source=a;target=d.targetId?nodeById(d.targetId):null;fromSide=edge.fromSide||incomingSide(b,a);startPoint=portPosition(source,fromSide);toSide=target?incomingSide(source,target):({left:'right',right:'left',top:'bottom',bottom:'top'}[fromSide]);endPoint=target?portPosition(target,toSide):d.point}else{target=b;source=d.targetId?nodeById(d.targetId):null;toSide=edge.toSide||incomingSide(a,b);endPoint=portPosition(target,toSide);fromSide=source?incomingSide(target,source):({left:'right',right:'left',top:'bottom',bottom:'top'}[toSide]);startPoint=source?portPosition(source,fromSide):d.point}svg('path',{d:curveBetween(startPoint,endPoint,fromSide,toSide),class:'svg-connector-preview','marker-end':'url(#arrowHead)'},edgesEl)}
function renderEdges(){edgesEl.replaceChildren();selection.replaceChildren();for(const edge of state.edges){const a=nodeById(edge.from),b=nodeById(edge.to);if(!a||!b)continue;const path=routedEdgePath(edge,a,b);const selected=state.selected===edge.id;const hit=svg('path',{d:path,class:'svg-connector-hit',fill:'none',stroke:'transparent','stroke-width':24,'vector-effect':'non-scaling-stroke','pointer-events':'stroke'},edgesEl);hit.addEventListener('pointerdown',e=>{if(state.tool!=='select'||state.space||e.button!==0)return;e.stopPropagation();board.focus();state.selected=edge.id;render()});svg('path',{d:path,stroke:selected?'#2563eb':'#94a3b8','stroke-width':selected?2.8:2.3,fill:'none','stroke-linecap':'round','marker-end':'url(#arrowHead)',class:`svg-connector ${selected?'selected':''}`,'pointer-events':'none'},edgesEl);
 if(selected&&state.tool==='select'){const {start,end}=edgeAnchors(edge,a,b),bend=edgeBendPoint(edge,a,b);for(const [kind,p] of [['from',start],['to',end]]){const h=svg('circle',{cx:p.x,cy:p.y,r:10/state.zoom,class:'edge-endpoint-handle','data-end':kind},selection);h.addEventListener('pointerdown',ev=>{if(ev.button!==0||state.drag)return;ev.stopPropagation();ev.preventDefault();beginDrag(ev,{mode:'edge-relink',edgeId:edge.id,end:kind,before:serialize(),point:toWorld(ev),targetId:null});renderEdges()})}const bendHandle=svg('circle',{cx:bend.x,cy:bend.y,r:10/state.zoom,class:'edge-bend-handle'},selection);bendHandle.addEventListener('pointerdown',ev=>{if(ev.button!==0||state.drag)return;ev.stopPropagation();ev.preventDefault();beginDrag(ev,{mode:'edge-bend',edgeId:edge.id,before:serialize()})})}}
 if(state.edgeFrom){const n=nodeById(state.edgeFrom);if(n)svg('circle',{cx:n.x+n.w/2,cy:n.y+n.h/2,r:7,fill:'#2563eb',opacity:.4},edgesEl)}previewConnector();previewEdgeRelink()}
function renderNodes(){shapes.replaceChildren();for(const n of state.nodes){if(n.type==='pen'){svg('polyline',{points:(n.points||[]).map(p=>p.join(',')).join(' '),fill:'none',stroke:n.color||'#334155','stroke-width':n.stroke||3,'stroke-linecap':'round','stroke-linejoin':'round','pointer-events':'stroke'},shapes).addEventListener('pointerdown',e=>selectDrawable(e,n));continue}
  const g=svg('g',{transform:`translate(${n.x} ${n.y})`,class:`svg-node ${state.selected===n.id?'selected':''} ${state.drag?.targetId===n.id?'connector-target':''}`, 'data-node':n.id},shapes);const w=n.w||210,h=n.h||96;
  if(n.type==='task'){
   svg('rect',{width:w,height:h,rx:12,fill:'#fff',stroke:state.selected===n.id?'#2563eb':'#e2e8f0','stroke-width':1.5,class:'node-body node-outline'},g);
   svg('rect',{x:0,y:0,width:5,height:h,rx:2.5,fill:n.color||'#2563eb'},g);
   svg('rect',{x:17,y:14,width:49,height:18,rx:4,fill:'#eff6ff'},g);
   txt(g,'工程',26,27,'node-topline',n.color||'#2563eb');
   const lines=n.text.split('\n');txt(g,lines[0]||'工程名',18,60,'node-title');txt(g,`${n.duration||1} 日間  ·  ダブルクリックで編集`,18,85,'node-meta');
   svg('circle',{cx:w-20,cy:23,r:4,fill:n.color||'#2563eb',opacity:.28},g);
  }else if(n.type==='note'){
   svg('rect',{width:w,height:h,rx:8,fill:'#fef8df',stroke:state.selected===n.id?'#2563eb':'#f1e1a5',class:'node-body node-outline'},g);
   svg('rect',{x:0,y:0,width:w,height:5,rx:2.5,fill:'#edc95c'},g);
   n.text.split('\n').slice(0,5).forEach((line,i)=>txt(g,line,17,30+i*21,i===0?'node-title':'node-text'));
  }else{
   svg('rect',{width:w,height:h,rx:5,fill:state.selected===n.id?'#eff6ff':'transparent',stroke:state.selected===n.id?'#2563eb':'transparent','stroke-dasharray':'4 3',class:'node-outline'},g);
   n.text.split('\n').slice(0,5).forEach((line,i)=>txt(g,line,5,28+i*23,'node-text'));
  }
  g.addEventListener('pointerdown',e=>selectDrawable(e,n));
  if(n.type==='task'&&(state.tool==='select'||state.tool==='arrow')){
   for(const side of SIDES){const pos=portPosition({x:0,y:0,w,h},side);
    const handle=svg('circle',{cx:pos.x,cy:pos.y,r:8,class:'node-connector-handle','aria-hidden':true,'data-side':side},g);
    handle.addEventListener('pointerdown',e=>{if(e.button!==0||state.drag)return;e.stopPropagation();e.preventDefault();state.selected=n.id;state.edgeFrom=null;beginDrag(e,{mode:'connect',from:n.id,side,point:toWorld(e),targetId:null});renderNodes();renderEdges()});
   }
  }
  if(state.selected===n.id&&state.tool==='select'){svg('rect',{x:0,y:0,width:w,height:h,rx:10,stroke:'#2563eb','stroke-width':1,'stroke-dasharray':'4 5',fill:'none','pointer-events':'none'},g);const hnd=svg('rect',{x:w-7,y:h-7,width:14,height:14,rx:3,class:'node-handle',style:'cursor:nwse-resize'},g);hnd.addEventListener('pointerdown',e=>{e.stopPropagation();const p=toWorld(e);beginDrag(e,{mode:'resize',nodeId:n.id,start:p,origin:{w:n.w,h:n.h},before:serialize()})})}
 }}
function applyConnection(candidate,oldEdge){
  const result=changeConnection(state.nodes,state.edges,candidate);
  if(result.error){
    toast({task:'工程カード同士を選択してください',duplicate:'同じ接続がすでにあります',cycle:'循環する接続は作成できません'}[result.error]);
    render();
    return;
  }
  mutate(()=>{
    if(oldEdge)state.edges[state.edges.indexOf(oldEdge)]=result.edge;
    else state.edges.push(result.edge);
    state.selected=result.edge.id;
  });
  toast(oldEdge?'矢印の接続先を変更しました':'工程を矢印で接続しました');
}
function chooseConnectionNode(n){
  if(n.type!=='task'){toast('工程カード同士を選択してください');return}
  const from=state.edgeFrom;
  if(!from){
    state.edgeFrom=n.id;state.selected=n.id;
    render();toast('接続先の工程カードを選んでください');
  }else{
    state.edgeFrom=null;
    applyConnection({id:id(),from,to:n.id});
  }
}
function selectDrawable(e,n){
  if(state.drag||e.button!==0||state.space||state.tool==='hand')return;
  e.stopPropagation();
  if(state.tool==='arrow'){chooseConnectionNode(n);return}
  if(state.tool!=='select')return;
  board.focus();
  state.selected=n.id;
  const pt=toWorld(e);
  beginDrag(e,{mode:'node',nodeId:n.id,start:pt,origin:{x:n.x,y:n.y},before:serialize()});
  render();
}
function renderInspector(){const e=$('#inspector');const n=nodeById(state.selected);if(!n){const edge=edgeById(state.selected);if(edge){e.innerHTML=`<p class="empty-inspector">矢印を選択中。両端の青い丸をドラッグすると接続先を変更でき、中央の丸をドラッグすると経路を調整できます。</p><div class="inspector-actions">${edge.bend?'<button class="button secondary" id="resetEdgeBend">曲がりをリセット</button>':''}<button class="button secondary" id="deleteSelected">${ico('trash')} 削除</button></div>`;$('#resetEdgeBend')?.addEventListener('click',()=>mutate(()=>delete edge.bend));$('#deleteSelected')?.addEventListener('click',removeSelected);return}e.innerHTML='<p class="empty-inspector">キャンバスで要素を選ぶと、ここから内容を編集できます。</p>';return}
 e.innerHTML=`<div class="field"><label for="inspectorText">内容（改行可能）</label><textarea id="inspectorText" rows="${n.type==='note'?4:2}">${escapeHtml(n.text||'')}</textarea></div>${n.type==='task'?`<div class="field-row"><div class="field"><label for="inspectorDuration">工期（日）</label><input id="inspectorDuration" type="number" min="1" max="180" value="${Math.max(1,Math.min(180,Number(n.duration)||1))}"></div><div class="field"><label for="inspectorStart">開始日（任意）</label><input id="inspectorStart" type="date" value="${escapeHtml(n.startDate||'')}"></div></div>`:''}<div class="inspector-actions"><button id="duplicateSelected" class="button secondary">${ico('copy')} 複製</button><button id="deleteSelected" class="button secondary">${ico('trash')} 削除</button></div>`;
 $('#inspectorText').addEventListener('change',ev=>mutate(()=>{n.text=ev.target.value.slice(0,500);const found=n.text.match(/(?:^|\n)\s*(\d+)\s*日/);if(found&&n.type==='task'){n.duration=Math.max(1,Math.min(Number(found[1]),180));$('#inspectorDuration').value=n.duration}},true));
 $('#inspectorDuration')?.addEventListener('change',ev=>mutate(()=>{n.duration=Math.max(1,Math.min(180,Math.round(Number(ev.target.value)||1)));n.text=(n.text.split('\n')[0]||'工程')+`\n${n.duration}日`;ev.target.value=n.duration;$('#inspectorText').value=n.text},true));
 $('#inspectorStart')?.addEventListener('change',ev=>mutate(()=>n.startDate=ev.target.value,true));
 $('#duplicateSelected').addEventListener('click',()=>mutate(()=>{const nn={...clone(n),id:id(),x:n.x+30,y:n.y+30};state.nodes.push(nn);state.selected=nn.id}));
 $('#deleteSelected').addEventListener('click',removeSelected)}
function renderLayers(){
  const list=$('#layerList');
  const focused=list.contains(document.activeElement)?document.activeElement.dataset.layer:undefined;
  $('#layerCount').textContent=String(state.nodes.length);
  list.innerHTML='';
  function item(id,icon,label,action){
    const b=document.createElement('button');
    b.className='layer-item';b.classList.toggle('active',state.selected===id);
    b.dataset.layer=id;
    b.setAttribute('aria-pressed',String(state.selected===id));
    b.innerHTML=`${ico(icon)}<span>${escapeHtml(label)}</span>`;
    b.addEventListener('click',action);
    list.appendChild(b);
    if(focused===id)b.focus({preventScroll:true});
  }
  for(const n of [...state.nodes].reverse()){
    item(n.id,n.type==='task'?'square':n.type==='note'?'note':n.type==='pen'?'pen':'type',
      n.type==='pen'?'フリーハンド':n.text.split('\n')[0],()=>{
        if(state.tool==='arrow')chooseConnectionNode(n);
        else{state.tool='select';state.selected=n.id;render()}
      });
  }
  const title=id=>nodeById(id)?.text?.split('\n')[0]??'工程';
  for(const edge of state.edges)item(edge.id,'arrow',`${title(edge.from)} → ${title(edge.to)}`,()=>{
    state.tool='select';state.edgeFrom=null;state.selected=edge.id;render();
  });
  if(!state.nodes.length)list.innerHTML='<div class="layer-empty">まだオブジェクトがありません。</div>';
}
function renderStatus(){
$('#undoBtn').disabled=!state.history.length;$('#redoBtn').disabled=!state.future.length;$('#resultCount').textContent=state.draft.length?`${state.draft.length} 工程`:'未生成';$('#scheduleStatus').innerHTML=state.draft.length?'<span></span>生成済み':'<span></span>準備完了'}
function renderResults(){const result=$('#resultList');const s=scheduleTasks(state.draft,state.projectStart);const unresolved=s.tasks.filter(t=>!t.confirmed).length;$('#resultSummary').innerHTML=state.draft.length?`<strong>${s.tasks.length}工程</strong> · ${s.tasks.reduce((a,t)=>a+t.duration,0)}工程日 · ${unresolved}件 未確認 ${state.stale?'<br><span style="color:#c2410c">キャンバスが変更されました。再生成してください。</span>':''}${s.warnings.length?`<br><span style="color:#c2410c">${escapeHtml(s.warnings[0])}</span>`:''}`:'工程カードを作って「工程表を生成」を押すと、ここにドラフトが表示されます。';result.replaceChildren();$('#openGanttBtn').classList.toggle('hidden',!state.draft.length);for(const t of s.tasks){const div=document.createElement('div');div.className='result-item';const i=s.tasks.indexOf(t);div.innerHTML=`<span class="result-index">${String(i+1).padStart(2,'0')}</span><div class="result-info"><strong>${escapeHtml(t.title)}</strong><small>${escapeHtml(t.start)} → ${escapeHtml(t.end)}</small>${!t.confirmed?'<span class="result-review">要確認 · 編集可</span>':'<small style="color:#16a34a">✓ 確認済み</small>'}</div><span class="result-days">${t.duration} 日</span><button class="subtle-icon" aria-label="工程を編集" title="工程を編集">${ico('pen')}</button>`;div.querySelector('button').addEventListener('click',()=>editDraft(t.id));result.appendChild(div)}renderGantt(s)}
function renderGantt(s){const root=$('#fullGantt');if(!s.tasks.length){root.innerHTML='<div class="empty-gantt">キャンバスで工程カードを作成し、工程表を生成してください。</div>';return}
 const maxDay=Math.max(...s.tasks.map(t=>Math.round((new Date(t.end+'T12:00:00')-new Date(s.projectStart+'T12:00:00'))/86400000)+1));const count=Math.min(730,Math.max(15,maxDay+3));const days=Array.from({length:count},(_,i)=>addDays(s.projectStart,i));const dated=t=>Math.round((new Date(t.start+'T12:00:00')-new Date(s.projectStart+'T12:00:00'))/86400000);
 root.innerHTML=`${state.stale?'<p class="storage-warning">キャンバスが変更されました。工程表を再生成してください。</p>':''}${maxDay>count?'<p class="modal-note">タイムラインは先頭730日まで表示します。全日程はCSVで確認できます。</p>':''}<table class="gantt-table" style="width:${344+count*32}px"><thead><tr><th class="gantt-task-col">工程名</th><th class="gantt-duration-col">日数</th><th class="gantt-date-col">開始日</th>${days.map(d=>`<th class="gantt-day" title="${d}">${d.slice(5).replace('-','/')}</th>`).join('')}</tr></thead><tbody>${s.tasks.map(t=>{const first=dated(t);return `<tr><td class="gantt-task-col gantt-task-name" title="${escapeHtml(t.title)}">${escapeHtml(t.title)} ${!t.confirmed?'⚬':''}</td><td>${t.duration}日</td><td>${escapeHtml(t.start.slice(5))}</td>${days.map((d,i)=>`<td class="gantt-day gantt-bar-cell ${new Date(d+'T12:00:00').getDay()%6===0?'weekend':''}">${i===first?`<div class="gantt-bar ${t.confirmed?'':'draft'}" style="width:${Math.min(t.duration,count-i)*32-4}px">${t.duration>2?escapeHtml(t.title):''}</div>`:''}</td>`).join('')}</tr>`}).join('')}</tbody></table>`}
function render(keepInspector=false){const projectsScreen=state.screen==='projects';$('#projectDashboard').classList.toggle('hidden',!projectsScreen);$('#workspaceShell').classList.toggle('hidden',projectsScreen);$('.top-actions').classList.toggle('hidden',projectsScreen);$('#projectsTab').classList.toggle('active',projectsScreen);$('#canvasTab').classList.toggle('active',!projectsScreen&&state.view==='canvas');$('#ganttTab').classList.toggle('active',!projectsScreen&&state.view==='gantt');for(const tab of $$('.primary-tab')){
  if(tab.classList.contains('active'))tab.setAttribute('aria-current','page');
  else tab.removeAttribute('aria-current');
}
const hasProject=currentProjectId||projectAction(()=>projectStore.list().length);
$('#canvasTab').disabled=$('#ganttTab').disabled=!hasProject;
updateProjectChrome();if(projectsScreen){renderProjects($('#projectSearch')?.value||'');return}renderEdges();renderNodes();transform();renderLayers();if(!keepInspector)renderInspector();renderStatus();renderResults();$$('[data-tool]').forEach(el=>{const active=el.dataset.tool===state.tool;el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active))});holder.dataset.tool=state.tool;holder.classList.toggle('hidden',state.view!=='canvas');$('#canvasDockRow').classList.toggle('hidden',state.view!=='canvas');$('#ganttHolder').classList.toggle('hidden',state.view!=='gantt');$('.left-panel').classList.toggle('hidden',state.view==='gantt');$('.canvas-topbar').classList.toggle('hidden',state.view==='gantt');$('#projectStart').value=state.projectStart;$('#activeHint').textContent=state.tool==='arrow'?(state.edgeFrom?'接続先のカードを選んでください':'最初のカードをクリックして接続開始'):state.tool==='pen'?'ドラッグして自由に描く':state.tool==='hand'?'ドラッグしてキャンバスを移動':'ダブルクリックでテキストを編集できます';}
function setTool(tool){cancelDrag();state.tool=tool;state.edgeFrom=null;state.selected=null;render()}
function newNode(type,p){const node={id:id(),type,x:Math.round(p.x),y:Math.round(p.y),w:type==='note'?220:type==='text'?225:222,h:type==='note'?124:type==='text'?70:115,text:type==='task'?'新しい工程\n1日':type==='note'?'メモ\nここに補足を記入':'テキストを入力',duration:type==='task'?1:undefined,color:type==='task'?'#2563eb':'#f59e0b'};mutate(()=>{state.nodes.push(node);state.selected=node.id});setTool('select');state.selected=node.id;render();if(type==='text')openInlineEdit(node)}
function removeSelected(){if(!state.selected)return;cancelDrag();mutate(()=>{state.nodes=state.nodes.filter(n=>n.id!==state.selected);state.edges=state.edges.filter(e=>e.id!==state.selected&&e.from!==state.selected&&e.to!==state.selected);state.draft=state.draft.filter(t=>t.sourceId!==state.selected);state.selected=null});toast('オブジェクトを削除しました')}
function openInlineEdit(n){if(n.type==='pen')return;document.querySelector('.inline-editor')?.remove();const area=document.createElement('textarea');area.className='inline-editor';area.value=n.text;area.style.left=`${n.x*state.zoom+state.panX}px`;area.style.top=`${n.y*state.zoom+state.panY}px`;area.style.width=`${Math.max(125,n.w*state.zoom)}px`;area.style.height=`${Math.max(65,n.h*state.zoom)}px`;area.setAttribute('aria-label','キャンバス要素の内容');holder.appendChild(area);area.focus();area.select();let resolved=false;function finish(commitEdit){if(resolved)return;resolved=true;const newVal=area.value;area.remove();if(commitEdit&&n.text!==newVal)mutate(()=>{n.text=newVal.slice(0,500);const m=newVal.match(/(?:^|\n)\s*(\d+)\s*日/);if(m&&n.type==='task')n.duration=Math.max(1,Math.min(180,Number(m[1])))});else render()};area.addEventListener('blur',()=>finish(true));area.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape')finish(false);if(e.key==='Enter'&&(e.ctrlKey||e.metaKey))finish(true)})}
function fitBoard(){const rect=holder.getBoundingClientRect();if(!rect.width||!rect.height)return;const display=state.nodes.filter(n=>n.type!=='pen');if(!display.length){state.zoom=1;state.panX=rect.width/2-160;state.panY=rect.height/2-90;transform();return}const minX=Math.min(...display.map(n=>n.x)),maxX=Math.max(...display.map(n=>n.x+n.w)),minY=Math.min(...display.map(n=>n.y),50),maxY=Math.max(...display.map(n=>n.y+n.h),450);const w=maxX-minX,h=maxY-minY;state.zoom=Math.max(.35,Math.min(1.05,Math.min((rect.width-76)/w,(rect.height-100)/h)));state.panX=(rect.width-w*state.zoom)/2-minX*state.zoom;state.panY=(rect.height-h*state.zoom)/2-minY*state.zoom;transform()}
function zoomTo(factor,cx,cy){const rect=board.getBoundingClientRect(),p={x:cx??rect.width/2,y:cy??rect.height/2};const next=Math.max(.25,Math.min(2.5,state.zoom*factor));state.panX=p.x-(p.x-state.panX)*next/state.zoom;state.panY=p.y-(p.y-state.panY)*next/state.zoom;state.zoom=next;transform();renderEdges()}
function boardStart(e){if(e.button!==0&&e.button!==1)return;if(state.drag)return;const isPan=state.tool==='hand'||state.space||e.button===1;const pt=toWorld(e);if(isPan){beginDrag(e,{mode:'pan',screen:getScreenPoint(e),origin:{x:state.panX,y:state.panY}});return}if(state.tool==='pen'){const n={id:id(),type:'pen',points:[[pt.x,pt.y]],color:'#334155',stroke:3};beginDrag(e,{mode:'pen',nodeId:n.id,before:serialize()});state.nodes.push(n);renderNodes();return}if(['task','note','text'].includes(state.tool)){newNode(state.tool,pt);return}if(state.tool==='arrow'){state.edgeFrom=null;renderEdges();return}state.selected=null;render()}
function boardMove(e){if(!state.drag||state.drag.pointerId!==e.pointerId)return;const d=state.drag;const p=toWorld(e);if(d.mode==='connect'){d.point=p;d.targetId=dropTarget(state.nodes,p,d.from)?.id||null;renderNodes();renderEdges();return}if(d.mode==='edge-relink'){const edge=edgeById(d.edgeId);if(!edge)return;const fixed=d.end==='to'?edge.from:edge.to;d.point=p;d.targetId=dropTarget(state.nodes,p,fixed)?.id||null;renderNodes();renderEdges();return}if(d.mode==='edge-bend'){const edge=edgeById(d.edgeId),a=edge&&nodeById(edge.from),b=edge&&nodeById(edge.to);if(edge&&a&&b){edge.bend=bendOffset(p,edge,a,b);renderEdges()}return}if(d.mode==='node'){const n=nodeById(d.nodeId);if(n){n.x=Math.round(d.origin.x+(p.x-d.start.x));n.y=Math.round(d.origin.y+(p.y-d.start.y));renderNodes();renderEdges();transform()}}else if(d.mode==='resize'){const n=nodeById(d.nodeId);if(n){n.w=Math.max(100,Math.round(d.origin.w+p.x-d.start.x));n.h=Math.max(70,Math.round(d.origin.h+p.y-d.start.y));renderNodes();renderEdges();transform()}}else if(d.mode==='pan'){const s=getScreenPoint(e);state.panX=d.origin.x+s.x-d.screen.x;state.panY=d.origin.y+s.y-d.screen.y;transform()}else if(d.mode==='pen'){const n=nodeById(d.nodeId);if(n){const last=n.points.at(-1);if(Math.hypot(last[0]-p.x,last[1]-p.y)>2){n.points.push([Math.round(p.x),Math.round(p.y)]);renderNodes();transform()}}}}
function beginDrag(event,drag){
  if(state.drag)return;
  state.drag={...drag,pointerId:event.pointerId};
  board.setPointerCapture(event.pointerId);
}
function cancelDrag(){
  const drag=state.drag;
  if(!drag)return false;
  state.drag=null;
  if(drag.before)Object.assign(state,JSON.parse(drag.before));
  if(drag.mode==='pan'){state.panX=drag.origin.x;state.panY=drag.origin.y}
  if(board.hasPointerCapture(drag.pointerId))board.releasePointerCapture(drag.pointerId);
  render();
  return true;
}
let lastCardClick;
function handleCardClick(event,drag){
  const node=nodeById(drag.nodeId);
  if(!node||node.type==='pen')return false;
  const point=getScreenPoint(event),time=event.timeStamp;
  const double=lastCardClick?.id===node.id&&time-lastCardClick.time<450&&
    Math.hypot(point.x-lastCardClick.point.x,point.y-lastCardClick.point.y)<8;
  lastCardClick=double?null:{id:node.id,point,time};
  if(double)openInlineEdit(node);
  return double;
}
function boardEnd(e){
  const d=state.drag;
  if(!d||d.pointerId!==e.pointerId)return;
  if(e.type!=='pointerup'){cancelDrag();return}
  boardMove(e);
  state.drag=null;
  if(d.mode==='edge-relink'){
    const edge=edgeById(d.edgeId);
    if(!edge||!d.targetId||edge[d.end]===d.targetId){render();return}
    applyConnection({id:edge.id,from:edge.from,to:edge.to,[d.end]:d.targetId},edge);
    return;
  }
  if(d.mode==='connect'){
    if(!d.targetId){render();return}
    applyConnection({id:id(),from:d.from,to:d.targetId,fromSide:d.side});
    return;
  }
  if(d.mode==='pen'&&nodeById(d.nodeId)?.points.length===1)state.nodes.pop();
  if(d.before&&d.before!==serialize()){lastCardClick=null;commit(d.before)}
  else if(d.mode!=='node'||!handleCardClick(e,d))render();
}
let modalOpener;
function showModal(title,html){
  const dialog=$('#modalBackdrop');
  modalOpener=document.activeElement;
  $('#modalTitle').textContent=title;
  $('#modalContent').innerHTML=html;
  $('#modalMessage').textContent='';
  dialog.showModal();
  (dialog.querySelector('input:not([type=file]), #deleteProjectCancel')??$('#modalClose')).focus();
}
function closeModal(){
  $('#modalBackdrop').close();
  if(modalOpener?.isConnected)modalOpener.focus();
}
function downloadFile(filename,textOrBlob,type='application/json'){const blob=textOrBlob instanceof Blob?textOrBlob:new Blob([textOrBlob],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
function exportSvgString(){
  const raw=board.cloneNode(true);
  raw.setAttribute('width',String(board.clientWidth||900));
  raw.setAttribute('height',String(board.clientHeight||550));
  raw.querySelectorAll('#selection,.svg-connector-hit,.svg-connector-preview,.node-connector-handle,.node-handle').forEach(el=>el.remove());
  raw.querySelectorAll('text').forEach(el=>{
    el.setAttribute('font-family','sans-serif');
    el.setAttribute('font-size',el.classList.contains('node-title')?'18':'13');
  });
  return new XMLSerializer().serializeToString(raw);
}
function exportPNG(){const markup=exportSvgString(),blob=new Blob([markup],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob),image=new Image();image.onload=()=>{try{const c=document.createElement('canvas');c.width=Math.max(900,board.clientWidth)*2;c.height=Math.max(550,board.clientHeight)*2;const ctx=c.getContext('2d');ctx.scale(2,2);ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(image,0,0);c.toBlob(data=>{if(data)downloadFile('fieldnote-canvas.png',data,'image/png');else toast('画像の出力に失敗しました');URL.revokeObjectURL(url)},'image/png')}catch{URL.revokeObjectURL(url);toast('画像の出力に失敗しました')}};image.onerror=()=>{URL.revokeObjectURL(url);toast('画像を生成できませんでした')};image.src=url}
function openExportMenu(){cancelDrag();showModal('書き出し',`<p class="modal-note">必要な形式を選んでエクスポートできます。JSONは再編集用の全データ、CSVは工程表用です。</p><div class="modal-grid"><button class="export-choice" data-export="json">${ico('file')}プロジェクト JSON<small>キャンバスを再編集</small></button><button class="export-choice" data-export="csv">${ico('chart')}工程表 CSV<small>Excelなどで開く</small></button><button class="export-choice" data-export="svg">${ico('pen_tool')}SVG<small>ベクター図面</small></button><button class="export-choice" data-export="png">${ico('image')}PNG<small>共有用の画像</small></button></div><div style="margin-top:16px"><label for="importJSON" class="file-label">${ico('file')} JSONから読み込む</label><input class="file-input" type="file" id="importJSON" accept=".json,application/json"></div>`);$$('[data-export]').forEach(b=>b.addEventListener('click',()=>{const type=b.dataset.export;closeModal();if(type==='json')downloadFile('fieldnote-project.json',serialize());if(type==='csv'){const tasks=scheduleTasks(state.draft.length?state.draft:extractDraft(state.nodes,state.edges),state.projectStart).tasks;downloadFile('fieldnote-schedule.csv',scheduleToCSV(tasks),'text/csv;charset=utf-8')}if(type==='svg')downloadFile('fieldnote-canvas.svg',exportSvgString(),'image/svg+xml');if(type==='png')exportPNG()}));$('#importJSON').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;const projectId=currentProjectId;try{if(f.size>2_000_000)throw new Error('ファイルが大きすぎます');const v=JSON.parse(await f.text());const data=readProjectData(v);if(!$('#modalBackdrop').open||projectId!==currentProjectId)return;mutate(()=>Object.assign(state,data,{selected:null,edgeFrom:null}));closeModal();fitBoard();toast('プロジェクトを読み込みました')}catch(err){toast('読み込み失敗: '+err.message)}})}
function editDraft(id){const t=state.draft.find(t=>t.id===id);if(!t)return;showModal('工程を編集・確認',`<p class="modal-note">工程の日数と依存関係を確認してください。確認後も自由に変更できます。</p><div class="field"><label for="draftTitle">工程名</label><input id="draftTitle" value="${escapeHtml(t.title)}"></div><div class="field-row"><div class="field"><label for="draftDuration">工期（日）</label><input id="draftDuration" type="number" min="1" max="180" value="${Math.max(1,Math.min(180,Number(t.duration)||1))}"></div><div class="field"><label for="draftDate">開始指定（任意）</label><input id="draftDate" type="date" value="${escapeHtml(t.startDate||'')}"></div></div><div class="field"><label>先行工程（複数選択可）</label><div id="depList">${state.draft.filter(x=>x.id!==t.id).map(other=>`<label style="display:flex;gap:8px;align-items:center;font-size:11px;margin:9px 0;color:#475569"><input style="width:15px" type="checkbox" value="${escapeHtml(other.id)}" ${t.dependsOn.includes(other.id)?'checked':''}>${escapeHtml(other.title)}</label>`).join('')||'<span style="font-size:10px;color:#94a3b8">先行工程なし</span>'}</div></div><div class="modal-actions"><button class="button secondary" id="draftCancel">キャンセル</button><button class="button primary" id="draftSave">${ico('check')} 確認して保存</button></div>`);$('#draftCancel').addEventListener('click',closeModal);$('#draftSave').addEventListener('click',()=>{const title=$('#draftTitle').value.trim(),duration=Number($('#draftDuration').value),start=$('#draftDate').value;if(!title||!Number.isInteger(duration)||duration<1||duration>180||start&&!parseISO(start)){toast('工程名・日数・日付を確認してください');return}const dependsOn=$$('#depList input:checked').map(c=>c.value);
const graph=state.draft.filter(item=>item!==t).flatMap(item=>item.dependsOn.map(dep=>({from:dep,to:item.id})));
if(dependsOn.some(dep=>wouldCreateCycle(graph,dep,t.id))){toast('循環する依存関係は保存できません');return}
mutate(()=>{t.title=title;t.duration=duration;t.startDate=start;t.dependsOn=dependsOn;t.confirmed=true;t.needsReview=false});closeModal();toast('ドラフトを確認しました')})}
function generate(){
 cancelDrag();
 const draft=extractDraft(state.nodes,state.edges);
 if(!draft.length){toast('工程カードを追加してください。テキストは「3日」などの期間がある場合に工程として扱います。');return}
 mutate(()=>{state.draft=draft.map(t=>({...t,confirmed:false}));state.stale=false});
 toast(`${draft.length}件の工程を生成しました。日数と前後関係を確認してください`);
}
function changeView(view){
  cancelDrag();
  if(currentProjectId===null){
    const project=projectAction(()=>currentProject()??projectStore.list()[0]);
    if(project)openProject(project.id,view);
    return;
  }
  state.screen='workspace';state.view=view;render();
  if(view==='canvas'&&!state.fitted){fitBoard();state.fitted=true}
}
function showGuide(){showModal('操作ガイド',`<p class="modal-note"><strong>V</strong> 選択・移動／<strong>H</strong> 手のひらで移動／<strong>R</strong> 工程カード／<strong>N</strong> 付箋／<strong>T</strong> テキスト／<strong>P</strong> 手書き／<strong>A</strong> 矢印で工程を接続。カードの四辺の青い点をドラッグしても接続できます。</p><p class="modal-note">カードをダブルクリックで文字編集。四隅の右下をドラッグでリサイズ。選択中に Delete で削除。⌘Z で戻る。スクロールで移動、⌘+スクロールで拡大・縮小。</p><p class="modal-note">工程生成はブラウザ内で動作し、外部APIは使用しません。工程カードの文字・日数・接続矢印を解析します。手書き線や付箋の文章は自動で工程に変換されません。</p>`)}
function wire(){injectIcons();initCanvasDock();
 $('#projectGrid').addEventListener('click',onProjectGridClick);
 board.addEventListener('pointerdown',boardStart);
 board.addEventListener('pointermove',boardMove);
 board.addEventListener('pointerup',boardEnd);
 board.addEventListener('pointercancel',boardEnd);
 board.addEventListener('lostpointercapture',boardEnd);
 board.addEventListener('wheel',e=>{e.preventDefault();if(e.ctrlKey||e.metaKey){const p=getScreenPoint(e);zoomTo(e.deltaY<0?1.08:1/1.08,p.x,p.y)}else{state.panX-=e.deltaX;state.panY-=e.deltaY;transform()}},{passive:false});
 $$('[data-tool]').forEach(b=>b.addEventListener('click',()=>setTool(b.dataset.tool)));
 $('#undoBtn').addEventListener('click',undo);
 $('#redoBtn').addEventListener('click',redo);
 $('#zoomIn').addEventListener('click',()=>zoomTo(1.15));
 $('#zoomOut').addEventListener('click',()=>zoomTo(1/1.15));
 $('#zoomReset').addEventListener('click',fitBoard);
 $('#clearSelectionBtn').addEventListener('click',fitBoard);
 $('#newBoardBtn').addEventListener('click',()=>{setTool('task');toast('キャンバスをクリックして工程を配置')});
 $('#helpBtn').addEventListener('click',showGuide);
 $('#scheduleBtn').addEventListener('click',generate);
 $('#generateBtn').addEventListener('click',generate);
 $('#projectsTab').addEventListener('click',showProjects);
 $('#canvasTab').addEventListener('click',()=>changeView('canvas'));
 $('#ganttTab').addEventListener('click',()=>changeView('gantt'));
 $('#createProjectBtn').addEventListener('click',createProject);
 $('#projectSearch').addEventListener('input',e=>renderProjects(e.target.value));
 $('#openGanttBtn').addEventListener('click',()=>changeView('gantt'));
 $('#projectStart').addEventListener('change',e=>{if(parseISO(e.target.value))mutate(()=>state.projectStart=e.target.value)});
 $('#ganttCsv').addEventListener('click',()=>downloadFile('fieldnote-schedule.csv',scheduleToCSV(scheduleTasks(state.draft,state.projectStart).tasks),'text/csv;charset=utf-8'));
 $('#exportMenuBtn').addEventListener('click',openExportMenu);
 $('#modalClose').addEventListener('click',closeModal);
 $('#modalBackdrop').addEventListener('click',e=>{if(e.target===$('#modalBackdrop')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal()}});
 $('#modalBackdrop').addEventListener('cancel',e=>{e.preventDefault();closeModal()});
 document.addEventListener('keydown',e=>{if($('#modalBackdrop').open||state.screen!=='workspace'||e.defaultPrevented)return;if(e.key==='Escape'&&cancelDrag()){e.preventDefault();return}const tag=document.activeElement?.tagName?.toLowerCase();if(['input','textarea','select'].includes(tag)||document.activeElement?.isContentEditable)return;if(e.key===' '&&document.activeElement===board){state.space=true;e.preventDefault();return}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();return}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();redo();return}if(state.view==='canvas'&&(e.key==='Delete'||e.key==='Backspace')){if(state.selected){e.preventDefault();removeSelected()}return}if(e.key==='Escape'){state.selected=null;setTool('select');return}if(e.ctrlKey||e.metaKey||e.altKey)return;const lookup={v:'select',h:'hand',r:'task',n:'note',t:'text',p:'pen',a:'arrow'};if(e.key==='Enter'&&document.activeElement===board&&['task','note','text'].includes(state.tool)){e.preventDefault();const box=board.getBoundingClientRect();newNode(state.tool,toWorld({clientX:box.left+box.width/2-70,clientY:box.top+box.height/2-35}));return}if(state.view==='canvas'&&lookup[e.key.toLowerCase()])setTool(lookup[e.key.toLowerCase()])});
 document.addEventListener('keyup',e=>{if(e.key===' ')state.space=false});
 window.addEventListener('blur',()=>{state.space=false;cancelDrag()});
 window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}})}
wire();render();
if(storageUnavailable)$('#storageWarning').hidden=false;
