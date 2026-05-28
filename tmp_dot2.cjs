const puppeteer = require("puppeteer");
const os = require("os"), path = require("path");
(async () => {
  const b = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto("http://localhost:8080/", { waitUntil: "networkidle2", timeout: 30000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));

  async function scanAll(label) {
    const els = await p.evaluate(() => {
      const res = [];
      for (const el of document.querySelectorAll("*")) {
        const r = el.getBoundingClientRect();
        if (r.top < 0 || r.top > 160) continue; // only header band (top 160px)
        const cs = getComputedStyle(el);
        const mind = Math.min(r.width, r.height);
        const round = cs.borderRadius.includes("50%") || (mind > 0 && parseFloat(cs.borderRadius) >= mind / 2 - 1);
        if (r.width > 0 && r.width <= 16 && r.height > 0 && r.height <= 16 && round && cs.opacity !== "0" && cs.visibility !== "hidden") {
          res.push({ cls: (el.className?.toString?.() || "").slice(0, 150), w: Math.round(r.width), h: Math.round(r.height), bg: cs.backgroundColor, top: Math.round(r.top), left: Math.round(r.left) });
        }
      }
      return res;
    });
    console.log(`[${label}] header-band small round els:`, JSON.stringify(els));
  }

  for (const y of [0, 400, 800, 1200, 1600]) {
    await p.evaluate((yy) => window.scrollTo(0, yy), y);
    await new Promise(r => setTimeout(r, 900));
    await scanAll("scroll=" + y);
    await p.screenshot({ path: path.join(os.tmpdir(), `dot-y${y}.png`) });
  }
  await b.close();
})().catch(e => { console.error("FAIL", e.message); process.exit(1); });
