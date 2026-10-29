// Local attention heuristics for imported sessions. No network. Developer override always wins.
(function(global){
 const NEEDS_PATTERNS=/\b(waiting for (you|your|me)|needs? (your|a) (decision|input|review|approval)|what (should|do) (you|i)|please (confirm|decide|review|approve)|can you (confirm|decide|review))\b|\?\s*$/im;
 const WAITING_PATTERNS=/\b(done|completed|ready for review|pr is ready|opened (a )?pr|merge(d)?|waiting on (ci|review|checks|maya|approver))\b/i;
 const RISK_DAYS=7;

 function lastRoles(excerpt){
  const lines=String(excerpt||'').split(/\n+/).map(l=>l.trim()).filter(Boolean);
  const roles=[];
  for(const line of lines){
   const m=line.match(/^(user|assistant)\s*:\s*([\s\S]*)$/i);
   if(m)roles.push({role:m[1].toLowerCase(),text:m[2].trim()});
  }
  return roles;
 }

 function analyzeSession(session){
  const roles=lastRoles(session.excerpt);
  const lastUser=[...roles].reverse().find(r=>r.role==='user');
  const lastAssistant=[...roles].reverse().find(r=>r.role==='assistant');
  const last=roles.at(-1);
  const why=[];
  let state=null;
  if(lastUser&&(NEEDS_PATTERNS.test(lastUser.text)||/\?\s*$/.test(lastUser.text))){
   state='Needs you';
   why.push('Recent user message asks a question or requests a decision'+(session.title?`: “${session.title.slice(0,80)}”`:''));
  }else if(last&&last.role==='assistant'&&WAITING_PATTERNS.test(last.text)&&!(lastUser&&roles.indexOf(lastUser)>roles.indexOf(last))){
   state='Waiting';
   why.push('Assistant reported completion or review-ready without a later user acknowledgement');
  }else if(lastAssistant&&WAITING_PATTERNS.test(lastAssistant.text)&&(!lastUser||roles.indexOf(lastAssistant)>roles.indexOf(lastUser))){
   state='Waiting';
   why.push('Latest assistant outcome looks complete / waiting on review');
  }
  const updated=Date.parse(session.updated||'');
  const stale=Number.isFinite(updated)&&(Date.now()-updated)>RISK_DAYS*86400000;
  if(stale)why.push(`Last update older than ${RISK_DAYS} days`);
  return {
   sessionId:session.id,
   state,
   atRisk:stale&&state!=='Needs you',
   why:why.join(' · ')||'No strong local signal',
   evidence:why,
   title:session.title,
   tool:session.tool,
   cwd:session.cwd,
   updated:session.updated,
   branch:session.branch||null
  };
 }

 function tokenize(text){
  return String(text||'').toLowerCase().split(/[^a-z0-9/+._-]+/).filter(t=>t.length>3&&!['untitled','session','please','would','could','should','about','these','those','with','from','that','this','have','been'].includes(t));
 }

 function colocate(sessions){
  const byBranch=new Map();
  const byToken=new Map();
  const groups=[];
  for(const s of sessions){
   const branch=(s.branch||'').trim();
   if(branch){if(!byBranch.has(branch))byBranch.set(branch,[]);byBranch.get(branch).push(s.id);}
   for(const token of new Set(tokenize(s.title).slice(0,8))){
    if(!byToken.has(token))byToken.set(token,[]);
    byToken.get(token).push(s.id);
   }
  }
  for(const [branch,ids] of byBranch){
   const unique=[...new Set(ids)];
   if(unique.length>1)groups.push({reason:'Shared branch '+branch,sessionIds:unique,kind:'branch'});
  }
  for(const [token,ids] of byToken){
   const unique=[...new Set(ids)];
   if(unique.length>1&&unique.length<=6)groups.push({reason:'Overlapping topic “'+token+'”',sessionIds:unique,kind:'topic'});
  }
  // Prefer stronger branch colocations; dedupe overlapping topic noise.
  const seen=new Set();
  return groups.filter(g=>{
   const key=g.sessionIds.slice().sort().join('|');
   if(seen.has(key))return false;
   seen.add(key);return true;
  }).slice(0,12);
 }

 function analyzeWorkstream(sessions){
  const analyses=sessions.map(analyzeSession);
  const needs=analyses.filter(a=>a.state==='Needs you');
  const waiting=analyses.filter(a=>a.state==='Waiting');
  const atRisk=analyses.filter(a=>a.atRisk);
  let suggested='Paused';
  let why='Imported · no strong attention signal yet';
  let nextSteps=[];
  if(needs.length){
   suggested='Needs you';
   why=needs[0].why+(needs.length>1?` · +${needs.length-1} more session(s)`:'');
   nextSteps=needs.slice(0,3).map(a=>`Open “${(a.title||'session').slice(0,60)}” (${a.tool}) and answer the open question`);
  }else if(waiting.length){
   suggested='Waiting';
   why=waiting[0].why;
   nextSteps=waiting.slice(0,2).map(a=>`Verify outcome in “${(a.title||'session').slice(0,60)}” then mark Done or resume`);
  }else if(atRisk.length){
   suggested='Paused';
   why=atRisk[0].why+' · consider At risk';
   nextSteps=[`Skim oldest stale session “${(atRisk[0].title||'').slice(0,60)}” and decide keep / park / Done`];
  }else if(sessions.length){
   nextSteps=[`Inspect newest session “${(sessions[0].title||'').slice(0,60)}” and confirm the shared objective`];
  }
  const changesSince=(checkpoint)=>{
   const stamp=Date.parse(checkpoint||'');
   if(!Number.isFinite(stamp))return sessions.slice(0,5).map(s=>[s.title||'Untitled',`${s.tool} · ${s.updated||'unknown'}`]);
   return sessions.filter(s=>Date.parse(s.updated||'')>stamp).slice(0,8).map(s=>{
    const excerpt=(s.excerpt||'').split('\n').filter(Boolean).at(-1)||'';
    return [s.title||'Untitled',`${s.tool} · ${s.updated}${excerpt?` · ${excerpt.replace(/^(user|assistant):\s*/i,'').slice(0,90)}`:''}`];
   });
  };
  return {suggested,why,nextSteps,analyses,needsCount:needs.length,waitingCount:waiting.length,atRiskCount:atRisk.length,changesSince};
 }

 function parseRelationships(text,workstreams){
  const known=workstreams.map(w=>({id:w.id,title:String(w.title||'').replace(/<[^>]+>/g,''),tokens:tokenize(w.title)}));
  const matchEndpoint=raw=>{
   const clean=String(raw||'').replace(/[`"']/g,'').trim();
   if(!clean)return null;
   const byId=known.find(k=>k.id===clean||clean.includes(k.id));
   if(byId)return byId.id;
   const lower=clean.toLowerCase();
   const byTitle=known.find(k=>k.title&&(lower===k.title.toLowerCase()||lower.includes(k.title.toLowerCase())||k.title.toLowerCase().includes(lower)));
   if(byTitle)return byTitle.id;
   let best=null,score=0;
   for(const k of known){
    const hit=k.tokens.filter(t=>lower.includes(t)).length;
    if(hit>score){score=hit;best=k;}
   }
   return score>=1?best.id:null;
  };
  const out=[];
  let parsed=null;
  try{parsed=JSON.parse(String(text).replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,''));}catch{}
  const rows=Array.isArray(parsed?.relationships)?parsed.relationships:null;
  if(rows){
   for(const row of rows){
    const from=matchEndpoint(row.from||row.source||row.a);
    const to=matchEndpoint(row.to||row.target||row.b);
    if(!from||!to||from===to)continue;
    out.push({from,to,kind:'suggested',label:row.kind||row.relation||'blocks',confidence:row.confidence||row.label||'Possible',evidence:String(row.evidence||row.why||'').slice(0,240)});
   }
   return out.slice(0,8);
  }
  const prose=typeof parsed?.relationships==='string'?parsed.relationships:String(text||'');
  if(/no supported cross-workstream/i.test(prose))return [];
  for(const chunk of prose.split(/[;\n]+/)){
   const labelled=chunk.match(/\b(Observed|Possible)\b[:\s-]*(.*)/i);
   const body=labelled?labelled[2]:chunk;
   const conf=labelled?labelled[1]:'Possible';
   const arrow=body.match(/(.+?)\s+(?:blocks|blocked by|enables|depends on|→|->)\s+(.+?)(?:\(|$)/i);
   if(!arrow)continue;
   const from=matchEndpoint(arrow[1]),to=matchEndpoint(arrow[2]);
   if(!from||!to||from===to)continue;
   out.push({from,to,kind:'suggested',label:/enables/i.test(body)?'enables':'blocks',confidence:conf,evidence:body.trim().slice(0,240)});
  }
  return out.slice(0,8);
 }

 function parseGuidance(text){
  let brief=null;
  try{brief=JSON.parse(String(text).replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,''));}catch{return null;}
  if(!brief||typeof brief!=='object')return null;
  if(!['standing','attention','next'].every(k=>typeof brief[k]==='string'))return null;
  return {
   standing:brief.standing,
   attention:brief.attention,
   next:brief.next,
   attentionState:typeof brief.attentionState==='string'?brief.attentionState:null,
   attentionWhy:typeof brief.attentionWhy==='string'?brief.attentionWhy:brief.attention,
   relatedSessionIds:Array.isArray(brief.relatedSessionIds)?brief.relatedSessionIds.map(String):[],
   nextSteps:Array.isArray(brief.nextSteps)?brief.nextSteps.map(String).slice(0,5):(brief.next?[brief.next]:[]),
   relationships:brief.relationships,
   raw:brief
  };
 }

 global.TangledAttention={analyzeSession,analyzeWorkstream,colocate,parseRelationships,parseGuidance,tokenize};
})(typeof window!=='undefined'?window:globalThis);
