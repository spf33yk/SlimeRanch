const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../dist'),port=Number(process.env.PORT||4173);
const mime={'.html':'text/html; charset=utf-8','.json':'application/json','.png':'image/png','.webp':'image/webp','.mp3':'audio/mpeg','.mp4':'video/mp4','.woff2':'font/woff2'};
http.createServer((req,res)=>{
 let url;
 try{url=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);return res.end();}
 // Test the same project subpath that GitHub Pages uses.
 if(!url.startsWith('/SlimeRanch/')){res.writeHead(404);return res.end();}
 const file=path.resolve(root,url.slice('/SlimeRanch/'.length)||'index.html');
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 fs.stat(file,(err,stat)=>{
  if(err||!stat.isFile()){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
  res.setHeader('Accept-Ranges','bytes');
  const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
  if(range){
   const start=Number(range[1]),end=Math.min(stat.size-1,range[2]?Number(range[2]):stat.size-1);
   if(start>end||start>=stat.size){res.writeHead(416);return res.end();}
   res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${stat.size}`,'Content-Length':end-start+1});
   fs.createReadStream(file,{start,end}).pipe(res);
  }else{res.setHeader('Content-Length',stat.size);fs.createReadStream(file).pipe(res);}
 });
}).listen(port,'127.0.0.1',()=>console.log(`http://127.0.0.1:${port}/SlimeRanch/`));
