const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({
 testDir:'./tests',
 timeout:30000,
 retries:process.env.CI?1:0,
 workers:2,
 reporter:[['list'],['html',{open:'never'}]],
 use:{
  baseURL:'http://127.0.0.1:4173/SlimeRanch/',
  viewport:{width:1280,height:900},
  trace:'retain-on-failure',
  launchOptions:process.env.PLAYWRIGHT_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH}:{}
 },
 webServer:{command:'node scripts/serve.cjs',url:'http://127.0.0.1:4173/SlimeRanch/',reuseExistingServer:!process.env.CI},
});
