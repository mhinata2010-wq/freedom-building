/** Horizontal tool dock: collapse and drag resize, with a keyboard equivalent. */
const STORAGE_KEY='fieldnote_dock_width_v1';
export function initCanvasDock() {
  const dock=document.querySelector('#canvasToolbar');
  const grip=document.querySelector('#toolbarResize');
  const collapse=document.querySelector('#toolbarCollapseBtn');
  if(!dock||!grip||!collapse)return;
  let currentWidth=700, drag=null;
  try {const stored=Number(localStorage.getItem(STORAGE_KEY));if(Number.isFinite(stored)&&stored>=320)currentWidth=stored} catch {}
  const limits=()=>Math.max(280,dock.parentElement.getBoundingClientRect().width-24);
  function applyWidth(width,store=false){currentWidth=Math.max(280,Math.min(limits(),Math.round(width)));dock.style.setProperty('--dock-width',currentWidth+'px');if(store){try{localStorage.setItem(STORAGE_KEY,String(currentWidth))}catch{}}}
  applyWidth(currentWidth);
  collapse.addEventListener('click',()=>{
    const collapsed=dock.classList.toggle('is-collapsed');
    collapse.setAttribute('aria-expanded',String(!collapsed));
    collapse.setAttribute('aria-label',collapsed?'描画ツールを展開':'描画ツールを折りたたむ');
    collapse.title=collapsed?'ツールバーを開く':'ツールバーを閉じる';
  });
  grip.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    drag={x:event.clientX,width:dock.getBoundingClientRect().width};
    grip.setPointerCapture(event.pointerId);
    event.preventDefault();
    dock.classList.add('is-resizing');
  });
  grip.addEventListener('pointermove',event=>{if(drag)applyWidth(drag.width+2*(event.clientX-drag.x))});
  function endDrag(){if(!drag)return;drag=null;dock.classList.remove('is-resizing');applyWidth(currentWidth,true)}
  grip.addEventListener('pointerup',endDrag);
  grip.addEventListener('pointercancel',endDrag);
  grip.addEventListener('lostpointercapture',endDrag);
  grip.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();
    const width=event.key==='Home'?320:event.key==='End'?limits():currentWidth+(event.key==='ArrowRight'?40:-40);
    applyWidth(width,true);
  });
  window.addEventListener('resize',()=>applyWidth(currentWidth));
}
