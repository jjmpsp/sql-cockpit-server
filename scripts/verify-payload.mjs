import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
function find(dir) {
 for(const entry of readdirSync(dir,{withFileTypes:true})) {
  const file=path.join(dir,entry.name);
  if(entry.isDirectory()) { const result=find(file); if(result) return result; }
  else if(entry.name==='hello.txt' && path.basename(dir)==='server-payload') return file;
 }
}
const file=find('release');
if(!file) throw new Error('Packaged platform payload missing');
const text=readFileSync(file,'utf8');
if(!text.includes(process.platform)) throw new Error('Wrong platform payload packaged');
console.log('Packaged payload verified:',file,text.trim());
