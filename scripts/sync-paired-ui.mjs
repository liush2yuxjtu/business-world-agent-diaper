import {cp,mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const source=process.argv[2];
if(!source)throw new Error('Usage: node scripts/sync-paired-ui.mjs /path/to/world-agent-interactive');
const from=path.resolve(source),to=path.resolve('public/business-world');
const modules=(await readdir(path.join(from,'src'))).filter(name=>/^ui-.*\.mjs$/.test(name)).map(name=>'src/'+name);
const files=['ui.html','ui.md',...modules,'src/vendor/pptxgen.bundle.js','src/vendor/pptxgenjs.LICENSE','src/vendor/README.md'];
const hashes={};
for(const file of files){await mkdir(path.dirname(path.join(to,file)),{recursive:true});await cp(path.join(from,file),path.join(to,file));hashes[file]=createHash('sha256').update(await readFile(path.join(to,file))).digest('hex');}
await writeFile(path.join(to,'paired-source.json'),JSON.stringify({sourceRepository:'liush2yuxjtu/world-agent-interactive',files:hashes},null,2)+'\n');
console.log(`Synced ${files.length} exact paired source files; other business-world assets were not modified.`);
