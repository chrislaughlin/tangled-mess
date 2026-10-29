#!/usr/bin/env node
/** Local smoke checks for P0 attention + workstream memory helpers (no Electron). */
const path=require('node:path');
const fs=require('node:fs');
const vm=require('node:vm');
const assert=(cond,msg)=>{if(!cond)throw Error(msg);};

const attentionSrc=fs.readFileSync(path.join(__dirname,'attention.js'),'utf8');
const sandbox={window:{},globalThis:{}};
vm.createContext(sandbox);
vm.runInContext(attentionSrc,sandbox);
const A=sandbox.window.TangledAttention;
assert(A,'TangledAttention missing');

const needs=A.analyzeSession({id:'Codex:1',tool:'Codex',title:'Fallback policy?',excerpt:'user: Should we keep the v1 fallback?\n\nassistant: Ready when you decide.',updated:new Date().toISOString()});
assert(needs.state==='Needs you', 'expected Needs you, got '+needs.state);
assert(/question|decision/i.test(needs.why),'expected why evidence');

const waiting=A.analyzeSession({id:'Cursor:2',tool:'Cursor',title:'Adapter done',excerpt:'user: implement adapter\n\nassistant: Done — PR is ready for review.',updated:new Date().toISOString()});
assert(waiting.state==='Waiting','expected Waiting, got '+waiting.state);

const ws=A.analyzeWorkstream([
 {id:'Codex:1',tool:'Codex',title:'Fallback policy?',excerpt:'user: Can you confirm the fallback?\n\nassistant: Waiting on you.',updated:new Date().toISOString()},
 {id:'Cursor:2',tool:'Cursor',title:'UI copy',excerpt:'user: tweak copy\n\nassistant: updated strings',updated:new Date(Date.now()-10*86400000).toISOString()}
]);
assert(ws.suggested==='Needs you','workstream should need you');
assert(ws.nextSteps.length>=1,'expected concrete next steps');
const changes=ws.changesSince(new Date(Date.now()-86400000).toISOString());
assert(Array.isArray(changes),'changesSince should return rows');

const coloc=A.colocate([
 {id:'a',title:'Implement idempotency adapter',branch:'feat/idempotency'},
 {id:'b',title:'Review rollback safety',branch:'feat/idempotency'},
 {id:'c',title:'Unrelated search notes',branch:'experiment/indexing'}
]);
assert(coloc.some(g=>g.kind==='branch'&&g.sessionIds.includes('a')&&g.sessionIds.includes('b')),'branch colocation missing');

const work=[{id:'checkout',title:'Checkout reliability'},{id:'mobile',title:'Mobile checkout'},{id:'schema',title:'Payment schema'}];
const edges=A.parseRelationships(JSON.stringify({
 standing:'ok',attention:'x',next:'y',
 relationships:[
  {from:'checkout',to:'mobile',kind:'blocks',confidence:'Observed',evidence:'Mobile waits on fallback'},
  {from:'unknown-a',to:'unknown-b',kind:'blocks',confidence:'Possible',evidence:'noise'}
 ]
}),work);
assert(edges.length===1&&edges[0].from==='checkout'&&edges[0].to==='mobile','grounded suggested edge failed');

const proseEdges=A.parseRelationships(JSON.stringify({standing:'s',attention:'a',next:'n',relationships:'Observed: Payment schema blocks Checkout reliability (schema approved).'}),work);
assert(proseEdges.some(e=>e.from==='schema'&&e.to==='checkout'),'prose relationship parse failed: '+JSON.stringify(proseEdges));

const guidance=A.parseGuidance('```json\n{"standing":"Adapter ready","attention":"Fallback decision","next":"Decide fallback","attentionState":"Needs you","attentionWhy":"User asked about fallback","nextSteps":["Open Codex session","Decide fallback"],"relatedSessionIds":["Codex:1"]}\n```');
assert(guidance&&guidance.attentionState==='Needs you'&&guidance.nextSteps.length===2,'guidance parse failed');

const WM=require('./workstream-memory.js');
const {loadMemory,saveMemory}=require('./memory.cjs');

