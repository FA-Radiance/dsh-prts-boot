const https = require('https');
const { createWriteStream } = require('fs');
const jobs = [
  ['https://registry.npmmirror.com/react/18.3.1/files/umd/react.production.min.js', process.argv[2] + '/react.production.min.js'],
  ['https://registry.npmmirror.com/react-dom/18.3.1/files/umd/react-dom.production.min.js', process.argv[2] + '/react-dom.production.min.js'],
];
function get(url, file) {
  return new Promise((resolve, reject) => {
    const go = (u, depth) => https.get(u, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && depth < 5) {
        res.resume(); return go(res.headers.location, depth + 1);
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error(url + ' -> ' + res.statusCode)); }
      const out = createWriteStream(file);
      res.pipe(out);
      out.on('finish', () => resolve(file));
    }).on('error', reject);
    go(url, 0);
  });
}
(async () => { for (const [u, f] of jobs) { await get(u, f); console.log('ok', f); } })().catch(e => { console.error(e.message); process.exit(1); });
