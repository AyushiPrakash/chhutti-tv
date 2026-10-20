// Screen corners on the photo, in the photo's own pixels (2752 x 1536): TL, TR, BL, BR
var QUAD = [[958, 508], [1576, 514], [958, 1002], [1576, 986]]; // measured from the dark glass recess edges in room.jpg
var PW = 2752, PH = 1536, FOCUS_X = 0.45;
var TV_X = 1267, PHONE_ZOOM = 1.12; // middle of the TV set (photo pixels), and the extra zoom on phones

var on = false, ch = 0, vol = 6, muted = false, ready = false, tuneStart = 0;
var $ = function (id) { return document.getElementById(id); };

/* ---------- perspective mapping ---------- */
function adj(m){return [m[4]*m[8]-m[5]*m[7],m[2]*m[7]-m[1]*m[8],m[1]*m[5]-m[2]*m[4],m[5]*m[6]-m[3]*m[8],m[0]*m[8]-m[2]*m[6],m[2]*m[3]-m[0]*m[5],m[3]*m[7]-m[4]*m[6],m[1]*m[6]-m[0]*m[7],m[0]*m[4]-m[1]*m[3]];}
function mm(a,b){var c=[];for(var i=0;i<3;i++)for(var j=0;j<3;j++){var s=0;for(var k=0;k<3;k++)s+=a[3*i+k]*b[3*k+j];c[3*i+j]=s;}return c;}
function mv(m,v){return [m[0]*v[0]+m[1]*v[1]+m[2]*v[2],m[3]*v[0]+m[4]*v[1]+m[5]*v[2],m[6]*v[0]+m[7]*v[1]+m[8]*v[2]];}
function basis(p){var m=[p[0][0],p[1][0],p[2][0],p[0][1],p[1][1],p[2][1],1,1,1];var v=mv(adj(m),[p[3][0],p[3][1],1]);return mm(m,[v[0],0,0,0,v[1],0,0,0,v[2]]);}
function fit(){
  var vw = window.innerWidth, vh = window.innerHeight;
  var s = Math.max(vw / PW, vh / PH);
  var ox = (vw - PW * s) * FOCUS_X, oy = (vh - PH * s) * 0.5;
  // Narrow screens (phones): the photo still fills the whole window, and the TV is kept in the middle.
  // There's a lot of bare wall above the set, so zoom in a touch and let the extra fall off the top.
  if (vw / vh < PW / PH * 0.6) {
    s *= PHONE_ZOOM; oy = -(PH * s - vh) * 0.9;
    ox = Math.min(0, Math.max(vw - PW * s, vw / 2 - TV_X * s));
  }
  $('stage').style.transform = 'translate(' + ox + 'px,' + oy + 'px) scale(' + s + ')';
  var dst = QUAD;
  var src = [[0,0],[640,0],[0,480],[640,480]];
  var t = mm(basis(dst), adj(basis(src)));
  for (var i = 0; i < 9; i++) t[i] = t[i] / t[8];
  $('screen').style.transform = 'matrix3d(' + [t[0],t[3],0,t[6], t[1],t[4],0,t[7], 0,0,1,0, t[2],t[5],0,t[8]].join(',') + ')';
}
window.addEventListener('resize', fit);
$('tvimg').addEventListener('load', fit);
fit();

