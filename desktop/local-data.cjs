const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const readline=require('node:readline');
const {createReadStream}=require('node:fs');
const {execFile}=require('node:child_process');
const {promisify}=require('node:util');
const run=promisify(execFile);
const roots={Codex:path.join(os.homedir(),'.codex/sessions'),Cursor:path.join(os.homedir(),'.cursor/projects'),OpenCode:path.join(os.homedir(),'.local/share/opencode/opencode.db'),Claude:path.join(os.homedir(),'.claude/projects')};
async function files(dir,depth=0){if(depth>10)return [];const entries=await fs.readdir(dir,{withFileTypes:true});let out=[];for(const e of entries){if(e.isSymbolicLink())continue;const p=path.join(dir,e.name);if(e.isDirectory()&&e.name!=='subagents')out.push(...await files(p,depth+1));else if(e.isFile()&&p.endsWith('.jsonl'))out.push(p);}return out;}
function text(value){if(typeof value==='string')return value;if(Array.isArray(value))return value.map(x=>x.text||'').join('\n');return '';}
async function transcript(file,tool){
 let id=path.basename(file,'.jsonl'),cwd='',first='';const recent=[];
 const handle=await fs.open(file,'r');let stat,head,tail;
 try{stat=await handle.stat();head=Buffer.alloc(Math.min(stat.size,65536));await handle.read(head,0,head.length,0);const start=Math.max(head.length,stat.size-524288);tail=Buffer.alloc(Math.max(0,stat.size-start));await handle.read(tail,0,tail.length,start);}finally{await handle.close();}
 // Head supplies identity; tail supplies recent outcomes rather than the earliest requests.
 for(const line of (head.toString()+'\n'+tail.toString()).split('\n')){let j;try{j=JSON.parse(line);}catch{continue;}
 if(j.type==='session_meta'){cwd=j.payload?.cwd||'';id=j.payload?.id||id;}cwd=cwd||j.cwd||'';
 let role=j.role||j.message?.role,body=j.message?.content;
 if(j.type==='response_item'&&j.payload?.type==='message'){role=j.payload.role;body=j.payload.content;}
 if(j.type==='event_msg'&&j.payload?.type==='user_message'){role='user';body=j.payload.message;}
 if(j.type==='event_msg'&&j.payload?.type==='agent_message'){role='assistant';body=j.payload.message;}
 const t=text(body).trim();if(!['user','assistant'].includes(role)||!t||t.startsWith('<')||t.startsWith('# '))continue;
 if(role==='user'&&!first)first=t.slice(0,240);const entry=role+': '+t.slice(0,1600);if(recent.at(-1)!==entry)recent.push(entry);if(recent.length>12)recent.shift();
 }return {id:tool+':'+id,tool,cwd,title:first?first.split('\n')[0].slice(0,100):'Untitled '+tool+' session',excerpt:recent.join('\n\n').slice(-10000),updated:stat.mtime.toISOString(),source:file};
}
async function scan(selected){const results=[],reports=[];for(const tool of selected){if(!roots[tool])continue;try{if(tool==='OpenCode'){const {stdout}=await run('/usr/bin/sqlite3',['-readonly','-json',roots[tool],"SELECT id,title,directory,time_updated FROM session WHERE parent_id IS NULL ORDER BY time_updated DESC LIMIT 50;"],{maxBuffer:2000000,timeout:10000});const rows=JSON.parse(stdout||'[]');for(const r of rows)results.push({id:'OpenCode:'+r.id,tool,cwd:r.directory,title:r.title,excerpt:'',updated:new Date(r.time_updated).toISOString(),source:roots[tool]});reports.push({tool,count:rows.length,status:'Readable session database; metadata imported'});}else{const all=await files(roots[tool]);const sorted=await Promise.all(all.map(async f=>({f,mtime:(await fs.stat(f)).mtimeMs})));sorted.sort((a,b)=>b.mtime-a.mtime);let count=0,failed=0;for(const {f} of sorted.slice(0,50)){try{results.push(await transcript(f,tool));count++;}catch{failed++;}}reports.push({tool,count,status:'Imported newest '+count+' of '+all.length+' transcripts'+(failed?'; '+failed+' unreadable':'')});}}catch(e){reports.push({tool,count:0,status:e.code==='ENOENT'?'No local history found':'Cannot read local history ('+(e.code||'format error')+')'});}}return {sessions:results,reports,importedAt:new Date().toISOString()};}
module.exports={scan,roots};
