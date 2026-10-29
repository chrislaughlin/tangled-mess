const fs=require('node:fs/promises');
const path=require('node:path');

const EMPTY={version:1,workstreams:[],links:[],snapshots:{},dismissedLinks:[],reviewedFolders:[],lastImportSessionIds:[]};

function memoryPath(userData){return path.join(userData,'curated-memory.json');}

async function loadMemory(userData){
 try{
  const raw=JSON.parse(await fs.readFile(memoryPath(userData),'utf8'));
  return {
   version:1,
   workstreams:Array.isArray(raw.workstreams)?raw.workstreams:[],
   links:Array.isArray(raw.links)?raw.links:[],
   snapshots:raw.snapshots&&typeof raw.snapshots==='object'?raw.snapshots:{},
   dismissedLinks:Array.isArray(raw.dismissedLinks)?raw.dismissedLinks:[],
   reviewedFolders:Array.isArray(raw.reviewedFolders)?raw.reviewedFolders:[],
   lastImportSessionIds:Array.isArray(raw.lastImportSessionIds)?raw.lastImportSessionIds:[]
  };
 }catch{return structuredClone(EMPTY);}
}

async function saveMemory(userData,memory){
 const payload={
  version:1,
  workstreams:Array.isArray(memory.workstreams)?memory.workstreams:[],
  links:Array.isArray(memory.links)?memory.links:[],
  snapshots:memory.snapshots&&typeof memory.snapshots==='object'?memory.snapshots:{},
  dismissedLinks:Array.isArray(memory.dismissedLinks)?memory.dismissedLinks:[],
  reviewedFolders:Array.isArray(memory.reviewedFolders)?memory.reviewedFolders:[],
  lastImportSessionIds:Array.isArray(memory.lastImportSessionIds)?memory.lastImportSessionIds:[],
  savedAt:new Date().toISOString()
 };
 await fs.writeFile(memoryPath(userData),JSON.stringify(payload,null,2),{mode:0o600});
 return payload;
}

module.exports={loadMemory,saveMemory,EMPTY,memoryPath};