// --- Review P1: new sessions in a previously imported folder must not duplicate IDs ---
{
 const folder='/Users/dev/acme/payments-api';
 const id=WM.folderDerivedId(folder);
 const memory={
  workstreams:[{id,title:'payments-api',sessionIds:['Codex:old'],folderHints:[folder],provisional:true,attentionState:'Paused'}],
  snapshots:{},links:[],dismissedLinks:[],reviewedFolders:[],lastImportSessionIds:['Codex:old']
 };
 const sessions=[
  {id:'Codex:old',cwd:folder,title:'Old session',tool:'Codex',updated:'2026-01-01T00:00:00.000Z'},
  {id:'Codex:new',cwd:folder,title:'Brand new in same folder',tool:'Codex',updated:'2026-10-01T00:00:00.000Z'}
 ];
 const planned=WM.planImport(sessions,memory);
 assert(planned.length===1,'P1: expected single workstream, got '+planned.length+' ids='+planned.map(p=>p.id));
 assert(planned[0].id===id,'P1: should reuse existing folder workstream id');
 assert(planned[0].presentSessions.map(s=>s.id).sort().join()==='Codex:new,Codex:old','P1: both sessions should attach');
 assert(new Set(planned.map(p=>p.id)).size===planned.length,'P1: duplicate ids present');
}

// --- Review P1b: if folder id is claimed by a different folderHint set, allocate distinct id ---
{
 const folderA='/repo/a',folderB='/repo/b';
 const claimed=WM.folderDerivedId(folderB); // collide artificially
 const memory={
  workstreams:[{id:claimed,title:'Other',sessionIds:['X:1'],folderHints:[folderA],provisional:true}],
  snapshots:{},links:[]
 };
 const planned=WM.planImport([{id:'Y:1',cwd:folderB,title:'New',tool:'Codex'}],memory);
 assert(planned.length===2,'P1b: expected two workstreams');
 assert(planned.filter(p=>p.id===claimed).length===1,'P1b: original id kept once');
 assert(planned.some(p=>p.id!==claimed&&p.presentSessions.some(s=>s.id==='Y:1')),'P1b: new grouping needs distinct id');
 assert(new Set(planned.map(p=>p.id)).size===2,'P1b: ids must be unique');
}

// --- Review P2: membership outside scan window survives merge ---
{
 const previous={
  workstreams:[
   {id:'ws-keep',title:'Keep me',sessionIds:['Codex:visible','Codex:aged-out'],folderHints:['/repo'],provisional:false,attentionState:'Needs you',acceptedNextMove:'Decide fallback'},
   {id:'ws-dormant',title:'All aged out',sessionIds:['Cursor:old'],folderHints:['/other'],provisional:false,attentionState:'Paused'}
  ],
  snapshots:{'ws-keep':{status:'accepted',standing:'Standing text',next:'Decide fallback'},'ws-dormant':{status:'pending',standing:'x'}},
  links:[{from:'ws-keep',to:'ws-dormant',kind:'blocks'}],
  dismissedLinks:[],
  reviewedFolders:['/repo'],
  lastImportSessionIds:['Codex:visible','Codex:aged-out','Cursor:old']
 };
 const observation={
  workstreams:[{id:'ws-keep',title:'Keep me',sessionIds:['Codex:visible'],folderHints:['/repo'],provisional:false,attentionState:'Needs you',acceptedNextMove:'Decide fallback'}],
  snapshots:{'ws-keep':{status:'accepted',standing:'Standing text',next:'Decide fallback'}},
  links:[{from:'ws-keep',to:'ws-dormant',kind:'blocks'}],
  dismissedLinks:[],
  reviewedFolders:['/repo'],
  lastImportSessionIds:['Codex:visible']
 };
 const merged=WM.mergeDurableMemory(previous,observation);
 const keep=merged.workstreams.find(w=>w.id==='ws-keep');
 const dormant=merged.workstreams.find(w=>w.id==='ws-dormant');
 assert(keep,'P2: ws-keep missing');
 assert(keep.sessionIds.includes('Codex:aged-out')&&keep.sessionIds.includes('Codex:visible'),'P2: aged-out member dropped: '+keep.sessionIds);
 assert(dormant,'P2: dormant workstream deleted');
 assert(dormant.sessionIds.includes('Cursor:old'),'P2: dormant membership lost');
 assert(merged.snapshots['ws-keep']?.status==='accepted','P2: accepted snapshot lost');
 assert(merged.snapshots['ws-dormant'],'P2: dormant snapshot lost');
 assert(merged.links.some(l=>l.from==='ws-keep'&&l.to==='ws-dormant'),'P2: link dropped');
}

