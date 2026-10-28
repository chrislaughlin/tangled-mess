// Sidebar widths are presentation preferences stored only on this machine.
const shellElement=document.querySelector('.shell');
let widths={left:225,right:350};
try{const saved=JSON.parse(localStorage.getItem('tangled-mess-columns'));if(saved&&Number.isFinite(saved.left)&&Number.isFinite(saved.right))widths=saved;}catch{}
function limits(side){return {min:side==='left'?170:260,max:Math.max(side==='left'?170:260,Math.min(550,shellElement.clientWidth-440-(side==='left'?widths.right:widths.left)-16))};}
function applyWidths(){
 for(const side of ['left','right']){const {min,max}=limits(side);widths[side]=Math.max(min,Math.min(max,widths[side]));shellElement.style.setProperty('--'+side+'-width',widths[side]+'px');const handle=document.getElementById(side+'-resizer');if(handle){handle.setAttribute('aria-valuenow',Math.round(widths[side]));handle.setAttribute('aria-valuemin',min);handle.setAttribute('aria-valuemax',max);}}
}
function saveWidths(){try{localStorage.setItem('tangled-mess-columns',JSON.stringify(widths));}catch{}}
for(const side of ['left','right']){
 const handle=document.createElement('div');handle.id=side+'-resizer';handle.className='column-resizer '+side+'-resizer';handle.tabIndex=0;handle.setAttribute('role','separator');handle.setAttribute('aria-orientation','vertical');handle.setAttribute('aria-label','Resize '+side+' sidebar');handle.setAttribute('aria-controls',side==='left'?'work-sidebar':'inspector');handle.title='Drag to resize · arrow keys adjust · double-click to reset';
 if(side==='left'){document.querySelector('.rail').id='work-sidebar';document.querySelector('.rail').after(handle);}else document.getElementById('inspector').before(handle);
 handle.addEventListener('pointerdown',event=>{
  if(event.button!==0)return;event.preventDefault();handle.focus();handle.setPointerCapture(event.pointerId);const start=event.clientX,initial=widths[side];document.body.classList.add('resizing-columns');
  const move=e=>{widths[side]=initial+(e.clientX-start)*(side==='left'?1:-1);applyWidths();};
  const stop=()=>{handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',stop);handle.removeEventListener('pointercancel',stop);handle.removeEventListener('lostpointercapture',stop);document.body.classList.remove('resizing-columns');saveWidths();};
  handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',stop);handle.addEventListener('pointercancel',stop);handle.addEventListener('lostpointercapture',stop);
 });
 handle.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const {min,max}=limits(side);widths[side]=event.key==='Home'?min:event.key==='End'?max:widths[side]+(event.key==='ArrowRight'?1:-1)*(side==='left'?1:-1)*(event.shiftKey?40:10);applyWidths();saveWidths();});
 handle.addEventListener('dblclick',()=>{widths[side]=side==='left'?225:350;applyWidths();saveWidths();});
}
applyWidths();window.addEventListener('resize',applyWidths);
