const INDEX_KEY='fieldnote_projects_v2';
const CURRENT_KEY='fieldnote_current_project_v2';
const LEGACY_KEY='fieldnote_mvp_v1';
const DATA_PREFIX='fieldnote_project_v2:';

const parse=value=>{try{return JSON.parse(value)}catch{return null}};
const validData=value=>value&&Array.isArray(value.nodes)&&Array.isArray(value.edges);
const clone=value=>JSON.parse(JSON.stringify(value));
const cleanName=value=>String(value||'').trim().slice(0,80)||'無題の工程計画';

export function createProjectStore(storage, options={}) {
  if(!storage)throw new Error('storage is required');
  const now=options.now||(()=>new Date().toISOString());
  const makeId=options.makeId||(()=>`p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`);
  const readIndex=()=>{
    const raw=storage.getItem(INDEX_KEY);
    if(raw===null)return [];
    const value=parse(raw);
    if(!Array.isArray(value)||value.some(p=>!p||typeof p.id!=='string'||typeof p.name!=='string'))throw new Error('invalid project index');
    return value;
  };
  const writeIndex=index=>storage.setItem(INDEX_KEY,JSON.stringify(index));
  const dataKey=id=>DATA_PREFIX+id;
  function stats(data){return {nodes:data.nodes.length,edges:data.edges.length,tasks:data.nodes.filter(n=>n?.type==='task').length}}
  function create(name,data){
    if(!validData(data))throw new Error('invalid project data');
    const id=makeId(),stamp=now(),item={id,name:cleanName(name),createdAt:stamp,updatedAt:stamp,...stats(data)};
    const index=readIndex();
    storage.setItem(dataKey(id),JSON.stringify(clone(data)));
    index.unshift(item);
    try{writeIndex(index)}catch(error){storage.removeItem(dataKey(id));throw error}
    return item;
  }
  function list(){return readIndex().map(item=>{const data=load(item.id);return data?{...item,...stats(data),updatedAt:[item.updatedAt,data.savedAt].filter(x=>typeof x==='string').sort().at(-1)}:item}).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)))}
  function load(id){const value=parse(storage.getItem(dataKey(id)));return validData(value)?value:null}
  function save(id,data){
    if(!validData(data))throw new Error('invalid project data');
    const item=readIndex().find(p=>p.id===id);if(!item)throw new Error('project not found');
    const savedAt=now();
    storage.setItem(dataKey(id),JSON.stringify({...data,savedAt}));
    return {...item,...stats(data),updatedAt:savedAt};
  }
  function rename(id,name){const index=readIndex(),item=index.find(p=>p.id===id);if(!item)return null;item.name=cleanName(name);item.updatedAt=now();writeIndex(index);return item}
  function setCurrent(id){if(!readIndex().some(p=>p.id===id))return false;storage.setItem(CURRENT_KEY,id);return true}
  function get(id){return readIndex().find(p=>p.id===id)??null}
  function current(){return get(storage.getItem(CURRENT_KEY))}
  function remove(id){const index=readIndex().filter(p=>p.id!==id);writeIndex(index);storage.removeItem(dataKey(id));if(storage.getItem(CURRENT_KEY)===id){if(index[0])storage.setItem(CURRENT_KEY,index[0].id);else storage.removeItem(CURRENT_KEY)}return index}
  function duplicate(id){const item=readIndex().find(p=>p.id===id),data=load(id);if(!item||!data)return null;return create(`${item.name} のコピー`,data)}
  function bootstrap(defaultData){
    const index=readIndex();
    if(storage.getItem(INDEX_KEY)===null){
      const raw=storage.getItem(LEGACY_KEY);
      const legacy=parse(raw);
      if(raw!==null&&!validData(legacy))throw new Error('invalid legacy project');
      const project=create('新しい工程計画',legacy??defaultData);
      return {project,data:load(project.id),migrated:legacy!==null};
    }
    const project=current()??index[0]??null;
    return {project,data:project?load(project.id):null,migrated:false};
  }
  return {bootstrap,list,load,save,create,rename,remove,duplicate,setCurrent,current,get};
}

export function createMemoryStorage(seed={}) {
  const map=new Map(Object.entries(seed));
  return {getItem:key=>map.has(key)?map.get(key):null,setItem:(key,value)=>map.set(key,String(value)),removeItem:key=>map.delete(key),dump:()=>Object.fromEntries(map)};
}