/* ---------- sound (made in the browser) ---------- */
var ac = null, noiseGain = null;
function audio(){
  if (ac) return ac;
  ac = new (window.AudioContext || window.webkitAudioContext)();
  var buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = buf.getChannelData(0);
  for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  var src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
  var bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3000; bp.Q.value = .4;
  noiseGain = ac.createGain(); noiseGain.gain.value = 0;
  src.connect(bp).connect(noiseGain).connect(ac.destination); src.start();
  return ac;
}
function level(){ return muted ? 0 : vol / 10; }
function staticSound(onOff){
  if (!noiseGain) return;
  noiseGain.gain.setTargetAtTime(onOff ? .22 * level() : 0, ac.currentTime, .02);
}
function thump(){
  var a = audio(), t = a.currentTime;
  var o = a.createOscillator(), g = a.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(35, t + .35);
  g.gain.setValueAtTime(.5 * Math.max(level(), .3), t); g.gain.exponentialRampToValueAtTime(.001, t + .5);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + .55);
  var w = a.createOscillator(), wg = a.createGain();
  w.type = 'sine'; w.frequency.value = 9500;
  wg.gain.setValueAtTime(0, t); wg.gain.linearRampToValueAtTime(.025, t + .3); wg.gain.exponentialRampToValueAtTime(.0005, t + 2.6);
  w.connect(wg).connect(a.destination); w.start(t); w.stop(t + 2.7);
}
function click(){
  var a = audio(), t = a.currentTime, o = a.createOscillator(), g = a.createGain();
  o.type = 'square'; o.frequency.value = 1800;
  g.gain.setValueAtTime(.05, t); g.gain.exponentialRampToValueAtTime(.0001, t + .03);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + .04);
}
// Crinkle of the plastic cover on the remote. Real plastic wrap is many small irregular crackles of very
// different loudness, bunched into a couple of bursts, over a soft papery rustle. Its energy sits mostly between
// 1 and 5 kHz; very high frequencies make it sound screechy, so the clicks are slightly rounded and the top is
// rolled off. strength 0..1 sets how long, dense and loud it is. Not tied to the TV volume: it's the room, not the TV.
var lastCrinkle = 0;
function crinkle(strength){
  var now = performance.now(); if (now - lastCrinkle < 45) return; lastCrinkle = now;
  var a = audio(); if (a.state === 'suspended') a.resume();
  strength = Math.max(.15, Math.min(1, strength));
  var sr = a.sampleRate, len = Math.floor(sr * (.2 + .2 * strength + Math.random() * .08));
  var buf = a.createBuffer(2, len, sr), L = buf.getChannelData(0), R = buf.getChannelData(1);
  // soft papery rustle under a smooth swell
  for (var i = 0; i < len; i++) {
    var t = i / len, env = Math.sin(Math.PI * t) * Math.pow(1 - t, .6) * .08;
    L[i] = (Math.random() * 2 - 1) * env; R[i] = (Math.random() * 2 - 1) * env;
  }
  // crackles in 2 to 4 bursts; each is a tiny rounded tick (1 to 4 ms), most faint, a few firm
  var bursts = 2 + Math.floor(Math.random() * 3), clicks = Math.floor(30 + 90 * strength);
  var centres = []; for (var k = 0; k < bursts; k++) centres.push(Math.random() * .8 + .05);
  for (var c = 0; c < clicks; c++) {
    var pos = centres[c % bursts] + (Math.random() - .5) * .2 * (Math.random() + .3);
    var at = Math.floor(Math.max(0, Math.min(.97, pos)) * len), amp = Math.pow(Math.random(), 2.5) * .7 + .03;
    var dur = Math.floor(sr * (.001 + Math.random() * .003)), pan = Math.random(), y = 0, sm = .35 + Math.random() * .3;
    for (var j = 0; j < dur && at + j < len; j++) {
      y += sm * ((Math.random() * 2 - 1) - y);                 // one-pole smoothing rounds the tick
      var v = y * amp * Math.pow(1 - j / dur, 1.5);
      L[at + j] += v * (1 - pan * .6); R[at + j] += v * (.4 + pan * .6);
    }
  }
  var src = a.createBufferSource(); src.buffer = buf;
  var hp = a.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 950; hp.Q.value = .6;
  var lp1 = a.createBiquadFilter(); lp1.type = 'lowpass'; lp1.frequency.value = 5200; lp1.Q.value = .5;
  var lp2 = a.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = 7000; lp2.Q.value = .5;
  var g = a.createGain(); g.gain.value = .16 + .12 * strength;
  src.connect(hp).connect(lp1).connect(lp2).connect(g).connect(a.destination); src.start();
}

/* ---------- static picture ---------- */
var nctx = $('noise').getContext('2d'), nimg = nctx.createImageData(160, 120), noiseOn = false;
function drawNoise(){
  if (noiseOn) {
    var d = nimg.data;
    for (var i = 0; i < d.length; i += 4) { var v = Math.random() * 255 | 0; d[i] = d[i+1] = d[i+2] = v; d[i+3] = 255; }
    nctx.putImageData(nimg, 0, 0);
  }
  requestAnimationFrame(drawNoise);
}
requestAnimationFrame(drawNoise);
function setStatic(v){ noiseOn = v; $('noise').classList.toggle('show', v); staticSound(v); }

/* ---------- OSD ---------- */
var chTimer, volTimer;
function hasShow(c){ return c >= 0 && c < CHANNELS.length && !!CHANNELS[c]; }
var sigTimer = null;
function setNoSignal(v){ clearTimeout(sigTimer); $('nosig').classList.toggle('show', v); }
function showCh(){
  $('osd-ch').firstChild.nodeValue = 'CH ' + String(ch + 1).padStart(2, '0');
  $('osd-ch').classList.add('show'); clearTimeout(chTimer);
  chTimer = setTimeout(function(){ $('osd-ch').classList.remove('show'); }, 3000);
}
function showVol(){
  var b = '';
  for (var i = 1; i <= 10; i++) b += '<i class="' + (i <= vol && !muted ? '' : 'empty') + '"></i>';
  $('bars').innerHTML = b;
  $('osd-vol').firstChild.nodeValue = muted ? 'MUTE ' : 'VOL ';
  $('osd-vol').classList.add('show'); clearTimeout(volTimer);
  volTimer = setTimeout(function(){ $('osd-vol').classList.remove('show'); }, 2200);
}

