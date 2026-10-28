const expansionStyle=document.createElement('link');expansionStyle.rel='stylesheet';expansionStyle.href='expansion.css';document.head.append(expansionStyle);
const resizeScript=document.createElement('script');resizeScript.src='resize.js';document.head.append(resizeScript);
const brand=document.querySelector('header strong');brand.textContent='';const logo=document.createElement('img');logo.src='assets/tangled-mess-logo.png';logo.alt='';logo.className='app-logo';brand.append(logo,document.createTextNode('tangled mess'));
const themeScript=document.createElement('script');themeScript.src='themes.js';document.head.append(themeScript);
const work = [
 {id:'checkout',title:'Checkout reliability',project:'Payments',state:'Needs you',x:48,y:43,objective:'Prevent duplicate charges during retries while preserving the legacy fallback.',brief:'The adapter is implemented and schema review is complete. The Codex session is waiting for your decision about the legacy payment fallback.',changes:[['Adapter implemented','Codex · sample session'],['Schema approved by Maya','GitHub · sample PR #412'],['Two legacy-path contract tests failed','CI · sample run #84']],next:'Decide whether to retain the v1 fallback through staged rollout.',sources:'TM-184 · PR #418 · Codex'},
 {id:'schema',title:'Payment schema',project:'Payments',state:'Waiting',x:24,y:16,objective:'Agree the schema used by the new payment adapter.',brief:'Maya approved the schema. The change is ready for its final merge check.',changes:[['Review approved','GitHub · sample PR #412']],next:'Check the final diff and merge readiness.',sources:'TM-180 · PR #412'},
 {id:'mobile',title:'Mobile checkout',project:'Mobile',state:'Waiting',x:77,y:69,objective:'Move mobile clients onto the reliable checkout path.',brief:'Implementation is paused until the checkout fallback policy is confirmed.',changes:[['Dependency decision still outstanding','Shortcut · sample TM-190']],next:'Resolve the upstream checkout decision before resuming.',sources:'TM-190 · Claude'},
 {id:'refund',title:'Refund tooling',project:'Payments',state:'Paused',x:24,y:78,objective:'Give support a safe way to retry refunds.',brief:'You left a draft of the refund flow. It depends on the new checkout behaviour.',changes:[['Draft saved before pausing','Cursor · sample session']],next:'Review checkout guarantees, then resume the refund flow.',sources:'TM-192 · Cursor'},
 {id:'auth',title:'Token refresh',project:'Identity',state:'Needs you',x:78,y:20,objective:'Refresh expired authentication tokens without interrupting requests.',brief:'Claude finished a first pass, but the expiry-boundary check is failing.',changes:[['Expiry-boundary test failed','GitLab · sample MR !72']],next:'Inspect the failing boundary case and agent explanation.',sources:'TM-176 · MR !72 · Claude'},
 {id:'search',title:'Search rewrite',project:'Discovery',state:'Paused',x:53,y:91,objective:'Replace the legacy search indexing path.',brief:'The initial exploration is complete. You paused before choosing an indexing strategy.',changes:[['Exploration notes captured','OpenCode · sample session']],next:'Compare the two indexing approaches in the session notes.',sources:'TM-141 · OpenCode'}
];
const links=[['schema','checkout'],['checkout','mobile'],['checkout','refund']];
let selected='checkout',view='map',expanded=null;
const $=id=>document.getElementById(id);
const harnessLabel=document.createElement('label');harnessLabel.className='label';harnessLabel.htmlFor='harness-filter';harnessLabel.textContent='Session harness';
const harnessFilter=document.createElement('select');harnessFilter.id='harness-filter';
for(const [value,label] of [['all','All harnesses'],['Codex','Codex'],['Cursor','Cursor'],['Claude','Claude'],['OpenCode','OpenCode']]){const option=document.createElement('option');option.value=value;option.textContent=label;harnessFilter.append(option);}
$('filter').after(harnessLabel,harnessFilter);harnessFilter.onchange=()=>{expanded=null;render();};
function matchesHarness(session){const tool=toolProjects[session.project]?.tool||'';return harnessFilter.value==='all'||tool.toLowerCase().startsWith(harnessFilter.value.toLowerCase());}
const setupScript=document.createElement('script');setupScript.src='setup.js';document.head.append(setupScript);
const viewport=document.createElement('div');viewport.className='map-viewport';$('map').before(viewport);viewport.append($('map'));
const tools=document.createElement('div');tools.className='map-tools';
let mapZoom=1;
const zoomControls=document.createElement('div');zoomControls.className='zoom-controls';
const zoomOut=document.createElement('button');zoomOut.textContent='−';zoomOut.setAttribute('aria-label','Zoom out');
const zoomReset=document.createElement('button');zoomReset.textContent='100%';zoomReset.setAttribute('aria-label','Reset map zoom');zoomReset.title='Reset zoom to fit';
const zoomIn=document.createElement('button');zoomIn.textContent='+';zoomIn.setAttribute('aria-label','Zoom in');
function changeZoom(value){mapZoom=Math.min(4,Math.max(.25,value));fitMap();}
zoomOut.onclick=()=>changeZoom(mapZoom/1.2);zoomIn.onclick=()=>changeZoom(mapZoom*1.2);zoomReset.onclick=()=>changeZoom(1);zoomControls.append(zoomOut,zoomReset,zoomIn);tools.append(zoomControls);
viewport.addEventListener('wheel',event=>{if(event.ctrlKey||event.metaKey){event.preventDefault();changeZoom(mapZoom*Math.exp(-event.deltaY*.005));}},{passive:false});
for(const [label,action] of [['Fit selection',()=>{mapZoom=1;expanded=selected;view='map';render();fitMap();}],['Fit overview',()=>{mapZoom=1;expanded=null;view='map';render();fitMap();}]]){const button=document.createElement('button');button.textContent=label;button.onclick=action;tools.append(button);}document.querySelector('.canvas-heading').append(tools);
function fitMap(){
 if(view!=='map')return;
 const map=$('map');map.style.transform='none';
 const nodes=[...$('nodes').querySelectorAll('.node')];
 if(!nodes.length)return;
 // Measure unscaled card dimensions, reserving space for focus outlines.
 const gapX=56,gapY=48,padding=32;
 if(map.classList.contains('expanded-map')){
  const root=nodes[0],children=nodes.slice(1),rows=Math.ceil(children.length/2);
  const widths=[Math.max(0,...children.filter((_,i)=>i%2===0).map(n=>n.offsetWidth)),root.offsetWidth,Math.max(0,...children.filter((_,i)=>i%2===1).map(n=>n.offsetWidth))];
  const rowHeights=Array.from({length:rows},(_,r)=>Math.max(...children.slice(r*2,r*2+2).map(n=>n.offsetHeight)));
  const width=Math.max(900,padding*2+widths.reduce((a,b)=>a+b,0)+gapX*2);
  const height=Math.max(680,root.offsetHeight+padding*2,rowHeights.reduce((a,b)=>a+b,0)+Math.max(0,rows-1)*gapY+padding*2);
  map.style.width=width+'px';map.style.height=height+'px';
  const centerX=padding+widths[0]+gapX+widths[1]/2;
  root.style.left=centerX+'px';root.style.top=height/2+'px';
  let y=padding;children.forEach((node,i)=>{const r=Math.floor(i/2);if(i>0&&i%2===0)y+=rowHeights[r-1]+gapY;node.style.left=(i%2===0?padding+widths[0]/2:width-padding-widths[2]/2)+'px';node.style.top=y+rowHeights[r]/2+'px';});
  $('edges').setAttribute('viewBox',`0 0 ${width} ${height}`);
  $('edges').innerHTML=children.map(n=>`<path d="M${centerX} ${height/2} C${(centerX+n.offsetLeft)/2} ${height/2}, ${(centerX+n.offsetLeft)/2} ${n.offsetTop}, ${n.offsetLeft} ${n.offsetTop}" fill="none" stroke="currentColor" stroke-width="1.5"/>`).join('');
 }else if(nodes.length>6){
  const columns=Math.ceil(Math.sqrt(nodes.length));const cardWidth=Math.max(...nodes.map(n=>n.offsetWidth));
  const rowHeights=Array.from({length:Math.ceil(nodes.length/columns)},(_,r)=>Math.max(...nodes.slice(r*columns,(r+1)*columns).map(n=>n.offsetHeight)));
  map.style.width=(padding*2+columns*cardWidth+(columns-1)*gapX)+'px';map.style.height=(padding*2+rowHeights.reduce((a,b)=>a+b,0)+(rowHeights.length-1)*gapY)+'px';
  let y=padding;nodes.forEach((node,i)=>{const r=Math.floor(i/columns);if(i>0&&i%columns===0)y+=rowHeights[r-1]+gapY;node.style.left=(padding+(i%columns)*(cardWidth+gapX)+cardWidth/2)+'px';node.style.top=(y+rowHeights[r]/2)+'px';});
 }else{map.style.width='';map.style.height='';}
 const left=Math.min(...nodes.map(n=>n.offsetLeft-n.offsetWidth/2))-12;
 const top=Math.min(...nodes.map(n=>n.offsetTop-n.offsetHeight/2))-12;
 const right=Math.max(...nodes.map(n=>n.offsetLeft+n.offsetWidth/2))+12;
 const bottom=Math.max(...nodes.map(n=>n.offsetTop+n.offsetHeight/2))+12;
 const scale=Math.max(.1,Math.min(1,(viewport.clientWidth-24)/(right-left),(viewport.clientHeight-24)/(bottom-top)))*mapZoom;
 const x=Math.max(12,(viewport.clientWidth-(right-left)*scale)/2)-left*scale;
 const y=Math.max(12,(viewport.clientHeight-(bottom-top)*scale)/2)-top*scale;
 map.style.transform='translate('+x+'px,'+y+'px) scale('+scale+')';
 viewport.style.overflow=mapZoom>1?'auto':'hidden';if(mapZoom<=1){viewport.scrollTop=0;viewport.scrollLeft=0;}
 zoomReset.textContent=Math.round(mapZoom*100)+'%';zoomOut.disabled=mapZoom<=.25;zoomIn.disabled=mapZoom>=4;
}
new ResizeObserver(fitMap).observe(viewport);
function choose(id){mapZoom=1;expanded=expanded===id?null:id;selected=id;render();}
function collapse(){mapZoom=1;expanded=null;render();[...$('nodes').children].find(n=>n.getAttribute('aria-pressed')==='true')?.focus();}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&expanded)collapse();});
function render(){
 const query=$('search').value.toLowerCase(),filter=$('filter').value;
 const visible=work.filter(w=>(filter==='all'||w.state===filter)&&(harnessFilter.value==='all'||sessions.some(s=>s.work===w.id&&matchesHarness(s)))&&(w.title+' '+w.project+' '+w.sources+' '+sessions.filter(s=>s.work===w.id&&matchesHarness(s)).map(s=>s.title+' '+toolProjects[s.project].name+' '+toolProjects[s.project].tool+' '+(s.repo?repositories[s.repo].name:'research')).join(' ')).toLowerCase().includes(query));
 if(visible.length&&!visible.some(w=>w.id===selected)){selected=visible[0].id;expanded=null;}
 $('queue').replaceChildren();$('nodes').replaceChildren();$('deck').replaceChildren();
 for(const w of visible){
  const queue=document.createElement('button');queue.className='queue-item'+(w.id===selected?' selected':'');queue.textContent=w.title;const small=document.createElement('small');small.textContent=w.state+' · '+w.project;queue.append(small);queue.onclick=()=>choose(w.id);$('queue').append(queue);
  const node=document.createElement('button');node.className='node'+(w.id===selected?' selected':'')+(w.state==='Needs you'?' needs':'');node.style.left=w.x+'%';node.style.top=w.y+'%';node.setAttribute('aria-pressed',w.id===selected);node.innerHTML='<strong>'+w.title+'</strong><small>'+w.state+'</small>';node.onclick=()=>choose(w.id);$('nodes').append(node);
  const relatedSessions=sessions.filter(s=>s.work===w.id&&matchesHarness(s));
  const card=document.createElement('button');card.className='deck-card'+(w.id===selected?' selected':'');card.innerHTML='<strong>'+w.title+'</strong><p>'+w.state+' · '+w.project+'</p><p class="deck-next">'+w.next+'</p>';
  const stats=document.createElement('p');stats.className='deck-session-stats';stats.textContent=relatedSessions.length+' sessions · '+new Set(relatedSessions.map(s=>s.repo).filter(Boolean)).size+' repositories · '+[...new Set(relatedSessions.map(s=>toolProjects[s.project].tool))].join(', ');card.append(stats);
  const sessionList=document.createElement('span');sessionList.className='deck-sessions';
  for(const session of relatedSessions){const row=document.createElement('span');row.className='deck-session';const title=document.createElement('span');title.textContent=session.title;const meta=document.createElement('span');meta.className='deck-session-meta';meta.textContent=toolProjects[session.project].tool+' · '+(session.repo?repositories[session.repo].name:'No repository')+' · '+session.state;row.append(title,meta);sessionList.append(row);}card.append(sessionList);
  card.onclick=()=>choose(w.id);$('deck').append(card);
 }
 for(const [index,w] of visible.entries()) { const related=sessions.filter(s=>s.work===w.id&&matchesHarness(s));const count=document.createElement('small');count.textContent='Expand '+related.length+' sessions · '+new Set(related.map(s=>s.repo).filter(Boolean)).size+' repos';$('nodes').children[index].append(count);$('nodes').children[index].setAttribute('aria-expanded','false'); }
 if(!visible.length){$('queue').textContent='No matching workstreams.';$('deck').textContent='No matching workstreams.';}
 const ids=new Set(visible.map(w=>w.id));
 $('edges').setAttribute('viewBox','0 0 100 100');$('edges').setAttribute('preserveAspectRatio','none');
 $('edges').innerHTML='<defs><marker id="arrow" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4" fill="#829b94"/></marker></defs>'+links.filter(([a,b])=>ids.has(a)&&ids.has(b)).map(([a,b])=>{const p=work.find(w=>w.id===a),q=work.find(w=>w.id===b);return `<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" stroke="#829b94" stroke-width=".3" marker-end="url(#arrow)"/>`;}).join('');
 $('map').hidden=view!=='map';$('deck').hidden=view!=='deck';$('map-view').setAttribute('aria-pressed',view==='map');$('deck-view').setAttribute('aria-pressed',view==='deck');$('view-title').textContent=view==='map'?'See the connections.':'Choose your next move.';
 viewport.hidden=view!=='map';tools.hidden=view!=='map';
 document.querySelector('main').classList.toggle('flight-mode',view==='deck');
 document.querySelector('.legend').textContent=view==='deck'?'Select a workstream to inspect its brief, source records, and sessions.':'Select a workstream to expand sessions. Select its root to return.';
 document.querySelectorAll('.edge-label').forEach(n=>n.remove());
 for(const [a,b] of links.filter(([a,b])=>ids.has(a)&&ids.has(b))){const p=work.find(w=>w.id===a),q=work.find(w=>w.id===b);const label=document.createElement('span');label.className='edge-label';label.textContent='blocks';label.style.left=(p.x+q.x)/2+'%';label.style.top=(p.y+q.y)/2+'%';label.title=p.title+' blocks '+q.title;$('nodes').append(label);}
 const localMode=typeof realSessions!=='undefined'&&realSessions.length>0;
 $('signal').textContent=localMode?realSessions.length+' imported sessions · folder groups are provisional · activity unknown':work.filter(w=>w.state==='Needs you').length+' workstreams need your attention · all records are synthetic';
 if(!visible.length){$('inspector').textContent='No workstreams match these filters. Choose All harnesses or Show all to reset.';return;}
 const w=work.find(w=>w.id===selected);
 if(expanded && ids.has(expanded)){
  const children=sessions.filter(s=>s.work===expanded&&matchesHarness(s));
  $('nodes').replaceChildren();
  $('map').classList.add('expanded-map');
  const root=document.createElement('button');root.className='node selected root-node';root.style.left='50%';root.style.top='50%';root.setAttribute('aria-expanded','true');root.setAttribute('aria-label','Back to workstreams: collapse '+w.title);root.innerHTML='<span class="collapse-cue">Back to workstreams</span><strong>'+w.title+'</strong><small>'+children.length+' sessions expanded · click to collapse</small>';root.onclick=collapse;$('nodes').append(root);
  root.classList.toggle('needs',w.state==='Needs you');
  let lines='';
  children.forEach((session,index)=>{
   const left=index%2===0;const side=children.filter((_,i)=>i%2===index%2).length;const row=Math.floor(index/2);const x=left?16:84,y=(row+1)*100/(side+1);
   const node=document.createElement('button');node.className='node session-node';node.style.left=x+'%';node.style.top=y+'%';
   node.classList.toggle('needs',session.state==='Needs input');
   const title=document.createElement('strong');title.textContent=session.title;
   const meta=document.createElement('small');meta.textContent=toolProjects[session.project].tool+' · '+session.state;
   const repo=document.createElement('small');repo.textContent=session.repo?repositories[session.repo].name:'Research · no repository';node.append(title,meta,repo);
   node.onclick=()=>{document.querySelectorAll('.session-node').forEach(n=>n.classList.remove('selected'));node.classList.add('selected');const detail=document.getElementById('session-'+session.id);if(detail){detail.open=true;detail.scrollIntoView({behavior:'smooth',block:'center'});}};
   $('nodes').append(node);lines+=`<path d="M50 50 C${left?30:70} 50, ${left?30:70} ${y}, ${x} ${y}" fill="none" stroke="#76b8ba" stroke-width=".35"/>`;
  });
  $('edges').innerHTML=lines;if(view==='map')$('view-title').textContent=w.title+' · sessions';
 }else{$('map').classList.remove('expanded-map');}
 $('inspector').innerHTML='<p class="label">SWITCH BRIEF · SAMPLE EVIDENCE</p><span class="badge">'+w.state+'</span><h2>'+w.title+'</h2><p class="brief">'+w.objective+'</p><p class="brief">'+w.brief+'</p><p class="label">WHAT CHANGED</p><ul class="changes">'+w.changes.map(([text,source])=>'<li>'+text+'<span class="source">'+source+'</span></li>').join('')+'</ul><div class="next"><span class="label">SUGGESTED NEXT MOVE</span><p>'+w.next+'</p><button id="resume" class="primary">Resume this workstream</button></div><div class="dependencies"><p class="label">DEPENDENCIES</p><div id="dependency-list"></div></div><label class="label" for="attention-state">ATTENTION STATE</label><select id="attention-state" class="status-control">'+['Needs you','Active','Waiting','Paused','Done'].map(s=>'<option'+(s===w.state?' selected':'')+'>'+s+'</option>').join('')+'</select><p class="source">'+w.sources+'</p><p class="source" id="checkpoint">'+(w.focused?'Resumed '+w.focused:'Preview only · no focus checkpoint recorded')+'</p>';
 const related=sessions.filter(s=>s.work===selected&&matchesHarness(s));
 const records=document.createElement('section');records.className='source-records';
 const recordsHeading=document.createElement('h3');recordsHeading.textContent='Tickets & PRs / MRs';records.append(recordsHeading);
 const recordsNote=document.createElement('p');recordsNote.className='source';recordsNote.textContent=localMode?'No external ticket or PR connector configured.':'All linked records for this workstream. Sample links open example.com.';records.append(recordsNote);
 for(const record of sourceRecords.filter(r=>r.work===selected)){
 const row=document.createElement('div');row.className='source-record';
 const title=document.createElement(record.url?'a':'span');title.textContent=record.type+' '+record.id+' · '+record.title;
 if(record.url){title.href=record.url;title.target='_blank';title.rel='noopener noreferrer';}
 const meta=document.createElement('p');meta.className='source';meta.textContent=record.provider+' · '+record.state+' · '+(record.repository||w.project)+' · Sample snapshot';row.append(title,meta);records.append(row);
 }
 $('inspector').insertBefore(records,$('inspector').querySelector('.next'));
 const section=document.createElement('section');
 section.innerHTML='<h3>Inside this workstream</h3><p class="source">'+related.length+' sessions · '+new Set(related.map(s=>s.repo).filter(Boolean)).size+' repositories</p>';
 for(const repo of [...new Set(related.map(s=>s.repo))]){
 const heading=document.createElement('h4');heading.textContent=repo?repositories[repo].name:'No repository · research';section.append(heading);
 for(const s of related.filter(item=>item.repo===repo)){
 const details=document.createElement('details');details.id='session-'+s.id;details.style.cssText='border-top:1px solid #bbc2b8;padding:12px 0;font-size:12px;line-height:1.7';
 const summary=document.createElement('summary');summary.textContent=s.title+' · '+s.state;summary.style.cursor='pointer';details.append(summary);
 for(const text of [toolProjects[s.project].tool+' / '+toolProjects[s.project].name,s.repo?repositories[s.repo].path:'No local repository',s.branch?'Branch: '+s.branch:'Branch unknown',s.summary,'Next: '+s.next,localMode?'Imported history · not live status':'Freshness: synthetic snapshot; not live']){const p=document.createElement('p');p.textContent=text;p.style.overflowWrap='anywhere';details.append(p);}
 if(!localMode){const open=document.createElement('a');open.href='https://example.com';open.target='_blank';open.rel='noopener noreferrer';open.textContent='Open session · sample destination';details.append(open);}section.append(details);
 }}$('inspector').append(section);
 const dependencies=links.filter(([a,b])=>a===selected||b===selected);if(!dependencies.length)$('dependency-list').textContent='No known dependencies.';
 for(const [a,b] of dependencies){const other=work.find(item=>item.id===(a===selected?b:a));const button=document.createElement('button');button.textContent=(a===selected?'Blocks → ':'Blocked by ← ')+other.title;button.onclick=()=>choose(other.id);$('dependency-list').append(button);}
 $('resume').onclick=()=>{w.state='Active';w.focused=new Date().toLocaleTimeString();render();};$('attention-state').onchange=e=>{w.state=e.target.value;render();};
 requestAnimationFrame(fitMap);
}
 $('map-view').onclick=()=>{view='map';render();};$('deck-view').onclick=()=>{view='deck';render();};$('search').oninput=render;$('filter').onchange=render;$('reset').onclick=()=>{expanded=null;$('filter').value='all';harnessFilter.value='all';$('search').value='';render();};render();