// --- Review P2 planImport: restore workstream with zero present members ---
{
 const memory={workstreams:[{id:'ws-gone',title:'Gone',sessionIds:['Missing:1'],folderHints:['/gone'],provisional:false}],snapshots:{'ws-gone':{status:'accepted',standing:'Still true',next:'Parked next'}},links:[]};
 const planned=WM.planImport([{id:'Other:1',cwd:'/fresh',title:'Fresh'}],memory);
 assert(planned.some(p=>p.id==='ws-gone'&&p.absentFromScan),'P2: absent workstream should still be planned');
 assert(planned.some(p=>p.id==='ws-gone'&&p.retainedSessionIds.includes('Missing:1')),'P2: retained ids lost in plan');
}

// --- Review: accepted guidance restore survives enrichment ---
{
 const item={id:'ws-1',brief:'',next:'heuristic will try to overwrite',acceptedNextMove:null,attentionWhy:null,state:'Paused',provisional:false,attentionOverride:false,snapshot:null};
 const snap={status:'accepted',standing:'Adapter is ready',next:'Decide fallback policy',attentionWhy:'User asked about fallback',attentionState:'Needs you',nextSteps:['Open Codex','Decide fallback']};
 WM.applyAcceptedSnapshot(item,snap);
 assert(item.acceptedGuidance&&item.brief==='Adapter is ready','accepted standing not applied');
 assert(item.next==='Decide fallback policy'&&item.acceptedNextMove==='Decide fallback policy','accepted next not applied');
 assert(item.attentionWhy==='User asked about fallback','accepted why not applied');
 assert(item.state==='Needs you','accepted attentionState not applied');
 WM.enrichFields(item,{suggested:'Waiting',why:'Heuristic why',next:'Heuristic next',nextSteps:['Heuristic step'],changes:[['x','y']],sessionCount:2,brief:'Heuristic brief'});
 assert(item.brief==='Adapter is ready','enrich clobbered accepted brief');
 assert(item.next==='Decide fallback policy','enrich clobbered accepted next');
 assert(item.attentionWhy==='User asked about fallback','enrich clobbered accepted why');
 assert(item.state==='Needs you','enrich clobbered accepted state');
 assert(item.nextSteps[0]==='Open Codex','enrich clobbered accepted nextSteps');
}

const tmp=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'tangled-mem-'));
(async()=>{
 const empty=await loadMemory(tmp);
 assert(empty.workstreams.length===0,'empty memory');
 const saved=await saveMemory(tmp,{workstreams:[{id:'ws-1',title:'T',sessionIds:['Codex:1'],attentionState:'Needs you',lastFocusedAt:'2026-01-01T00:00:00.000Z'}],links:[{from:'ws-1',to:'ws-2',kind:'suggested'}],snapshots:{'ws-1':{status:'pending'}},dismissedLinks:[],reviewedFolders:['/tmp/x'],lastImportSessionIds:['Codex:1']});
 assert(saved.workstreams[0].id==='ws-1','save failed');
 const loaded=await loadMemory(tmp);
 assert(loaded.workstreams[0].lastFocusedAt.startsWith('2026'),'reload checkpoint failed');
 assert(loaded.snapshots['ws-1'].status==='pending','snapshot persist failed');

 // Round-trip merge through save: aged-out member retained
 const round=WM.mergeDurableMemory(loaded,{
  workstreams:[{id:'ws-1',title:'T',sessionIds:['Codex:2'],attentionState:'Paused'}],
  snapshots:{'ws-1':{status:'accepted',standing:'S',next:'N'}},
  links:[],dismissedLinks:[],reviewedFolders:[],lastImportSessionIds:['Codex:2']
 });
 assert(round.workstreams[0].sessionIds.includes('Codex:1')&&round.workstreams[0].sessionIds.includes('Codex:2'),'save-merge round trip dropped member');
 await saveMemory(tmp,round);
 const again=await loadMemory(tmp);
 assert(again.workstreams[0].sessionIds.includes('Codex:1'),'persisted merge lost aged-out id');
 assert(again.snapshots['ws-1'].status==='accepted','persisted accepted snapshot lost');

 console.log('smoke-p0: ok');
})().catch(err=>{console.error(err);process.exit(1);});
