const setupStyle=document.createElement('link');setupStyle.rel='stylesheet';setupStyle.href='setup.css';document.head.append(setupStyle);
const setupPage=document.createElement('section');setupPage.className='setup-page';document.querySelector('.shell').before(setupPage);
setupPage.innerHTML='<div class="setup-intro"><h1>Bring your work into focus.</h1><p>Connect local session history, then turn it into guidance with your own AI provider. Tangled Mess stays beside your coding tools.</p></div><form id="setup-form"><h2>1. Choose your session sources</h2><p>Read the newest 50 sessions per tool. Source files are never modified.</p><fieldset id="harness-options"><legend>Installed coding tools</legend></fieldset><h2>2. Choose how to generate guidance</h2><label for="provider">AI provider</label><select id="provider"><option>None</option><option>OpenAI</option><option>Anthropic</option></select><label for="ai-model">Model ID available to your account</label><input id="ai-model" placeholder="Enter your provider model ID" autocomplete="off"><label for="api-key">API key</label><input id="api-key" type="password" placeholder="Stored encrypted on this Mac" autocomplete="off"><p class="setup-disclosure">Import stays local. Generating guidance sends selected session titles, paths, and bounded user-message excerpts to your chosen provider. OpenCode currently imports metadata only. API keys do not inherit ChatGPT, Claude, or Cursor MCP connections.</p><h2>3. External tickets and MCP tools</h2><p>Local import works now. Reusing an installed harness’s MCP configuration and collecting external tickets require a separate connector; they are not enabled yet. No harness is executed during import.</p><button type="submit" class="primary">Validate sources & import local sessions</button><button type="button" id="demo-mode">Explore sample data</button><p id="setup-result" role="status"></p></form>';
const cursorOption=document.createElement('option');cursorOption.value='Cursor';cursorOption.textContent='Cursor CLI (existing sign-in or API key)';document.getElementById('provider').append(cursorOption);
const engineHint=document.createElement('p');engineHint.className='setup-disclosure';engineHint.id='engine-hint';document.getElementById('provider').after(engineHint);
function updateEngineFields(){const cursor=document.getElementById('provider').value==='Cursor';document.querySelector('label[for=provider]').textContent='Processing engine';document.querySelector('label[for=ai-model]').textContent=cursor?'Cursor model (optional)':'Model ID available to your account';document.querySelector('label[for=api-key]').textContent=cursor?'Cursor API key (optional if signed in)':'API key';document.getElementById('ai-model').placeholder=cursor?'Leave blank to use Cursor’s default model':'Enter your provider model ID';engineHint.textContent=cursor?'Uses the installed Cursor CLI to summarize sessions imported from any selected harness. Leave the key blank to reuse Cursor CLI sign-in. No MCP collection is enabled; generation runs in Ask mode with sandbox enabled.':'Direct provider requests use the API key and model you configure. Local import needs neither.';}
document.getElementById('provider').addEventListener('change',updateEngineFields);updateEngineFields();
for(const tool of ['Codex','Cursor','OpenCode','Claude']){const label=document.createElement('label');label.className='harness-choice';const input=document.createElement('input');input.type='checkbox';input.value=tool;input.name='harness';input.checked=['Codex','Cursor','OpenCode'].includes(tool);label.append(input,document.createTextNode(tool));document.getElementById('harness-options').append(label);}
const settingsButton=document.createElement('button');settingsButton.textContent='Settings';settingsButton.id='settings-button';settingsButton.setAttribute('aria-controls','settings-page');settingsButton.title='Settings (⌘,)';document.querySelector('header').append(settingsButton);
setupPage.id='settings-page';setupPage.setAttribute('aria-label','Settings and configuration');
const backButton=document.createElement('button');backButton.type='button';backButton.className='settings-back';backButton.textContent='Back to workspace';backButton.onclick=()=>showWorkspace();setupPage.prepend(backButton);
const settingsHeading=setupPage.querySelector('h1');settingsHeading.tabIndex=-1;
const helpScript=document.createElement('script');helpScript.src='setup-help.js';document.head.append(helpScript);
function showSetup(){setupPage.hidden=false;document.querySelector('.shell').hidden=true;settingsButton.setAttribute('aria-pressed','true');settingsHeading.textContent='Settings';settingsHeading.focus();}
function showWorkspace(){setupPage.hidden=true;document.querySelector('.shell').hidden=false;settingsButton.setAttribute('aria-pressed','false');settingsButton.focus();requestAnimationFrame(fitMap);}
document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key===','){event.preventDefault();showSetup();}});
settingsButton.onclick=showSetup;document.getElementById('demo-mode').onclick=showWorkspace;
const report=document.getElementById('setup-result');
function escapeHTML(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
let realSessions=[];
let pendingReview=null;

function folderKey(row){return row.cwd||row.source?.split('/agent-transcripts/')[0]||'Unassigned';}
function plainTitle(value){return String(value||'').replace(/<[^>]+>/g,'');}

function placeWorkGrid(){
 const columns=Math.ceil(Math.sqrt(work.length||1));const rowCount=Math.ceil(work.length/columns);
 work.forEach((w,i)=>{w.x=(i%columns+.5)*100/columns;w.y=(Math.floor(i/columns)+.5)*100/rowCount;});
}

function guessBranch(row){
 if(row.branch)return row.branch;
 const blob=String(row.excerpt||'')+'\n'+String(row.title||'');
 const named=blob.match(/\b(?:branch|checkout)\s*[:=]\s*([A-Za-z0-9._\/-]+)/i);
 if(named)return named[1];
 const conventional=blob.match(/\b((?:feat|fix|chore|test|docs|refactor)\/[A-Za-z0-9._\/-]+)/);
 return conventional?conventional[1]:null;
}
function pushLocalSessions(workId,rows,repo,name){
 for(const row of rows){
  const toolProject=workId+'-'+row.tool;
  toolProjects[toolProject]={name,tool:row.tool,repos:[repo]};
  const analysis=window.TangledAttention?.analyzeSession(row);
  const state=analysis?.state==='Needs you'?'Needs input':(analysis?.state==='Waiting'?'Ready for review':'Imported · activity unknown');
  const branch=guessBranch(row);
  sessions.push({id:row.id,work:workId,project:toolProject,repo,title:row.title,state,branch,summary:row.excerpt||'Metadata only; no transcript excerpt imported.',next:analysis?.state==='Needs you'?'Answer the open question in this session.':'Return to '+row.tool+' to continue this session.',source:row.source,updated:row.updated,excerpt:row.excerpt,tool:row.tool,cwd:row.cwd});
 }
}

function enrichWorkstream(w,rows){
 const analysis=window.TangledAttention?.analyzeWorkstream(rows)||{suggested:'Paused',why:'Imported · activity unknown',nextSteps:[],changesSince:()=>rows.slice(0,3).map(r=>[r.title,r.tool+' · '+r.updated])};
 w.suggestedAttention=analysis.suggested;
 if(!w.attentionOverride)w.state=analysis.suggested;
 w.attentionWhy=analysis.why;
 w.nextSteps=analysis.nextSteps;
 w.next=analysis.nextSteps[0]||w.next;
 w.changes=analysis.changesSince(w.lastFocusedAt);
 if(!w.brief||w.provisional)w.brief=analysis.why+' · '+rows.length+' local session'+(rows.length===1?'':'s')+' in this Workstream.';
}

function buildFromMemory(result,memory){
 const byId=new Map(result.sessions.map(s=>[s.id,s]));
 const assigned=new Set();
 const created=[];
 for(const ws of memory.workstreams||[]){
  const members=ws.sessionIds.map(id=>byId.get(id)).filter(Boolean);
  if(!members.length)continue;
  members.forEach(s=>assigned.add(s.id));
  const id=ws.id||('ws-'+created.length);
  const repo='repo-'+id;
  const name=plainTitle(ws.title)||(folderKey(members[0]).split('/').filter(Boolean).pop())||'Workstream';
  repositories[repo]={name,path:ws.folderHints?.[0]||folderKey(members[0])};
  const item={id,title:escapeHTML(name),project:ws.provisional?'Local folder group':'Curated workstream',state:ws.attentionState||'Paused',x:20,y:20,objective:ws.objective||'Confirmed shared objective across imported sessions.',brief:'',changes:[],next:ws.acceptedNextMove||'Inspect sessions and decide the next move.',sources:'Local files · curated',folderHints:ws.folderHints||[...new Set(members.map(folderKey))],provisional:!!ws.provisional,attentionOverride:!!ws.attentionOverride,lastFocusedAt:ws.lastFocusedAt||null,acceptedNextMove:ws.acceptedNextMove||null,attentionWhy:ws.attentionWhy||null,suggestedAttention:ws.suggestedAttention||null,local:true,snapshot:memory.snapshots?.[id]||null};
  created.push(item);work.push(item);pushLocalSessions(id,members,repo,name);enrichWorkstream(item,members);
  if(ws.attentionOverride&&ws.attentionState)item.state=ws.attentionState;
 }
 const leftovers=result.sessions.filter(s=>!assigned.has(s.id));
 const groups=new Map();
 for(const row of leftovers){const directory=folderKey(row);if(!groups.has(directory))groups.set(directory,[]);groups.get(directory).push(row);}
 for(const [directory,rows] of groups){
  const id='local-'+directory.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(-56)||('unassigned-'+rows[0]?.id);
  const repo='repo-'+id;
  const name=directory.split('/').filter(Boolean).pop()||'Unassigned sessions';
  repositories[repo]={name,path:directory};
  const item={id,title:escapeHTML(name),project:'Local folder group',state:'Paused',x:20,y:20,objective:'Provisional folder grouping; confirm the shared objective.',brief:'',changes:[],next:'Inspect the imported sessions and confirm which belong to the same objective.',sources:'Local files · imported '+result.importedAt,folderHints:[directory],provisional:true,local:true};
  work.push(item);created.push(item);pushLocalSessions(id,rows,repo,name);enrichWorkstream(item,rows);
 }
 return {created,leftoverFolders:[...groups.keys()]};
}

function applyStoredLinks(memory){
 links.splice(0);
 const dismissed=new Set(memory.dismissedLinks||[]);
 for(const l of memory.links||[]){
  const n=normalizeLink(l);
  if(dismissed.has(linkKey(n)))continue;
  if(work.some(w=>w.id===n.from)&&work.some(w=>w.id===n.to))links.push(n);
 }
}

function shouldPromptReview(result,memory){
 const known=new Set(memory.reviewedFolders||[]);
 const folders=new Set(result.sessions.map(folderKey));
 const fresh=[...folders].filter(f=>!known.has(f));
 const hasProvisional=work.some(w=>w.provisional);
 return hasProvisional&&(fresh.length>0||!(memory.workstreams||[]).length);
}

function openReviewGroupings(result){
 pendingReview={result};
 const overlay=document.createElement('div');overlay.className='handoff-overlay review-overlay';overlay.id='review-groupings';
 const panel=document.createElement('div');panel.className='handoff-panel review-panel';
 panel.innerHTML='<p class="label">REVIEW GROUPINGS</p><h3>Confirm Workstreams</h3><p class="brief">Folder groups are suggestions. Rename, merge folders that share an objective, or split sessions into a new Workstream. Keep provisional if you are not sure.</p>';
 const list=document.createElement('div');list.className='review-list';
 const colocations=window.TangledAttention?.colocate(realSessions)||[];
 if(colocations.length){
  const tip=document.createElement('p');tip.className='source';tip.textContent='Related sessions spotted across folders/harnesses: '+colocations.slice(0,3).map(c=>c.reason).join(' · ');panel.append(tip);
 }
 const checks=[];
 for(const w of work){
  const row=document.createElement('label');row.className='review-row';
  const box=document.createElement('input');box.type='checkbox';box.value=w.id;checks.push(box);
  const title=document.createElement('input');title.type='text';title.value=plainTitle(w.title);title.className='review-title';title.dataset.workId=w.id;
  const meta=document.createElement('span');meta.className='source';meta.textContent=(w.provisional?'Provisional · ':'Curated · ')+sessions.filter(s=>s.work===w.id).length+' sessions'+(w.attentionWhy?' · '+w.attentionWhy.slice(0,70):'');
  row.append(box,title,meta);list.append(row);
 }
 panel.append(list);
 const actions=document.createElement('div');actions.className='handoff-actions';
 const renameApply=()=>{for(const input of panel.querySelectorAll('.review-title')){const w=work.find(x=>x.id===input.dataset.workId);if(w){w.title=escapeHTML(input.value.trim()||plainTitle(w.title));}}};
 const merge=document.createElement('button');merge.textContent='Merge selected';
 merge.onclick=()=>{
  renameApply();
  const ids=checks.filter(c=>c.checked).map(c=>c.value);
  if(ids.length<2)return;
  const primary=work.find(w=>w.id===ids[0]);
  const rest=ids.slice(1);
  for(const id of rest){
   for(const s of sessions.filter(s=>s.work===id))s.work=primary.id;
   primary.folderHints=[...new Set([...(primary.folderHints||[]),...(work.find(w=>w.id===id)?.folderHints||[])])];
   const idx=work.findIndex(w=>w.id===id);if(idx>=0)work.splice(idx,1);
  }
  primary.provisional=false;primary.project='Curated workstream';
  const rows=realSessions.filter(s=>sessions.some(x=>x.id===s.id&&x.work===primary.id));
  enrichWorkstream(primary,rows);persistMemory();overlay.remove();openReviewGroupings(result);
 };
 const split=document.createElement('button');split.textContent='Split checked into new Workstream';
 split.onclick=()=>{
  renameApply();
  const ids=checks.filter(c=>c.checked).map(c=>c.value);
  if(ids.length!==1){alert('Check exactly one Workstream, then pick sessions to split from the prompt.');return;}
  const source=work.find(w=>w.id===ids[0]);
  const members=sessions.filter(s=>s.work===source.id);
  if(members.length<2)return;
  const pick=prompt('Enter session titles (or IDs) to split out, comma-separated.\n\n'+members.map(m=>m.title).join('\n'));
  if(!pick)return;
  const needles=pick.split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
  const moving=members.filter(m=>needles.some(n=>m.title.toLowerCase().includes(n)||m.id.toLowerCase().includes(n)));
  if(!moving.length)return;
  const id='ws-split-'+Date.now().toString(36);
  const repo='repo-'+id;
  const name=prompt('Name for the new Workstream',moving[0].title.slice(0,40))||moving[0].title.slice(0,40);
  repositories[repo]={name,path:source.folderHints?.[0]||''};
  const item={id,title:escapeHTML(name),project:'Curated workstream',state:'Paused',x:50,y:50,objective:'Split from '+plainTitle(source.title),brief:'',changes:[],next:'Confirm objective and next move.',sources:'Local files · curated',folderHints:[...(source.folderHints||[])],provisional:false,local:true};
  work.push(item);for(const s of moving){s.work=id;s.repo=repo;}
  const rows=realSessions.filter(s=>moving.some(m=>m.id===s.id));
  enrichWorkstream(item,rows);enrichWorkstream(source,realSessions.filter(s=>sessions.some(x=>x.id===s.id&&x.work===source.id)));
  placeWorkGrid();persistMemory();overlay.remove();openReviewGroupings(result);
 };
 const keep=document.createElement('button');keep.textContent='Keep provisional';
 keep.onclick=async()=>{
  renameApply();
  curatedMemory.reviewedFolders=[...new Set([...(curatedMemory.reviewedFolders||[]),...realSessions.map(folderKey)])];
  await persistMemory();overlay.remove();placeWorkGrid();render();
 };
 const confirm=document.createElement('button');confirm.className='primary';confirm.textContent='Confirm Workstreams';
 confirm.onclick=async()=>{
  renameApply();
  for(const w of work){w.provisional=false;if(w.project==='Local folder group')w.project='Curated workstream';}
  curatedMemory.reviewedFolders=[...new Set([...(curatedMemory.reviewedFolders||[]),...realSessions.map(folderKey)])];
  placeWorkGrid();await persistMemory();overlay.remove();render();
 };
 actions.append(merge,split,keep,confirm);panel.append(actions);
 const note=document.createElement('p');note.className='source';note.textContent='Membership persists in local curated memory and reattaches on re-import by session ID.';panel.append(note);
 overlay.append(panel);document.body.append(overlay);
}

async function useLocalData(result){
 realSessions=result.sessions;
 work.splice(0);sessions.splice(0);sourceRecords.splice(0);links.splice(0);
 for(const key of Object.keys(repositories))delete repositories[key];
 for(const key of Object.keys(toolProjects))delete toolProjects[key];
 let memory={version:1,workstreams:[],links:[],snapshots:{},dismissedLinks:[],reviewedFolders:[],lastImportSessionIds:[]};
 if(window.tangled?.loadMemory){try{memory=await window.tangled.loadMemory();}catch{}}
 curatedMemory=memory;
 buildFromMemory(result,memory);
 applyStoredLinks(memory);
 placeWorkGrid();
 selected=work[0]?.id||'';expanded=null;
 if(!work.length)throw Error('No readable sessions found. Review the source report or explore sample data.');
 const colocations=window.TangledAttention?.colocate(realSessions)||[];
 // Soft-merge hint: if colocated sessions sit in different provisional workstreams, surface Needs you together in signal via attentionWhy already.
 for(const group of colocations.filter(c=>c.kind==='branch')){
  const memberSessions=sessions.filter(s=>group.sessionIds.includes(s.id));
  const workIds=[...new Set(memberSessions.map(s=>s.work))];
  if(workIds.length>1){
   for(const id of workIds){
    const w=work.find(x=>x.id===id);if(!w)continue;
    w.attentionWhy=(w.attentionWhy?w.attentionWhy+' · ':'')+'Related across folders: '+group.reason;
    if(!w.attentionOverride&&w.state==='Paused'){w.suggestedAttention=w.suggestedAttention||'Needs you';}
   }
  }
 }
 render();document.querySelector('.sample').textContent='LOCAL HISTORY · NOT LIVE STATUS';document.querySelector('.rail footer').textContent='Local import. Curated Workstreams persist; folders stay as evidence.';
 const needs=work.filter(w=>w.state==='Needs you').length;
 document.getElementById('signal').textContent=(needs?needs+' need you · ':'')+result.sessions.length+' imported sessions · '+work.length+' workstreams'+(work.some(w=>w.provisional)?' (some provisional)':'');
 await persistMemory();
 if(shouldPromptReview(result,memory))openReviewGroupings(result);
}

function bindGuidanceToBrief(workId,parsed,sessionIds){
 const w=work.find(x=>x.id===workId);if(!w||!parsed)return;
 w.snapshot={
  standing:parsed.standing,
  attention:parsed.attention,
  attentionWhy:parsed.attentionWhy||parsed.attention,
  attentionState:parsed.attentionState||null,
  next:parsed.next,
  nextSteps:parsed.nextSteps||[parsed.next],
  sessionIds:sessionIds||[],
  relatedSessionIds:parsed.relatedSessionIds||[],
  generatedAt:new Date().toISOString(),
  status:'pending'
 };
 // Surface in inspector immediately as Generated · not live; do not auto-apply Attention.
 if(parsed.attentionState)w.suggestedAttention=parsed.attentionState;
 if(parsed.attentionWhy||parsed.attention)w.attentionWhy=parsed.attentionWhy||parsed.attention;
 if(parsed.nextSteps?.length){/* keep pending until Accept */}
 // Co-locate related session IDs into this workstream suggestion note only (no auto-move).
 if(parsed.relatedSessionIds?.length){
  const orphans=parsed.relatedSessionIds.filter(id=>sessions.some(s=>s.id===id&&s.work!==workId));
  if(orphans.length)w.attentionWhy=(w.attentionWhy||'')+' · AI also tied '+orphans.length+' related session(s) elsewhere — review groupings to merge';
 }
 persistMemory();render();
}

function applySuggestedRelationships(text){
 const suggested=window.TangledAttention?.parseRelationships(text,work)||[];
 let added=0;
 for(const edge of suggested){
  if((curatedMemory.dismissedLinks||[]).includes(linkKey(edge)))continue;
  if(links.some(l=>linkKey(l)===linkKey(edge)))continue;
  links.push({...edge,kind:'suggested',label:'Suggested'});
  added++;
 }
 if(added)persistMemory();
 return added;
}

const generate=document.createElement('button');generate.textContent='Generate guidance for selected workstream';generate.className='primary';
const guidance=document.createElement('details');guidance.className='generated-guidance';guidance.open=false;
const guidanceSummary=document.createElement('summary');guidanceSummary.textContent='Workstream guidance';guidance.append(guidanceSummary,generate);
const guidanceText=document.createElement('p');guidanceText.style.whiteSpace='pre-wrap';guidance.append(guidanceText);document.querySelector('main').append(guidance);
guidance.addEventListener('toggle',()=>requestAnimationFrame(fitMap));
const generateAll=document.createElement('button');generateAll.textContent='Generate across all workstreams';generate.after(generateAll);
const scopeNote=document.createElement('p');scopeNote.className='source';scopeNote.textContent='Guidance binds into the Switch Brief as a Context Snapshot (Accept / Edit / Discard). Overview relationships become Suggested edges — never auto-confirmed.';generateAll.after(scopeNote);
const reviewBtn=document.createElement('button');reviewBtn.textContent='Review groupings';reviewBtn.onclick=()=>{if(!realSessions.length){guidanceText.textContent='Import local sessions first.';guidance.open=true;return;}openReviewGroupings({sessions:realSessions});};generateAll.after(reviewBtn);

generateAll.onclick=async()=>{
 guidance.open=true;
 if(!window.tangled?.overview||!realSessions.length){guidanceText.textContent='Import local sessions in the desktop app first. Restart Electron if the overview adapter is unavailable.';return;}
 generateAll.disabled=true;generate.disabled=true;guidanceText.textContent='Connecting the dots across imported workstreams…';
 try{
  const result=await window.tangled.overview();
  guidanceText.replaceChildren();
  const title=document.createElement('strong');title.textContent='Across all workstreams · '+result.included+' of '+result.total+' sessions'+(result.limited?' · partial coverage':'');guidanceText.append(title);
  const brief=window.TangledAttention?.parseGuidance(result.text);
  if(brief){
   for(const [key,label] of [['standing','Overall picture'],['relationships','Cross-workstream connections'],['attention','Needs your attention'],['next','Highest-value next move']]){
    const value=key==='relationships'?(typeof brief.raw?.relationships==='string'?brief.raw.relationships:JSON.stringify(brief.raw?.relationships||[],null,0)):brief[key];
    if(typeof value!=='string'&&key!=='relationships')continue;
    const row=document.createElement('span');row.className='guidance-row';const heading=document.createElement('b');heading.textContent=label;const body=document.createElement('span');body.textContent=typeof value==='string'?value:JSON.stringify(brief.raw?.relationships||[]);row.append(heading,body);guidanceText.append(row);
   }
   // Overview stays cross-cutting: relationships become Suggested edges; do not overwrite a Workstream Context Snapshot.
   if(brief.attention){
    const needy=work.filter(w=>w.state==='Needs you'||w.suggestedAttention==='Needs you');
    for(const w of (needy.length?needy:work.slice(0,1))){
     if(!w.attentionWhy||w.attentionWhy.includes('Imported'))w.attentionWhy=brief.attentionWhy||brief.attention;
    }
   }
   const added=applySuggestedRelationships(result.text);
   const note=document.createElement('span');note.className='guidance-row';note.textContent=added?('Added '+added+' Suggested constellation edge(s). Confirm or dismiss in the inspector.'):'No new grounded Suggested edges (endpoints must match known Workstreams).';guidanceText.append(note);
  }else{
   const row=document.createElement('span');row.className='guidance-row';row.textContent=result.text;guidanceText.append(row);
   applySuggestedRelationships(result.text);
  }
  render();
 }catch(e){guidanceText.textContent=e.message;}
 finally{generateAll.disabled=false;generate.disabled=false;}
};

generate.onclick=async()=>{
 if(!window.tangled||!realSessions.length){guidanceText.textContent='Import local sessions in the Electron app first.';guidance.open=true;return;}
 const requestedWork=selected;generate.disabled=true;guidance.open=true;guidanceText.textContent='Reconstructing your next move…';
 try{
  const ids=sessions.filter(s=>s.work===requestedWork).slice(0,20).map(s=>s.id);
  // Prefer evidence-rich sessions; include colocated relatives from other folders when titles/branches overlap.
  const colocated=(window.TangledAttention?.colocate(realSessions)||[]).filter(g=>g.sessionIds.some(id=>ids.includes(id)));
  const extra=colocated.flatMap(g=>g.sessionIds).filter(id=>!ids.includes(id)).slice(0,8);
  const output=await window.tangled.guidance([...ids,...extra].slice(0,20));
  guidanceText.replaceChildren();
  const brief=window.TangledAttention?.parseGuidance(output);
  const title=document.createElement('strong');title.textContent='Brief for '+(plainTitle(work.find(w=>w.id===requestedWork)?.title)||'selected workstream');guidanceText.append(title);
  if(brief){
   for(const [key,label] of [['standing','Where things stand'],['attention','Needs your attention'],['next','Next move']]){
    const row=document.createElement('span');row.className='guidance-row';const heading=document.createElement('b');heading.textContent=label;const body=document.createElement('span');body.textContent=brief[key];row.append(heading,body);guidanceText.append(row);
   }
   if(brief.attentionWhy){const row=document.createElement('span');row.className='guidance-row';const heading=document.createElement('b');heading.textContent='Why';const body=document.createElement('span');body.textContent=brief.attentionWhy;row.append(heading,body);guidanceText.append(row);}
   if(brief.nextSteps?.length){const row=document.createElement('span');row.className='guidance-row';const heading=document.createElement('b');heading.textContent='Clear next steps';const body=document.createElement('span');body.textContent=brief.nextSteps.join(' · ');row.append(heading,body);guidanceText.append(row);}
   const bindNote=document.createElement('span');bindNote.className='guidance-row';bindNote.textContent='Bound into Switch Brief as Generated · not live. Accept, Edit, or Discard there — nothing applies until you accept.';guidanceText.append(bindNote);
   bindGuidanceToBrief(requestedWork,brief,[...ids,...extra].slice(0,20));
  }else{
   const fallback=document.createElement('span');fallback.className='guidance-row';fallback.textContent=output;guidanceText.append(fallback);
  }
 }catch(e){guidanceText.textContent=e.message;}
 finally{generate.disabled=false;}
};

document.getElementById('setup-form').onsubmit=async event=>{event.preventDefault();if(!window.tangled){report.textContent='Local file access is available in the Electron app. Run npm start. The browser preview supports sample data only.';return;}const tools=[...document.querySelectorAll('input[name=harness]:checked')].map(n=>n.value);if(!tools.length){report.textContent='Choose at least one session source.';return;}const submit=event.submitter;submit.disabled=true;report.textContent='Reading selected local session histories…';try{await window.tangled.save({tools,provider:document.getElementById('provider').value,model:document.getElementById('ai-model').value,key:document.getElementById('api-key').value});document.getElementById('api-key').value='';const result=await window.tangled.scan(tools);report.textContent=result.reports.map(r=>r.tool+': '+r.status).join('\n');await useLocalData(result);showWorkspace();}catch(e){report.textContent+='\n'+e.message;}finally{submit.disabled=false;}};
showSetup();
if(window.tangled)window.tangled.status().then(async config=>{document.getElementById('provider').value=config.provider;document.getElementById('ai-model').value=config.model;if(config.hasKey)document.getElementById('api-key').placeholder='Saved key retained unless replaced';if(config.configured){document.querySelectorAll('input[name=harness]').forEach(n=>n.checked=config.tools.includes(n.value));try{const result=await window.tangled.scan(config.tools);await useLocalData(result);showWorkspace();}catch(e){report.textContent=e.message;}}}).catch(e=>{report.textContent=e.message;});
