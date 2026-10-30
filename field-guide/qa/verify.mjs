import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let dist = join(project, 'dist');
try { await stat(dist); } catch { dist = project; }
const source = Object.fromEntries(await Promise.all(
  ['app.js', 'data.js', 'reference.js', 'calculators.js', 'sw.js', 'index.html'].map(async name =>
    [name, await readFile(join(dist, name), 'utf8')])
));
let assertions = 0;
function check(condition, message) { assertions++; assert.ok(condition, message); }
function equal(actual, expected, message) { assertions++; assert.deepEqual(actual, expected, message); }
function near(actual, expected, message) {
  check(Math.abs(actual - expected) <= Math.max(1e-12, Math.abs(expected) * 1e-12), message);
}
function rejectsInput(fn, message) { assertions++; assert.throws(fn, undefined, message); }

// Read the shipped data, not the authoring fragments.
const dataContext = vm.createContext({ window: {} });
for (const file of ['data.js', 'reference.js', 'calculators.js']) {
  new vm.Script(source[file], { filename: file }).runInContext(dataContext);
}
for (const file of ['app.js', 'sw.js']) new vm.Script(source[file], { filename: file });
const scenes = dataContext.window.PFG_SCENES;
const reference = dataContext.window.PFG_REFERENCE;
const credits = dataContext.window.PFG_PHOTO_CREDITS;
const calc = dataContext.window.PFG_CALC;
const categories = ['night', 'landscape', 'water', 'wildlife', 'people', 'city', 'close', 'creative'];
const ids = new Set(scenes.map(scene => scene.id));
equal(scenes.length, 80, 'The complete app must contain 80 scene guides.');
equal(ids.size, 80, 'Scene IDs must be unique.');
for (const category of categories) {
  equal(scenes.filter(scene => scene.category === category).length, 10, `${category} must have ten guides.`);
}
const fields = ['id', 'title', 'category', 'description', 'tags', 'difficulty', 'settings', 'lens', 'support', 'why', 'steps', 'composition', 'pack', 'fixes', 'sony', 'fullFrame', 'phone', 'sources'];
for (const scene of scenes) {
  for (const field of fields) check(Object.hasOwn(scene, field), `${scene.id} lacks ${field}.`);
  check(/^[a-z][a-z0-9-]*$/.test(scene.id), `${scene.id} is not a safe scene identifier.`);
  check(categories.includes(scene.category), `${scene.id} has an unknown category.`);
  check(['Easy', 'Intermediate', 'Advanced'].includes(scene.difficulty), `${scene.id} has an unknown difficulty.`);
  for (const field of ['title', 'description', 'lens', 'support', 'why', 'sony', 'fullFrame', 'phone']) {
    check(typeof scene[field] === 'string' && scene[field].trim().length > 0, `${scene.id}: ${field} must be text.`);
  }
  for (const field of ['mode', 'aperture', 'shutter', 'iso', 'focus']) {
    check(typeof scene.settings[field] === 'string' && scene.settings[field].trim().length > 0, `${scene.id}: missing ${field} setting.`);
  }
  for (const [field, length] of [['steps', 3], ['composition', 2], ['fixes', 3]]) {
    equal(scene[field].length, length, `${scene.id}: incorrect ${field} count.`);
  }
  check(scene.pack.length >= 3 && scene.pack.length <= 5, `${scene.id}: packing list must have 3–5 items.`);
  check(Array.isArray(scene.tags) && scene.tags.every(tag => typeof tag === 'string'), `${scene.id}: tags must be text.`);
  check(scene.steps.every(step => typeof step === 'string' && step.trim()), `${scene.id}: invalid step.`);
  check(scene.composition.every(tip => typeof tip === 'string' && tip.trim()), `${scene.id}: invalid composition tip.`);
  check(scene.fixes.every(fix => typeof fix.problem === 'string' && typeof fix.solution === 'string' && fix.problem.trim() && fix.solution.trim()), `${scene.id}: invalid troubleshooting entry.`);
  check(scene.sources.length > 0, `${scene.id}: primary references are required.`);
  for (const entry of scene.sources) {
    equal(new URL(entry.url).protocol, 'https:', `${scene.id}: references must use HTTPS.`);
    check(typeof entry.label === 'string' && entry.label.trim(), `${scene.id}: source label is missing.`);
  }
}
equal(reference.rescue.length, 12, 'The app should ship twelve rescue routes.');
equal(reference.learn.length, 16, 'The app should ship sixteen reference cards.');
for (const rescue of reference.rescue) {
  for (const id of rescue.related) check(ids.has(id), `${rescue.id} links to missing scene ${id}.`);
}
for (const match of source['app.js'].matchAll(/#scene\/([a-z0-9-]+)/g)) {
  check(ids.has(match[1]), `App link points to missing scene ${match[1]}.`);
}
for (const id of ['sunrise', 'milky-way', 'perched-bird', 'silky-waterfall', 'city-blue-hour', 'outdoor-portrait']) {
  check(ids.has(id), `Home recommendation ${id} must exist.`);
}
equal(credits.length, 8, 'Every category needs a photograph credit.');
equal(new Set(credits.map(credit => credit.category)).size, 8, 'Credit categories must be unique.');
for (const credit of credits) {
  check(categories.includes(credit.category), 'Credit has an unknown category.');
  equal(credit.file, `images/${credit.category}.jpg`, 'Credit must identify its offline file.');
  check(credit.author && credit.alt && credit.url && credit.licenseUrl, 'Credit metadata must be complete.');
  check((await stat(join(dist, credit.file))).size > 1000, `${credit.file} must exist and contain image data.`);
}
for (const match of source['index.html'].matchAll(/<(?:script|link)\b[^>]*(?:src|href)="(\.\/[^"?#]+)"/g)) {
  check((await stat(join(dist, match[1]))).isFile(), `HTML asset ${match[1]} must exist.`);
}
console.log('PASS: 80 complete scenes, eight categories, references, photo credits and all fixed scene links.');

// Known photographic calculations, including zero-gap and single-frame boundaries.
near(calc.parseShutter('1/125'), 0.008, 'Fractional shutter parsing.');
near(calc.parseShutter(' 2 sec '), 2, 'Shutter parsing with units.');
near(calc.parseShutter('.5 s'), 0.5, 'Decimal shutter parsing.');
near(calc.nd('1/125', 10), 8.192, 'Ten-stop filter multiplies 1/125 s by 1024.');
near(calc.nd('1/30', 6), 64 / 30, 'Six-stop filter multiplies by 64.');
near(calc.nd('2', 0), 2, 'Zero-stop filter leaves exposure unchanged.');
near(calc.swap('1/250', 2.8, 5.6), 0.016, 'Two-stop aperture reduction needs four times the duration.');
near(calc.swap('1', 8, 4), 0.25, 'Opening two stops needs one-quarter the duration.');
const plan = calc.interval(10, 1, 300);
equal(plan.interval, 11, 'Sony interval is start-to-start.');
equal(plan.duration, 3299, 'Sequence excludes an unnecessary final gap.');
equal(plan.exposureTotal, 3000, 'Collected exposure time is independent of gaps.');
equal(calc.interval(10, 100, 1).duration, 10, 'One frame requires only its own exposure time.');
equal(calc.interval(2, 0, 3).duration, 6, 'Zero-gap arithmetic is valid even when the camera needs practical overhead.');
equal(calc.duration(3299), '54 min 59 s', 'Sequence duration formatting.');
equal(calc.duration(3601), '1 h 1 s', 'Hour formatting.');
equal(calc.duration(0.008), '1/125 s', 'Short-shutter formatting.');
for (const input of ['', '0', '-1', 'abc', '1/0', '1/2/3', '1e3']) {
  rejectsInput(() => calc.parseShutter(input), `Invalid shutter ${JSON.stringify(input)} must be rejected.`);
}
for (const stops of [-1, 21, NaN, Infinity]) rejectsInput(() => calc.nd('1', stops), 'Invalid ND strength must be rejected.');
for (const args of [[0, 1, 10], [86401, 1, 10], [10, -1, 10], [10, 1, 0], [10, 1, 1.5], [10, 1, 10000]]) {
  rejectsInput(() => calc.interval(...args), `Invalid interval input ${args} must be rejected.`);
}
rejectsInput(() => calc.swap('1/125', 0, 8), 'A zero aperture must be rejected.');
rejectsInput(() => calc.swap('1/125', 4, -8), 'A negative aperture must be rejected.');
console.log('PASS: shutter parsing, ND exposure, aperture equivalence, interval duration and invalid-input cases.');

// Execute the actual service worker in an isolated, deterministic Cache API harness.
// No browser-control tooling or external network requests are involved.
const scope = 'https://example.test/photographic-eye-lab/photo-field-guide/';
const parentScope = 'https://example.test/photographic-eye-lab/';
const cacheStore = new Map();
const listeners = new Map();
const deleted = [];
let networkCalls = 0, offline = false, skips = 0, claims = 0;
function requestURL(request) { return typeof request === 'string' ? new URL(request, scope).href : request.url; }
async function networkFetch(request) {
  networkCalls++;
  if (offline) throw new Error(`Network fetch attempted while offline: ${requestURL(request)}`);
  const url = new URL(requestURL(request));
  check(url.href.startsWith(scope), 'Precache must not escape the app subdirectory.');
  const relative = url.pathname.slice(new URL(scope).pathname.length) || 'index.html';
  return new Response(await readFile(join(dist, relative)), { status: 200 });
}
const caches = {
  async open(name) {
    if (!cacheStore.has(name)) cacheStore.set(name, new Map());
    const entries = cacheStore.get(name);
    return {
      async addAll(requests) {
        const responses = await Promise.all(requests.map(async request => [requestURL(request), await networkFetch(request)]));
        for (const [url, response] of responses) entries.set(url, response.clone());
      },
      async match(request) { return entries.get(requestURL(request))?.clone(); },
      async put(request, response) { entries.set(requestURL(request), response.clone()); },
      async delete(request) { return entries.delete(requestURL(request)); }
    };
  },
  async keys() { return [...cacheStore.keys()]; },
  async delete(name) { deleted.push(name); return cacheStore.delete(name); }
};
const workerContext = vm.createContext({
  URL, Request, Response, caches, fetch: networkFetch,
  self: {
    registration: { scope }, location: new URL('sw.js', scope),
    addEventListener(name, handler) { listeners.set(name, handler); },
    async skipWaiting() { skips++; },
    clients: { async claim() { claims++; } }
  }
});
new vm.Script(source['sw.js'], { filename: 'sw.js' }).runInContext(workerContext);
const cacheName = vm.runInContext('CACHE', workerContext);
const cachedURLs = Array.from(vm.runInContext('URLS', workerContext));
const expectedFiles = [
  './', './index.html', './styles.css', './data.js', './reference.js', './calculators.js', './app.js', './manifest.webmanifest',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable.png', './icons/apple-touch-icon.png',
  ...categories.map(category => `./images/${category}.jpg`)
];
equal(new Set(cachedURLs), new Set(expectedFiles.map(file => new URL(file, scope).href)), 'Precache must contain the complete 21-file app.');
equal(cachedURLs.length, 21, 'Offline manifest should contain 21 unique URLs.');
async function lifecycle(name, payload = {}) {
  const waiting = [];
  listeners.get(name)({ ...payload, waitUntil(promise) { waiting.push(Promise.resolve(promise)); } });
  await Promise.all(waiting);
}
await lifecycle('install');
equal(networkCalls, 21, 'Installation downloads every app URL exactly once.');
equal(cacheStore.get(cacheName).size, 21, 'All manifest entries must be cached.');
equal(skips, 1, 'Successful installation should activate without waiting for old tabs.');
const oldOwnCache = `photo-field-guide:${scope}:obsolete`;
const eyeLabCache = `photographic-eye-lab:${parentScope}:existing`;
const otherGuideCache = 'photo-field-guide:https://example.test/another-guide/:existing';
await caches.open(oldOwnCache);
await caches.open(eyeLabCache);
await caches.open(otherGuideCache);
await lifecycle('activate');
equal(deleted, [oldOwnCache], 'Activation must delete only this app scope’s obsolete cache.');
check(cacheStore.has(cacheName) && cacheStore.has(eyeLabCache) && cacheStore.has(otherGuideCache), 'Other apps and the current cache must survive activation.');
equal(claims, 1, 'Activated worker should claim eligible clients.');

offline = true;
const callsBeforeOffline = networkCalls;
async function requestThroughWorker(url, mode = 'cors', method = 'GET') {
  let result;
  listeners.get('fetch')({ request: { url, mode, method }, respondWith(response) { result = Promise.resolve(response); } });
  return result ? await result : undefined;
}
const navigation = await requestThroughWorker(new URL('a/deep/link', scope).href, 'navigate');
equal(await navigation.text(), source['index.html'], 'Offline deep navigation must return the field-guide shell.');
for (const url of cachedURLs) {
  const response = await requestThroughWorker(url);
  check(response instanceof Response, `Offline cache miss: ${url}`);
  const relative = new URL(url).pathname.slice(new URL(scope).pathname.length) || 'index.html';
  equal(Buffer.from(await response.arrayBuffer()), await readFile(join(dist, relative)), `Offline body mismatch for ${relative}.`);
}
equal(networkCalls, callsBeforeOffline, 'Offline navigation and every cached asset must avoid fetch.');
equal(await requestThroughWorker(parentScope, 'navigate'), undefined, 'The guide must not intercept Eye Lab navigation.');
equal(await requestThroughWorker('https://external.test/photo.jpg'), undefined, 'Cross-origin requests must not be intercepted.');
equal(await requestThroughWorker(new URL('index.html', scope).href, 'cors', 'POST'), undefined, 'Non-GET requests must not be intercepted.');
async function status() {
  let message;
  await lifecycle('message', { data: { type: 'PFG_CACHE_STATUS' }, ports: [{ postMessage(value) { message = value; } }] });
  return message;
}
let message = await status();
check(message.ready === true, 'Complete cache must report ready.');
equal(message.files, 21, 'Status must verify all 21 manifest URLs.');
equal(message.version, cacheName, 'Status version must identify the actual active cache.');
const cache = await caches.open(cacheName);
const appURL = new URL('app.js', scope).href;
const savedApp = await cache.match(appURL);
await cache.delete(appURL);
message = await status();
check(message.ready === false, 'A single missing file must make offline status incomplete.');
equal(message.files, 21, 'Incomplete status must still check the complete manifest.');
await cache.put(appURL, savedApp);
check((await status()).ready === true, 'Restoring the missing file must restore readiness.');
console.log('PASS: service-worker install, scope isolation, offline navigation/assets, safe activation and 21-file status checks.');
console.log(`PASS: ${assertions} assertions. No distribution files were modified.`);
