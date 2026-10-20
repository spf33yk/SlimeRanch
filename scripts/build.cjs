const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist'),assets=path.join(dist,'assets');
fs.mkdirSync(assets,{recursive:true});
const extensions={'image/png':'png','image/webp':'webp','image/jpeg':'jpg','audio/mpeg':'mp3','video/mp4':'mp4','font/woff2':'woff2'};
const manifest=new Map();
function emit(mime,base64){
 const data=Buffer.from(base64.replace(/\s/g,''),'base64');
 const hash=crypto.createHash('sha256').update(data).digest('hex').slice(0,20);
 if(!extensions[mime])throw Error('Unsupported embedded MIME: '+mime);
 const filename=hash+'.'+extensions[mime],url='assets/'+filename;
 fs.writeFileSync(path.join(assets,filename),data);
 manifest.set(url,{bytes:data.length,type:mime});
 return url;
}
function include(name,stack=[]){
 if(!/^[A-Za-z0-9_-]+$/.test(name)||stack.includes(name))throw Error('Invalid/recursive include: '+name);
 let html=fs.readFileSync(path.join(root,name+'.html'),'utf8');
 html=html.replace(/<\?!=\s*include\('([^']+)'\);\s*\?>/g,(_,child)=>include(child,[...stack,name]));
 // BGM fragments contain raw base64 strings, unlike other media.
 html=html.replace(/window\.SLIME_EMBEDDED_BGM\[(\d+)\]\s*=\s*"([A-Za-z0-9+/=\s]+)";/g,
  (_,index,data)=>`window.SLIME_EMBEDDED_BGM[${index}]=${JSON.stringify(emit('audio/mpeg',data))};`);
 return html;
}
let html=include('index');
html=html.replace(/data:([^;,"'\s]+);base64,([A-Za-z0-9+/=\r\n]+)/g,(_,mime,data)=>emit(mime,data));
html=html.replace(/<base\s+target="_top"\s*>/,'');
if(html.includes('<?'))throw Error('Unresolved GAS template');
for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))new vm.Script(match[1]);
fs.writeFileSync(path.join(dist,'index.html'),html);
fs.writeFileSync(path.join(dist,'.nojekyll'),'');
fs.writeFileSync(path.join(dist,'asset-manifest.json'),JSON.stringify(Object.fromEntries(manifest),null,2));
console.log(`Built dist/index.html: ${Buffer.byteLength(html).toLocaleString()} bytes; ${manifest.size} external media files.`);
