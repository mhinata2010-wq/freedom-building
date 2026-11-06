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
  const readIndex=()=>{const value=parse(storage.getItem(INDEX_KEY)||'[]');return Array.isArray(value)?value:[]};
  const writeIndex=index=>storage.setItem(INDEX_KEY,JSON.stringify(index));
  const dataKey=id=>DATA_PREFIX+id;
  function stats(data){return {nodes:data.nodes.length,edges:data.edges.length,tasks:data.nodes.filter(n=>n?.type==='task').length}}
  function touch(id,data,name){
    const index=readIndex(),stamp=now();let item=index.find(p=>p.id===id);
    if(!item){item={id,name:cleanName(name),createdAt:stamp,updatedAt:stamp,...stats(data)};index.unshift(item)}
    else Object.assign(item,{name:cleanName(name??item.name),updatedAt:stamp,...stats(data)});
    writeIndex(index);return item;
  }
  function create(name,data){
    if(!validData(data))throw new Error('invalid project data');
    const id=makeId(),stamp=now(),item={id,name:cleanName(name),createdAt:stamp,updatedAt:stamp,...stats(data)};
    storage.setItem(dataKey(id),JSON.stringify(clone(data)));
    const index=readIndex();index.unshift(item);writeIndex(index);storage.setItem(CURRENT_KEY,id);return item;
  }
  function list(){return readIndex().sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)))}
  function load(id){const value=parse(storage.getItem(dataKey(id)));return validData(value)?value:null}
  function save(id,data){
    if(!validData(data))throw new Error('invalid project data');
    const item=readIndex().find(p=>p.id===id);if(!item)throw new Error('project not found');
    storage.setItem(dataKey(id),JSON.stringify(clone(data)));return touch(id,data,item.name);
  }
  function rename(id,name){const index=readIndex(),item=index.find(p=>p.id===id);if(!item)return null;item.name=cleanName(name);item.updatedAt=now();writeIndex(index);return item}
  function setCurrent(id){if(!readIndex().some(p=>p.id===id))return false;storage.setItem(CURRENT_KEY,id);return true}
  function current(){const id=storage.getItem(CURRENT_KEY);return readIndex().find(p=>p.id===id)||null}
  function remove(id){const index=readIndex().filter(p=>p.id!==id);storage.removeItem(dataKey(id));writeIndex(index);if(storage.getItem(CURRENT_KEY)===id){if(index[0])storage.setItem(CURRENT_KEY,index[0].id);else storage.removeItem(CURRENT_KEY)}return index}
  function duplicate(id){const item=readIndex().find(p=>p.id===id),data=load(id);if(!item||!data)return null;return create(`${item.name} のコピー`,data)}
  function bootstrap(defaultData){
    let index=readIndex();
    if(!index.length){
      const legacy=parse(storage.getItem(LEGACY_KEY));const seed=validData(legacy)?legacy:defaultData;
      const created=create('新しい工程計画',seed);return {project:created,data:load(created.id),migrated:validData(legacy)};
    }
    let project=current();if(!project){project=index[0];setCurrent(project.id)}
    let data=load(project.id);
    if(!validData(data)){data=clone(defaultData);storage.setItem(dataKey(project.id),JSON.stringify(data));touch(project.id,data,project.name)}
    return {project,data,migrated:false};
  }
  return {bootstrap,list,load,save,create,rename,remove,duplicate,setCurrent,current};
}

export function createMemoryStorage(seed={}) {
  const map=new Map(Object.entries(seed));
  return {getItem:key=>map.has(key)?map.get(key):null,setItem:(key,value)=>map.set(key,String(value)),removeItem:key=>map.delete(key),dump:()=>Object.fromEntries(map)};
}