/* ---------- YouTube ---------- */
// Several players: one shows the current channel, the others keep the nearest channels above and below
// already playing (hidden and silent): two each side on computers, one each side on phones to spare data. YouTube draws its own pause button in the middle of the
// picture for about 3 seconds after a video starts, so a preloaded neighbour is clean by the time
// you switch to it, and channel up/down is near instant. A channel that wasn't preloaded
// (typed on the number keys) shows snow until its button has faded.
var ICON_MS = 3200, EARLY_MS = 1000, MIN_SNOW = 120;
// The picture is shown EARLY_MS after a video starts; until ICON_MS, a small patch of static in the middle of the
// screen (#iconCover) hides YouTube's pause icon, like a bit of weak signal.
var DESK = matchMedia('(pointer: fine) and (min-width: 700px)').matches;
// REACH: channels kept running on each side. RECENT: channels you visited lately, kept running so going back is instant.
var REACH = DESK ? 2 : 1, RECENT = DESK ? 3 : 0, SLOTS = 1 + 2 * REACH + RECENT, recent = [];
var P = [], cur = null, readyCount = 0;
// Join each show partway through, like live TV, by starting there directly.
var DUR = {};
// end (optional, seconds): where a channel's video stops being the show, e.g. a text card tacked on after the episode.
function startAt(id, end){ var d = Math.min(DUR[id] || 240, end || Infinity); return d > 120 ? Math.floor((Date.now() / 1000) % (d * 0.8)) : 0; }

