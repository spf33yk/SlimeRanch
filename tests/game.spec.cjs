const {test,expect}=require('@playwright/test');
test.beforeEach(async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('slimeRanchBgmSettings',JSON.stringify({track:0,volume:3,playing:false})));
});
test('starts under the Pages subpath; all tabs and responsive layouts work',async({page})=>{
 const errors=[],failed=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)failed.push(r.url());});
 await page.goto('./');
 await expect(page.locator('#uiSettingsButton')).toBeVisible();
 expect(await page.evaluate(()=>g.slimes.length)).toBeGreaterThan(0);
 for(const width of [1280,390]){
  await page.setViewportSize({width,height:900});
  for(const tab of ['field','ranch','battle','guide']){
   await page.click(`[data-tab="${tab}"]`);
   await expect(page.locator('#'+tab)).toBeVisible();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
   await page.screenshot({path:test.info().outputPath(`${tab}-${width}.png`),fullPage:true});
  }
 }
 for(const name of ['how','codex','skills','research','debug']){
  await page.click(`[data-guide="${name}"]`);
  await expect(page.locator('#guide'+name[0].toUpperCase()+name.slice(1))).toBeVisible();
 }
 expect(errors).toEqual([]);expect(failed).toEqual([]);
});
test('field collection works for pointer and button after expansion',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('./');
 await page.evaluate(()=>{g.tiles.fill('empty');g.tiles[0]='magic';g.maso=100;drawField();});
 await page.click('#uiCollect');
 expect(await page.evaluate(()=>g.maso)).toBeGreaterThan(100);
 await page.click('#expand');
 expect(await page.evaluate(()=>size())).toBe(3);
 for(const n of [3,24]){
  await page.evaluate(n=>{g.lv=SIZES.indexOf(n);g.tiles=Array(n*n).fill('empty');g.tiles[0]='magic';drawField();},n);
  const point=await page.evaluate(()=>{const r=document.getElementById('fieldCanvas').getBoundingClientRect(),z=fieldGeom();return {x:r.left+(z.off+z.cell/2)/720*r.width,y:r.top+(z.off+z.cell/2)/720*r.height};});
  const before=await page.evaluate(()=>g.maso);
  await page.mouse.move(point.x,point.y);
  expect(await page.evaluate(()=>g.maso)).toBeGreaterThan(before);
 }
 expect(errors).toEqual([]);
});
test('ranch shortcuts, equipment and battle controls remain connected',async({page})=>{
 await page.goto('./');
 await page.click('[data-tab=ranch]');
 const actions=page.locator('.ui-ranch-actions');
 await actions.getByRole('button',{name:'合成',exact:true}).click();
 await expect(page.locator('#fuse')).toBeVisible();
 await actions.getByRole('button',{name:'一括合成',exact:true}).click();
 await expect(page.locator('#bulkFusionDialog')).toBeVisible();
 await page.click('#closeBulkFusion');
 await actions.getByRole('button',{name:'ハート一覧',exact:true}).click();
 await expect(page.locator('#heartInventory')).toBeVisible();
 await actions.getByRole('button',{name:'相棒一覧',exact:true}).click();
 await expect(page.locator('#monsterInventory')).toBeVisible();
 await actions.getByRole('button',{name:'装備・宝箱',exact:true}).click();
 await expect(page.locator('#treasureModal')).toBeVisible();
 await page.click('#treasureClose');
 await page.evaluate(()=>{treasureDebugGive('normal');treasureOpenChest(g.treasureChests.at(-1).id);treasureEquipCharm('main',g.treasureCharms.at(-1).id);});
 expect(await page.evaluate(()=>!!g.treasureEquip.main)).toBe(true);
 await page.click('[data-tab=battle]');
 const before=await page.evaluate(()=>g.enemyHP);
 await page.click('#attack');
 expect(await page.evaluate(()=>g.enemyHP)).toBeLessThan(before);
 await page.click('#autoFight');
 await expect(page.locator('#autoFight')).toHaveAttribute('aria-pressed','true');
 await page.click('#autoFight');
 await page.click('#autoNext');
 await expect(page.locator('#autoNext')).toHaveAttribute('aria-pressed','false');
});
test('externalized backgrounds, BGM and videos resolve',async({page})=>{
 await page.goto('./');
 const backgrounds=await page.evaluate(async()=>{
  const selectors=['.field-wrap','#mainCard .mhead','.fight'];
  return Promise.all(selectors.map(async s=>{
   const url=getComputedStyle(document.querySelector(s)).backgroundImage.match(/url\("([^"]+)"\)/)?.[1];
   if(!url)return false;
   return await new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(image.naturalWidth>0);image.onerror=()=>resolve(false);image.src=url;});
  }));
 });
 expect(backgrounds).toEqual([true,true,true]);
 await page.click('#uiSettingsButton');
 for(const track of ['0','1']){
  await page.selectOption('#bgmTrack',track);
  if(await page.locator('#bgmAudio').evaluate(a=>a.paused))await page.click('#bgmToggle');
  await expect.poll(()=>page.locator('#bgmAudio').evaluate(a=>a.currentTime)).toBeGreaterThan(0);
 }
 const videos=await page.evaluate(async()=>{
  return Promise.all([window.SLIME_TREASURE_OPEN_VIDEO,window.SLIME_FREEZE_VIDEOS.freeze1].map(src=>new Promise(resolve=>{
   const v=document.createElement('video');const timer=setTimeout(()=>resolve(false),10000);
   v.preload='metadata';v.onloadedmetadata=()=>{clearTimeout(timer);resolve(v.duration>0);};v.onerror=()=>{clearTimeout(timer);resolve(false);};v.src=src;
  })));
 });
 expect(videos).toEqual([true,true]);
 await page.keyboard.press('Escape');
 await expect(page.locator('#uiSettings')).not.toBeVisible();
});
test('save export/import preserves progress, zero currency and equipment',async({page})=>{
 await page.goto('./');
 await page.evaluate(()=>{
  g.maso=0;g.stage=7;g.maxStage=12;g.kills=20;
  treasureDebugGive('normal');treasureOpenChest(g.treasureChests.at(-1).id);
  treasureEquipCharm('main',g.treasureCharms.at(-1).id);save();
 });
 const original=await page.evaluate(()=>({id:g.main,equip:g.treasureEquip.main,name:main().name}));
 await page.click('#uiSettingsButton');
 const downloaded=page.waitForEvent('download');
 await page.click('#saveExport');
 expect((await downloaded).suggestedFilename()).toMatch(/\.save\.json$/);
 const text=await page.locator('#saveTransferText').inputValue();
 expect(JSON.parse(text).state.maso).toBe(0);
 await page.evaluate(()=>{g.maso=999;g.stage=1;g.treasureEquip.main=null;save();});
 page.on('dialog',d=>d.accept());
 await page.locator('#saveImportFile').setInputFiles({name:'old.save.json',mimeType:'application/json',buffer:Buffer.from(text)});
 await expect(page.locator('#saveTransferStatus')).toContainText('読み込みました');
 await page.reload();
 expect(await page.evaluate(()=>({maso:g.maso,stage:g.stage,max:g.maxStage,id:g.main,equip:g.treasureEquip.main,name:main().name})))
  .toEqual({maso:0,stage:7,max:12,...original});
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('slimeRanchCodex1:beforeImport')).maso)).toBe(999);
});
test('bad save and canceled import leave existing progress intact',async({page})=>{
 await page.goto('./');await page.click('#uiSettingsButton');
 const state=await page.evaluate(()=>JSON.stringify(g));
 for(const text of ['not-json','{"slimes":[],"maso":0,"stage":1}',state.replace('"maso":80','"maso":-1')]){
  await page.locator('#saveImportFile').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from(text)});
  await expect(page.locator('#saveTransferStatus')).not.toBeEmpty();
  expect(await page.evaluate(()=>g.maso)).toBe(80);
 }
 page.once('dialog',d=>d.dismiss());
 await page.locator('#saveImportFile').setInputFiles({name:'valid.json',mimeType:'application/json',buffer:Buffer.from(state)});
 expect(await page.evaluate(()=>localStorage.getItem('slimeRanchCodex1:beforeImport'))).toBeNull();
 expect(await page.evaluate(()=>g.maso)).toBe(80);
});
test('legacy plain JSON and import rollback are supported',async({page})=>{
 await page.goto('./');
 const result=await page.evaluate(()=>{
  const text=JSON.stringify({...g,maso:0});
  SlimeSaveTransfer.restore(text);
  const old=render,stored=localStorage.getItem('slimeRanchCodex1');
  render=()=>{throw Error('simulated renderer failure')};
  let rejected=false;
  try{SlimeSaveTransfer.restore(JSON.stringify({...g,maso:55}));}catch{rejected=true;}
  render=old;
  return {rejected,maso:g.maso,same:localStorage.getItem('slimeRanchCodex1')===stored};
 });
 expect(result).toEqual({rejected:true,maso:0,same:true});
});
test('cold cached image callbacks before initialization do not crash',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(let i=0;i<3;i++){await page.goto('./');await expect(page.locator('#uiCollect')).toBeVisible();}
 expect(errors).toEqual([]);
});
test('GAS export helper produces a compatible save without clearing the game',async({page,context})=>{
 await page.goto('./');
 const original=await page.evaluate(()=>JSON.stringify({...g,maso:12345,stage:9,maxStage:9}));
 const legacy=await context.newPage();
 const helper=require('node:fs').readFileSync(require('node:path').join(__dirname,'../migration/GasSaveExport.html'),'utf8');
 await legacy.setContent('<!doctype html><html><body><script>const g='+original+';</script>'+helper+'</body></html>');
 await legacy.getByRole('button',{name:'セーブJSONを書き出す'}).click();
 const text=await legacy.locator('textarea').inputValue();
 expect(JSON.parse(text).state.maso).toBe(12345);
 expect(await legacy.evaluate(()=>g.maso)).toBe(12345);
 await page.evaluate(text=>SlimeSaveTransfer.restore(text),text);
 expect(await page.evaluate(()=>g.stage)).toBe(9);
 expect(await page.evaluate(()=>g.maso)).toBe(12345);
 await legacy.close();
});
test('ranch header, capacity upgrades, companion layout and sub charm stats work',async({page})=>{
 await page.goto('./');
 await page.click('[data-tab=ranch]');
 expect(await page.locator('#headerMonsterCount').textContent()).toBe('1 / 100');
 const layout=await page.evaluate(()=>({main:document.getElementById('mainCard').getBoundingClientRect().top,stats:document.getElementById('ranchTeamStats').getBoundingClientRect().top,sub:document.getElementById('uiSubCompanion').getBoundingClientRect().top,statsBottom:document.getElementById('ranchTeamStats').getBoundingClientRect().bottom}));
 expect(layout.stats).toBeLessThan(layout.sub);expect(layout.main).toBeLessThan(layout.sub);expect(layout.statsBottom).toBeLessThanOrEqual(layout.sub);
 await page.getByRole('button',{name:'相棒一覧',exact:true}).click();
 await page.evaluate(()=>{g.maso=1000;render();});
 await page.click('#capacityUp');
 expect(await page.evaluate(()=>({capacity:cap(),price:capCost(),header:document.getElementById('headerMonsterCount').textContent}))).toEqual({capacity:110,price:405,header:'1 / 110'});
 const charmStats=await page.evaluate(()=>{
  const partner=monster('森スライム');partner.name='装備確認用サブ';g.slimes.push(partner);g.kills=5;g.sub=partner.id;
  const charm={id:g.treasureNextId++,rarity:'normal',name:'検証用',effects:[{key:'atk',label:'攻撃力',mult:2}]};g.treasureCharms.push(charm);treasureEquipCharm('sub',charm.id);
  return {sub:singleStats(partner).atk,base:treasureOriginalSingleStats(partner).atk,team:teamBattleStats().atk,main:singleStats(main()).atk};
 });
 expect(charmStats.sub).toBe(charmStats.base*2);expect(charmStats.team).toBe(charmStats.sub+charmStats.main);
 expect(await page.locator('#headerMonsterCount').textContent()).toBe('2 / 110');
 await expect(page.locator('#uiSubCompanion #subCard')).toContainText('装備確認用サブ');
});
test('bulk fusion tries each selected material once, even when every attempt fails',async({page})=>{
 await page.goto('./');await page.click('[data-tab=ranch]');
 await page.locator('.ui-ranch-actions').getByRole('button',{name:'一括合成'}).click();
 await page.evaluate(()=>{
  g.maso=100000;g.slimes.push(monster('森スライム'),monster('森スライム'));render();
  document.querySelectorAll('.bulk-material').forEach(x=>{x.checked=true;x.dispatchEvent(new Event('change',{bubbles:true}));});
  window.__fusionCalls=0;performFusion=()=>{window.__fusionCalls++;return 'fail';};
 });
 page.on('dialog',dialog=>dialog.accept());
 await page.click('#bulkFuse');
 expect(await page.evaluate(()=>window.__fusionCalls)).toBe(2);
 await expect(page.locator('#fuseMsg')).toContainText('失敗 2個');
});
test('field and battle epic chests skip freeze and guaranteed freeze can be skipped safely',async({page})=>{
 await page.goto('./');
 const result=await page.evaluate(()=>{
  let awarded=0,freezeCalls=0,callbackValue=null;
  const oldPrompt=treasureFreezePrompt,oldRandom=Math.random;
  try{
   treasureFreezePrompt=()=>{freezeCalls++;};Math.random=()=>0;g.tiles.fill('empty');
   treasureFieldRoll();
   const fieldEpic=g.tiles.includes('treasure:epic');
   const fieldFreezeCalls=freezeCalls;
   treasureBattleRoll(500);
   const battleEpic=g.treasureChests.some(c=>c.rarity==='epic');
   treasureFreezePrompt=oldPrompt;Math.random=oldRandom;
   treasureGateDrop('epic',()=>awarded++,true);
   treasureFreezePrompt(1,success=>callbackValue=success,true);
   const visible=!document.getElementById('treasureFreezeSkip').hidden;
   document.getElementById('treasureFreezeSkip').click();
   return {awarded,fieldEpic,fieldFreezeCalls,battleEpic,battleFreezeCalls:freezeCalls-fieldFreezeCalls,visible,hidden:document.getElementById('treasureFreeze').hidden,busy:treasureFreezeBusy,callbackValue};
  }finally{treasureFreezePrompt=oldPrompt;Math.random=oldRandom;}
 });
 expect(result).toEqual({awarded:1,fieldEpic:true,fieldFreezeCalls:1,battleEpic:true,battleFreezeCalls:1,visible:true,hidden:true,busy:false,callbackValue:true});
});
