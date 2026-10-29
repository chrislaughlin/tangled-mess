// Pure Workstream membership + guidance restore helpers (Node + renderer).
(function(root){
 function folderKey(row){return row.cwd||row.source?.split('/agent-transcripts/')[0]||'Unassigned';}

 function folderDerivedId(directory){
  const base='local-'+String(directory||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(-56);
  return base||'local-unassigned';
 }

 function uniqueId(preferred,usedIds){
  if(!usedIds.has(preferred))return preferred;
  let n=2;while(usedIds.has(preferred+'-'+n))n++;
  return preferred+'-'+n;
 }

 function plainTitle(value){return String(value||'').replace(/<[^>]+>/g,'');}

 /**
  * Plan Workstreams for an import without mutating UI state.
  * - Restores every saved Workstream (even when no members are in the current scan).
  * - Attaches leftover sessions in a known folder to that existing Workstream.
  * - Never reuses an already-claimed id for a new grouping.
  */
 function planImport(sessions,memory){
  const rows=Array.isArray(sessions)?sessions:[];
  const byId=new Map(rows.map(s=>[s.id,s]));
  const assigned=new Set();
  const usedIds=new Set();
  const planned=[];

  for(const ws of memory?.workstreams||[]){
   const id=ws.id||folderDerivedId((ws.folderHints||[])[0]||'workstream-'+planned.length);
   usedIds.add(id);
   const present=(ws.sessionIds||[]).map(sid=>byId.get(sid)).filter(Boolean);
   present.forEach(s=>assigned.add(s.id));
   planned.push({
    id,
    title:plainTitle(ws.title)||'Workstream',
    objective:ws.objective||'',
    provisional:!!ws.provisional,
    folderHints:[...(ws.folderHints||[])],
    attentionState:ws.attentionState||'Paused',
    attentionOverride:!!ws.attentionOverride,
    lastFocusedAt:ws.lastFocusedAt||null,
    acceptedNextMove:ws.acceptedNextMove||null,
    attentionWhy:ws.attentionWhy||null,
    suggestedAttention:ws.suggestedAttention||null,
    retainedSessionIds:[...(ws.sessionIds||[])],
    presentSessions:present,
    fromMemory:true,
    absentFromScan:present.length===0,
    snapshot:(memory.snapshots&&memory.snapshots[id])||null
   });
  }

  const leftovers=rows.filter(s=>!assigned.has(s.id));
  const groups=new Map();
  for(const row of leftovers){
   const directory=folderKey(row);
   if(!groups.has(directory))groups.set(directory,[]);
   groups.get(directory).push(row);
  }

  for(const [directory,groupRows] of groups){
   const existing=planned.find(p=>(p.folderHints||[]).includes(directory));
   if(existing){
    existing.presentSessions=existing.presentSessions.concat(groupRows);
    existing.retainedSessionIds=[...new Set([...(existing.retainedSessionIds||[]),...groupRows.map(r=>r.id)])];
    existing.absentFromScan=false;
    if(!(existing.folderHints||[]).includes(directory))existing.folderHints=[...(existing.folderHints||[]),directory];
    continue;
   }
   const preferred=folderDerivedId(directory);
   const id=uniqueId(preferred,usedIds);
   usedIds.add(id);
   const name=directory.split('/').filter(Boolean).pop()||'Unassigned sessions';
   planned.push({
    id,
    title:name,
    objective:'Provisional folder grouping; confirm the shared objective.',
    provisional:true,
    folderHints:[directory],
    attentionState:'Paused',
    attentionOverride:false,
    lastFocusedAt:null,
    acceptedNextMove:null,
    attentionWhy:null,
    suggestedAttention:null,
    retainedSessionIds:groupRows.map(r=>r.id),
    presentSessions:groupRows,
    fromMemory:false,
    absentFromScan:false,
    snapshot:null
   });
  }

  return planned;
 }

 /**
  * Merge a bounded import observation into durable curated memory.
  * Absence from the current scan does not delete membership, snapshots, or links.
  */
 function mergeDurableMemory(previous,observation){
  const prev=previous&&typeof previous==='object'?previous:{workstreams:[],links:[],snapshots:{},dismissedLinks:[],reviewedFolders:[],lastImportSessionIds:[]};
  const obs=observation&&typeof observation==='object'?observation:{workstreams:[],links:[],snapshots:{},dismissedLinks:[],reviewedFolders:[],lastImportSessionIds:[]};
  const prevById=new Map((prev.workstreams||[]).map(w=>[w.id,w]));
  const obsIds=new Set((obs.workstreams||[]).map(w=>w.id));
  const claimedNow=new Map();
  for(const w of obs.workstreams||[]){
   for(const sid of w.sessionIds||[])claimedNow.set(sid,w.id);
  }

  const mergedWorkstreams=[];
  for(const cur of obs.workstreams||[]){
   const older=prevById.get(cur.id);
   const retained=(older?.sessionIds||[]).filter(id=>!claimedNow.has(id)||claimedNow.get(id)===cur.id);
   const sessionIds=[...new Set([...retained,...(cur.sessionIds||[])])];
   const folderHints=[...new Set([...(older?.folderHints||[]),...(cur.folderHints||[])])];
   mergedWorkstreams.push({...older,...cur,sessionIds,folderHints});
  }
  for(const older of prev.workstreams||[]){
   if(obsIds.has(older.id))continue;
   const sessionIds=(older.sessionIds||[]).filter(id=>!claimedNow.has(id));
   mergedWorkstreams.push({...older,sessionIds});
  }

  const linkKey=l=>(l.from||'')+'→'+(l.to||'');
  const linksByKey=new Map();
  for(const l of prev.links||[])linksByKey.set(linkKey(l),l);
  for(const l of obs.links||[])linksByKey.set(linkKey(l),l);
  const dismissed=new Set([...(prev.dismissedLinks||[]),...(obs.dismissedLinks||[])]);
  const links=[...linksByKey.values()].filter(l=>!dismissed.has(linkKey(l)));

  const snapshots={...(prev.snapshots||{}),...(obs.snapshots||{})};
  // Drop snapshots only when their Workstream was explicitly removed from both sides — keep for retained WSes.
  const alive=new Set(mergedWorkstreams.map(w=>w.id));
  for(const id of Object.keys(snapshots)){if(!alive.has(id))delete snapshots[id];}

  return {
   version:1,
   workstreams:mergedWorkstreams,
   links,
   snapshots,
   dismissedLinks:[...dismissed],
   reviewedFolders:[...new Set([...(prev.reviewedFolders||[]),...(obs.reviewedFolders||[])])],
   lastImportSessionIds:Array.isArray(obs.lastImportSessionIds)?obs.lastImportSessionIds:(prev.lastImportSessionIds||[])
  };
 }

 /** Copy accepted Context Snapshot fields onto a live Workstream item. */
 function applyAcceptedSnapshot(item,snapshot){
  if(!item)return item;
  const snap=snapshot||item.snapshot;
  if(!snap||snap.status!=='accepted'){
   item.acceptedGuidance=false;
   return item;
  }
  item.snapshot=snap;
  item.acceptedGuidance=true;
  if(snap.standing)item.brief=snap.standing;
  if(snap.next){item.next=snap.next;item.acceptedNextMove=snap.next;}
  if(Array.isArray(snap.nextSteps)&&snap.nextSteps.length)item.nextSteps=snap.nextSteps.slice();
  else if(snap.next)item.nextSteps=[snap.next];
  if(snap.attentionWhy)item.attentionWhy=snap.attentionWhy;
  if(snap.attentionState&&!item.attentionOverride){
   item.state=snap.attentionState;
   item.suggestedAttention=snap.attentionState;
  }
  return item;
 }

 /**
  * Apply heuristic enrichment without clobbering accepted Context Snapshot fields
  * or developer attention overrides.
  */
 function enrichFields(item,heuristic){
  const h=heuristic||{};
  if(h.suggested)item.suggestedAttention=h.suggested;
  if(!item.attentionOverride&&!item.acceptedGuidance&&h.suggested)item.state=h.suggested;
  if(Array.isArray(h.changes))item.changes=h.changes;
  if(item.acceptedGuidance){
   // Keep standing / next / attentionWhy from accepted snapshot; fill gaps only.
   if(!item.attentionWhy&&h.why)item.attentionWhy=h.why;
   if(!item.next&&h.next)item.next=h.next;
   if((!item.nextSteps||!item.nextSteps.length)&&h.nextSteps)item.nextSteps=h.nextSteps;
   if(!item.brief&&h.brief)item.brief=h.brief;
   return item;
  }
  if(h.why)item.attentionWhy=h.why;
  if(h.nextSteps)item.nextSteps=h.nextSteps;
  if(h.next)item.next=h.next;
  else if(h.nextSteps?.[0])item.next=h.nextSteps[0];
  if(h.brief!=null)item.brief=h.brief;
  else if(!item.brief||item.provisional){
   const count=h.sessionCount||0;
   item.brief=(h.why||'Imported')+' · '+count+' local session'+(count===1?'':'s')+' in this Workstream.';
  }
  return item;
 }

 const api={folderKey,folderDerivedId,uniqueId,plainTitle,planImport,mergeDurableMemory,applyAcceptedSnapshot,enrichFields};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.TangledWorkstreamMemory=api;
})(typeof window!=='undefined'?window:globalThis);