window.onYouTubeIframeAPIReady = function(){
  for (var i = 0; i < SLOTS; i++) (function(i){
    var el = document.createElement('div'); el.className = 'slot';
    var inner = document.createElement('div'); el.appendChild(inner); $('player').appendChild(el);
    var s = { i: i, el: el, ch: -1, ready: false, playStart: 0, loadedAt: 0, tries: 0 };
    s.yt = new YT.Player(inner, {
      width: '100%', height: '100%', host: 'https://www.youtube.com',
      playerVars: { controls: 0, disablekb: 1, modestbranding: 1, rel: 0, iv_load_policy: 3, playsinline: 1, fs: 0, cc_load_policy: 0, cc_lang_pref: 'zz', hl: 'en', mute: 1 },
      events: {
        onReady: function(){ s.ready = true; s.yt.mute(); if (++readyCount === SLOTS) { ready = true; if (on) tune(ch); else warm(); } },
        onStateChange: function(e){ onState(s, e.data); },
        onError: function(e){ s.err = e && e.data; s.playStart = 0; if (s === cur && on) { $('tube').classList.remove('live'); setStatic(true); } nextAlt(s); }
      }
    });
    P.push(s);
  })(i);
};
function noCaptions(s){ try { s.yt.unloadModule('captions'); s.yt.unloadModule('cc'); s.yt.setOption('captions', 'track', {}); } catch (err) {} }
function onState(s, st){
  var PS = YT.PlayerState;
  // YouTube shows its button every time a video starts or resumes, so restart the clean timer on each start
  // (resuming after a buffering stall shows no button, so a video that was already clean is clean again at once)
  if (st === PS.PLAYING && s.lastSt !== PS.PLAYING) s.playStart = s.lastSt === PS.BUFFERING && s.wasClean ? Date.now() - ICON_MS : Date.now();
  if (st !== PS.PLAYING && st !== PS.BUFFERING) s.wasClean = false;
  if (st !== PS.PLAYING) s.playStart = 0;
  s.lastSt = st;
  if (st === PS.PLAYING) {
    noCaptions(s);
    var id = s.id, d = s.yt.getDuration();
    if (id && d > 0 && !DUR[id]) { DUR[id] = d; if (s.yt.getCurrentTime() > d * 0.85) s.yt.seekTo(0, true); } // guessed start was past a short show's end
  }
  if (st === PS.ENDED) { s.yt.seekTo(0, true); s.yt.playVideo(); }
  // background players never stay paused; the shown one stays paused only if you pressed pause
  if (st === PS.PAUSED && !(s === cur && userPaused)) s.yt.playVideo();
  if (s === cur && on && st !== PS.PLAYING) {
    $('tube').classList.remove('live'); applyVolume();
    if (!userPaused) setStatic(true); // buffering mid-show: snow, never a black screen
  }
}
function isLive(s){ return s && s.ready && s.yt.getPlayerState && s.yt.getPlayerState() === YT.PlayerState.PLAYING; }
function clean(s){ var c = isLive(s) && s.playStart && Date.now() - s.playStart >= EARLY_MS; if (c) s.wasClean = true; return c; }
// a channel can list backup videos (alt) for when YouTube refuses to play the main one
function ids(c){ return [CHANNELS[c].id].concat(CHANNELS[c].alt || []); }
function loadInto(s, c){
  s.ch = c; s.alt = 0; s.playStart = 0; s.loadedAt = Date.now(); s.tries = 0; s.wasClean = false; s.usedAt = Date.now();
  s.yt.mute(); playId(s);
}
function playId(s){ var id = ids(s.ch)[s.alt]; s.id = id; s.end = s.alt === 0 ? CHANNELS[s.ch].end || 0 : 0; s.yt.loadVideoById({ videoId: id, startSeconds: startAt(id, s.end) }); }
function nextAlt(s){
  if (s.ch < 0) return;
  s.alt = (s.alt + 1) % ids(s.ch).length; s.tries = 0; s.loadedAt = Date.now(); s.playStart = 0; s.wasClean = false;
  s.yt.mute(); playId(s);
}
function neighbour(c, d){
  for (var k = 1; k <= CHANNELS.length; k++) { var n = ((c + d * k) % CHANNELS.length + CHANNELS.length) % CHANNELS.length; if (hasShow(n)) return n; }
  return -1;
}
function slotFor(c){ for (var i = 0; i < P.length; i++) if (P[i].ch === c) return P[i]; return null; }
// put channel c in a player that isn't needed for any of the wanted channels
function claim(c, want){
  var s = slotFor(c); if (s) return s;
  // reuse the player that was used least recently
  var pick = null;
  P.forEach(function(p){ if (want.indexOf(p.ch) < 0 && p !== cur && (!pick || (p.usedAt || 0) < (pick.usedAt || 0))) pick = p; });
  if (!pick) P.forEach(function(p){ if (want.indexOf(p.ch) < 0 && (!pick || (p.usedAt || 0) < (pick.usedAt || 0))) pick = p; });
  if (pick) loadInto(pick, c);
  return pick;
}
// channel c and its nearest REACH neighbours on each side, nearest first
function around(c){
  var want = [c], up = c, down = c;
  for (var k = 0; k < REACH; k++) { up = neighbour(up, 1); down = neighbour(down, -1); want.push(up, down); }
  return want.concat(recent).filter(function(x, i, a){ return hasShow(x) && a.indexOf(x) === i; });
}
function preloadAround(c){
  if (!ready) return;
  var want = around(c);
  want.forEach(function(x){ claim(x, want); });
}
// before the TV is switched on, get the starting channel and its neighbours going
function warm(){ preloadAround(hasShow(ch) ? ch : neighbour(ch, 1)); }
function setCur(s){
  cur = s; if (s) s.usedAt = Date.now();
  P.forEach(function(p){ p.el.classList.toggle('cur', p === s); });
  applyVolume();
}
function reveal(){ if (!on || !cur) return; $('tube').classList.add('live'); setStatic(false); applyVolume(); }
function applyVolume(){
  if (!ready) return;
  var live = $('tube').classList.contains('live');
  P.forEach(function(s){
    if (s === cur && live && !muted && on) { s.yt.unMute(); s.yt.setVolume(vol * 10); } else s.yt.mute();
  });
}
function tune(n){
  if (n !== ch) { prevCh = ch; if (RECENT && hasShow(ch)) { recent = [ch].concat(recent.filter(function(x){ return x !== ch && x !== n; })).slice(0, RECENT); } }
  ch = n; userPaused = false;
  $('tube').classList.remove('live');
  setNoSignal(false); setStatic(true); showCh(); tuneStart = Date.now();
  if (!ready) return;
  if (!hasShow(ch)) { // empty channel: snow, with NO SIGNAL over it
    setCur(null);
    sigTimer = setTimeout(function(){ if (on && !hasShow(ch)) $('nosig').classList.add('show'); }, 350);
    preloadAround(neighbour(ch, 1));
    return;
  }
  var want = around(ch);
  setCur(claim(ch, want));
  preloadAround(ch);
}
// show the picture as soon as the current channel is playing and YouTube's button has faded
setInterval(function(){
  if (!on || !cur || userPaused || !hasShow(ch) || $('tube').classList.contains('live')) return;
  if (Date.now() - tuneStart >= MIN_SNOW && clean(cur)) reveal();
}, 50);
// Cover YouTube's pause icon with a patch of static while it's showing (from EARLY_MS to ICON_MS after a start).
(function(){
  var c = $('iconCover'), x = c.getContext('2d'), img = x.createImageData(c.width, c.height), d = img.data, shown = false;
  (function draw(){
    var want = on && cur && $('tube').classList.contains('live') && cur.playStart && Date.now() - cur.playStart < ICON_MS;
    if (want !== shown) { shown = want; c.classList.toggle('show', want); }
    if (want) { for (var i = 0; i < d.length; i += 4) { var v = Math.random() * 255 | 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; } x.putImageData(img, 0, 0); }
    requestAnimationFrame(draw);
  })();
})();
// A channel with an end time loops back to the start when it gets there, like the end of a tape.
setInterval(function(){
  if (!ready) return;
  P.forEach(function(s){ if (s.end && s.ch >= 0 && s.yt.getCurrentTime && s.yt.getCurrentTime() >= s.end) s.yt.seekTo(0, true); });
}, 400);

// YouTube sometimes leaves a video stuck (unstarted, or an "auth" error). Reload it, a few times at most.
setInterval(function(){
  if (!ready) return;
  P.forEach(function(s){
    if (s.ch < 0 || s.playStart || s.tries >= 3 || Date.now() - s.loadedAt < 2500) return;
    var st = s.yt.getPlayerState();
    if (st === -1 || st === YT.PlayerState.CUED || st === undefined) { s.tries++; s.loadedAt = Date.now(); if (s.tries >= 2) nextAlt(s); else playId(s); }
  });
}, 500);

