const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('@playwright/test');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'assets/game-art/world-tree/ascension.webm');
const frames = Array.from({ length: 10 }, (_, i) => {
  const file = path.join(root, `assets/game-art/world-tree/stage-${String(i + 1).padStart(2, '0')}.webp`);
  return 'data:image/webp;base64,' + fs.readFileSync(file).toString('base64');
});

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  await page.setContent('<canvas id="scene" width="960" height="540"></canvas>');
  const video = await page.evaluate(async (images) => {
    const canvas = document.getElementById('scene');
    const ctx = canvas.getContext('2d');
    const art = await Promise.all(images.map((src) => new Promise((resolve, reject) => {
      const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = src;
    })));
    const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
      .find((type) => MediaRecorder.isTypeSupported(type));
    if (!mimeType) throw new Error('This browser cannot encode WebM video.');
    const chunks = [];
    const recorder = new MediaRecorder(canvas.captureStream(24), { mimeType, videoBitsPerSecond: 1900000 });
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
    recorder.start(100);
    const duration = 4.6;
    const particles = Array.from({ length: 75 }, (_, i) => ({
      phase: i * 2.399963, radius: 0.08 + ((i * 37) % 100) / 135, speed: 0.12 + ((i * 13) % 31) / 80,
      size: 1 + ((i * 7) % 4), alpha: 0.25 + ((i * 17) % 70) / 100,
    }));
    const drawImageCover = (img, alpha, t) => {
      const scale = Math.max(canvas.width / img.width, canvas.height / img.height) * (1.015 + Math.sin(t * 1.8) * 0.018);
      const w = img.width * scale, h = img.height * scale;
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    };
    const started = performance.now();
    await new Promise((resolve) => {
      const render = (now) => {
        const t = Math.min(duration, (now - started) / 1000);
        const fadeIn = Math.min(1, t / 0.35), fadeOut = Math.min(1, (duration - t) / 0.55);
        const artProgress = Math.max(0, Math.min(8.999, (t - 0.25) / 0.41));
        const index = Math.floor(artProgress), mix = artProgress - index;
        ctx.globalAlpha = 1; ctx.fillStyle = '#03070a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawImageCover(art[index], 1 - mix, t);
        drawImageCover(art[index + 1], mix, t);
        ctx.globalAlpha = 1;
        const centerX = canvas.width * 0.5, centerY = canvas.height * 0.49;
        const bloom = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, canvas.width * (0.1 + 0.1 * Math.sin(t * 2)));
        bloom.addColorStop(0, `rgba(255,255,225,${0.72 * fadeIn * fadeOut})`);
        bloom.addColorStop(0.22, `rgba(255,226,145,${0.4 * fadeIn * fadeOut})`);
        bloom.addColorStop(1, 'rgba(250,202,93,0)');
        ctx.fillStyle = bloom; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.save(); ctx.translate(centerX, centerY); ctx.rotate(t * 0.24);
        ctx.globalAlpha = 0.2 * fadeIn * fadeOut;
        for (let i = 0; i < 36; i++) {
          ctx.rotate(Math.PI / 18); ctx.fillStyle = '#fff2bd';
          ctx.beginPath(); ctx.moveTo(0, -canvas.height * 0.04); ctx.lineTo(canvas.width * 0.62, -canvas.height * 0.16);
          ctx.lineTo(canvas.width * 0.62, canvas.height * 0.16); ctx.lineTo(0, canvas.height * 0.04); ctx.fill();
        }
        ctx.restore();
        ctx.save(); ctx.globalCompositeOperation = 'screen';
        for (const p of particles) {
          const orbit = p.phase + t * p.speed;
          const x = centerX + Math.cos(orbit) * canvas.width * p.radius;
          const y = centerY + Math.sin(orbit * 1.15) * canvas.height * p.radius * 0.72 - t * 8;
          const pulse = Math.max(0, Math.sin(t * 4 + p.phase));
          ctx.globalAlpha = p.alpha * pulse * fadeIn * fadeOut; ctx.fillStyle = '#fff1b5';
          ctx.shadowColor = '#ffe598'; ctx.shadowBlur = 9 + p.size * 3;
          ctx.beginPath(); ctx.arc(x, (y + canvas.height) % canvas.height, p.size * (0.6 + pulse), 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
        const flash = Math.max(0, 1 - Math.abs(t - 3.72) / 0.22) * 0.8;
        if (flash) { ctx.globalAlpha = flash; ctx.fillStyle = '#fff8dc'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
        ctx.globalAlpha = 1;
        const shade = ctx.createLinearGradient(0, 0, 0, canvas.height);
        shade.addColorStop(0, '#05080a66'); shade.addColorStop(0.45, 'transparent'); shade.addColorStop(1, '#05080a99');
        ctx.fillStyle = shade; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.textAlign = 'center'; ctx.font = '700 16px system-ui, sans-serif'; ctx.fillStyle = `rgba(255,242,194,${Math.min(1, fadeIn * fadeOut)})`;
        ctx.shadowColor = '#ffda78'; ctx.shadowBlur = 18; ctx.fillText('ASCENSION', centerX, canvas.height - 44);
        if (t < duration) requestAnimationFrame(render); else resolve();
      };
      requestAnimationFrame(render);
    });
    await new Promise((resolve) => { recorder.onstop = resolve; recorder.stop(); });
    const blob = new Blob(chunks, { type: mimeType });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = ''; for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return { base64: btoa(binary), mimeType, bytes: bytes.length };
  }, frames);
  fs.writeFileSync(out, Buffer.from(video.base64, 'base64'));
  await browser.close();
  console.log(`Created ${path.relative(root, out)} (${video.bytes.toLocaleString()} bytes, ${video.mimeType})`);
})().catch((error) => { console.error(error); process.exitCode = 1; });
