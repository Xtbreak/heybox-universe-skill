import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const root=path.resolve('dist');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(item=>item.isDirectory()?walk(path.join(dir,item.name)):[path.join(dir,item.name)]);
const files=walk(root),errors=[],missing=[],bare=[];
let imports=0;
for(const file of files.filter(file=>file.endsWith('.js'))){
 const code=fs.readFileSync(file,'utf8');
 let refs=[];
 try{refs=[...new vm.SourceTextModule(code,{identifier:file}).dependencySpecifiers];}catch(error){errors.push({file:path.relative(root,file),error:error.message});}
 refs.push(...[...code.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g)].map(match=>match[1]));
 for(const ref of refs){
  imports++;
  if(!ref.startsWith('./')&&!ref.startsWith('../')){bare.push({file:path.relative(root,file),ref});continue;}
  const target=path.resolve(path.dirname(file),decodeURIComponent(ref.split(/[?#]/)[0]));
  if(!fs.existsSync(target))missing.push({file:path.relative(root,file),ref});
 }
}
const report=JSON.parse(fs.readFileSync('打包检查.json'));
Object.assign(report,{dist_file_count:files.length,syntax_errors:errors,missing_runtime_imports:missing,unresolved_bare_imports:bare,checked_runtime_import_count:imports,sample_index_identical:fs.readFileSync(path.join(root,'sample.html')).equals(fs.readFileSync(path.join(root,'index.html')))});
// Last recorded online check; run from the project root. Falls back to the copy shipped with the skill.
const online=['output/journey-22-qa/online-resources.json',new URL('./online-resources.json',import.meta.url).pathname].find(f=>fs.existsSync(f));
report.online_resource_check=online?JSON.parse(fs.readFileSync(online)):{checked:0,failed:[]};
delete report.online_resource_check.files;
fs.writeFileSync('打包检查.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({syntax_errors:errors,missing_runtime_imports:missing,unresolved_bare_imports:bare,imports,sample_index_identical:report.sample_index_identical,online_resources:report.online_resource_check.checked,online_failures:report.online_resource_check.failed},null,2));
if(errors.length||missing.length||bare.length||!report.sample_index_identical||report.online_resource_check.failed.length)process.exitCode=1;