/* ---------- glitch ---------- */
// Once in a while the picture jitters and a faint band rolls past, like a weak antenna signal.
function glitch(){
  if (on && !noiseOn) {
    var t = $('tube');
    t.style.setProperty('--gy', Math.round(40 + Math.random() * 360) + 'px');
    t.classList.remove('glitch'); void t.offsetWidth; t.classList.add('glitch');
    setTimeout(function(){ t.classList.remove('glitch'); }, 280);
    if (noiseGain && Math.random() < .5) { noiseGain.gain.setTargetAtTime(.06 * level(), ac.currentTime, .01); setTimeout(function(){ if (!noiseOn) staticSound(false); }, 70); }
  }
  setTimeout(glitch, 25000 + Math.random() * 35000);
}
setTimeout(glitch, 20000);

/* ---------- controls ---------- */
function power(){
  audio(); if (ac.state === 'suspended') ac.resume();
  on = !on;
  $('hint').classList.add('fade');
  var tube = $('tube');
  if (on) {
    thump();
    $('glassOff').style.opacity = 0;
    tube.className = 'tube on';
    setStatic(true); // snow straight away while the tube warms up
    setTimeout(function(){ if (on) tune(ch); }, 450);
  } else {
    click(); setStatic(false); setNoSignal(false);
    tube.className = 'tube off';
    setCur(null); // the players keep running hidden and silent, so switching back on is quick
    setTimeout(function(){ if (!on) $('glassOff').style.opacity = 1; }, 420);
    $('now').textContent = 'TV is off';
    $('osd-ch').classList.remove('show'); $('osd-vol').classList.remove('show');
  }
}
function chStep(d){ if (!on) return; click(); var base = ch < CHANNELS.length ? ch : 0; tune((base + d + CHANNELS.length) % CHANNELS.length); }
function volStep(d){ if (!on) return; click(); muted = false; vol = Math.max(0, Math.min(10, vol + d)); applyVolume(); showVol(); }
function toggleMute(){ if (!on) return; click(); muted = !muted; applyVolume(); showVol(); }

var prevCh = 0, bw = false, userPaused = false;
var ACTIONS = {
  power: power,
  chUp: function(){ chStep(1); }, chDown: function(){ chStep(-1); },
  volUp: function(){ volStep(1); }, volDown: function(){ volStep(-1); },
  mute: toggleMute,
  info: function(){ if (on) { click(); showCh(); showVol(); } else click(); },
  prev: function(){ if (on) { click(); tune(prevCh); } else click(); },
  bw: function(){ click(); if (!on) return; bw = !bw; $('tube').classList.toggle('bw', bw); },
  reset: function(){ click(); remoteHome(); if (!on) return; vol = 6; muted = false; bw = false; $('tube').classList.remove('bw'); applyVolume(); showVol(); },
  play: function(){ click(); if (on && cur && userPaused) { userPaused = false; cur.playStart = 0; setStatic(true); tuneStart = Date.now(); cur.yt.playVideo(); } }, // snow until YouTube's button fades
  pause: function(){ click(); if (on && cur && !userPaused) { userPaused = true; cur.yt.pauseVideo(); } },
  none: click
};
var digits = '', digitTimer = null;
function enterDigit(d){
  click(); if (!on) return;
  digits += d; clearTimeout(digitTimer);
  $('osd-ch').firstChild.nodeValue = 'CH ' + (digits.length === 1 ? digits + '-' : digits);
  $('osd-ch').classList.add('show'); clearTimeout(chTimer);
  var n = parseInt(digits, 10);
  var done = digits.length === 2 || n * 10 > 99 || (n * 10 > CHANNELS.length && n !== 0);
  // start loading that channel right away, so it's ready (or nearly) when the entry commits
  if (n >= 1 && hasShow(n - 1) && ready) claim(n - 1, [ch, n - 1]);
  digitTimer = setTimeout(commitDigits, done ? 150 : 700);
}
function commitDigits(){
  var n = parseInt(digits, 10); digits = '';
  if (n >= 1) tune(n - 1); else showCh();
}
for (var d = 0; d <= 9; d++) (function(d){ ACTIONS['n' + d] = function(){ enterDigit(String(d)); }; })(d);
/* ---------- curved glass ---------- */
// Old CRTs bulge outward. Each point of the picture samples a spot a little nearer the centre, so the
// middle is slightly magnified and the edges squeezed, while the four edges themselves stay in place.
// BULGE sets the strength (0 is flat); 0.07 is subtle.
var BULGE = 0.07;
(function(){
  var pic = document.querySelector('.pic'), W = pic.offsetWidth, H = pic.offsetHeight;
  if (!W || !H || !BULGE) return;
  var c = document.createElement('canvas'); c.width = W; c.height = H;
  var x = c.getContext('2d'), img = x.createImageData(W, H), d = img.data, max = 0, dx = new Float32Array(W * H), dy = new Float32Array(W * H);
  for (var j = 0; j < H; j++) for (var i = 0; i < W; i++) {
    var u = (i + .5) / W * 2 - 1, v = (j + .5) / H * 2 - 1, r2 = (u * u + v * v) / 2, f = -BULGE * (1 - r2), n = j * W + i;
    dx[n] = u * f * W / 2; dy[n] = v * f * H / 2;
    max = Math.max(max, Math.abs(dx[n]), Math.abs(dy[n]));
  }
  var scale = max * 2 + 1;
  for (n = 0; n < W * H; n++) { d[n*4] = 128 + dx[n] / scale * 255; d[n*4+1] = 128 + dy[n] / scale * 255; d[n*4+2] = 128; d[n*4+3] = 255; }
  x.putImageData(img, 0, 0);
  ['bulge', 'bulgeMap'].forEach(function(id){ var el = $(id); el.setAttribute('width', W); el.setAttribute('height', H); });
  $('bulgeMap').setAttribute('href', c.toDataURL());
  $('bulgeDisp').setAttribute('scale', scale);
  pic.classList.add('curved');
})();

