const {test,expect}=require('@playwright/test');
test.beforeEach(async({page})=>{
 await page.addInitScript(()=>{window.__SLIME_E2E__=true;localStorage.setItem('slimeRanchBgmSettings',JSON.stringify({track:0,volume:3,playing:false}));});
});
test('shared title and settings header stays fixed with the navigation while scrolling',async({page})=>{
 await page.goto('./');await page.click('[data-tab=ranch]');
 const desktop=await page.evaluate(()=>{window.scrollTo(0,document.documentElement.scrollHeight);const bar=document.getElementById('uiTopbar'),header=bar.querySelector('header'),nav=bar.querySelector('nav');return {position:getComputedStyle(bar).position,top:bar.getBoundingClientRect().top,headerTop:header.getBoundingClientRect().top,navTop:nav.getBoundingClientRect().top,headerBottom:header.getBoundingClientRect().bottom,navBottom:nav.getBoundingClientRect().bottom}});
 expect(desktop.position).toBe('sticky');expect(desktop.top).toBe(0);expect(desktop.headerTop).toBe(0);expect(desktop.navTop).toBeCloseTo(desktop.headerBottom,0);expect(desktop.navBottom).toBeGreaterThan(desktop.navTop);
 await page.setViewportSize({width:390,height:844});
 const mobile=await page.evaluate(()=>{window.scrollTo(0,document.documentElement.scrollHeight);const bar=document.getElementById('uiTopbar'),header=bar.querySelector('header'),nav=bar.querySelector('nav');return {top:bar.getBoundingClientRect().top,headerTop:header.getBoundingClientRect().top,navTop:nav.getBoundingClientRect().top,headerBottom:header.getBoundingClientRect().bottom}});
 expect(mobile.top).toBe(0);expect(mobile.headerTop).toBe(0);expect(mobile.navTop).toBeCloseTo(mobile.headerBottom,0);
});
test('opening screen loads the game art and offers start, options and end actions',async({page})=>{
 await page.setViewportSize({width:1902,height:1069});
 await page.addInitScript(()=>{window.__SLIME_E2E__=false;});
 await page.goto('./');
 await expect(page.locator('#openingScreen')).toBeVisible();
 const openingFrame=await page.locator('.opening-frame').boundingBox();
 expect(openingFrame.x+openingFrame.width/2).toBeGreaterThan(page.viewportSize().width/2);
 await expect(page.locator('#openingTitle')).toHaveText('スライム牧場');
 await expect(page.locator('#gameStart')).toHaveText('GAME START');
 await expect(page.locator('#gameOption')).toHaveText('OPTION');
 await expect(page.locator('#gameEnd')).toHaveText('GAME END');
 await page.waitForFunction(()=>{const image=document.getElementById('openingArtwork');return image.complete&&image.naturalWidth>0;});
 await expect(page.locator('.opening-frame')).toHaveCSS('opacity','1');
 await page.screenshot({path:test.info().outputPath('opening-screen.png'),fullPage:true});
 await page.evaluate(()=>{g.maso=9876;save();});
 await page.evaluate(()=>{window.__menuSfx=[];window.sfx=kind=>window.__menuSfx.push(kind);});
 await page.click('#gameOption');
 expect(await page.evaluate(()=>window.__menuSfx)).toEqual(['tab']);
 await expect(page.locator('#uiSettings')).toBeVisible();
 await page.screenshot({path:test.info().outputPath('opening-options.png'),fullPage:true});
 await expect(page.locator('#uiSfxVolume')).toBeVisible();
 await expect(page.locator('#uiSfxVolume')).toHaveValue('50');
 await expect(page.locator('#uiReducedMotion')).toBeVisible();
 await expect(page.locator('#uiResetGame')).toBeVisible();
 await page.locator('#uiSfxVolume').fill('24');
 expect(await page.evaluate(()=>localStorage.getItem('slimeRanchSfxVolume'))).toBe('24');
 await page.locator('#soundToggle').uncheck();
 expect(await page.evaluate(()=>localStorage.getItem('slimeRanchSoundEnabled'))).toBe('false');
 await page.locator('#uiReducedMotion').check();
 expect(await page.evaluate(()=>localStorage.getItem('slimeRanchReducedMotion'))).toBe('true');
 await page.click('#uiResetGame');
 await expect(page.locator('#gameConfirmDialog')).toBeVisible();
 await page.locator('#gameConfirmAccept').click();
 expect(await page.evaluate(()=>g.maso)).toBe(80);
 if(await page.locator('#tutorialSkip').isVisible())await page.locator('#tutorialSkip').click();
 await page.click('#gameOption');
 await page.locator('#uiReducedMotion').uncheck();
 expect(await page.evaluate(()=>localStorage.getItem('slimeRanchReducedMotion'))).toBe('false');
 await page.locator('#uiSettings').getByRole('button',{name:'閉じる ×'}).click();
 await page.evaluate(()=>{window.__menuSfx=[]});
 await page.click('#gameEnd');
 await expect(page.locator('#gameEndDialog')).toBeVisible();
 await expect(page.locator('#gameEndTitle')).toHaveText('ゲームを終了しますか？');
 await page.screenshot({path:test.info().outputPath('opening-game-end-warning.png'),fullPage:true});
 expect(await page.evaluate(()=>window.__menuSfx)).toEqual(['tab']);
 await page.click('#cancelGameEnd');
 await expect(page.locator('#gameEndDialog')).toBeHidden();
 expect(await page.evaluate(()=>window.__menuSfx)).toEqual(['tab','tap']);
 await page.click('#gameEnd');
 await page.click('#confirmGameEnd');
 await expect(page.locator('#gameEndDialog')).toBeHidden();
 await expect(page.locator('#openingStatus')).toContainText('このタブを閉じてください');
 expect(await page.evaluate(()=>window.__menuSfx)).toEqual(['tab','tap','tab','fail']);
 await page.evaluate(()=>{window.__startSfx=[];window.sfx=kind=>window.__startSfx.push(kind);});
 await page.click('#gameStart');
 await expect(page.locator('#openingScreen')).toHaveClass(/is-starting/);
 expect(await page.evaluate(()=>window.__startSfx)).toEqual(['win']);
 await expect(page.locator('.opening-frame')).toHaveCSS('visibility','hidden');
 await expect(page.locator('#openingScreen')).toBeHidden();
 await expect(page.locator('#field')).toBeVisible();
 await expect(page.locator('#tutorialTitle')).toHaveText('魔素と仲間を集めよう');
 await expect(page.locator('#tutorialOverlay')).toBeVisible();
});
test('fresh browser uses an audible default and resumes Web Audio on the first game click',async({page})=>{
 await page.goto('./');
 const settings=await page.evaluate(()=>({volume:sfxVolume,enabled:soundOn,saved:localStorage.getItem('slimeRanchSfxVolume')}));
 expect(settings).toEqual({volume:50,enabled:true,saved:null});
 await page.evaluate(()=>{
  const original=AudioContext.prototype.createOscillator;
  AudioContext.prototype.createOscillator=function(){window.__sfxOscillators=(window.__sfxOscillators||0)+1;return original.call(this)};
 });
 await page.click('[data-tab=\"ranch\"]');
 await expect.poll(()=>page.evaluate(()=>audioCtx?.state)).toBe('running');
 await expect.poll(()=>page.evaluate(()=>window.__sfxOscillators||0)).toBeGreaterThan(0);
 const oscillatorCount=()=>page.evaluate(()=>window.__sfxOscillators||0);
 await page.click('[data-tab=\"field\"]');
 await page.evaluate(()=>{g.tiles.fill('empty');g.tiles[0]='magic';drawField()});
 let before=await oscillatorCount();
  const fieldPoint=await page.locator('#fieldCanvas').evaluate(canvas=>{const r=canvas.getBoundingClientRect(),z=fieldGeom();return{x:r.left+(z.off+z.cell/2)/720*r.width,y:r.top+(z.off+z.cell/2)/720*r.height}});
  await page.mouse.click(fieldPoint.x,fieldPoint.y);
 await expect.poll(oscillatorCount).toBeGreaterThan(before);
 await page.click('[data-tab=\"battle\"]');
 await page.evaluate(()=>{g.won=false;g.enemyHP=Number.MAX_SAFE_INTEGER;render()});
 before=await oscillatorCount();
 await page.click('#attack');
 await expect.poll(oscillatorCount).toBeGreaterThan(before);
});
test('freeze effect audio follows the shared sound effect volume setting',async({page})=>{
 await page.goto('./');
 await page.click('#uiSettingsButton');
 await page.locator('#uiSfxVolume').fill('25');
 await page.evaluate(()=>{
  const NativeAudio=window.Audio;window.__mediaVolumes=[];
  window.Audio=function(src){const audio=new NativeAudio(src);let volume=1;Object.defineProperty(audio,'volume',{get(){return volume},set(value){volume=value;window.__mediaVolumes.push(value)}});audio.play=()=>Promise.resolve();audio.pause=()=>{};return audio;};
  treasurePlaySound('freeze');treasurePlaySound('beep');
 });
 const volumes=await page.evaluate(()=>window.__mediaVolumes);
 expect(volumes).toHaveLength(2);expect(volumes[0]).toBeCloseTo(.08);expect(volumes[1]).toBeCloseTo(.1);
});
test('treasure freeze and opening videos follow the shared sound effect volume setting',async({page})=>{
 await page.goto('./');
 await page.click('#uiSettingsButton');
 await page.locator('#uiSfxVolume').fill('25');
 const volumes=await page.evaluate(()=>{
  const video=document.getElementById('treasureFreezeVideo'),set=[];
  Object.defineProperty(video,'volume',{configurable:true,get(){return this.__volume??1},set(value){this.__volume=value;set.push(value)}});
  video.play=()=>Promise.resolve();video.pause=()=>{};
  window.SLIME_FREEZE_VIDEOS={freeze1:'freeze.mp4'};window.SLIME_TREASURE_OPEN_VIDEO='opening.mp4';
  treasureFreezePrompt(1,null,true);treasureFreezePush();treasurePlayOpeningVideo();
  treasureFreezeEnd();return set;
 });
 expect(volumes).toEqual([.1,.1]);
});
test('treasure videos are muted with the shared sound effects toggle',async({page})=>{
 await page.goto('./');
 await page.click('#uiSettingsButton');
 await page.locator('#soundToggle').uncheck();
 const muted=await page.evaluate(()=>{
  const video=document.getElementById('treasureFreezeVideo'),values=[];
  Object.defineProperty(video,'muted',{configurable:true,get(){return this.__muted??false},set(value){this.__muted=value;values.push(value)}});
  video.play=()=>Promise.resolve();video.pause=()=>{};
  window.SLIME_FREEZE_VIDEOS={freeze1:'freeze.mp4'};window.SLIME_TREASURE_OPEN_VIDEO='opening.mp4';
  treasureFreezePrompt(1,null,true);treasureFreezePush();treasurePlayOpeningVideo();treasureFreezeEnd();return values;
 });
 expect(muted).toEqual([true,true]);
});
test('starts under the Pages subpath; all tabs and responsive layouts work',async({page})=>{
 const errors=[],failed=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)failed.push(r.url());});
 await page.goto('./');
 await expect(page.locator('#uiSettingsButton')).toBeVisible();
 await expect(page.locator('#uiCodexButton')).toBeVisible();
 expect((await page.locator('#uiCodexButton').boundingBox()).x).toBeLessThan((await page.locator('#uiSettingsButton').boundingBox()).x);
 expect(await page.evaluate(()=>g.slimes.length)).toBeGreaterThan(0);
 for(const width of [1280,390]){
  await page.setViewportSize({width,height:900});
  if(width===390){const positions=await page.evaluate(()=>[document.getElementById('headerMonsterCount'),document.getElementById('hearts')].map(e=>e.closest('.resource').getBoundingClientRect().y));expect(Math.abs(positions[0]-positions[1])).toBeLessThan(1);}
  for(const tab of ['field','ranch','battle','worldtree']){
   await page.click(`[data-tab="${tab}"]`);
   await expect(page.locator('#'+tab)).toBeVisible();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
   await page.screenshot({path:test.info().outputPath(`${tab}-${width}.png`),fullPage:true});
  }
  await page.click('#uiCodexButton');
  await expect(page.locator('#guide')).toBeVisible();
  await expect(page.locator('#uiCodexButton')).toHaveAttribute('aria-current','page');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  await page.click('[data-tab="worldtree"]');
  await expect(page.locator('#uiCodexButton')).toHaveAttribute('aria-current','false');
 }
 await page.click('#uiCodexButton');
 for(const name of ['how','codex','skills','research','debug']){
  await page.click(`[data-guide="${name}"]`);
  await expect(page.locator('#guide'+name[0].toUpperCase()+name.slice(1))).toBeVisible();
 }
 expect(errors).toEqual([]);expect(failed).toEqual([]);
});
test('field starts with click collection and unlocks mouseover collection',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('./');
 await page.evaluate(()=>{g.tiles.fill('empty');g.tiles[0]='magic';g.tiles[1]='magic';g.maso=100;drawField();});
 const firstPoint=await page.locator('#fieldCanvas').evaluate(canvas=>{const r=canvas.getBoundingClientRect(),z=fieldGeom();return{x:r.left+(z.off+z.cell/2)/720*r.width,y:r.top+(z.off+z.cell/2)/720*r.height}});
 await page.mouse.move(firstPoint.x,firstPoint.y);
 expect(await page.evaluate(()=>g.maso)).toBe(100);
 expect(await page.evaluate(()=>g.tiles[0])).toBe('magic');
 await page.mouse.click(firstPoint.x,firstPoint.y);
 expect(await page.evaluate(()=>g.maso)).toBeGreaterThan(100);
 expect(await page.evaluate(()=>g.dragCollectUnlocked)).toBe(false);
 await page.evaluate(()=>{g.maso=10000;render()});
 await page.click('#expand');
 expect(await page.evaluate(()=>size())).toBe(3);
 expect(await page.evaluate(()=>g.dragCollectUnlocked)).toBe(false);
 await page.click('#rangeUp');
 expect(await page.evaluate(()=>g.dragCollectUnlocked)).toBe(false);
 const masoBeforeUnlock=await page.evaluate(()=>g.maso);
 await page.click('#dragUnlock');
 expect(await page.evaluate(()=>g.dragCollectUnlocked)).toBe(true);
 expect(await page.evaluate(()=>g.maso)).toBe(masoBeforeUnlock-120);
 await expect(page.locator('body')).toHaveClass(/field-hover-unlocked/);
 await expect(page.locator('#dragUnlock')).toHaveText('解放済み');
 await expect(page.locator('#dragUnlock')).toBeDisabled();
 await page.evaluate(()=>{g.tiles=Array(9).fill('empty');g.tiles[0]='magic';g.tiles[1]='magic';drawField();});
 await page.locator('#fieldCanvas').scrollIntoViewIfNeeded();
 const hoverPoints=await page.evaluate(()=>{const c=document.getElementById('fieldCanvas'),r=c.getBoundingClientRect(),z=fieldGeom();return [0,1].map(i=>({x:r.left+(z.off+(i+.5)*z.cell)/720*r.width,y:r.top+(z.off+z.cell/2)/720*r.height}))});
 const beforeHover=await page.evaluate(()=>g.maso);
 await page.mouse.move(hoverPoints[0].x,hoverPoints[0].y);await page.mouse.move(hoverPoints[1].x,hoverPoints[1].y,{steps:4});
 expect(await page.evaluate(()=>g.maso)).toBeGreaterThan(beforeHover);
 expect(await page.evaluate(()=>g.tiles.slice(0,2))).toEqual(['empty','empty']);
 await page.evaluate(()=>{g.lv=SIZES.indexOf(24);g.tiles=Array(24*24).fill('empty');g.tiles[100]='magic';lastHoverCellIndex=null;fieldHoverCell=null;drawField();});
 await page.locator('#fieldCanvas').scrollIntoViewIfNeeded();
 const point=await page.evaluate(()=>{const r=document.getElementById('fieldCanvas').getBoundingClientRect(),z=fieldGeom(),x=4,y=4;return{x:r.left+(z.off+(x+.5)*z.cell)/720*r.width,y:r.top+(z.off+(y+.5)*z.cell)/720*r.height}});
 await page.mouse.move(point.x,point.y);
 expect(await page.evaluate(()=>g.tiles[100])).toBe('empty');
 expect(errors).toEqual([]);
});
test('field spawn meter is removed',async({page})=>{
 await page.goto('./');
 await expect(page.locator('.field-spawn-meter')).toHaveCount(0);
 expect(await page.evaluate(()=>typeof updateFieldSpawnMeter)).toBe('undefined');
});
test('legacy field bonuses do not falsely mark drag collection as unlocked',async({page})=>{
 await page.goto('./');
 await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('slimeRanchCodex1'));delete s.dragCollectUnlocked;s.rangeLv=0;s.yield=1;s.maso=500;localStorage.setItem('slimeRanchCodex1',JSON.stringify(s))});
 await page.reload();
 expect(await page.evaluate(()=>g.dragCollectUnlocked)).toBe(false);
 await expect(page.locator('#dragUnlock')).toBeEnabled();
});
test('hover collection unlock shows unavailable state when funds are short',async({page})=>{
 await page.goto('./');
 await page.evaluate(()=>{g.maso=0;render()});
 await expect(page.locator('#dragUnlock')).toBeDisabled();
 await expect(page.locator('#dragUnlockInfo')).toContainText('120');
 expect(await page.evaluate(()=>g.dragCollectUnlocked)).toBe(false);
});
test('mouseover collection applies the expanded collection radius from an empty cell',async({page})=>{
 await page.goto('./');
 await page.evaluate(()=>{g.lv=1;g.tiles=Array(9).fill('empty');g.tiles[5]='magic';g.tiles[7]='magic';g.rangeLv=1;g.dragCollectUnlocked=true;g.maso=0;render()});
 const point=await page.locator('#fieldCanvas').evaluate(c=>{const r=c.getBoundingClientRect(),z=fieldGeom();return{x:r.left+(z.off+1.5*z.cell)/720*r.width,y:r.top+(z.off+1.5*z.cell)/720*r.height}});
 const before=await page.evaluate(()=>g.maso);
 await page.mouse.move(point.x,point.y);
 expect(await page.evaluate(()=>g.maso)).toBeGreaterThan(before);
 expect(await page.evaluate(()=>g.tiles.slice(5,8))).toEqual(['empty','empty','empty']);
});
test('field upgrade buttons share available and completed styles',async({page})=>{
 await page.goto('./');
 await page.evaluate(()=>{g.maso=1000000;render()});
 const ids=['expand','spawnUp','yieldUp','rangeUp','dragUnlock'];
 const available=await page.evaluate(ids=>ids.map(id=>{const b=document.getElementById(id);return{disabled:b.disabled,gold:b.classList.contains('gold'),background:getComputedStyle(b).backgroundImage}}),ids);
 expect(available.every(x=>!x.disabled&&!x.gold)).toBe(true);
 expect(new Set(available.map(x=>x.background)).size).toBe(1);
 await page.evaluate(()=>{g.lv=SIZES.length-1;g.rangeLv=4;g.dragCollectUnlocked=true;render()});
 await expect.poll(()=>page.locator('#expand').evaluate(el=>getComputedStyle(el).filter)).toBe('saturate(0.35)');
 const completed=await page.evaluate(()=>['expand','rangeUp','dragUnlock'].map(id=>{const b=document.getElementById(id);const s=getComputedStyle(b);return{disabled:b.disabled,background:s.backgroundImage,opacity:s.opacity,filter:s.filter}}));
 expect(completed.every(x=>x.disabled)).toBe(true);
 expect(new Set(completed.map(x=>[x.background,x.opacity,x.filter].join('|'))).size).toBe(1);
 await expect(page.locator('#dragUnlock')).toHaveText('解放済み');
 await expect(page.locator('.field-upgrades h3').filter({hasText:'魔素湧き速度強化'})).not.toContainText('🌱');
});
test('field has no manual collect button, batch collect spans the row and uses a 10 minute cooldown',async({page})=>{
 await page.goto('./');
 expect(await page.locator('#uiCollect').count()).toBe(0);
 await expect(page.locator('#treasureOdds')).toBeVisible();
 expect(await page.locator('#treasureOdds').evaluate(el=>el.parentElement.classList.contains('ui-field-facts'))).toBe(true);
 expect(await page.locator('#treasureOdds').evaluate(el=>el.classList.contains('ui-fact'))).toBe(true);
 await page.setViewportSize({width:320,height:780});
 const oddsStyle=await page.locator('#treasureOdds').evaluate(el=>({whiteSpace:getComputedStyle(el).whiteSpace,childWhiteSpaces:[...el.children].map(x=>getComputedStyle(x).whiteSpace),overflow:el.scrollWidth>el.clientWidth}));
 expect(oddsStyle.whiteSpace).toBe('nowrap');expect(oddsStyle.childWhiteSpaces).toEqual(['nowrap','nowrap']);expect(oddsStyle.overflow).toBe(false);
 expect(await page.locator('#nextSize').evaluate(el=>el.parentElement.parentElement.classList.contains('row'))).toBe(true);
 expect(await page.locator('#collectAll').evaluate(el=>getComputedStyle(el).gridColumnEnd)).toBe('-1');
 await page.evaluate(()=>{g.maso=1000;g.tiles.fill('magic');render()});
 const before=await page.evaluate(()=>g.maso);
 await page.click('#collectAll');
 expect(await page.evaluate(()=>({unlocked:g.batchUnlocked,maso:g.maso}))).toEqual({unlocked:true,maso:before-200});
 await page.evaluate(()=>{g.tiles.fill('magic');render()});
 await page.click('#collectAll');
 expect(await page.evaluate(()=>Date.now()-g.batchLast<1000)).toBe(true);
 await expect(page.locator('#collectAll')).toContainText('10分00秒');
 expect(await page.locator('#collectAll').isDisabled()).toBe(true);
 await page.evaluate(()=>{g.batchLast=Date.now()-BATCH_COOLDOWN_MS+1000;render()});
 await expect(page.locator('#collectAll')).toContainText('1秒');
 await page.evaluate(()=>{g.batchLast=Date.now()-BATCH_COOLDOWN_MS+59000;renderBatchButton()});
 await expect(page.locator('#collectAll')).toContainText('59秒');
 await page.evaluate(()=>{g.batchLast=Date.now()-BATCH_COOLDOWN_MS-1;render()});
 await expect(page.locator('#collectAll')).toBeEnabled();
});
test('battle win and lose result is text only at the center of both teams',async({page})=>{
 await page.goto('./');await page.click('[data-tab=battle]');
 const result=await page.evaluate(()=>{treasureBattleResultFx('win');const field=document.querySelector('#battle .fight'),team=document.getElementById('teamCard'),enemy=document.getElementById('enemyCard'),overlay=document.querySelector('.treasure-battle-result'),r=overlay.getBoundingClientRect(),f=field.getBoundingClientRect(),t=team.getBoundingClientRect(),e=enemy.getBoundingClientRect();return{inFight:overlay.parentElement===field,transparent:getComputedStyle(overlay).backgroundColor==='rgba(0, 0, 0, 0)',centered:Math.abs((r.left+r.right)/2-(f.left+f.width/2))<2,betweenTeams:Math.abs((r.left+r.right)/2-(t.right+e.left)/2)<2,ratio:r.height/f.height}});
 expect(result.inFight).toBe(true);expect(result.transparent).toBe(true);expect(result.centered).toBe(true);expect(result.betweenTeams).toBe(true);expect(result.ratio).toBeLessThan(.3);
 const lose=await page.evaluate(()=>{treasureBattleResultFx('lose');return document.querySelector('.treasure-battle-result strong').textContent});
 expect(lose).toBe('LOSE');
});
test('ranch shortcuts, equipment and battle controls remain connected',async({page})=>{
 await page.goto('./');
 await page.click('[data-tab=ranch]');
 const actions=page.locator('.ui-ranch-actions');
 await expect(page.locator('#ranch #monsterList, #ranch #heartList, #ranch #bulkFusionDialog, #ranch #uiFusion')).toHaveCount(0);
 await expect(page.locator('#uiFusion')).not.toHaveJSProperty('open',true);
 await page.evaluate(()=>document.querySelector('[data-tab="battle"]').focus());
 await page.locator('#ranchOpenFusion').click();
 expect(await page.locator('[data-tab=battle]').evaluate(el=>el.matches(':focus-visible'))).toBe(false);
 await expect.poll(()=>page.locator('[data-tab]').evaluateAll(tabs=>tabs.filter(el=>el.classList.contains('active')).map(el=>el.dataset.tab))).toEqual(['ranch']);
 await page.waitForTimeout(300);
 const battleTab=page.locator('[data-tab=battle]');
 expect(await battleTab.evaluate(el=>el.matches(':focus')||el.matches(':focus-visible'))).toBe(false);
 expect(await battleTab.evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('none');
 expect(await battleTab.evaluate(el=>getComputedStyle(el).borderTopColor)).not.toBe('rgb(224, 201, 135)');
 await expect(page.locator('#uiFusion')).toHaveJSProperty('open',true);
 await expect(page.locator('#fuse')).toBeVisible();
 await page.locator('#openBulkFusion').click();
 await expect(page.locator('#bulkFusionDialog')).toBeVisible();
 await page.locator('[data-dialog-close="bulkFusionDialog"]').click();
 await page.locator('#ranchOpenHeartInventory').click();
 await expect(page.locator('#heartInventoryDialog')).toHaveJSProperty('open',true);
 await page.locator('[data-dialog-close="heartInventoryDialog"]').click();
 await page.locator('#ranchOpenMonsterInventory').click();
 await expect(page.locator('#monsterInventoryDialog')).toHaveJSProperty('open',true);
 await page.locator('[data-dialog-close="monsterInventoryDialog"]').click();
 await page.locator('.ui-monster-select-row--main').getByRole('button',{name:'宝箱/装備',exact:true}).click();
 await expect(page.locator('#treasureModal')).toBeVisible();
 await page.click('#treasureClose');
 await page.locator('.ui-monster-select-row--sub').getByRole('button',{name:'宝箱/装備',exact:true}).click();
 await expect(page.locator('#treasureModal')).toBeVisible();
 await expect(page.locator('#treasureSlot')).toHaveValue('sub');
 await page.click('#treasureClose');
 await page.evaluate(()=>{treasureEnsure();g.treasureCharms.push({id:999,name:'Test Charm',rarity:'normal',effects:[{key:'atk',label:'攻撃力',mult:1.1}]});treasureEquipCharm('main',999);});
 await expect(page.locator('#teamChangeConfirmDialog')).toBeVisible();
 await expect(page.locator('#teamChangeTitle')).toHaveText('変更しますか？');
 await expect(page.locator('#teamChangeDescription')).toContainText('メインモンスターのおまもり装備');
 await expect(page.locator('#teamChangeStats')).toContainText('攻撃力');
 await expect(page.locator('#teamChangeStats')).toContainText(/e[+-]\d+/i);
 expect(await page.evaluate(()=>g.treasureEquip.main)).toBeNull();
 await page.click('#teamChangeAccept');
 expect(await page.evaluate(()=>g.treasureEquip.main)).toBe(999);
 await page.click('[data-tab=battle]');
 // Keep the target alive while exercising the auto settings so a fast CI
 // worker cannot trigger the victory continuation between the button clicks.
 await page.evaluate(()=>{g.won=false;g.autoNext=true;g.autoFight=false;g.enemyHP=Number.MAX_SAFE_INTEGER;render();});
 const before=await page.evaluate(()=>g.enemyHP);
 await page.click('#attack');
 expect(await page.evaluate(()=>g.enemyHP)).toBeLessThan(before);
 await page.locator('#autoNext').evaluate(button=>button.click());
 await expect(page.locator('#autoNext')).toHaveAttribute('aria-pressed','false');
 await page.locator('#autoFight').evaluate(button=>button.click());
 await expect(page.locator('#autoFight')).toHaveAttribute('aria-pressed','true');
 await page.locator('#autoFight').evaluate(button=>button.click());
 await expect(page.locator('#autoFight')).toHaveAttribute('aria-pressed','false');
});
test('auto battle keeps ranch monster idle animations attached and smooth',async({page})=>{
 await page.goto('./');await page.click('[data-tab=ranch]');
 await page.evaluate(()=>{const m=main(),partner=monster('森スライム');m.atk=1e30;m.hp=1e30;partner.hp=1e30;g.slimes.push(partner);g.sub=partner.id;g.kills=3;g.teamHP=teamMax();g.won=false;g.autoNext=false;g.autoFight=false;Math.random=()=>.99;render()});
 await expect(page.locator('#mainCard .ui-monster-idle-motion--main')).toHaveCount(1);
 await expect(page.locator('#subCard .ui-monster-idle-motion--sub')).toHaveCount(1);
 await page.evaluate(()=>new Promise(requestAnimationFrame));
 const initial=await page.evaluate(()=>{
  window.__ranchMainMotion=document.querySelector('#mainCard .ui-monster-idle-motion--main');
  window.__ranchSubMotion=document.querySelector('#subCard .ui-monster-idle-motion--sub');
  window.__ranchAnimationCancels={main:0,sub:0};
  window.__ranchMainMotion.addEventListener('animationcancel',()=>window.__ranchAnimationCancels.main++);
  window.__ranchSubMotion.addEventListener('animationcancel',()=>window.__ranchAnimationCancels.sub++);
  return {kills:g.kills,mainTime:window.__ranchMainMotion.getAnimations()[0]?.currentTime,subTime:window.__ranchSubMotion.getAnimations()[0]?.currentTime};
 });
 await page.evaluate(()=>document.getElementById('autoFight').click());
 await page.waitForFunction(kills=>g.kills>=kills+3,initial.kills,{timeout:8000});
 const result=await page.evaluate(()=>({
  kills:g.kills,
  mainPreserved:window.__ranchMainMotion===document.querySelector('#mainCard .ui-monster-idle-motion--main'),
  subPreserved:window.__ranchSubMotion===document.querySelector('#subCard .ui-monster-idle-motion--sub'),
  mainConnected:window.__ranchMainMotion.isConnected,subConnected:window.__ranchSubMotion.isConnected,
  mainAnimation:getComputedStyle(window.__ranchMainMotion).animationName,subAnimation:getComputedStyle(window.__ranchSubMotion).animationName,
  mainPlayState:window.__ranchMainMotion.getAnimations()[0]?.playState,subPlayState:window.__ranchSubMotion.getAnimations()[0]?.playState,
  mainTime:window.__ranchMainMotion.getAnimations()[0]?.currentTime,subTime:window.__ranchSubMotion.getAnimations()[0]?.currentTime,
  animationCancels:window.__ranchAnimationCancels
 }));
 await page.evaluate(()=>{g.autoFight=false;render()});
 expect(result.kills).toBeGreaterThanOrEqual(initial.kills+3);
 expect(result.mainPreserved).toBe(true);expect(result.subPreserved).toBe(true);
 expect(result.mainConnected).toBe(true);expect(result.subConnected).toBe(true);
 expect(result.mainAnimation).toBe('ranch-idle-bob');expect(result.subAnimation).toBe('ranch-idle-bob');
 expect(result.mainPlayState).toBe('running');expect(result.subPlayState).toBe('running');
 expect(result.mainTime).toBeGreaterThan(initial.mainTime);expect(result.subTime).toBeGreaterThan(initial.subTime);
 expect(result.animationCancels).toEqual({main:0,sub:0});
});
test('selected monsters lock themselves and hover does not shift game controls',async({page})=>{
 await page.goto('./');
 await page.evaluate(()=>{const added=[monster('森スライム'),monster('森スライム')];g.slimes.push(...added);g.main=g.slimes[0].id;g.sub=added[0].id;g.kills=3;g.tiles.fill('magic');g.slimes.forEach(m=>{m.locked=false;delete m.autoLocked});invalidateMonsterInventory();render()});
 expect(await page.evaluate(()=>g.slimes.filter(m=>m.id===+g.main||m.id===+g.sub).every(m=>m.locked))).toBe(true);
 await page.click('[data-tab=ranch]');
 await page.locator('#ranchOpenFusion').click();
 await expect(page.locator('#fuseB option')).toHaveCount(1);
 await expect(page.locator('label[for="fuseB"]')).toHaveText('合成素材');
 await page.locator('#uiFusion [data-dialog-close]').click();
 await page.locator('#ranchOpenMonsterInventory').click();
 await page.waitForTimeout(300);
 const card=page.locator('#monsterList .mcard').first();
 const before=await card.boundingBox();await page.mouse.move(before.x+Math.min(12,before.width/2),before.y+Math.min(12,before.height/2));await page.waitForTimeout(200);const after=await card.boundingBox();
 expect(after.x).toBe(before.x);expect(after.y).toBe(before.y);
  await page.locator('[data-dialog-close="monsterInventoryDialog"]').click();
 await page.click('[data-tab=battle]');
 await page.waitForTimeout(300);
 const auto=page.locator('#autoFight'),autoBefore=await auto.boundingBox();await page.mouse.move(autoBefore.x+autoBefore.width/2,autoBefore.y+autoBefore.height/2);await page.waitForTimeout(200);const autoAfter=await auto.boundingBox();
 expect(autoAfter.x).toBe(autoBefore.x);expect(autoAfter.y).toBe(autoBefore.y);
 await expect.poll(()=>page.locator('#teamSprites .sprite').first().evaluate(el=>getComputedStyle(el).animationName)).toBe('slime-idle');
 await expect.poll(()=>page.locator('#enemySprite').evaluate(el=>getComputedStyle(el).animationName)).toBe('slime-idle');
});
test('auto attack setting survives a browser reload',async({page})=>{
 await page.goto('./');await page.click('[data-tab=battle]');
 await page.locator('#autoFight').evaluate(button=>button.click());
 await expect(page.locator('#autoFight')).toHaveAttribute('aria-pressed','true');
 await page.reload();
 expect(await page.evaluate(()=>g.autoFight)).toBe(true);
 await expect(page.locator('#autoFight')).toHaveAttribute('aria-pressed','true');
});
test('turning auto attack off cancels its pending attack timer',async({page})=>{
 await page.goto('./');await page.click('[data-tab=battle]');
 const timer=await page.evaluate(()=>{window.__autoCalls=0;const realBattle=battle;window.battle=(...args)=>{if(args[0])window.__autoCalls++;return realBattle(...args)};g.autoFight=true;syncAutoFightTimer();const started=autoFightTimer!==null;g.autoFight=false;syncAutoFightTimer();return {started,stopped:autoFightTimer===null}});
 expect(timer).toEqual({started:true,stopped:true});await page.waitForTimeout(900);expect(await page.evaluate(()=>window.__autoCalls)).toBe(0);
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
test('1920×1080 packaged viewport keeps each game tab on screen, and phone width has no horizontal overflow',async({page})=>{
 await page.setViewportSize({width:1920,height:1080});
 await page.goto('./');
 for(const tab of ['field','ranch','battle','worldtree']){
  await page.locator(`[data-tab="${tab}"]`).evaluate(button=>button.click());
  const size=await page.evaluate(()=>({width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,viewportWidth:innerWidth,viewportHeight:innerHeight}));
  expect(size.width,`${tab} width`).toBeLessThanOrEqual(size.viewportWidth);
  expect(size.height,`${tab} height`).toBeLessThanOrEqual(size.viewportHeight);
 }
 await page.locator('[data-tab="ranch"]').click();
 await page.evaluate(()=>{
  const main=g.slimes.find(m=>m.id===Number(g.main));
  main.debugOmni=true;main.uniq=Array.from({length:13},(_,i)=>({type:['hp','atk','def','spd','crit','critDmg','maso','masoGain','heart','drop','success'][i%11],name:'ステータス'+i,value:100}));
  const sub={...structuredClone(main),id:Math.max(...g.slimes.map(m=>m.id))+1,name:'サブモンスター'};
  g.slimes.push(sub);g.sub=sub.id;g.kills=Math.max(g.kills,3);render();
 });
 const ranchFill=await page.evaluate(()=>{
  const card=document.querySelector('#mainCard>.mcard'),scene=card.querySelector('.mhead'),last=card.lastElementChild,sprite=scene.querySelector('.ui-monster-idle-motion--main'),stats=scene.querySelector(':scope > div');
  return {sceneHeight:scene.getBoundingClientRect().height,sceneMinHeight:parseFloat(getComputedStyle(scene).minHeight),cardBottom:card.getBoundingClientRect().bottom,lastBottom:last.getBoundingClientRect().bottom,scrollHeight:document.documentElement.scrollHeight,clientHeight:document.documentElement.clientHeight,viewportHeight:innerHeight,spriteWidth:sprite.getBoundingClientRect().width,spriteStatsGap:stats.getBoundingClientRect().top-sprite.getBoundingClientRect().bottom};
 });
 expect(ranchFill.sceneHeight).toBeGreaterThan(ranchFill.sceneMinHeight);
 expect(ranchFill.cardBottom-ranchFill.lastBottom).toBeLessThanOrEqual(14);
 expect(ranchFill.spriteWidth).toBeGreaterThanOrEqual(220);
 expect(ranchFill.spriteStatsGap).toBeGreaterThanOrEqual(0);
 expect(ranchFill.spriteStatsGap).toBeLessThanOrEqual(36);
 expect(ranchFill.scrollHeight).toBeLessThanOrEqual(ranchFill.clientHeight);
 expect(ranchFill.scrollHeight).toBeLessThanOrEqual(ranchFill.viewportHeight);
 for(const height of [960,900,889]){
  await page.setViewportSize({width:1920,height});
  const compact=await page.evaluate(()=>({scrollHeight:document.documentElement.scrollHeight,clientHeight:document.documentElement.clientHeight,viewportHeight:innerHeight,cardBottom:document.querySelector('#mainCard>.mcard').getBoundingClientRect().bottom,subBottom:document.querySelector('#uiSubCompanion #subCard>.mcard').getBoundingClientRect().bottom}));
  expect(compact.scrollHeight,`F11 ${height}px document`).toBeLessThanOrEqual(compact.clientHeight);
  expect(compact.scrollHeight,`F11 ${height}px viewport`).toBeLessThanOrEqual(compact.viewportHeight);
  expect(compact.cardBottom,`F11 ${height}px main card`).toBeLessThanOrEqual(height);
  expect(compact.subBottom,`F11 ${height}px sub card`).toBeLessThanOrEqual(height);
 }
 await page.setViewportSize({width:390,height:844});
 for(const tab of ['field','ranch','battle','worldtree']){
  await page.locator(`[data-tab="${tab}"]`).evaluate(button=>button.click());
  const size=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewportWidth:innerWidth}));
  expect(size.width,`${tab} phone width`).toBeLessThanOrEqual(size.viewportWidth);
 }
});
test('scene art assets load at their intended game resolutions',async({page})=>{
 await page.goto('./');
 const dimensions=await page.evaluate(async()=>{
  const sources=[
   ...['empty','monster','mana','treasure'].map(name=>`assets/game-art/field/${name}.webp`),
   ...Array.from({length:10},(_,i)=>`assets/game-art/world-tree/stage-${String(i+1).padStart(2,'0')}.webp`),
   'assets/game-art/ranch/ranch-background.webp',
   ...['normal-ruins','normal-forest','normal-frozen','normal-volcanic','boss-eclipse','boss-sky-fortress','boss-crystal-cavern','boss-world-tree'].map(name=>`assets/game-art/battle/${name}.webp`)
  ];
  const results=[];
  for(const src of sources){
   const image=new Image();
   results.push(await new Promise(resolve=>{image.onload=()=>resolve([image.naturalWidth,image.naturalHeight]);image.onerror=()=>resolve(null);image.src=src}));
   image.src='';
  }
  return results;
 });
 expect(dimensions.slice(0,4)).toEqual(Array(4).fill([512,512]));
 expect(dimensions.slice(4,14)).toEqual(Array(10).fill([1920,1080]));
 expect(dimensions[14]).toEqual([1920,1080]);
 expect(dimensions.slice(15)).toEqual(Array(8).fill([1920,660]));
});
test('battle backgrounds use fixed five-stage scene groups and decode before swapping',async({page})=>{
 await page.goto('./');await page.locator('[data-tab="battle"]').click();
 await expect(page.locator('#battle .fight')).toHaveAttribute('data-backdrop','normal-ruins');
 await page.evaluate(()=>{g.stage=2;g.enemyHP=enemyMax(g.stage);render()});
 await expect(page.locator('#battle .fight')).toHaveAttribute('data-backdrop','normal-ruins');
 await page.evaluate(()=>{g.stage=3;g.enemyHP=enemyMax(g.stage);render()});
 await expect(page.locator('#battle .fight')).toHaveAttribute('data-backdrop','normal-ruins');
 await page.evaluate(()=>{g.stage=5;g.enemyHP=enemyMax(g.stage);render()});
 await expect(page.locator('#battle .fight')).toHaveAttribute('data-backdrop','normal-ruins');
 await page.evaluate(()=>{g.stage=6;g.enemyHP=enemyMax(g.stage);render()});
 await expect(page.locator('#battle .fight')).toHaveAttribute('data-backdrop','boss-eclipse');
 await expect.poll(()=>page.locator('#battle .fight').evaluate(e=>getComputedStyle(e).backgroundImage)).toContain('boss-eclipse.webp');
 await page.evaluate(()=>{g.stage=10;g.enemyHP=enemyMax(g.stage);render()});
 await expect(page.locator('#battle .fight')).toHaveAttribute('data-backdrop','boss-eclipse');
 await page.evaluate(()=>{g.stage=11;g.enemyHP=enemyMax(g.stage);render()});
 await expect(page.locator('#battle .fight')).toHaveAttribute('data-backdrop','normal-forest');
 await expect.poll(()=>page.locator('#battle .fight').evaluate(e=>getComputedStyle(e).backgroundImage)).toContain('normal-forest.webp');
});
test('battle combatant sprites sit directly above their HP bars',async({page})=>{
 await page.goto('./');await page.locator('[data-tab="battle"]').click();
 const positions=await page.evaluate(()=>{
  const gap=(image,hp)=>{const a=image.getBoundingClientRect(),b=hp.getBoundingClientRect();return {imageBottom:a.bottom,hpTop:b.top,gap:b.top-a.bottom,width:a.width,height:a.height}};
  return {team:gap(document.querySelector('#teamSprites .sprite'),document.querySelector('#teamCard .hp')),enemy:gap(document.querySelector('#enemySprite'),document.querySelector('#enemyCard .hp'))};
 });
 for(const side of [positions.team,positions.enemy]){expect(side.gap).toBeGreaterThanOrEqual(0);expect(side.gap).toBeLessThanOrEqual(10)}
 expect(positions.team.width).toBeGreaterThanOrEqual(118);
 expect(positions.team.height).toBeGreaterThanOrEqual(138);
});
test('save export/import preserves progress, zero currency and equipment',async({page})=>{
 await page.goto('./');
 await page.evaluate(()=>{
  g.maso=0;g.stage=7;g.maxStage=12;g.kills=20;
  treasureDebugGive('normal');treasureOpenChest(g.treasureChests.at(-1).id);
  treasureApplyCharm('main',g.treasureCharms.at(-1).id);save();
 });
 const original=await page.evaluate(()=>({id:g.main,equip:g.treasureEquip.main,name:main().name}));
 await page.click('#uiSettingsButton');
 const downloaded=page.waitForEvent('download');
 await page.click('#saveExport');
 expect((await downloaded).suggestedFilename()).toMatch(/\.save\.json$/);
 const text=await page.locator('#saveTransferText').inputValue();
 expect(JSON.parse(text).state.maso).toBe(0);
 await page.evaluate(()=>{g.maso=999;g.stage=1;g.treasureEquip.main=null;save();});
 await page.locator('#saveImportFile').setInputFiles({name:'old.save.json',mimeType:'application/json',buffer:Buffer.from(text)});
  await expect(page.locator('#gameConfirmDialog')).toBeVisible();await page.locator('#gameConfirmAccept').click();
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
 await page.locator('#saveImportFile').setInputFiles({name:'valid.json',mimeType:'application/json',buffer:Buffer.from(state)});
  await expect(page.locator('#gameConfirmDialog')).toBeVisible();await page.locator('#gameConfirmCancel').click();
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
 for(let i=0;i<3;i++){await page.goto('./');await expect(page.locator('#fieldCanvas')).toBeVisible();await expect(page.locator('#uiCollect')).toHaveCount(0);}
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
test('ranch header, capacity upgrades, monster layout and sub charm stats work',async({page})=>{
 await page.goto('./');
 await page.click('[data-tab=ranch]');
 expect(await page.locator('#headerMonsterCount').textContent()).toBe('1 / 100');
 expect(await page.locator('#kills').count()).toBe(0);
 const resourceLabels=await page.locator('header .resource small').allTextContents();expect(resourceLabels).toEqual(['✨ 魔素','🐾 モンスター','💗 ハート']);
 const layout=await page.evaluate(()=>{const main=document.getElementById('mainCard').getBoundingClientRect(),stats=document.getElementById('ranchTeamStats').getBoundingClientRect(),sub=document.getElementById('uiSubCompanion').getBoundingClientRect();return {mainX:main.x,statsX:stats.x,statsY:stats.y,statsBottom:stats.bottom,subX:sub.x,subY:sub.y}});
 expect(layout.mainX).toBeLessThan(layout.statsX);expect(layout.subX).toBe(layout.statsX);expect(layout.subY).toBeGreaterThanOrEqual(layout.statsBottom);
 await page.locator('#ranchOpenMonsterInventory').click();
 await page.evaluate(()=>{g.maso=1000;render();});
 await page.click('#capacityUp');
 expect(await page.evaluate(()=>({capacity:cap(),price:capCost(),header:document.getElementById('headerMonsterCount').textContent}))).toEqual({capacity:110,price:405,header:'1 / 110'});
 const charmStats=await page.evaluate(()=>{
  const partner=monster('森スライム');partner.name='装備確認用サブ';g.slimes.push(partner);g.kills=5;g.sub=partner.id;
  const charm={id:g.treasureNextId++,rarity:'normal',name:'検証用',effects:[{key:'atk',label:'攻撃力',mult:2}]};g.treasureCharms.push(charm);treasureApplyCharm('sub',charm.id);
  return {sub:singleStats(partner).atk,base:treasureOriginalSingleStats(partner).atk,team:teamBattleStats().atk,main:singleStats(main()).atk};
 });
 expect(charmStats.sub).toBe(charmStats.base*2);expect(charmStats.team).toBe(charmStats.sub+charmStats.main);
 expect(await page.locator('#headerMonsterCount').textContent()).toBe('2 / 110');
 await expect(page.locator('#uiSubCompanion #subCard')).toContainText('装備確認用サブ');
 expect(await page.locator('#uiSubCompanion .ui-monster-idle-motion').evaluate(e=>getComputedStyle(e).animationName)).toBe('ranch-idle-bob');
 expect(await page.locator('#mainCard .mhead').evaluate(e=>getComputedStyle(e).backgroundPositionY)).toContain('56%');
});
test('ranch selection rows fit the name limit and extend the main monster frame to the sub card bottom',async({page})=>{
 await page.goto('./');await page.click('[data-tab=ranch]');
 const desktop=await page.evaluate(()=>({
  intro:document.querySelector('#ranch .ranch-layout>.panel>p')?.textContent||'',
  rows:[...document.querySelectorAll('.ui-monster-select-row')].map(row=>({
   width:row.getBoundingClientRect().width,selectWidth:row.querySelector('select').getBoundingClientRect().width,
   button:row.querySelector('button')?.textContent.trim(),buttonWidth:row.querySelector('button')?.getBoundingClientRect().width,selectRight:row.querySelector('select').getBoundingClientRect().right,
   buttonLeft:row.querySelector('button')?.getBoundingClientRect().left
  })),
  mainMinHeight:getComputedStyle(document.querySelector('#mainCard .mhead')).minHeight,
  mainCardHeight:document.querySelector('#mainCard>.mcard').getBoundingClientRect().height,
  mainSpriteWidth:document.querySelector('#mainCard .ui-monster-idle-motion--main').getBoundingClientRect().width,
  mainBackgroundPosition:getComputedStyle(document.querySelector('#mainCard .mhead')).backgroundPositionY
 }));
 expect(desktop.intro).toBe('');expect(desktop.rows).toHaveLength(2);
 for(const row of desktop.rows){expect(row.selectWidth).toBeLessThan(row.width);expect(row.buttonLeft).toBeGreaterThanOrEqual(row.selectRight)}
 expect(desktop.rows.map(row=>row.button)).toEqual(['宝箱/装備','宝箱/装備']);
 expect(desktop.rows[0].buttonWidth).toBe(desktop.rows[1].buttonWidth);
 expect(desktop.mainMinHeight).toBe('260px');expect(desktop.mainSpriteWidth).toBe(224);expect(desktop.mainBackgroundPosition).toContain('56%');
 await page.evaluate(()=>{const partner=monster('森スライム');g.slimes.push(partner);g.sub=partner.id;g.kills=3;render()});
 const aligned=await page.evaluate(()=>({mainPanelBottom:document.querySelector('.ranch-layout>.panel').getBoundingClientRect().bottom,sideStackBottom:document.querySelector('.ranch-side-stack').getBoundingClientRect().bottom,mainFrameBottom:document.querySelector('#mainCard>.mcard').getBoundingClientRect().bottom,subFrameBottom:document.querySelector('#subCard>.mcard').getBoundingClientRect().bottom,mainHeight:document.querySelector('#mainCard>.mcard').getBoundingClientRect().height,subHeight:document.querySelector('#subCard>.mcard').getBoundingClientRect().height,subBadgePadding:getComputedStyle(document.querySelector('#subCard .trait')).paddingTop}));
 expect(aligned.mainPanelBottom).toBeCloseTo(aligned.sideStackBottom,0);expect(aligned.mainFrameBottom).toBeCloseTo(aligned.subFrameBottom,0);expect(aligned.mainHeight).toBeGreaterThan(aligned.subHeight);expect(aligned.subHeight).toBeCloseTo(312,2);expect(aligned.subBadgePadding).toBe('5px');
 const optionLabels=await page.evaluate(()=>['mainSelect','subSelect','fuseA','fuseB'].flatMap(id=>[...document.getElementById(id).options].map(option=>option.textContent)));
 expect(optionLabels.every(text=>!/\s\/\s.*系$/.test(text))).toBe(true);
 await expect(page.locator('.treasure-equip-action')).toHaveCount(0);
 const maxSkillCard=await page.evaluate(()=>{
  const partner=g.slimes.find(m=>m.id===Number(g.sub)),skillNames=RANCH_STAT_RULES.map(([,name])=>name);partner.name='あ'.repeat(16);partner.uniq=Array.from({length:16},(_,i)=>({type:RANCH_STAT_RULES[i%RANCH_STAT_RULES.length][0],name:skillNames[i%skillNames.length],value:123456789}));render();
  const card=document.querySelector('#subCard>.mcard'),select=document.getElementById('subSelect'),row=select.parentElement;
  const fullHeight=card.getBoundingClientRect().height;card.style.height='auto';const naturalHeight=card.getBoundingClientRect().height;card.style.height='312px';partner.uniq=partner.uniq.slice(0,2);render();
  const mainMonster=main(),savedSkills=mainMonster.uniq;mainMonster.uniq=Array.from({length:16},(_,i)=>({type:RANCH_STAT_RULES[i%RANCH_STAT_RULES.length][0],name:skillNames[i%skillNames.length],value:123456789}));render();
  const mainCard=document.querySelector('#mainCard>.mcard');mainCard.style.height='auto';const mainNaturalHeight=mainCard.getBoundingClientRect().height;mainCard.style.removeProperty('height');mainMonster.uniq=savedSkills;render();
  return {height:fullHeight,naturalHeight,shortHeight:card.getBoundingClientRect().height,mainCardHeight:document.querySelector('#mainCard>.mcard').getBoundingClientRect().height,mainNaturalHeight,scrollHeight:card.scrollHeight,clientHeight:card.clientHeight,selectWidth:select.getBoundingClientRect().width,rowWidth:row.getBoundingClientRect().width,mainHeight:getComputedStyle(document.querySelector('#mainCard .mhead')).minHeight};
 });
 expect(maxSkillCard.height).toBeCloseTo(312,2);expect(maxSkillCard.naturalHeight).toBeGreaterThan(maxSkillCard.height);expect(maxSkillCard.shortHeight).toBeCloseTo(maxSkillCard.height,2);expect(maxSkillCard.clientHeight).toBeCloseTo(310,0);
 expect(maxSkillCard.selectWidth).toBeLessThan(maxSkillCard.rowWidth);expect(maxSkillCard.mainHeight).toBe('260px');expect(maxSkillCard.mainCardHeight).toBeGreaterThan(maxSkillCard.height);
 await page.click('[data-tab="field"]');
 const fieldMessage=await page.locator('#fieldMsg').evaluate(el=>({width:el.getBoundingClientRect().width,field:el.parentElement.querySelector('.field-wrap').getBoundingClientRect().width,height:el.getBoundingClientRect().height,lineHeight:parseFloat(getComputedStyle(el).lineHeight)}));
 expect(Math.abs(fieldMessage.width-fieldMessage.field)).toBeLessThan(2);expect(fieldMessage.height).toBeLessThan(45);expect(fieldMessage.height).toBeGreaterThanOrEqual(fieldMessage.lineHeight);
 await page.setViewportSize({width:390,height:844});
 const mobile=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,rows:[...document.querySelectorAll('.ui-monster-select-row')].map(row=>({row:row.getBoundingClientRect().width,select:row.querySelector('select').getBoundingClientRect().width}))}));
 expect(mobile.scrollWidth).toBeLessThanOrEqual(mobile.viewport);expect(mobile.rows).toHaveLength(2);
 for(const row of mobile.rows)expect(row.select).toBeLessThanOrEqual(row.row);
});
test('ranch panels remain the same height whether a sub monster is assigned or empty',async({page})=>{
 await page.setViewportSize({width:1920,height:1080});await page.goto('./');await page.locator('[data-tab="ranch"]').click();
 await page.evaluate(()=>{const partner=monster('森スライム');g.slimes.push(partner);window.__testSubMonsterId=partner.id;g.sub=partner.id;g.kills=3;render()});
 const measure=()=>page.evaluate(()=>({layout:document.querySelector('.ranch-layout').getBoundingClientRect().height,mainPanel:document.querySelector('.ranch-layout>.panel').getBoundingClientRect().height,mainCard:document.querySelector('#mainCard>.mcard').getBoundingClientRect().height,sideStack:document.querySelector('.ranch-side-stack').getBoundingClientRect().height,subPanel:document.querySelector('#uiSubCompanion').getBoundingClientRect().height,subCard:document.querySelector('#subCard>.mcard')?.getBoundingClientRect().height??null,scrollHeight:document.documentElement.scrollHeight,viewport:innerHeight}));
 for(const height of [1080,960,900,889]){
  await page.setViewportSize({width:1920,height});const withSub=await measure();
  await page.evaluate(()=>{g.sub=null;render()});const withoutSub=await measure();
  await page.evaluate(()=>{g.sub=window.__testSubMonsterId;render()});
  for(const state of [withSub,withoutSub])expect(Math.abs(state.mainPanel-state.sideStack),`${height}px ranch column bottoms`).toBeLessThanOrEqual(1);
  for(const key of ['layout','mainPanel','mainCard','sideStack','subPanel'])expect(Math.abs(withSub[key]-withoutSub[key]),`${height}px ${key}`).toBeLessThanOrEqual(1);
  for(const state of [withSub,withoutSub])expect(state.scrollHeight,`${height}px page scroll`).toBeLessThanOrEqual(state.viewport);
  expect(withSub.subCard).toBeGreaterThan(0);expect(withoutSub.subCard).toBeNull();
 }
});
test('battle control card uses the requested desktop height without its helper text',async({page})=>{
 await page.goto('./');await page.click('[data-tab=battle]');
 await expect(page.locator('#battle')).not.toContainText('敵を倒して次のステージを解放。');
 const desktop=await page.locator('#battle').evaluate(el=>({screen:el.getBoundingClientRect().height,control:el.querySelector('.battle-control').getBoundingClientRect().height,fight:el.querySelector('.fight').getBoundingClientRect().height,report:el.querySelector(':scope > .panel:last-child').getBoundingClientRect().height,scrollHeight:el.querySelector('.battle-control').scrollHeight,clientHeight:el.querySelector('.battle-control').clientHeight}));
 expect(desktop.screen).toBeCloseTo(900,2);expect(desktop.control).toBeCloseTo(desktop.screen,2);expect(Math.abs(desktop.fight+desktop.report-desktop.screen+14)).toBeLessThan(2);expect(desktop.scrollHeight).toBeGreaterThanOrEqual(desktop.clientHeight);
 await page.setViewportSize({width:390,height:844});
 const mobile=await page.locator('#battle').evaluate(el=>({screen:el.getBoundingClientRect().height,control:el.querySelector('.battle-control').getBoundingClientRect().height,fight:el.querySelector('.fight').getBoundingClientRect().height,documentWidth:document.documentElement.scrollWidth,viewport:innerWidth}));
 expect(mobile.screen).toBeGreaterThan(900);expect(mobile.control).toBeGreaterThan(420);expect(mobile.fight).toBeGreaterThan(300);expect(mobile.documentWidth).toBeLessThanOrEqual(mobile.viewport);
});
test('auto attacks update only battle vitals between results and show floating damage',async({page})=>{
 await page.goto('./');await page.click('[data-tab=battle]');
 await page.evaluate(()=>{g.won=false;g.autoFight=true;g.autoNext=false;g.enemyHP=1e30;g.teamHP=1e30;render();window.__fullRenderCount=0;window.__realRender=window.render;window.render=()=>{window.__fullRenderCount++;return window.__realRender()};battle(true);const popup=document.querySelector('.battle-damage-popup'),card=document.getElementById('enemyCard'),name=document.getElementById('enemyName'),sprite=document.getElementById('enemySprite'),cardTop=card.getBoundingClientRect().top,top=parseFloat(popup.style.top),height=popup.getBoundingClientRect().height;window.__damagePopupGap={top,bottom:top+height,nameBottom:name.getBoundingClientRect().bottom-cardTop,spriteTop:sprite.getBoundingClientRect().top-cardTop};showTab('ranch');battle(true)});
 const status=await page.evaluate(()=>({renderCount:window.__fullRenderCount,lastHit:g.lastHit,enemyText:document.getElementById('enemyHP').textContent,teamText:document.getElementById('teamHP').textContent}));
 expect(status.renderCount).toBe(0);expect(status.lastHit.damage).toBeGreaterThan(0);expect(status.enemyText).toContain('HP ');expect(status.teamText).toContain('HP ');
 const popup=page.locator('#enemyCard .battle-damage-popup');await expect(popup).toHaveCount(1);await expect(popup).toContainText('−');
 const popupInNameGap=await page.evaluate(()=>window.__damagePopupGap);expect(popupInNameGap.top).toBeGreaterThanOrEqual(popupInNameGap.nameBottom);expect(popupInNameGap.bottom).toBeLessThanOrEqual(popupInNameGap.spriteTop);
 await page.evaluate(()=>{window.render=window.__realRender;g.autoFight=false;render()});
});
test('battle result refresh skips hidden inventories and grows stage options incrementally',async({page})=>{
 await page.goto('./');
 await page.evaluate(()=>{
  g.slimes.push(...Array.from({length:40},()=>monster('森スライム')));
  g.autoNext=false;g.autoFight=false;g.won=false;g.enemyHP=1;g.teamHP=teamMax();main().atk=1e30;Math.random=()=>.99;
  render();
  window.__firstStageOption=document.querySelector('#stageSelect option');
  document.querySelector('#monsterList').innerHTML='<span id="inventory-sentinel">stale</span>';
  document.querySelector('#bulkMaterialList').innerHTML='<span id="bulk-sentinel">stale</span>';
  battle(true);
 });
 expect(await page.locator('#inventory-sentinel').textContent()).toBe('stale');
 expect(await page.locator('#bulk-sentinel').textContent()).toBe('stale');
 expect(await page.evaluate(()=>document.querySelector('#stageSelect option')===window.__firstStageOption)).toBe(true);
 expect(await page.locator('#stageSelect option').count()).toBe(2);
 await page.click('[data-tab=ranch]');
 await page.click('#ranchOpenMonsterInventory');
 await expect(page.locator('#monsterList .mcard')).toHaveCount(41);
 await page.locator('[data-dialog-close="monsterInventoryDialog"]').click();
 await page.click('#ranchOpenBulkFusion');
 await expect(page.locator('#bulkMaterialList .bulk-material')).toHaveCount(40);
});
test('ranch team stats keep the requested order after fusion adds stats in reverse order',async({page})=>{
 await page.goto('./');
 const labels=await page.evaluate(()=>{
  const a=main(),b=monster('森スライム');
  b.uniq=[...RANCH_STAT_RULES].reverse().map(([type,name])=>({type,name,value:1}));
  g.slimes.push(b);g.maso=100000;const originalFailRate=failRate;
  try{failRate=()=>0;performFusion(a,b,'pair',null);renderNewRulesUI();}
  finally{failRate=originalFailRate;}
  return [...document.querySelectorAll('#ranchTeamStats .team-stats-grid > div small')].map(el=>el.textContent);
 });
 expect(labels).toEqual(['HP','攻撃力','守備力','素早さ','クリティカル率','クリティカルダメージ','魔素湧き速度','魔素取得量','ハートドロップ率','モンスタードロップ率','合成成功率']);
});
test('monster ranch cards sort added status badges in the fixed order',async({page})=>{
 await page.goto('./');await page.click('[data-tab=ranch]');
 const labels=await page.evaluate(()=>{
  const m=main();m.uniq=[...RANCH_STAT_RULES].reverse().map(([type,name])=>({type,name,value:1}));render();
  return [...document.querySelectorAll('#mainCard .trait.unique')].map(el=>el.textContent.replace(/\s+\+\d+%$/,''));
 });
 expect(labels).toEqual(['HP','攻撃力','守備力','素早さ','クリティカル率','クリティカルダメージ','魔素湧き速度','魔素取得量','ハートドロップ率','モンスタードロップ率','合成成功率']);
});
test('main monster changes keep the idle animation attached to the new sprite',async({page})=>{
 await page.goto('./');await page.click('[data-tab=ranch]');
 const id=await page.evaluate(()=>{const m=monster('森スライム');m.name='切替テスト';g.slimes.push(m);invalidateMonsterInventory();render();return m.id;});
 await page.selectOption('#mainSelect',String(id));
 await expect(page.locator('#teamChangeConfirmDialog')).toBeVisible();
 await page.click('#teamChangeAccept');
 await expect(page.locator('#mainCard')).toContainText('切替テスト');
 const motion=page.locator('#mainCard .ui-monster-idle-motion--main');
 await expect(motion).toHaveCount(1);
 expect(await motion.evaluate(e=>getComputedStyle(e).animationName)).toBe('ranch-idle-bob');
 expect(await motion.locator('.sprite').evaluate(e=>getComputedStyle(e).animationName)).toBe('none');
});
test('main and sub selection use a scientific notation confirmation and can be cancelled',async({page})=>{
 await page.goto('./');await page.click('[data-tab=ranch]');
 const ids=await page.evaluate(()=>{const a=monster('炎スライム'),b=monster('海スライム');a.name='メイン比較用';b.name='サブ比較用';a.atk*=5;b.atk*=4;g.slimes.push(a,b);g.kills=3;invalidateMonsterInventory();render();return [a.id,b.id]});
 const originalMain=await page.evaluate(()=>g.main);
 await page.selectOption('#mainSelect',String(ids[0]));
 await expect(page.locator('#teamChangeConfirmDialog')).toBeVisible();
 await expect(page.locator('#teamChangeDescription')).toContainText('メインモンスター');
 await expect(page.locator('#teamChangeStats')).toContainText('攻撃力');
 await expect(page.locator('#teamChangeStats')).toContainText(/e[+-]\d+/i);
 expect(await page.evaluate(()=>g.main)).toBe(originalMain);
 await page.click('#teamChangeAccept');
 expect(await page.evaluate(()=>g.main)).toBe(ids[0]);
 await page.selectOption('#subSelect',String(ids[1]));
 await expect(page.locator('#teamChangeConfirmDialog')).toBeVisible();
 await expect(page.locator('#teamChangeDescription')).toContainText('サブモンスター');
 await expect(page.locator('#teamChangeStats')).toContainText(/e[+-]\d+/i);
 await page.click('#teamChangeCancel');
 expect(await page.evaluate(()=>g.sub)).toBeNull();
 await expect(page.locator('#teamChangeConfirmDialog')).not.toBeVisible();
});
test('team change preview colors increases, decreases and unchanged stats',async({page})=>{
 await page.goto('./');
 await page.evaluate(()=>{
  const snapshot=()=>({battle:Object.fromEntries(BATTLE_RULES.map(([key])=>[key,1])),farm:Object.fromEntries(FARM_RULES.map(([key])=>[key,1]))});
  const before=snapshot(),after=snapshot();
  after.battle[BATTLE_RULES[0][0]]=3;after.battle[BATTLE_RULES[1][0]]=0.5;
  showTeamChangeConfirm('検証',before,after,()=>{});
 });
 await expect(page.locator('.team-change-direction.is-up').first()).toContainText('上昇');
 await expect(page.locator('.team-change-direction.is-down').first()).toContainText('下降');
 await expect(page.locator('.team-change-direction.is-same').first()).toContainText('変更なし');
 await page.click('#teamChangeCancel');
});
test('ranch team totals use consistent compact numbers and fit inside each stat tile',async({page})=>{
 await page.goto('./');await page.click('[data-tab=ranch]');
 await page.evaluate(()=>{
  teamBattleStats=()=>({hp:7.984896e50,atk:4.46023424e50,def:3.6470784e50,spd:99136252204.99,crit:3699.73,critDmg:18359282.2});
  teamFarmStats=()=>({maso:37393.86,masoGain:1442,heart:23.1,drop:22.88,success:24});
  renderRanchTeamStats();
 });
 const values=await page.locator('#ranchTeamStats .team-stats-grid').first().locator('b').allTextContents();
 expect(values).toEqual(['7.985e+50','4.460e+50','3.647e+50','9.914e+10','3,699.73%','1.836e+7']);
 expect(await page.locator('#ranchTeamStats .team-stats-grid b').evaluateAll(nodes=>nodes.every(node=>node.scrollWidth<=node.clientWidth))).toBe(true);
});
test('active tabs have balanced corner marks and screens use a brief scene change',async({page})=>{
 await page.goto('./');
 const field=page.locator('[data-tab=field]');
 const marks=await field.evaluate(e=>({left:getComputedStyle(e,'::before').content,right:getComputedStyle(e,'::after').content}));
 expect(marks).toEqual({left:'"◆"',right:'"◆"'});
 await page.click('[data-tab=ranch]');
 expect(await page.locator('#ranch').evaluate(e=>e.classList.contains('scene-enter'))).toBe(true);
 expect(await page.locator('#ranch').evaluate(e=>getComputedStyle(e).animationName)).toBe('scene-enter');
});
test('charm controls and modal windows use the shared game UI',async({page})=>{
 await page.goto('./');await page.evaluate(()=>treasureDialog('main'));
  const order=await page.evaluate(()=>{const ids=['treasureSelectUnused','treasureClearSelected','treasureRerollSelected','treasureDeleteSelected'];return ids.map(id=>[...document.querySelector('.treasure-bulk-actions').children].indexOf(document.getElementById(id)));});
  expect(order).toEqual([0,1,2,3]);
 const panel=page.locator('#treasureModal .treasure-panel');
 expect(await panel.evaluate(e=>getComputedStyle(e).borderTopColor)).toBe('rgb(189, 171, 120)');
 await page.locator('#treasureClose').click();
 await page.click('[data-tab=ranch]');
 await page.locator('.ui-ranch-actions').locator('#ranchOpenBulkFusion').click();
 expect(await page.locator('#bulkFusionDialog').evaluate(e=>getComputedStyle(e).borderTopColor)).toBe('rgb(184, 161, 105)');
});
test('bulk fusion tries each selected material once, even when every attempt fails',async({page})=>{
 await page.goto('./');await page.click('[data-tab=ranch]');
 await page.locator('.ui-ranch-actions').locator('#ranchOpenBulkFusion').click();
 await page.evaluate(()=>{
  g.maso=100000;g.slimes.push(monster('森スライム'),monster('森スライム'));render();
  document.querySelectorAll('.bulk-material').forEach(x=>{x.checked=true;x.dispatchEvent(new Event('change',{bubbles:true}));});
  window.__fusionCalls=0;performFusion=()=>{window.__fusionCalls++;return 'fail';};
 });
 await page.click('#bulkFuse');
  await expect(page.locator('#gameConfirmDialog')).toBeVisible();await page.locator('#gameConfirmAccept').click();
 expect(await page.evaluate(()=>window.__fusionCalls)).toBe(2);
 await expect(page.locator('#fuseMsg')).toContainText('失敗 2個');
});
test('bulk fusion completes selected monster and heart materials when the full budget is available',async({page})=>{
 await page.goto('./');await page.click('[data-tab=ranch]');
 await page.locator('.ui-ranch-actions').locator('#ranchOpenBulkFusion').click();
 await page.evaluate(()=>{
  g.maso=100000;g.firstFusionUsed=true;g.slimes.push(monster('森スライム'),monster('森スライム'));failRate=()=>0;render();
  document.querySelectorAll('.bulk-material').forEach(x=>{x.checked=true;x.dispatchEvent(new Event('change',{bubbles:true}));});
 });
 await page.click('#bulkFuse');
  await expect(page.locator('#gameConfirmDialog')).toBeVisible();await page.locator('#gameConfirmAccept').click();
 await expect(page.locator('#fuseMsg')).toContainText('成功 2個');
 expect(await page.evaluate(()=>g.slimes.length)).toBe(1);

 await page.locator('[data-dialog-close="bulkFusionDialog"]').click();
 await page.locator('.ui-ranch-actions').locator('#ranchOpenBulkFusion').click();
 await page.locator('#bulkModeSelect').selectOption('heart');
 await page.evaluate(()=>{
  g.heartItems=[{id:1,type:'attack',name:'攻撃力',value:2},{id:2,type:'hp',name:'HP',value:3}];g.hearts=g.heartItems.length;g.maso=100000;renderNewRulesUI();
  document.querySelectorAll('.bulk-material').forEach(x=>{x.checked=true;x.dispatchEvent(new Event('change',{bubbles:true}));});
 });
 await page.click('#bulkFuse');
  await expect(page.locator('#gameConfirmDialog')).toBeVisible();await page.locator('#gameConfirmAccept').click();
 await expect(page.locator('#fuseMsg')).toContainText('成功 2個');
 expect(await page.evaluate(()=>g.heartItems.length)).toBe(0);
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
test('equipped charms cannot be shared, and the charm selection can be cleared',async({page})=>{
 await page.goto('./');
 const charmId=await page.evaluate(()=>{
  const id=g.treasureNextId++;g.treasureCharms.push({id,rarity:'normal',name:'専用装備',effects:[{key:'atk',label:'攻撃力',mult:1.5}]});
  treasureApplyCharm('main',id);treasureDialog('sub');return id;
 });
 const equipButton=page.locator(`#treasureCharmList button[data-tequip="${charmId}"]`);
 await expect(equipButton).toBeDisabled();await expect(equipButton).toContainText('メイン装備中');
 expect(await page.evaluate(id=>treasureEquipCharm('sub',id),charmId)).toBe(false);
 expect(await page.evaluate(()=>g.treasureEquip.sub)).toBeNull();
 await expect(page.locator('#mainCard')).not.toHaveClass(/treasure-equip-(active|epic|normal)/);
 await page.evaluate(()=>{
  for(let i=0;i<2;i++)g.treasureCharms.push({id:g.treasureNextId++,rarity:'normal',name:'未装備'+i,effects:[{key:'hp',label:'HP',mult:1.2}]});
  renderTreasure();
 });
 await page.locator('#treasureCharmSection summary').click();
 const boxes=page.locator('#treasureCharmList input[data-tselect]:not(:disabled)');
 await boxes.evaluateAll(xs=>xs.forEach(x=>{x.checked=true;}));
 await page.click('#treasureClearSelected');
 expect(await boxes.evaluateAll(xs=>xs.some(x=>x.checked))).toBe(false);
});
test('three un-equipped charms of one rarity reroll into one charm of that rarity',async({page})=>{
 await page.goto('./');
 await page.evaluate(()=>{
  for(let i=0;i<3;i++)g.treasureCharms.push({id:g.treasureNextId++,rarity:'epic',name:'変換素材'+i,effects:[{key:'hp',label:'HP',mult:1.2+i/10}]});
  treasureDialog('main');document.querySelector('#treasureCharmSection summary').click();renderTreasure();
 });
 const choices=page.locator('#treasureCharmList input[data-tselect]:not(:disabled)');
 await choices.evaluateAll(xs=>xs.slice(0,3).forEach(x=>{x.checked=true}));
 await page.click('#treasureRerollSelected');await expect(page.locator('#gameConfirmDialog')).toBeVisible();
 await page.locator('#gameConfirmAccept').click();
 const inventory=await page.evaluate(()=>g.treasureCharms.map(c=>({rarity:c.rarity,effects:c.effects.length})));
 expect(inventory).toHaveLength(1);expect(inventory[0]).toEqual({rarity:'epic',effects:2});
});
test('charm reroll rejects mixed rarity and retains legendary freeze at a total multiplier of exactly ten',async({page})=>{
 await page.goto('./');
 await page.evaluate(()=>{
  for(let i=0;i<3;i++)g.treasureCharms.push({id:g.treasureNextId++,rarity:'legendary',name:'変換素材'+i,effects:[{key:'hp',label:'HP',mult:2},{key:'atk',label:'攻撃力',mult:2},{key:'def',label:'守備力',mult:2}]});
  treasureDialog('main');document.querySelector('#treasureCharmSection summary').click();
  window.__oldRandom=Math.random;window.__rollValues=[0,.5641,.1,.5641,.2,.58974358974];Math.random=()=>window.__rollValues.shift();
  window.__freezeCall=null;treasureFreezePrompt=(...args)=>{window.__freezeCall=args};
 });
 await page.locator('#treasureCharmList input[data-tselect]:not(:disabled)').evaluateAll(xs=>xs.forEach(x=>{x.checked=true}));
 await page.click('#treasureRerollSelected');await page.locator('#gameConfirmAccept').click();
 const result=await page.evaluate(()=>{const charm=g.treasureCharms.at(-1);Math.random=window.__oldRandom;return {count:g.treasureCharms.length,rarity:charm.rarity,total:charm.effects.reduce((n,e)=>n+e.mult,0),freezeCall:window.__freezeCall}});
 expect(result).toEqual({count:1,rarity:'legendary',total:10,freezeCall:[1,null,true]});
 await page.evaluate(()=>{g.treasureCharms.push({id:g.treasureNextId++,rarity:'legendary',name:'レジェンド',effects:[]},{id:g.treasureNextId++,rarity:'epic',name:'エピック',effects:[]},{id:g.treasureNextId++,rarity:'legendary',name:'レジェンド',effects:[]});renderTreasure()});
 await page.locator('#treasureCharmList input[data-tselect]:not(:disabled)').evaluateAll(xs=>xs.slice(-3).forEach(x=>{x.checked=true}));
 await page.click('#treasureRerollSelected');await expect(page.locator('#gameConfirmDialog')).not.toBeVisible();
 await expect(page.locator('#treasureToast')).toContainText('同じレアリティ');
 expect(await page.evaluate(()=>g.treasureCharms.length)).toBe(4);
});
test('bulk fusion shares the regular fusion form style and confirmation uses an in-game dialog',async({page})=>{
 await page.goto('./');
 await page.evaluate(()=>{
  const a=g.slimes[0];for(let i=0;i<2;i++){const m=monster('森スライム');m.id=g.nextId++;m.locked=false;g.slimes.push(m)}
  invalidateMonsterInventory();render();
 });
 await page.locator('[data-tab="ranch"]').click();
 await page.locator('#ranchOpenBulkFusion').click();
 await expect(page.locator('#bulkFusionDialog .fusion-form-panel')).toBeVisible();
 expect(await page.locator('#uiFusion .fusion-form-panel').count()).toBe(1);
 await expect(page.locator('#battleLog')).toHaveCSS('max-height',/3[0-9]{2}px/);
 await page.evaluate(()=>gameConfirm('テスト確認',()=>{}));await expect(page.locator('#gameConfirmDialog')).toBeVisible();
 await page.locator('#gameConfirmCancel').click();await expect(page.locator('#gameConfirmDialog')).not.toBeVisible();
});
test('legendary charms above a total multiplier of ten use the guaranteed freeze sequence',async({page})=>{
 await page.goto('./');
 const result=await page.evaluate(()=>{
  const id=g.treasureNextId++,oldRandom=Math.random,oldPrompt=treasureFreezePrompt;let call=null;
  try{
   g.treasureChests.push({id,rarity:'legendary',source:'test',time:Date.now()});
   Math.random=()=>0.999999;
   treasureFreezePrompt=(...args)=>{call=args};
   treasureOpenChest(id);
   const charm=g.treasureCharms.at(-1);
   return {call:call&&[call[0],call[1],call[2]],total:charm.effects.reduce((n,e)=>n+e.mult,0),effects:charm.effects.length};
  }finally{Math.random=oldRandom;treasureFreezePrompt=oldPrompt;}
 });
 expect(result.effects).toBe(3);expect(result.total).toBeGreaterThan(10);expect(result.call).toEqual([1,null,true]);
});
test('heart drop reaches 100 percent and the field grid fills its backdrop',async({page})=>{
 await page.goto('./');
 const chances=await page.evaluate(()=>{
  const original=teamFarmStats;teamFarmStats=()=>({heart:98.99});const below=heartDropChance();teamFarmStats=()=>({heart:99});const max=heartDropChance();teamFarmStats=original;return {below,max};
 });
 expect(chances.below).toBeCloseTo(0.9999,4);expect(chances.max).toBe(1);
 await page.click('[data-tab=field]');
 await expect(page.locator('#fieldInputHint')).toHaveCount(0);
 await expect(page.locator('#field')).not.toContainText('魔素マスをクリックして採集。ホバー採集を解放すると');
 for(const n of [2,24]){
  const grid=await page.evaluate(n=>{g.lv=SIZES.indexOf(n);g.tiles=Array(n*n).fill('empty');drawField();const z=fieldGeom(),wrap=document.querySelector('.field-wrap'),canvas=document.getElementById('fieldCanvas');return {n:z.n,cell:z.cell,off:z.off,total:z.cell*z.n,canvas:canvas.width,padding:getComputedStyle(wrap).padding};},n);
  expect(grid).toEqual({n,cell:720/n,off:0,total:720,canvas:720,padding:'0px'});
 }
 await page.setViewportSize({width:1280,height:900});
 const desktopFieldWidth=await page.locator('.field-wrap').evaluate(el=>el.getBoundingClientRect().width);
 expect(desktopFieldWidth).toBeGreaterThan(600);
 await page.setViewportSize({width:390,height:844});
 const mobileLayout=await page.evaluate(()=>({field:document.querySelector('.field-wrap').getBoundingClientRect().width,scroll:document.documentElement.scrollWidth}));
 expect(mobileLayout.field).toBeGreaterThan(300);expect(mobileLayout.scroll).toBeLessThanOrEqual(390);
});
test('header, navigation and content keep a stable horizontal position across tabs',async({page})=>{
 await page.goto('./');
 const positions=[];
 for(const tab of ['field','ranch','battle','worldtree']){
  await page.click(`[data-tab="${tab}"]`);
  positions.push(await page.evaluate(()=>({header:document.querySelector('header').getBoundingClientRect().x,nav:document.querySelector('nav').getBoundingClientRect().x,main:document.querySelector('main').getBoundingClientRect().x,scrollbar:getComputedStyle(document.documentElement).scrollbarGutter,width:document.documentElement.scrollWidth})));
 }
 await page.click('#uiCodexButton');
 positions.push(await page.evaluate(()=>({header:document.querySelector('header').getBoundingClientRect().x,nav:document.querySelector('nav').getBoundingClientRect().x,main:document.querySelector('main').getBoundingClientRect().x,scrollbar:getComputedStyle(document.documentElement).scrollbarGutter,width:document.documentElement.scrollWidth})));
 expect(positions.every(p=>p.header===positions[0].header)).toBe(true);
 expect(positions.every(p=>p.main===positions[0].main)).toBe(true);
 expect(positions.every(p=>p.scrollbar.includes('stable')&&p.width<=1280)).toBe(true);
});
test('opening screen fits phone portrait and landscape viewports',async({page})=>{
 await page.addInitScript(()=>{window.__SLIME_E2E__=false;});
 for(const viewport of [{width:390,height:844},{width:360,height:640},{width:844,height:390}]){
  await page.setViewportSize(viewport);
  await page.goto('./');
  await expect(page.locator('#openingScreen')).toBeVisible();
  await expect(page.locator('.opening-frame')).toHaveCSS('opacity','1');
  const layout=await page.evaluate(()=>{
   const frame=document.querySelector('.opening-frame').getBoundingClientRect();
   const buttons=[...document.querySelectorAll('.opening-menu button')].map(el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom}});
   return{width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,frame:{x:frame.x,y:frame.y,right:frame.right,bottom:frame.bottom},buttons};
  });
  expect(layout.scrollWidth).toBeLessThanOrEqual(viewport.width);
  expect(layout.frame.x).toBeGreaterThanOrEqual(0);
  expect(layout.frame.y).toBeGreaterThanOrEqual(0);
  expect(layout.frame.right).toBeLessThanOrEqual(viewport.width+1);
  expect(layout.frame.bottom).toBeLessThanOrEqual(viewport.height+1);
  const artwork=await page.locator('#openingArtwork').evaluate(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return{x:r.x,y:r.y,width:r.width,height:r.height,fit:s.objectFit,duration:s.animationDuration}});
  expect(artwork.x).toBeLessThanOrEqual(0);expect(artwork.y).toBeLessThanOrEqual(0);expect(artwork.width).toBeGreaterThanOrEqual(viewport.width);expect(artwork.height).toBeGreaterThanOrEqual(viewport.height);expect(artwork.fit).toBe('cover');expect(artwork.duration).toBe('18s');
  expect(await page.locator('.opening-shade').evaluate(el=>getComputedStyle(el,'::after').animationName)).toBe('opening-sunlight');
  for(const button of layout.buttons){expect(button.x).toBeGreaterThanOrEqual(0);expect(button.right).toBeLessThanOrEqual(viewport.width+1);expect(button.y).toBeGreaterThanOrEqual(0);expect(button.bottom).toBeLessThanOrEqual(viewport.height+1);}
  await expect(page.locator('#gameStart')).toBeVisible();
  await expect(page.locator('#gameOption')).toBeVisible();
  await expect(page.locator('#gameEnd')).toBeVisible();
  await page.screenshot({path:test.info().outputPath(`opening-${viewport.width}x${viewport.height}.png`),fullPage:true});
 }
});
test('first-run tutorial follows collection, upgrades, fusion, battle and sub-slot unlock',async({page})=>{
 await page.addInitScript(()=>{window.__SLIME_E2E__=false;['slimeRanchCodex1','slimeRanchFinal','slimeRanchGAS_v3','slimeRanchGAS_v2','slimeRanchGAS_v1','slimeRanchPixel_v4','slimeRanchTutorialV1'].forEach(key=>localStorage.removeItem(key))});
 await page.goto('./');
 await expect(page.locator('#openingScreen')).toBeVisible();
 await page.evaluate(()=>{g.maso=80;render();save()});
 await page.click('#gameStart');
 await expect(page.locator('#openingScreen')).toBeHidden();
 await expect(page.locator('#tutorialTitle')).toHaveText('魔素と仲間を集めよう');
 await expect(page.locator('#tutorialSkip')).toHaveText('スキップ');
 const firstTiles=await page.evaluate(()=>({magic:g.tiles.indexOf('magic'),spawn:g.tiles.findIndex(t=>t==='spawn'||t.startsWith('spawn:'))}));
 expect(firstTiles.magic).toBeGreaterThanOrEqual(0);expect(firstTiles.spawn).toBeGreaterThanOrEqual(0);expect(firstTiles.magic).not.toBe(firstTiles.spawn);
 expect(await page.locator('#tutorialDimTop').evaluate(el=>parseFloat(el.style.height))).toBeLessThan(await page.locator('#fieldCanvas').evaluate(el=>el.getBoundingClientRect().top));
 await page.screenshot({path:test.info().outputPath('tutorial-first-step.png')});
 const clickFieldCell=async index=>{
  const point=await page.locator('#fieldCanvas').evaluate((canvas,index)=>{const r=canvas.getBoundingClientRect(),cell=82,off=(720-2*cell)/2;return{x:r.x+(off+(index%2)*cell+cell/2)/720*r.width,y:r.y+(off+Math.floor(index/2)*cell+cell/2)/720*r.height}},index);
  await page.mouse.click(point.x,point.y);
 };
 await clickFieldCell(firstTiles.magic);
 await expect(page.locator('#tutorialTitle')).toHaveText('魔素と仲間を集めよう');
 await clickFieldCell(firstTiles.spawn);
 await expect(page.locator('#tutorialTitle')).toHaveText('フィールドを強化しよう');
 await page.click('#yieldUp');
 await expect(page.locator('#tutorialTitle')).toHaveText('モンスターを合成しよう');
 await expect(page.locator('#tutorialText')).toContainText('画面上部の「合成」ボタン');
  expect(await page.evaluate(()=>g.dragCollectUnlocked)).toBe(false);
 await page.click('[data-tab="ranch"]');
 await expect(page.locator('.ui-ranch-actions button').first()).toHaveClass(/tutorial-focus/);
 await expect(page.locator('#tutorialText')).toContainText('画面上部の「合成」ボタンを押そう');
 await expect(page.locator('#uiFusion')).not.toHaveJSProperty('open',true);
 await page.locator('.ui-ranch-actions button').first().click();
 await expect(page.locator('#uiFusion')).toHaveJSProperty('open',true);
 await expect(page.locator('#tutorialText')).toContainText('合成画面が開きました');
  await expect(page.locator('#fuseA')).toHaveClass(/tutorial-focus/);
  await expect(page.locator('#fuseB')).toHaveClass(/tutorial-focus/);
  await expect(page.locator('#fuse')).toHaveClass(/tutorial-focus/);
  await expect(page.locator('label[for="fuseA"]')).toHaveText('合成元');
   await expect(page.locator('label[for="fuseB"]')).toHaveText('合成素材');
   const fusionHighlight=await page.evaluate(()=>{const nodes=['label[for="fuseA"]','#fuseA','label[for="fuseB"]','#fuseB','#fuse'].map(s=>document.querySelector(s)).filter(e=>e&&e.getClientRects().length);return{expected:Math.max(0,Math.min(...nodes.map(e=>e.getBoundingClientRect().top))-8),actual:parseFloat(document.getElementById('tutorialDimTop').style.height)}});
  expect(Math.abs(fusionHighlight.expected-fusionHighlight.actual)).toBeLessThan(2);
  await expect(page.locator('#fuseCost')).toHaveText('初回無料');
  await expect(page.locator('#fuseChance')).toHaveText('100%（初回保証）');
 await expect.poll(()=>page.locator('#fuse').evaluate(el=>{const r=el.getBoundingClientRect();return Math.abs((r.top+r.bottom)/2-innerHeight/2)})).toBeLessThan(80);
  const masoBeforeFirstFusion=await page.evaluate(()=>g.maso);
  await page.evaluate(()=>{window.__beforeFusionRandom=Math.random;Math.random=()=>.999999;});
 await page.click('#fuse');
  await page.evaluate(()=>{Math.random=window.__beforeFusionRandom;});
  expect(await page.evaluate(()=>({used:g.firstFusionUsed,wins:g.wins,fails:g.fails,maso:g.maso}))).toEqual({used:true,wins:1,fails:0,maso:masoBeforeFirstFusion});
 await expect(page.locator('#tutorialTitle')).toHaveText('バトルに挑戦しよう');
 await page.click('[data-tab="battle"]');
  await expect(page.locator('#attack')).toHaveClass(/tutorial-focus/);
  const battleHighlight=await page.evaluate(()=>{const r=document.getElementById('battle').getBoundingClientRect();return{expected:Math.max(0,r.top-8),actual:parseFloat(document.getElementById('tutorialDimTop').style.height)}});
  expect(Math.abs(battleHighlight.expected-battleHighlight.actual)).toBeLessThan(2);
 await page.evaluate(()=>{g.autoNext=false;g.autoFight=false;save()});
 for(const stage of [1,2,3]){
  await page.evaluate(stage=>{setStage(stage);g.enemyHP=1;render();save()},stage);
  await page.click('#attack');
 }
 await expect(page.locator('#tutorialTitle')).toHaveText('仲間をもう1体迎えよう');
 await expect(page.locator('#subCard')).toContainText('仲間にするとサブ枠に編成できます');
 expect(await page.evaluate(()=>g.kills)).toBe(3);
 await page.click('[data-tab="field"]');
 await expect(page.locator('#fieldCanvas')).toHaveClass(/tutorial-focus/);
  const tutorialSpawn=await page.evaluate(()=>g.tiles.findIndex(t=>typeof t==='string'&&t.startsWith('spawn:')));
  expect(tutorialSpawn).toBeGreaterThanOrEqual(0);
  await clickFieldCell(tutorialSpawn);
 await expect(page.locator('#tutorialTitle')).toHaveText('サブモンスターを編成しよう');
 await page.click('[data-tab="ranch"]');
 await expect(page.locator('#subSelect')).toBeEnabled();
 const subId=await page.evaluate(()=>g.slimes.find(m=>m.id!==+g.main).id);
 await page.locator('#subSelect').selectOption(String(subId));
 await expect(page.locator('#teamChangeConfirmDialog')).toBeVisible();
 await page.click('#teamChangeAccept');
 await expect(page.locator('#tutorialTitle')).toHaveText('チュートリアル完了');
 await expect(page.locator('#tutorialContinue')).toBeVisible();
 await expect(page.locator('#tutorialSkip')).toBeHidden();
 await page.click('#tutorialContinue');
 await page.click('#uiCodexButton');
 await page.click('#tutorialReplay');
 await expect(page.locator('#tutorialTitle')).toHaveText('魔素と仲間を集めよう');
 await page.click('#tutorialSkip');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('slimeRanchTutorialV1')).done)).toBe(true);
});
test('tutorial highlights never run outside the active tutorial',async({page})=>{
 await page.addInitScript(()=>{window.__SLIME_E2E__=false});
 await page.addInitScript(()=>localStorage.setItem('slimeRanchTutorialV1',JSON.stringify({step:3,magic:true,monster:true,inProgress:false,done:true})));
 await page.goto('./');
 await page.click('#gameStart');
 await expect(page.locator('#tutorialOverlay')).toBeHidden();
 await page.click('[data-tab="ranch"]');
 await page.locator('.ui-ranch-actions button').first().click();
 await expect(page.locator('#uiFusion')).toHaveJSProperty('open',true);
 await expect(page.locator('body')).not.toHaveClass(/tutorial-active/);
 await expect(page.locator('[data-tab="battle"]')).not.toHaveClass(/tutorial-focus/);
 await expect(page.locator('.ui-ranch-actions button').first()).not.toHaveClass(/tutorial-focus/);
});
test('new starter slime can win the first three stages',async({page})=>{
 await page.goto('./');
 await expect.poll(()=>page.evaluate(()=>g.slimes.length)).toBe(1);
 expect(await page.evaluate(()=>g.slimes[0].hp)).toBe(120);
  expect(await page.evaluate(()=>g.slimes[0].level)).toBe(1);
  expect(await page.evaluate(()=>g.sub)).toBeNull();
 await page.evaluate(()=>{g.autoNext=false;g.autoFight=false;showTab('battle');});
 for(const stage of [1,2,3]){
  await page.evaluate(stage=>setStage(stage),stage);
  let attacks=0;
  while(!(await page.evaluate(()=>g.won))&&attacks<30){await page.click('#attack');attacks++}
  expect(await page.evaluate(()=>g.won),`stage ${stage} should be clearable`).toBe(true);
 }
 expect(await page.evaluate(()=>g.maxStage)).toBe(4);
});

test('game controls read as raised actions beside the quieter display panels',async({page})=>{
 await page.goto('./');
 await page.evaluate(()=>showTab('battle'));
 const affordance=await page.evaluate(()=>{
  const button=document.querySelector('#attack'),panel=document.querySelector('#battle>.panel');
  return{cursor:getComputedStyle(button).cursor,buttonBorder:getComputedStyle(button).borderTopColor,panelBorder:getComputedStyle(panel).borderTopColor,shadow:getComputedStyle(button).boxShadow};
 });
 expect(affordance.cursor).toBe('pointer');
 expect(affordance.buttonBorder).not.toBe(affordance.panelBorder);
 expect(affordance.shadow).toContain('rgb(17, 20, 24)');
});