/* ---------- "Felt nostalgic?" hearts ---------- */
// The heart total lives only on the server, in api/hearts.js (a Vercel function backed by Upstash Redis); nothing is
// kept in the browser. HEART_CAP limits how many hearts one visit can add. If the server can't be reached (local dev
// server, or the service is down) the count shows just this visit's hearts.
var HEART_API = '/api/hearts', HEART_CAP = 30;
(function(){
  var btn = $('loveBtn'), num = $('loveN'), count = $('loveCount');
  var url = /^https?:/.test(location.protocol) ? HEART_API : '';
  var mine = 0, total = null, last = 0; // mine: hearts left during this visit
  try { localStorage.removeItem('hearts'); } catch (err) {} // clear the per-browser count older versions saved
  function show(){
    var n = total === null ? mine : total;
    num.textContent = n.toLocaleString('en-IN'); count.setAttribute('aria-label', n + (n === 1 ? ' heart' : ' hearts'));
    btn.disabled = mine >= HEART_CAP;
    btn.setAttribute('aria-label', btn.disabled ? 'Thanks for the hearts' : 'Leave a heart');
  }
  function readCount(j){ return j && typeof j.count === 'number' ? j.count : null; }
  if (url) fetch(url).then(function(r){ return r.ok ? r.json() : null; }).then(function(j){ var v = readCount(j); if (v !== null) { total = v + mine; show(); } }).catch(function(){});
  function float(){
    var b = btn.getBoundingClientRect(), h = document.createElement('span');
    h.className = 'love-float'; h.textContent = '\u2665'; h.setAttribute('aria-hidden', 'true');
    h.style.left = (b.left + b.width / 2 - 7) + 'px'; h.style.top = (b.top + 4) + 'px';
    h.style.setProperty('--drift', Math.round(Math.random() * 40 - 20) + 'px'); h.style.setProperty('--spin', Math.round(Math.random() * 40 - 20) + 'deg');
    document.body.appendChild(h); setTimeout(function(){ h.remove(); }, 1200);
  }
  btn.addEventListener('click', function(){
    var now = Date.now(); if (now - last < 250 || mine >= HEART_CAP) return; last = now;
    mine++; if (total !== null) total++;
    float(); show(); btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop');
    if (url) fetch(url, { method: 'POST' }).then(function(r){ return r.ok ? r.json() : null; }).then(function(j){ var v = readCount(j); if (v !== null && v > (total || 0)) { total = v; show(); } }).catch(function(){});
  });
  btn.addEventListener('click', function(){ if (mine > 0) btn.classList.add('filled'); }); // coloured in once you've left a heart
  show();
})();

/* ---------- film grain ---------- */
// A small tile of mid-grey noise; CSS repeats it over the scene as a still texture.
(function(){
  var c = document.createElement('canvas'); c.width = c.height = 256;
  var x = c.getContext('2d'), img = x.createImageData(256, 256), d = img.data;
  for (var i = 0; i < d.length; i += 4) { var v = 128 + (Math.random() + Math.random() + Math.random() - 1.5) * 90 | 0; d[i] = d[i+1] = d[i+2] = v; d[i+3] = 255; }
  x.putImageData(img, 0, 0);
  $('grain').style.backgroundImage = 'url(' + c.toDataURL() + ')';
})();

/* ---------- carry the remote around ---------- */
// Press and move anywhere on the remote (even on a button) to pick it up; a plain tap still presses the button.
// The spot you grab is the pivot: gravity pulls the remote's centre down below your cursor, and moving
// the mouse makes it swing, like holding a real remote by one end. Let go and it keeps its speed and spin
// for a moment (a flick), then slows to a stop.
(function(){
  var r = document.querySelector('.remote');
  var HOME_ROT = -11 * Math.PI / 180;
  var dx = 0, dy = 0, rot = HOME_ROT;     // offset of the centre from its home spot, and angle
  var down = false, moved = false, sx, sy, P = null, l, L, C, Cp, raf = 0, last = 0;
  var G = 0.9, DAMP = 0.93;                           // gravity (px per frame²) and swing damping per frame
  // How quickly a flicked remote slows down after you let go: the share of its speed and spin lost each
  // frame (at 60 fps). Lower glides further (0.02 is icy), higher stops sooner (0.15 is sticky).
  var FLICK_DRAG = 0.06;
  // Plastic cover crinkle: while held, every CRINKLE_STEP px of cursor travel, and every sharp turn (more than
  // CRINKLE_TURN degrees), rolls a die; CRINKLE_CHANCE of those rolls play one soft crinkle, never closer than CRINKLE_GAP ms.
  var CRINKLE_CHANCE = 1 / 3, CRINKLE_STEP = 120, CRINKLE_TURN = 60, CRINKLE_GAP = 350;
  var travel = 0, lastMove = null, lastDir = null, lastRollAt = 0;
  function rollCrinkle(){
    var now = performance.now(); if (now - lastRollAt < CRINKLE_GAP) return;
    if (Math.random() < CRINKLE_CHANCE) { lastRollAt = now; crinkle(.3); }
  }
  var BOUNCE = 0.5, MAX_V = 60, MAX_W = 0.35;        // energy kept on hitting a screen edge; speed and spin caps
  var rotP = rot, fv = null, fw = 0, fraf = 0, flast = 0;
  function place(){
    r.style.setProperty('--dx', dx + 'px'); r.style.setProperty('--dy', dy + 'px');
    r.style.setProperty('--rot', (rot * 180 / Math.PI) + 'deg');
    r.classList.toggle('moved', Math.abs(dx) > 1 || Math.abs(dy) > 1 || Math.abs(rot - HOME_ROT) > 0.01);
  }
  function home(){ return { x: r.offsetLeft + r.offsetWidth / 2, y: r.offsetTop + r.offsetHeight / 2 }; }
  function clamp(){ // keep a good chunk of the remote on screen
    var b = r.getBoundingClientRect(), m = 80;
    if (b.right < m) dx += m - b.right; if (b.left > innerWidth - m) dx -= b.left - (innerWidth - m);
    if (b.bottom < m) dy += m - b.bottom; if (b.top > innerHeight - m) dy -= b.top - (innerHeight - m);
    place();
  }
  // every visit starts with the remote in its home spot; drop any position saved by older versions
  try { localStorage.removeItem('remotePos'); } catch (err) {}
  place(); requestAnimationFrame(clamp);

  function step(t){
    var k = Math.min(2, (t - (last || t)) / 16.67 || 1); last = t;
    var vx = (C.x - Cp.x) * Math.pow(DAMP, k), vy = (C.y - Cp.y) * Math.pow(DAMP, k);
    Cp = { x: C.x, y: C.y }; rotP = rot;
    C = { x: C.x + vx, y: C.y + vy + G * k * k };
    if (L > 4) {
      // the centre stays at a fixed distance from the pivot; the angle follows where it swung to
      var ddx = C.x - P.x, ddy = C.y - P.y, len = Math.hypot(ddx, ddy) || 1;
      C = { x: P.x + ddx * L / len, y: P.y + ddy * L / len };
      rot = Math.atan2(C.y - P.y, C.x - P.x) - Math.atan2(-l.y, -l.x);
    } else { // grabbed at the very centre: nothing to swing, just carry it
      C = { x: P.x - l.x, y: P.y - l.y }; Cp = { x: C.x, y: C.y };
    }
    var h = home(); dx = C.x - h.x; dy = C.y - h.y; place();
    raf = requestAnimationFrame(step);
  }

  // after release: keep drifting and spinning, losing FLICK_DRAG of it each frame, bouncing off screen edges
  function glide(t){
    var k = Math.min(2, (t - (flast || t)) / 16.67 || 1); flast = t;
    var h = home(), cx = h.x + dx + fv.x * k, cy = h.y + dy + fv.y * k;
    if (cx < 0 || cx > innerWidth) { fv.x = -fv.x * BOUNCE; cx = Math.max(0, Math.min(innerWidth, cx)); }
    if (cy < 0 || cy > innerHeight) { fv.y = -fv.y * BOUNCE; cy = Math.max(0, Math.min(innerHeight, cy)); }
    dx = cx - h.x; dy = cy - h.y; rot += fw * k;
    var f = Math.pow(1 - FLICK_DRAG, k); fv.x *= f; fv.y *= f; fw *= f;
    place();
    if (Math.hypot(fv.x, fv.y) < 0.05 && Math.abs(fw) < 0.0005) { fraf = 0; clamp(); return; }
    fraf = requestAnimationFrame(glide);
  }
  function capped(v, m){ return Math.max(-m, Math.min(m, v)); }

  r.addEventListener('pointerdown', function(e){
    e.preventDefault(); if (window.getSelection) getSelection().removeAllRanges();
    if (fraf) { cancelAnimationFrame(fraf); fraf = 0; } // catch it mid-glide
    down = true; moved = false; sx = e.clientX; sy = e.clientY;
  });
  window.addEventListener('pointermove', function(e){
    if (!down) return;
    if (!moved) {
      if (Math.hypot(e.clientX - sx, e.clientY - sy) < 6) return;
      // roll a die each time the remote is picked up and moved: 1 in 3 gives one soft crinkle of the plastic cover
      moved = true; r.classList.add('dragging'); travel = 0; lastMove = { x: e.clientX, y: e.clientY }; lastDir = null; rollCrinkle(); try { r.setPointerCapture(e.pointerId); } catch (err) {}
      // where on the remote it was grabbed, in the remote's own (unrotated) frame
      var h = home(), cx = h.x + dx, cy = h.y + dy, px = sx - cx, py = sy - cy, c = Math.cos(-rot), s = Math.sin(-rot);
      l = { x: px * c - py * s, y: px * s + py * c }; L = Math.hypot(l.x, l.y);
      C = { x: cx, y: cy }; Cp = { x: cx, y: cy }; rotP = rot; last = 0;
      raf = requestAnimationFrame(step);
    }
    P = { x: e.clientX, y: e.clientY };
    // movement and direction changes while held can rustle the plastic
    var mx = e.clientX - lastMove.x, my = e.clientY - lastMove.y, md = Math.hypot(mx, my);
    if (md >= 12) {
      var dir = Math.atan2(my, mx);
      if (lastDir !== null) { var turn = Math.abs(Math.atan2(Math.sin(dir - lastDir), Math.cos(dir - lastDir))) * 180 / Math.PI; if (turn > CRINKLE_TURN) rollCrinkle(); }
      travel += md; if (travel >= CRINKLE_STEP) { travel -= CRINKLE_STEP; rollCrinkle(); }
      lastDir = dir; lastMove = { x: e.clientX, y: e.clientY };
    }
  });
  function end(){
    if (!down) return; down = false; r.classList.remove('dragging');
    if (moved) {
      cancelAnimationFrame(raf); setTimeout(function(){ moved = false; }, 0);
      // carry on with the speed and spin it had at the moment of release
      fv = { x: capped(C.x - Cp.x, MAX_V), y: capped(C.y - Cp.y, MAX_V) };
      var w = rot - rotP; w = Math.atan2(Math.sin(w), Math.cos(w)); fw = capped(w, MAX_W);
      flast = 0; fraf = requestAnimationFrame(glide);
    }
  }
  ['pointerup', 'pointercancel', 'mouseup', 'blur'].forEach(function(t){ window.addEventListener(t, end); });
  r.addEventListener('lostpointercapture', end);
  // a drag that ends on a button must not press it
  r.addEventListener('click', function(e){ if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
  window.addEventListener('resize', clamp);
  // the remote's own RESET key (below MENU) glides it back to where it starts; see ACTIONS.reset
  window.remoteHome = function(){
    if (fraf) { cancelAnimationFrame(fraf); fraf = 0; }
    dx = 0; dy = 0; rot = HOME_ROT;
    r.classList.add('returning'); place();
    setTimeout(function(){ r.classList.remove('returning'); }, 650);
  };
})();

document.querySelectorAll('.rk').forEach(function(b){ b.addEventListener('click', function(){ ACTIONS[b.dataset.act](); }); });
$('tvbtn').onclick = power;
document.addEventListener('keydown', function(e){
  if (e.target.tagName === 'INPUT') return;
  var k = e.key;
  if (k === 'p' || k === 'P') power();
  else if (k === 'ArrowUp') { e.preventDefault(); volStep(1); }
  else if (k === 'ArrowDown') { e.preventDefault(); volStep(-1); }
  else if (k === 'ArrowRight') chStep(1);
  else if (k === 'ArrowLeft') chStep(-1);
  else if (k === 'm' || k === 'M') toggleMute();
  else if (/^[0-9]$/.test(k)) ACTIONS['n' + k]();
});

/* ---------- diagnostics (only with ?debug in the address) ---------- */
// A small panel showing what each YouTube player is doing, for tracking down playback problems on phones.
if (/[?&]debug\b/.test(location.search)) (function(){
  var box = document.createElement('pre');
  box.style.cssText = 'position:fixed;left:6px;top:6px;z-index:999;margin:0;padding:6px 8px;max-width:calc(100% - 12px);white-space:pre-wrap;font:11px/1.35 ui-monospace,monospace;color:#cfe;background:rgba(0,0,0,.78);border-radius:6px;pointer-events:none';
  document.body.appendChild(box);
  var names = { '-1': 'unstarted', 0: 'ended', 1: 'playing', 2: 'paused', 3: 'buffering', 5: 'cued' };
  setInterval(function(){
    var lines = [navigator.userAgent.replace(/^Mozilla\/5\.0 /, '').slice(0, 120),
      'YT api: ' + (window.YT && YT.Player ? 'loaded' : 'NOT loaded') + '  ready: ' + ready + ' (' + readyCount + '/' + SLOTS + ')',
      'on: ' + on + '  ch: ' + (ch + 1) + '  live: ' + $('tube').classList.contains('live') + '  tab: ' + document.visibilityState];
    P.forEach(function(p, i){
      var st = '?', m = '?', t = '?';
      try { st = p.yt.getPlayerState(); m = p.yt.isMuted(); t = Math.round(p.yt.getCurrentTime()); } catch (err) {}
      lines.push('#' + i + (p === cur ? '*' : ' ') + ' ch ' + (p.ch + 1) + ' ' + (names[st] || st) + ' t=' + t + ' muted=' + m + (p.err ? ' ERR ' + p.err : '') + ' tries=' + p.tries);
    });
    box.textContent = lines.join('\n');
  }, 500);
})();
