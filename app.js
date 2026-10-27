/* Vouch web test app. Plain JavaScript, no build step. */
(function () {
  'use strict';

  // ---------- Constants ----------
  var CFG = window.VOUCH_CONFIG || {};
  var CONFIGURED = CFG.supabaseUrl && CFG.supabaseUrl.indexOf('http') === 0 && CFG.supabaseKey && CFG.supabaseKey.indexOf('YOUR_') !== 0;
  var DAY = 86400000;
  var ICON = {
    eat: '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 2-2.5 5-2.5 8h2.5v10"/>',
    coffee: '<path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9zM16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 3v3M12 3v3"/>',
    stay: '<path d="M3 19V6M3 15h18v4M21 15v-3a3 3 0 0 0-3-3h-7v6M7 12a1.5 1.5 0 1 0 0-.01"/>',
    shop: '<path d="M3 9h18l-2 10H5L3 9zM8 9l4-5 4 5"/>',
    fuel: '<path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h12M4 10h10M14 8l3 3v7a1.5 1.5 0 0 0 3 0V9l-3-3"/>',
    ev: '<path d="M13 2L5 13h6l-1 9 8-11h-6l1-9z"/>',
    work: '<path d="M5 6h14v10H5zM2 19h20"/>',
    'do': '<path d="M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4V7zM14 7v10"/>'
  };
  var CATS = [['eat', 'Eat'], ['coffee', 'Coffee'], ['stay', 'Stay'], ['shop', 'Shop'], ['fuel', 'Fuel'], ['ev', 'EV'], ['work', 'Workspace'], ['do', 'Do']];
  var CATNAME = { eat: 'Food and drink', coffee: 'Coffee', stay: 'Places to stay', shop: 'Shops', fuel: 'Fuel', ev: 'EV charging', work: 'Workspace', 'do': 'Things to do' };
  var BEST = { eat: 'meal', coffee: 'coffee', stay: 'stay', shop: 'shop', fuel: 'fuel stop', ev: 'charging stop', work: 'workspace', 'do': 'day out' };
  var STYLES = ['Quality first', 'Value hunter', 'Convenience', 'Road-tripper'];
  var THEMES = [['navy-gold', 'Navy & Gold', '#102347', '#D4A017', '#FFFFFF'], ['midnight', 'Midnight', '#2F55A4', '#E3B53A', '#0B0D12'], ['coastal', 'Coastal', '#C8462A', '#2A8C8C', '#F4F1EC'], ['forest', 'Forest', '#1F4D3A', '#8DB38B', '#EEF0EA']];
  var STAR = '<svg class="star" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.8l2.85 5.8 6.4.93-4.63 4.5 1.1 6.37L12 17.4l-5.72 3l1.1-6.37L2.75 9.53l6.4-.93L12 2.8z"/></svg>';
  var P = {
    tag: '<path d="M3 12V4h8l10 10-8 8L3 12z"/><circle cx="7.5" cy="8.5" r="1.2"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    share: '<path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
    near: '<path d="M21 3L3 10.5l7.5 3 3 7.5L21 3z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/>',
    me: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    friends: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'
  };
  function svg(path, cls, size) { return '<svg class="' + (cls || '') + '"' + (size ? ' width="' + size + '" height="' + size + '"' : '') + ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + '</svg>'; }

  // ---------- State ----------
  var sb = null;
  var S = { session: null, me: null, friends: [], places: [], reviews: [], tips: [], best: [], photos: [], notes: {}, groups: [], members: [], people: {} };
  var ui = {
    view: 'loading', place: null, person: null, cats: {}, deg: 1, indie: false, work: true, leisure: true, group: '',
    rate: null, add: null, email: '', mode: 'signin', recovery: false, busy: false, confirm: null, here: null
  };
  CATS.forEach(function (c) { ui.cats[c[0]] = true; });
  var map = null, markerLayer = null, meMarker = null, tileLayer = null;

  // ---------- Helpers ----------
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function safeUrl(u) { u = String(u || '').trim(); return /^https?:\/\//i.test(u) ? u : ''; }
  function toast(msg) { var t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(function () { t.hidden = true; }, 2600); }
  function fail(e, what) { console.error(e); toast((what || 'Something went wrong') + ': ' + (e && e.message ? e.message : 'please try again')); }
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem('vouch:' + k)); localStorage.setItem('vouch:' + k, JSON.stringify(v)); } catch (e) { return null; } }
  function daysSince(d) { var t = new Date(d + (String(d).length === 10 ? 'T12:00:00' : '')).getTime(); return Math.max(0, Math.floor((Date.now() - t) / DAY)); }
  function agoText(n) { return n <= 0 ? 'today' : n === 1 ? 'yesterday' : n + ' days ago'; }
  function fmtDate(d) { return new Date(d + (String(d).length === 10 ? 'T12:00:00' : '')).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  function initials(n) { var p = String(n || '').trim().split(/\s+/).filter(Boolean); if (!p.length) return '?'; return (p[0][0] + (p[1] ? p[1][0] : '')).toUpperCase(); }
  function mean(a) { return a.length ? a.reduce(function (s, x) { return s + x; }, 0) / a.length : 0; }
  function overall(r) { return (r.quality + r.value + r.location) / 3; }
  function todayISO() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function miles(a, b) {
    var R = 3958.8, toR = Math.PI / 180;
    var dLat = (b.lat - a.lat) * toR, dLng = (b.lng - a.lng) * toR;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(x));
  }
  function fmtMiles(m) { return m < 0.1 ? 'here' : m < 10 ? m.toFixed(1) + ' mi' : Math.round(m) + ' mi'; }
  function place(id) { for (var i = 0; i < S.places.length; i++) if (S.places[i].id === id) return S.places[i]; return null; }
  function myId() { return S.me ? S.me.id : null; }
  function degreeOf(uid) { if (uid === myId()) return 0; var p = S.people[uid]; return p ? p.degree : 9; }
  function nameOf(uid) {
    if (uid === myId()) return (S.me.name || 'You') + ' (you)';
    var p = S.people[uid];
    if (!p) return 'Someone';
    if (p.name) return p.name;
    return p.degree === 2 ? 'A friend of a friend' : 'A traveller';
  }
  function avClass(uid) { var d = degreeOf(uid); return d === 0 ? 'av me' : d === 1 ? 'av' : 'av wide'; }
  function avText(uid) { if (uid === myId()) return initials(S.me.name); var p = S.people[uid]; return p && p.name ? initials(p.name) : '?'; }
  function degLabel(uid) { var d = degreeOf(uid); return d === 0 ? 'You' : d === 1 ? 'Friend' : d === 2 ? '2nd degree' : '3rd degree'; }
  function photoUrl(path) { return sb.storage.from('photos').getPublicUrl(path).data.publicUrl; }

  function effectiveDark() {
    var t = S.me ? S.me.theme : store('theme');
    if (t === 'midnight') return true;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function applyTheme() {
    var t = (S.me && S.me.theme) || store('theme') || 'navy-gold';
    if (t === 'navy-gold') document.documentElement.removeAttribute('data-vtheme'); else document.documentElement.setAttribute('data-vtheme', t);
    var meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.setAttribute('content', effectiveDark() ? '#0B0D12' : '#FFFFFF');
    document.documentElement.classList.toggle('map-dark', effectiveDark());
  }
  function tileUrl() { return 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'; }

  // ---------- Visibility maths ----------
  function inScope(r) {
    var d = degreeOf(r.user_id);
    if (d > ui.deg) return false;
    if (ui.group) {
      if (r.user_id === myId()) return true;
      var ids = S.members.filter(function (m) { return m.group_id === ui.group; }).map(function (m) { return m.member; });
      if (ids.indexOf(r.user_id) < 0) return false;
    }
    return true;
  }
  function reviewsFor(pid, all) { return S.reviews.filter(function (r) { return r.place_id === pid && (all || inScope(r)); }); }
  function stats(pid) {
    var rs = reviewsFor(pid);
    var close = rs.filter(function (r) { return degreeOf(r.user_id) <= 1; });
    return { rs: rs, score: rs.length ? mean(rs.map(overall)) : 0, top: close.length > 0 && mean(close.map(overall)) >= 8.5, wide: rs.length > 0 && close.length === 0 };
  }
  function favsFor(pid) { return S.best.filter(function (b) { return b.place_id === pid && (b.user_id === myId() || degreeOf(b.user_id) <= ui.deg); }); }
  function tipsFor(pid) { return S.tips.filter(function (t) { return t.place_id === pid; }); }
  function photosFor(pid) { return S.photos.filter(function (p) { return p.place_id === pid; }).sort(function (a, b) { return a.created_at < b.created_at ? 1 : -1; }); }
  function centre() { if (ui.here) return ui.here; if (map) { var c = map.getCenter(); return { lat: c.lat, lng: c.lng }; } var v = store('view'); return v ? { lat: v[0], lng: v[1] } : { lat: 51.5074, lng: -0.1278 }; }
  function visiblePlaces() {
    return S.places.filter(function (p) {
      if (!ui.cats[p.category]) return false;
      if (ui.indie && !p.independent) return false;
      var rs = reviewsFor(p.id);
      if (!rs.length) return p.created_by === myId() && !ui.group;
      return rs.some(function (r) { return (ui.work && r.trip === 'Work') || (ui.leisure && r.trip === 'Leisure'); });
    });
  }

  // ---------- Data ----------
  async function loadAll() {
    if (notePending) await flushNote();
    var uid = S.session.user.id;
    var res = await Promise.all([
      sb.from('profiles').select('*').eq('id', uid).maybeSingle(),
      sb.from('friends').select('friend_id'),
      sb.from('places').select('*'),
      sb.from('reviews').select('*'),
      sb.from('tips').select('*'),
      sb.from('best').select('*'),
      sb.from('photos').select('*'),
      sb.from('notes').select('*'),
      sb.from('groups').select('*').order('name'),
      sb.from('group_members').select('*')
    ]);
    for (var i = 0; i < res.length; i++) if (res[i].error) throw res[i].error;
    S.me = res[0].data;
    if (!S.me) throw new Error('Your profile was not created. Check the database setup ran fully.');
    S.friends = res[1].data.map(function (f) { return f.friend_id; });
    S.places = res[2].data; S.reviews = res[3].data; S.tips = res[4].data; S.best = res[5].data; S.photos = res[6].data;
    S.notes = {}; res[7].data.forEach(function (n) { S.notes[n.place_id] = n.body; });
    S.groups = res[8].data; S.members = res[9].data;
    var ids = {};
    S.friends.concat(S.reviews.map(function (r) { return r.user_id; }), S.tips.map(function (t) { return t.user_id; }), S.best.map(function (b) { return b.user_id; }), S.photos.map(function (p) { return p.user_id; }))
      .forEach(function (id) { if (id && id !== uid) ids[id] = 1; });
    await loadPeople(Object.keys(ids));
    store('theme', S.me.theme);
    if (ui.view === 'loading') ui.deg = S.me.see_degree || 1;
  }
  async function loadPeople(ids) {
    S.people = {};
    if (!ids.length) return;
    var r = await sb.rpc('people', { ids: ids });
    if (r.error) throw r.error;
    r.data.forEach(function (p) { S.people[p.id] = { name: p.display_name, style: p.style, home: p.home, degree: p.degree }; });
  }
  async function refresh() { try { await loadAll(); render(); } catch (e) { fail(e, 'Could not load'); } }

  // ---------- Views ----------
  function viewSetup() {
    return '<div class="wrap stack" style="padding-block: 48px">' + logo() + '<h1>Almost ready</h1><p class="muted" style="margin:0">Vouch is not connected to its database yet. Add the Supabase Project URL and publishable key to <b>config.js</b>.</p></div>';
  }
  function logo() { return '<div class="logo"><svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="var(--primary)"/><path d="M9.5 16.5l4.5 4.5 8.5-10" fill="none" stroke="var(--trim)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>Vouch</div>'; }

  function viewSignIn() {
    var up = ui.mode === 'signup', reset = ui.mode === 'reset';
    var form;
    if (ui.recovery) {
      form = '<form id="newPassForm" class="stack" style="margin-top:12px"><h2>Choose a new password</h2><label for="newPass" class="lbl-t">New password</label><input id="newPass" class="field" type="password" autocomplete="new-password" minlength="8" required><span class="small muted">At least 8 characters, with a capital letter, a lowercase letter, a number and a symbol.</span><button class="btn primary" type="submit"' + (ui.busy ? ' disabled' : '') + '>Save password</button></form>';
    } else if (reset) {
      form = '<form id="resetForm" class="stack" style="margin-top:12px"><label for="emailIn" class="lbl-t">Your email</label><input id="emailIn" class="field" type="email" autocomplete="email" inputmode="email" required value="' + esc(ui.email) + '">' +
        '<button class="btn primary" type="submit"' + (ui.busy ? ' disabled' : '') + '>Email me a reset link</button><span class="small muted">Open the link in Safari or Chrome to choose a new password.</span>' +
        '<button class="btn soft" type="button" data-mode="signin">Back to sign in</button></form>';
    } else {
      form = '<div class="segwide" role="group" aria-label="Sign in or create account" style="margin-top:12px"><button type="button" data-mode="signin" aria-pressed="' + !up + '">Sign in</button><button type="button" data-mode="signup" aria-pressed="' + up + '">Create account</button></div>' +
        '<form id="authForm" class="stack"><label for="emailIn" class="lbl-t">Email</label><input id="emailIn" class="field" type="email" autocomplete="email" inputmode="email" required value="' + esc(ui.email) + '" placeholder="you@example.com">' +
        '<label for="passIn" class="lbl-t">Password</label><input id="passIn" class="field" type="password" autocomplete="' + (up ? 'new-password' : 'current-password') + '" minlength="8" required>' + (up ? '<span class="small muted">At least 8 characters, with a capital letter, a lowercase letter, a number and a symbol, e.g. Travel24!</span>' : '') +
        '<button class="btn primary" type="submit"' + (ui.busy ? ' disabled' : '') + '>' + (ui.busy ? 'Please wait…' : up ? 'Create account' : 'Sign in') + '</button>' +
        (up ? '' : '<button class="btn soft" type="button" data-mode="reset">Forgotten your password?</button>') + '</form>';
    }
    return '<div class="wrap stack" style="padding-block: 40px 24px; min-height: 86vh">' + logo() +
      '<div style="flex:1"></div>' +
      '<h1 style="font-size:38px">Places, rated by people you trust.</h1>' +
      '<p class="muted" style="margin:0;font-size:16px">Restaurants, hotels, supermarkets, fuel and EV chargers, wherever you travel. Only your friends\' ratings, so you know what a score really means.</p>' +
      form + '</div>';
  }

  function viewOnboard() {
    return '<div class="wrap stack" style="padding-block: 40px">' + logo() + '<h1>Welcome. What should friends call you?</h1>' +
      '<form id="onboardForm" class="stack"><label for="obName" class="lbl-t">Your name</label><input id="obName" class="field" autocomplete="name" required placeholder="e.g. Alex Morgan">' +
      '<span class="lbl-t">How do you usually rate?</span><div class="filters">' + STYLES.map(function (s, i) { return '<label class="pill" style="display:inline-flex;align-items:center;gap:6px"><input type="radio" name="obStyle" value="' + s + '"' + (i === 0 ? ' checked' : '') + '>' + s + '</label>'; }).join('') + '</div>' +
      '<span class="small muted">Shown on your reviews so friends know what your scores mean.</span><button class="btn primary" type="submit">Continue</button></form></div>';
  }

  function pinHtml(p) {
    var st = stats(p.id);
    var fav = favsFor(p.id).length > 0;
    var tip = tipsFor(p.id).length > 0;
    var cls = 'pin' + (st.top ? ' top' : '') + (st.wide ? ' wide' : '') + (!st.rs.length ? ' new' : '') + (fav ? ' fav' : '');
    return '<div class="' + cls + '" role="button" tabindex="0" aria-label="' + esc(p.name + (st.rs.length ? ', rated ' + st.score.toFixed(1) : ', not rated yet') + (fav ? ', a favourite' : '')) + '">' +
      '<span class="ic">' + svg(ICON[p.category]) + '</span>' + STAR + (st.rs.length ? st.score.toFixed(1) : 'New') + (tip ? svg(P.tag, 'tag') : '') + '</div>';
  }

  function viewMap() {
    var c = centre();
    var vis = visiblePlaces().map(function (p) { return { p: p, d: miles(c, p) }; }).sort(function (a, b) { return a.d - b.d; });
    var chips = CATS.map(function (k) { return '<button class="chip" data-cat="' + k[0] + '" aria-pressed="' + ui.cats[k[0]] + '">' + svg(ICON[k[0]]) + k[1] + '</button>'; }).join('');
    var segs = [['Friends', 1], ['2nd', 2], ['3rd', 3]].map(function (d) { return '<button data-deg="' + d[1] + '" aria-pressed="' + (ui.deg === d[1]) + '">' + d[0] + '</button>'; }).join('');
    var groupSel = '<label class="sr" for="groupSel" hidden>Show</label><select id="groupSel" class="pill" aria-label="Whose ratings"><option value="">All friends</option>' + S.groups.map(function (g) { return '<option value="' + g.id + '"' + (ui.group === g.id ? ' selected' : '') + '>' + esc(g.name) + '</option>'; }).join('') + '</select>';
    var list = vis.slice(0, 40).map(function (o) {
      var p = o.p, st = stats(p.id);
      var friendsN = st.rs.filter(function (r) { return degreeOf(r.user_id) === 1; }).length;
      var who = !st.rs.length ? 'Not rated yet' : friendsN ? friendsN + (friendsN === 1 ? ' friend' : ' friends') : 'friends of friends';
      return '<button class="item" data-place="' + p.id + '"><span class="tile">' + svg(ICON[p.category]) + '</span><span class="t"><span class="n">' + esc(p.name) + '</span><span class="small muted">' + (p.independent ? 'Independent · ' : '') + esc(CATNAME[p.category]) + ' · ' + fmtMiles(o.d) + ' · ' + who + '</span></span>' +
        (st.rs.length ? '<span class="badge' + (st.top ? ' top' : '') + '">' + st.score.toFixed(1) + '</span>' : '') + '</button>';
    }).join('');
    var emptyMsg = !S.places.length ? 'No places yet. Tap Rate to add the first one, or invite friends from the Friends tab.'
      : 'Nothing matches these filters here. Turn a category back on, widen to 2nd or 3rd degree, or move the map.';
    return '<div class="mapbox"><div id="map" aria-label="Map"></div>' +
      '<div class="map-top wrap"><div class="chips" role="group" aria-label="Categories">' + chips + '</div>' +
      '<div class="row"><div class="seg" role="group" aria-label="Degrees of separation">' + segs + '</div><span style="flex:1"></span>' +
      '<button class="fab" data-act="near" aria-label="Near me">' + svg(P.near) + '</button></div></div></div>' +
      '<div class="sheet wrap"><div class="handle"></div>' +
      '<div class="row between" style="align-items:baseline"><h2>Near you</h2><span class="small muted">' + vis.length + (vis.length === 1 ? ' place' : ' places') + '</span></div>' +
      '<div class="filters" style="padding-block:10px">' + groupSel +
      '<button class="pill" data-act="work" aria-pressed="' + ui.work + '">Work trips</button>' +
      '<button class="pill" data-act="leisure" aria-pressed="' + ui.leisure + '">Leisure trips</button>' +
      '<button class="pill" data-act="indie" aria-pressed="' + ui.indie + '">Independents only</button></div>' +
      '<div class="list">' + (list || '<p class="empty">' + emptyMsg + '</p>') + '</div></div>';
  }

  function badge(s) { return '<span class="badge' + (s >= 8.5 ? ' top' : '') + '">' + s.toFixed(1) + '</span>'; }

  function viewPlace() {
    var p = place(ui.place); if (!p) { ui.view = 'map'; return viewMap(); }
    var st = stats(p.id), rs = st.rs;
    var friendsN = rs.filter(function (r) { return degreeOf(r.user_id) === 1; }).length;
    var mine = S.reviews.filter(function (r) { return r.place_id === p.id && r.user_id === myId(); })[0];
    var photos = photosFor(p.id);
    var bars = [['Quality', 'quality'], ['Value', 'value'], ['Location', 'location']].map(function (b) {
      var m = mean(rs.map(function (r) { return r[b[1]]; }));
      return '<div class="bar"><span>' + b[0] + '</span><span class="track"><span class="fill" style="width:' + (m * 10) + '%"></span></span><b>' + m.toFixed(1) + '</b></div>';
    }).join('');
    var raters = rs.slice().sort(function (a, b) { return overall(b) - overall(a); }).map(function (r) {
      return '<button class="person" data-person="' + r.user_id + '"><span class="' + avClass(r.user_id) + '">' + esc(avText(r.user_id)) + '</span><span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px"><span style="font-weight:600">' + esc(nameOf(r.user_id)) + '</span><span class="small muted">' + degLabel(r.user_id) + ' · ' + r.trip + ' · ' + agoText(daysSince(r.visited_on)) + (r.body ? '' : ' · score only') + (r.visibility === 'me' ? ' · only you' : '') + '</span></span>' + badge(overall(r)) + '</button>';
    }).join('');
    var reviews = rs.filter(function (r) { return r.body; }).sort(function (a, b) { return a.visited_on < b.visited_on ? 1 : -1; }).map(function (r) {
      var n = daysSince(r.visited_on);
      var style = r.user_id === myId() ? S.me.style : (S.people[r.user_id] || {}).style;
      return '<article class="review"><div class="row"><span class="date">' + fmtDate(r.visited_on) + '</span><span class="ago' + (n > 60 ? ' old' : '') + '">' + agoText(n) + '</span></div>' +
        '<button class="person" style="border:0;padding:0" data-person="' + r.user_id + '"><span class="' + avClass(r.user_id) + '">' + esc(avText(r.user_id)) + '</span><span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px"><span style="font-weight:600">' + esc(nameOf(r.user_id)) + '</span><span class="small muted">' + degLabel(r.user_id) + (r.visibility === 'me' ? ' · only you can see this' : '') + '</span></span>' + badge(overall(r)) + '</button>' +
        '<div class="row" style="flex-wrap:wrap;gap:6px">' + (style ? '<span class="lbl">' + esc(style) + '</span>' : '') + '<span class="lbl grey">' + r.trip + ' trip</span></div>' +
        '<p style="margin:0;white-space:pre-line">' + esc(r.body) + '</p><span class="small muted">Quality ' + r.quality + ' · Value ' + r.value + ' · Location ' + r.location + '</span></article>';
    }).join('');
    var favs = favsFor(p.id).map(function (b) {
      var who = b.user_id === myId() ? 'Your' : (nameOf(b.user_id).split(' ')[0] + '\'s');
      return '<span class="favbadge">' + STAR.replace('class="star"', 'width="13" height="13"') + esc(who + ' best ' + (BEST[b.category] || 'place') + ' ever') + '</span>' + (b.quote ? '<span class="small muted" style="margin-top:-6px">“' + esc(b.quote) + '”</span>' : '');
    }).join('');
    var tips = tipsFor(p.id).map(function (t) {
      var link = safeUrl(t.url);
      return '<div class="tip"><span class="tg">' + svg(P.tag) + '</span><span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px"><span class="eyebrow">' + esc(t.kind) + '</span><span style="font-weight:600">' + esc(t.body) + '</span>' +
        (link ? '<a href="' + esc(link) + '" target="_blank" rel="noopener noreferrer" class="small" style="font-weight:600;word-break:break-all">' + esc(link.replace(/^https?:\/\//, '')) + '</a>' : '') +
        '<span class="small muted">Shared by ' + esc(nameOf(t.user_id)) + ' · ' + agoText(daysSince(t.created_at)) + '</span>' +
        (t.user_id === myId() ? '<button class="pill" style="align-self:flex-start" data-deltip="' + t.id + '">Remove</button>' : '') + '</span></div>';
    }).join('');
    var lat = p.lat, lng = p.lng, q = encodeURIComponent(p.name);
    var apple = 'https://maps.apple.com/?daddr=' + lat + ',' + lng + '&q=' + q;
    var google = 'https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lng;
    var waze = 'https://waze.com/ul?ll=' + lat + ',' + lng + '&navigate=yes';
    var wa = 'https://wa.me/?text=' + encodeURIComponent(shareText(p));
    var myBest = S.best.filter(function (b) { return b.user_id === myId() && b.category === p.category; })[0];
    var isMyBest = myBest && myBest.place_id === p.id;
    var degSeg = [['Friends', 1], ['+ 2nd degree', 2], ['+ 3rd', 3]].map(function (d) { return '<button data-deg="' + d[1] + '" aria-pressed="' + (ui.deg === d[1]) + '">' + d[0] + '</button>'; }).join('');
    var dist = ui.here ? ' · ' + fmtMiles(miles(ui.here, p)) + ' away' : '';
    return '<div class="wrap">' +
      '<div class="topbar"><button class="round" data-act="back" aria-label="Back">' + svg(P.back) + '</button><button class="round" data-act="share" aria-label="Share this place">' + svg(P.share) + '</button></div>' +
      (photos.length ? '<div class="photos">' + photos.slice(0, 6).map(function (ph) { return '<button class="photo" data-photo="' + esc(ph.path) + '" aria-label="View photo by ' + esc(nameOf(ph.user_id)) + '"><img src="' + esc(photoUrl(ph.path)) + '" alt="" loading="lazy"></button>'; }).join('') + '</div>' : '') +
      '<div class="section"><span class="eyebrow">' + (p.independent ? 'Independent · ' : '') + esc(CATNAME[p.category]) + '</span><h1>' + esc(p.name) + '</h1>' + (p.address ? '<span class="muted">' + esc(p.address) + dist + '</span>' : '') + favs + '</div>' +
      '<div class="segwide" role="group" aria-label="Whose ratings">' + degSeg + '</div>' +
      '<div class="section"><div class="card"><div class="row" style="gap:16px">' + (rs.length ? '<div class="big' + (st.top ? ' top' : '') + '">' + st.score.toFixed(1) + '</div>' : '<div class="big">–</div>') +
      '<div class="stack" style="gap:4px"><span style="font-weight:600;font-size:17px">' + (ui.deg === 1 ? 'Friends\' score' : 'Wider circle score') + '</span><span class="small muted">' + (rs.length ? 'From ' + rs.length + (rs.length === 1 ? ' person' : ' people') + (friendsN ? ', ' + friendsN + (friendsN === 1 ? ' friend' : ' friends') : '') : 'No ratings at this level yet. Be the first, or widen to 2nd or 3rd degree.') + '</span></div></div>' + (rs.length ? bars : '') + '</div></div>' +
      (rs.length ? '<div class="section"><h2>Rated by ' + rs.length + '</h2><div>' + raters + '</div></div>' : '') +
      (reviews ? '<div class="section"><h2>Reviews</h2><div>' + reviews + '</div></div>' : '') +
      '<div class="section"><label for="noteIn" class="row" style="gap:6px;font-weight:700">' + svg(P.lock, '', 16) + 'Your note <span class="small muted" style="font-weight:500">Only you can see this</span></label><textarea id="noteIn" class="note" placeholder="e.g. Ask for the window table">' + esc(S.notes[p.id] || '') + '</textarea></div>' +
      '<div class="section"><div class="row between"><h2>Value tips</h2><button class="pill" data-act="addtip">Add a tip</button></div>' + (tips || '<p class="small muted" style="margin:0">No tips yet. Know a loyalty scheme, a better time to go, or where to find offers? Add it.</p>') +
      (ui.tipOpen ? tipForm() : '') + '</div>' +
      '<div class="section"><h2>Getting there</h2><div class="grid2">' +
      '<a class="btn ghost" href="' + apple + '" target="_blank" rel="noopener">Apple Maps</a><a class="btn ghost" href="' + google + '" target="_blank" rel="noopener">Google Maps</a>' +
      '<a class="btn ghost" href="' + waze + '" target="_blank" rel="noopener">Waze</a><a class="btn ghost" href="' + wa + '" target="_blank" rel="noopener">WhatsApp</a></div>' +
      '<button class="btn soft" data-act="share">' + svg(P.share, '', 18) + 'Send this place</button></div>' +
      '<div class="section">' +
      (isMyBest ? '<label for="quoteIn" class="lbl-t">Why it\'s your best ' + esc(BEST[p.category]) + ' ever</label><input id="quoteIn" class="field" maxlength="140" value="' + esc(myBest.quote) + '" placeholder="e.g. The best flat white I have ever had">' : '') +
      '<button class="btn ghost" data-act="best">' + (isMyBest ? 'Remove from my best ever' : 'Make this my best ' + esc(BEST[p.category]) + ' ever') + '</button>' +
      '<button class="btn primary" data-act="rate">' + (mine ? 'Edit your review' : 'Add your review') + '</button></div>' +
      '</div>';
  }
  function tipForm() {
    return '<form id="tipForm" class="stack card"><label for="tipKind" class="lbl-t">Type</label><select id="tipKind" class="field"><option>Hidden value</option><option>Loyalty</option><option>Where to look</option></select>' +
      '<label for="tipBody" class="lbl-t">Tip</label><textarea id="tipBody" class="field" required maxlength="300" placeholder="e.g. Book direct on their website for free breakfast"></textarea>' +
      '<label for="tipUrl" class="lbl-t">Link (optional)</label><input id="tipUrl" class="field" type="url" inputmode="url" placeholder="https://">' +
      '<div class="row"><button class="btn soft" type="button" data-act="canceltip" style="flex:1">Cancel</button><button class="btn primary" type="submit" style="flex:1">Share tip</button></div></form>';
  }
  function shareText(p) {
    var st = stats(p.id);
    return p.name + (p.address ? ' (' + p.address.split(',')[0] + ')' : '') + (st.rs.length ? ' - rated ' + st.score.toFixed(1) + ' by friends on Vouch' : ' on Vouch') + '. https://www.google.com/maps/search/?api=1&query=' + p.lat + ',' + p.lng;
  }

  function viewRate() {
    var r = ui.rate; var p = place(r.place_id);
    function dots(k) { var b = ''; for (var n = 1; n <= 10; n++) b += '<button type="button" data-score="' + k + ':' + n + '" class="' + (n === r[k] ? 'cur' : n < r[k] ? 'on' : '') + '" aria-label="' + n + ' out of 10">' + n + '</button>'; return b; }
    return '<div class="wrap"><div class="topbar"><button class="round" data-act="back" aria-label="Close">' + svg(P.close) + '</button><h2>' + (r.existing ? 'Edit review' : 'New review') + '</h2><span style="width:44px"></span></div>' +
      '<form id="rateForm" class="stack" style="gap:20px;padding-bottom:24px">' +
      '<div class="row" style="gap:12px;padding:14px;border-radius:16px;box-shadow:inset 0 0 0 1px var(--line)"><span class="tile">' + svg(ICON[p.category]) + '</span><span style="flex:1;min-width:0;display:flex;flex-direction:column"><b>' + esc(p.name) + '</b><span class="small muted">' + esc(CATNAME[p.category]) + '</span></span></div>' +
      '<div class="row between"><label for="visitIn" class="lbl-t">Date of visit</label><input id="visitIn" type="date" class="field" style="width:auto" max="' + todayISO() + '" value="' + esc(r.visited_on) + '"></div>' +
      '<div class="row between"><span class="lbl-t">This trip was</span><span class="row" style="gap:8px"><button type="button" class="pill" data-trip="Work" aria-pressed="' + (r.trip === 'Work') + '">Work</button><button type="button" class="pill" data-trip="Leisure" aria-pressed="' + (r.trip === 'Leisure') + '">Leisure</button></span></div>' +
      '<div class="stack"><div class="row between"><span class="lbl-t">Your scores</span><span style="font-weight:600">Overall <span style="font-family:var(--display);font-size:20px">' + ((r.quality + r.value + r.location) / 3).toFixed(1) + '</span></span></div>' +
      [['Quality', 'quality'], ['Value', 'value'], ['Location', 'location']].map(function (x) { return '<div class="stack" style="gap:6px"><div class="row between"><span style="font-weight:600">' + x[0] + '</span><b>' + r[x[1]] + '</b></div><div class="dots" role="group" aria-label="' + x[0] + ' score">' + dots(x[1]) + '</div></div>'; }).join('') + '</div>' +
      '<div class="stack" style="gap:6px"><label for="revText" class="lbl-t">Your review</label><textarea id="revText" class="field" maxlength="2000" placeholder="What should your friends know? Tips like a better bakery down the road are gold.">' + esc(r.body) + '</textarea></div>' +
      '<div class="stack" style="gap:6px"><label for="photoIn" class="lbl-t">Photos (optional)</label><input id="photoIn" type="file" accept="image/*" multiple class="field"><span class="small muted">Menus, rooms, the view, what you ate. Shared with the same people as your review.</span></div>' +
      '<div class="stack" style="gap:6px"><span class="lbl-t">Who sees this review</span><div class="segwide"><button type="button" data-vis="circle" aria-pressed="' + (r.visibility === 'circle') + '">My circle</button><button type="button" data-vis="me" aria-pressed="' + (r.visibility === 'me') + '">Only me</button></div>' +
      '<span class="small muted">' + (r.visibility === 'circle' ? 'Friends, and friends of friends up to your privacy setting.' : 'Kept private, like a notebook.') + '</span></div>' +
      '<button class="btn primary" type="submit"' + (ui.busy ? ' disabled' : '') + '>' + (ui.busy ? 'Saving…' : r.existing ? 'Save changes' : 'Post review') + '</button>' +
      (r.existing ? '<button class="btn danger" type="button" data-act="delreview">Delete my review</button>' : '') + '</form></div>';
  }

  function viewAdd() {
    var a = ui.add;
    var results = (a.results || []).map(function (r, i) {
      return '<button class="item" data-pick="' + i + '"><span class="tile">' + svg(ICON[r.category]) + '</span><span class="t"><span class="n">' + esc(r.name) + '</span><span class="small muted">' + esc(r.address) + '</span></span></button>';
    }).join('');
    var f = a.form;
    return '<div class="wrap"><div class="topbar"><button class="round" data-act="back" aria-label="Close">' + svg(P.close) + '</button><h2>Rate a place</h2><span style="width:44px"></span></div>' +
      (!f ?
        '<form id="searchForm" class="stack"><label for="searchIn" class="lbl-t">Find the place</label><div class="row"><input id="searchIn" class="field" type="search" enterkeyhint="search" placeholder="Name and town, e.g. Forno Bakery Leeds" value="' + esc(a.q) + '"><button class="round" type="submit" aria-label="Search">' + svg(P.search) + '</button></div>' +
        '<span class="small muted">Searches near the map. Already on Vouch? It will appear in the list.</span></form>' +
        (a.searching ? '<p class="empty">Searching…</p>' : '') +
        (a.existing && a.existing.length ? '<div class="section"><span class="eyebrow">Already on Vouch</span><div class="list">' + a.existing.map(function (p) { return '<button class="item" data-place-rate="' + p.id + '"><span class="tile">' + svg(ICON[p.category]) + '</span><span class="t"><span class="n">' + esc(p.name) + '</span><span class="small muted">' + esc(p.address) + '</span></span></button>'; }).join('') + '</div></div>' : '') +
        (results ? '<div class="section"><span class="eyebrow">From the map</span><div class="list">' + results + '</div></div>' : (a.done && !a.searching ? '<p class="empty">No matches. Try adding the town, or drop a pin instead.</p>' : '')) +
        '<div class="section"><button class="btn ghost" data-act="droppin">Can\'t find it? Add it where the map is centred</button><span class="small muted">Move the map to the spot first.</span></div>'
        :
        '<form id="placeForm" class="stack" style="padding-bottom:24px"><label for="pName" class="lbl-t">Name</label><input id="pName" class="field" required maxlength="120" value="' + esc(f.name) + '">' +
        '<label for="pCat" class="lbl-t">Category</label><select id="pCat" class="field">' + CATS.map(function (c) { return '<option value="' + c[0] + '"' + (c[0] === f.category ? ' selected' : '') + '>' + esc(CATNAME[c[0]]) + '</option>'; }).join('') + '</select>' +
        '<label for="pAddr" class="lbl-t">Area or address</label><input id="pAddr" class="field" maxlength="200" value="' + esc(f.address) + '">' +
        '<label class="check"><input id="pIndie" type="checkbox"' + (f.independent ? ' checked' : '') + '>Independent business (not a chain)</label>' +
        '<button class="btn primary" type="submit"' + (ui.busy ? ' disabled' : '') + '>Next: rate it</button><button class="btn soft" type="button" data-act="unpick">Back to search</button></form>') +
      '</div>';
  }

  function viewFriends() {
    var friends = S.friends.slice().sort(function (a, b) { return nameOf(a).localeCompare(nameOf(b)); });
    var g = ui.groupEdit ? S.groups.filter(function (x) { return x.id === ui.groupEdit; })[0] : null;
    if (g) {
      var inG = S.members.filter(function (m) { return m.group_id === g.id; }).map(function (m) { return m.member; });
      return '<div class="wrap"><div class="topbar"><button class="round" data-act="groupdone" aria-label="Back">' + svg(P.back) + '</button><h2>' + esc(g.name) + '</h2><span style="width:44px"></span></div>' +
        '<p class="small muted" style="margin:0">Tick who belongs in this group. Only you can see your groups.</p><div class="list" style="margin-top:8px">' +
        (friends.length ? friends.map(function (id) { return '<label class="person" style="cursor:pointer"><span class="' + avClass(id) + '">' + esc(avText(id)) + '</span><span style="flex:1;font-weight:600">' + esc(nameOf(id)) + '</span><input type="checkbox" class="gmember" data-group="' + g.id + '" data-member="' + id + '"' + (inG.indexOf(id) >= 0 ? ' checked' : '') + ' style="width:22px;height:22px;accent-color:var(--primary)"></label>'; }).join('') : '<p class="empty">Add friends first.</p>') +
        '</div><div class="section"><button class="btn danger" data-delgroup="' + g.id + '">Delete this group</button></div></div>';
    }
    return '<div class="wrap" style="padding-top:20px">' +
      '<h1>Friends</h1>' +
      '<div class="section card"><span class="eyebrow">Your invite code</span><span class="code">' + esc(S.me.invite_code) + '</span><span class="small muted">Send this and the app link to someone. When they enter it, you become friends.</span><button class="btn primary" data-act="invite">' + svg(P.share, '', 18) + 'Send an invite</button></div>' +
      '<form id="friendForm" class="section"><label for="friendCode" class="lbl-t">Got a friend\'s code?</label><div class="row"><input id="friendCode" class="field code" style="font-size:20px" maxlength="10" autocapitalize="characters" autocomplete="off" placeholder="ABC123" required><button class="btn primary" type="submit">Add</button></div></form>' +
      '<div class="section"><h2>Your friends · ' + friends.length + '</h2><div class="list">' +
      (friends.length ? friends.map(function (id) { var p = S.people[id] || {}; return '<button class="person" data-person="' + id + '"><span class="' + avClass(id) + '">' + esc(avText(id)) + '</span><span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px"><span style="font-weight:600">' + esc(nameOf(id)) + '</span><span class="small muted">' + esc([p.style, p.home].filter(Boolean).join(' · ') || 'Friend') + '</span></span></button>'; }).join('') : '<p class="empty">No friends yet. Share your invite code to get started.</p>') +
      '</div></div>' +
      '<div class="section"><h2>Groups</h2><p class="small muted" style="margin:0">Like Family, Uni friends or Event crew. Filter the map to one group. Only you can see your groups.</p><div class="list">' +
      S.groups.map(function (gr) { var n = S.members.filter(function (m) { return m.group_id === gr.id; }).length; return '<button class="item" data-group-edit="' + gr.id + '"><span class="t"><span class="n">' + esc(gr.name) + '</span><span class="small muted">' + n + (n === 1 ? ' person' : ' people') + '</span></span></button>'; }).join('') +
      '</div><form id="groupForm" class="row"><label for="groupName" hidden>New group name</label><input id="groupName" class="field" maxlength="40" placeholder="New group, e.g. Family" required><button class="btn soft" type="submit">Create</button></form></div>' +
      '</div>';
  }

  function viewPerson() {
    var id = ui.person;
    if (id === myId()) { ui.view = 'me'; return viewMe(); }
    var p = S.people[id] || { degree: 9 };
    var best = S.best.filter(function (b) { return b.user_id === id; });
    var revs = S.reviews.filter(function (r) { return r.user_id === id; }).sort(function (a, b) { return a.visited_on < b.visited_on ? 1 : -1; });
    var isFriend = S.friends.indexOf(id) >= 0;
    return '<div class="wrap"><div class="topbar"><button class="round" data-act="back" aria-label="Back">' + svg(P.back) + '</button><span></span></div>' +
      '<div class="row" style="gap:16px"><span class="' + avClass(id) + '" style="width:72px;height:72px;border-radius:36px;font-size:22px">' + esc(avText(id)) + '</span><div class="stack" style="gap:4px"><h1 style="font-size:26px">' + esc(nameOf(id)) + '</h1><span class="small muted">' + degLabel(id) + (p.home ? ' · ' + esc(p.home) : '') + '</span>' + (p.style ? '<span class="lbl" style="align-self:flex-start">' + esc(p.style) + '</span>' : '') + '</div></div>' +
      '<div class="section"><h2>' + esc(p.name ? p.name.split(' ')[0] + '\'s' : 'Their') + ' best ever</h2>' +
      (best.length ? '<div class="list">' + best.map(function (b) { var pl = place(b.place_id); return pl ? '<button class="item" data-place="' + pl.id + '"><span class="tile" style="box-shadow:0 0 0 3px var(--fav)">' + svg(ICON[pl.category]) + '</span><span class="t"><span class="eyebrow" style="color:var(--fav-text)">Best ' + esc(BEST[b.category] || '') + '</span><span class="n">' + esc(pl.name) + '</span>' + (b.quote ? '<span class="small">“' + esc(b.quote) + '”</span>' : '') + '</span></button>' : ''; }).join('') + '</div>' : '<p class="small muted" style="margin:0">Nothing picked yet.</p>') + '</div>' +
      '<div class="section"><h2>Reviews you can see · ' + revs.length + '</h2>' + (revs.length ? '<div class="list">' + revs.map(function (r) { var pl = place(r.place_id); return pl ? '<button class="item" data-place="' + pl.id + '"><span class="tile">' + svg(ICON[pl.category]) + '</span><span class="t"><span class="n">' + esc(pl.name) + '</span><span class="small muted">' + fmtDate(r.visited_on) + ' · ' + r.trip + '</span></span>' + badge(overall(r)) + '</button>' : ''; }).join('') + '</div>' : '<p class="small muted" style="margin:0">None visible yet.</p>') + '</div>' +
      (isFriend ? '<div class="section">' + (ui.confirm === 'unfriend' ? '<p style="margin:0">Remove ' + esc(nameOf(id)) + ' as a friend?</p><div class="row"><button class="btn soft" data-act="confirm-no" style="flex:1">Keep</button><button class="btn danger" data-act="unfriend-yes" style="flex:1">Remove</button></div>' : '<button class="btn danger" data-act="unfriend">Remove friend</button>') + '</div>' : '') +
      '</div>';
  }

  function viewMe() {
    var me = S.me;
    var mine = S.reviews.filter(function (r) { return r.user_id === me.id; }).sort(function (a, b) { return a.visited_on < b.visited_on ? 1 : -1; });
    var best = S.best.filter(function (b) { return b.user_id === me.id; });
    function opt(field, val, label) { return '<button data-pref="' + field + ':' + val + '" aria-pressed="' + (String(me[field]) === String(val)) + '">' + label + '</button>'; }
    return '<div class="wrap" style="padding-top:20px">' +
      '<div class="row" style="gap:14px"><span class="av me" style="width:64px;height:64px;border-radius:32px;font-size:20px">' + esc(initials(me.name)) + '</span><div class="stack" style="gap:2px;min-width:0"><h1 style="font-size:26px">' + esc(me.name || 'You') + '</h1><span class="small muted">' + esc(S.session.user.email || '') + '</span></div></div>' +
      '<form id="profileForm" class="section"><h2>Your profile</h2>' +
      '<label for="meName" class="lbl-t">Name</label><input id="meName" class="field" maxlength="60" value="' + esc(me.name) + '">' +
      '<label for="meHome" class="lbl-t">Home town</label><input id="meHome" class="field" maxlength="60" value="' + esc(me.home) + '" placeholder="e.g. Leeds">' +
      '<label for="meBio" class="lbl-t">About you</label><textarea id="meBio" class="field" style="min-height:72px" maxlength="280" placeholder="e.g. Always on the road for events. Love a good bakery and a cheap EV charge.">' + esc(me.bio) + '</textarea>' +
      '<span class="lbl-t">How you rate</span><div class="filters">' + STYLES.map(function (s) { return '<button type="button" class="pill" data-style="' + s + '" aria-pressed="' + (me.style === s) + '">' + s + '</button>'; }).join('') + '</div>' +
      '<button class="btn primary" type="submit">Save profile</button></form>' +
      '<div class="section"><h2>Your best ever</h2>' + (best.length ? '<div class="list">' + best.map(function (b) { var pl = place(b.place_id); return pl ? '<button class="item" data-place="' + pl.id + '"><span class="tile" style="box-shadow:0 0 0 3px var(--fav)">' + svg(ICON[pl.category]) + '</span><span class="t"><span class="eyebrow" style="color:var(--fav-text)">Best ' + esc(BEST[b.category] || '') + '</span><span class="n">' + esc(pl.name) + '</span>' + (b.quote ? '<span class="small">“' + esc(b.quote) + '”</span>' : '') + '</span></button>' : ''; }).join('') + '</div>' : '<p class="small muted" style="margin:0">Open a place and tap "Make this my best ever". It gets a gold edge on friends\' maps.</p>') + '</div>' +
      '<div class="section"><h2>Your reviews · ' + mine.length + '</h2>' + (mine.length ? '<div class="list">' + mine.map(function (r) { var pl = place(r.place_id); return pl ? '<button class="item" data-place="' + pl.id + '"><span class="tile">' + svg(ICON[pl.category]) + '</span><span class="t"><span class="n">' + esc(pl.name) + '</span><span class="small muted">' + fmtDate(r.visited_on) + ' · ' + r.trip + (r.visibility === 'me' ? ' · only me' : '') + '</span></span>' + badge(overall(r)) + '</button>' : ''; }).join('') + '</div>' : '<p class="small muted" style="margin:0">No reviews yet. Tap Rate to add your first.</p>') + '</div>' +
      '<div class="section"><h2>Privacy</h2>' +
      '<span class="lbl-t">Recommendations I see by default</span><div class="segwide">' + opt('see_degree', 1, 'Friends') + opt('see_degree', 2, 'Up to 2nd') + opt('see_degree', 3, 'Up to 3rd') + '</div>' +
      '<span class="lbl-t">Who can see my reviews</span><div class="segwide">' + opt('share_degree', 1, 'Friends') + opt('share_degree', 2, 'Up to 2nd') + opt('share_degree', 3, 'Up to 3rd') + '</div>' +
      '<span class="lbl-t">How 2nd degree see my name</span><div class="segwide">' + opt('show_as_2', 'full', 'Full name') + opt('show_as_2', 'first', 'First name') + opt('show_as_2', 'anon', 'Hidden') + '</div>' +
      '<span class="lbl-t">How 3rd degree see my name</span><div class="segwide">' + opt('show_as_3', 'first', 'First name') + opt('show_as_3', 'anon', 'Hidden') + '</div>' +
      '<span class="small muted">Private notes and "Only me" reviews are never shared, whatever these say.</span></div>' +
      '<div class="section"><h2>Theme</h2><div class="themes">' + THEMES.map(function (t) { return '<button class="theme" data-themepick="' + t[0] + '" aria-pressed="' + (me.theme === t[0]) + '"><span style="font-weight:700">' + t[1] + '</span><span class="sw"><span style="background:' + t[2] + '"></span><span style="background:' + t[3] + '"></span><span style="background:' + t[4] + '"></span></span></button>'; }).join('') + '</div><span class="small muted">Navy &amp; Gold, Coastal and Forest follow your phone\'s dark mode.</span></div>' +
      '<div class="section"><h2>Install on your phone</h2><p class="small muted" style="margin:0">iPhone: open this page in Safari, tap Share, then Add to Home Screen. Android: open the browser menu and choose Add to Home screen.</p></div>' +
      '<div class="section"><button class="btn ghost" data-act="signout">Sign out</button></div>' +
      '</div>';
  }

  function renderTabs() {
    var t = $('tabs');
    var show = ['map', 'place', 'friends', 'person', 'me', 'rate', 'add'].indexOf(ui.view) >= 0;
    t.hidden = !show; if (!show) return;
    function cur(v) { return v.indexOf(ui.view) >= 0 ? ' aria-current="page"' : ''; }
    t.innerHTML = '<div class="in">' +
      '<button class="tab" data-tab="map"' + cur(['map', 'place']) + '>' + svg(P.map) + 'Map</button>' +
      '<button class="tab" data-tab="add"' + cur(['add', 'rate']) + '><span class="plus">' + svg(P.plus, '', 18) + '</span>Rate</button>' +
      '<button class="tab" data-tab="friends"' + cur(['friends', 'person']) + '>' + svg(P.friends) + 'Friends</button>' +
      '<button class="tab" data-tab="me"' + cur(['me']) + '>' + svg(P.me) + 'Me</button></div>';
  }

  function render() {
    applyTheme();
    if (map && ui.view !== 'map') { saveView(); map.remove(); map = null; markerLayer = null; meMarker = null; tileLayer = null; }
    var v = ui.view, h;
    if (v === 'setup') h = viewSetup();
    else if (v === 'signin') h = viewSignIn();
    else if (v === 'onboard') h = viewOnboard();
    else if (v === 'place') h = viewPlace();
    else if (v === 'rate') h = viewRate();
    else if (v === 'add') h = viewAdd();
    else if (v === 'friends') h = viewFriends();
    else if (v === 'person') h = viewPerson();
    else if (v === 'me') h = viewMe();
    else if (v === 'map') h = null;
    else h = '<p class="loading">Loading Vouch…</p>';
    var app = $('app');
    if (v === 'map') {
      if (!map) { app.innerHTML = viewMap(); initMap(); }
      else { refreshMapPanel(); }
    } else {
      app.innerHTML = h;
    }
    renderTabs();
  }
  function refreshMapPanel() {
    // Re-render the overlay and list but keep the live map.
    var mapEl = $('map');
    var holder = document.createElement('div'); holder.innerHTML = viewMap();
    var newTop = holder.querySelector('.map-top'), newSheet = holder.querySelector('.sheet');
    var app = $('app');
    app.querySelector('.map-top').replaceWith(newTop);
    app.querySelector('.sheet').replaceWith(newSheet);
    if (!mapEl) return;
    drawMarkers();
  }

  // ---------- Map ----------
  function saveView() { if (map) { var c = map.getCenter(); store('view', [c.lat, c.lng, map.getZoom()]); } }
  function initMap() {
    var v = store('view');
    var start = v ? [v[0], v[1]] : [54.3, -2.5], zoom = v ? v[2] : 6;
    if (!v && S.places.length) {
      var b = L.latLngBounds(S.places.map(function (p) { return [p.lat, p.lng]; }));
      start = b.getCenter(); zoom = 12;
    }
    map = L.map('map', { zoomControl: false, attributionControl: true }).setView(start, zoom);
    tileLayer = L.tileLayer(tileUrl(), {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
    }).addTo(map);
    markerLayer = L.layerGroup().addTo(map);
    drawMarkers();
    if (!v && S.places.length > 1) map.fitBounds(L.latLngBounds(S.places.map(function (p) { return [p.lat, p.lng]; })), { padding: [40, 40], maxZoom: 15 });
    if (ui.here) showMe();
    map.on('moveend', function () { saveView(); if (!ui.here) { var app = $('app'); var holder = document.createElement('div'); holder.innerHTML = viewMap(); var s = app.querySelector('.sheet'); if (s) s.replaceWith(holder.querySelector('.sheet')); } });
  }
  function drawMarkers() {
    if (!markerLayer) return;
    markerLayer.clearLayers();
    visiblePlaces().forEach(function (p) {
      var icon = L.divIcon({ className: 'vpin', html: pinHtml(p), iconSize: null });
      var st = stats(p.id);
      var m = L.marker([p.lat, p.lng], { icon: icon, keyboard: true, title: p.name, zIndexOffset: st.top ? 500 : favsFor(p.id).length ? 400 : 0 });
      m.on('click', function () { go('place', { place: p.id }); });
      markerLayer.addLayer(m);
    });
  }
  function showMe() {
    if (!map || !ui.here) return;
    var icon = L.divIcon({ className: 'vpin', html: '<div class="mepin" role="img" aria-label="You are here"></div>', iconSize: null });
    if (meMarker) meMarker.setLatLng([ui.here.lat, ui.here.lng]); else meMarker = L.marker([ui.here.lat, ui.here.lng], { icon: icon, interactive: false, zIndexOffset: 1000 }).addTo(map);
  }
  function locate(then) {
    if (!navigator.geolocation) { toast('Location is not available on this device'); return; }
    toast('Finding you…');
    navigator.geolocation.getCurrentPosition(function (pos) {
      ui.here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      if (then) then();
    }, function (err) {
      toast(err.code === 1 ? 'Location is off for this site. Allow it in your browser settings to use Near me.' : 'Could not find your location');
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  }

  // ---------- Place search (OpenStreetMap Nominatim) ----------
  function osmCategory(r) {
    var c = r.category, t = r.type;
    if (c === 'amenity') {
      if (t === 'cafe') return 'coffee';
      if (t === 'fuel') return 'fuel';
      if (t === 'charging_station') return 'ev';
      if (t === 'coworking_space') return 'work';
      if (['restaurant', 'fast_food', 'pub', 'bar', 'food_court', 'ice_cream', 'biergarten'].indexOf(t) >= 0) return 'eat';
      if (['cinema', 'theatre', 'arts_centre', 'nightclub'].indexOf(t) >= 0) return 'do';
    }
    if (c === 'tourism') { if (['hotel', 'guest_house', 'hostel', 'apartment', 'motel', 'chalet', 'camp_site', 'caravan_site'].indexOf(t) >= 0) return 'stay'; return 'do'; }
    if (c === 'shop') { if (['bakery', 'pastry', 'deli'].indexOf(t) >= 0) return 'eat'; if (t === 'coffee') return 'coffee'; return 'shop'; }
    if (c === 'office' && t === 'coworking') return 'work';
    if (c === 'leisure' || c === 'historic') return 'do';
    return 'eat';
  }
  async function searchPlaces(q) {
    var c = centre();
    var a = ui.add; a.searching = true; a.done = false; a.q = q;
    var ql = q.toLowerCase();
    a.existing = S.places.filter(function (p) { return p.name.toLowerCase().indexOf(ql.split(' ')[0]) >= 0; }).slice(0, 5);
    render();
    try {
      var url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&extratags=1&limit=10&accept-language=en-GB&q=' + encodeURIComponent(q) +
        '&viewbox=' + (c.lng - 0.5) + ',' + (c.lat + 0.35) + ',' + (c.lng + 0.5) + ',' + (c.lat - 0.35);
      var res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error('search service returned ' + res.status);
      var data = await res.json();
      a.results = data.map(function (r) {
        var ad = r.address || {};
        var area = [ad.road, ad.suburb || ad.neighbourhood, ad.town || ad.city || ad.village].filter(Boolean).join(', ');
        return {
          name: r.name || (r.display_name || '').split(',')[0], address: area || r.display_name, lat: Number(r.lat), lng: Number(r.lon),
          category: osmCategory(r), osm_id: r.osm_type + ':' + r.osm_id, independent: !(r.extratags && (r.extratags.brand || r.extratags['brand:wikidata']))
        };
      }).filter(function (r) { return r.name; });
    } catch (e) { a.results = []; fail(e, 'Search failed'); }
    a.searching = false; a.done = true; render();
  }

  // ---------- Actions ----------
  function go(view, extra) {
    if (notePending) flushNote();
    if (extra) for (var k in extra) ui[k] = extra[k];
    if (view !== 'person') ui.confirm = null;
    if (view !== 'place') ui.tipOpen = false;
    ui.prev = ui.view === view ? ui.prev : ui.view;
    ui.view = view; render(); window.scrollTo(0, 0);
  }
  function startRate(pid) {
    var mine = S.reviews.filter(function (r) { return r.place_id === pid && r.user_id === myId(); })[0];
    ui.rate = mine ? { place_id: pid, quality: mine.quality, value: mine.value, location: mine.location, trip: mine.trip, body: mine.body, visibility: mine.visibility, visited_on: mine.visited_on, existing: mine.id }
      : { place_id: pid, quality: 7, value: 7, location: 7, trip: 'Leisure', body: '', visibility: 'circle', visited_on: todayISO(), existing: null };
    go('rate');
  }
  function syncRate() { var t = $('revText'); if (t && ui.rate) ui.rate.body = t.value; var d = $('visitIn'); if (d && ui.rate && d.value) ui.rate.visited_on = d.value; }

  async function resizeImage(file) {
    var url = URL.createObjectURL(file);
    try {
      var img = await new Promise(function (ok, no) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = no; i.src = url; });
      var max = 1600, w = img.naturalWidth, h = img.naturalHeight, s = Math.min(1, max / Math.max(w, h));
      var c = document.createElement('canvas'); c.width = Math.round(w * s); c.height = Math.round(h * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      return await new Promise(function (ok) { c.toBlob(ok, 'image/jpeg', 0.82); });
    } finally { URL.revokeObjectURL(url); }
  }
  function uuid() { return (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2)); }

  async function saveReview() {
    syncRate(); var r = ui.rate; ui.busy = true; render();
    try {
      var row = { place_id: r.place_id, user_id: myId(), quality: r.quality, value: r.value, location: r.location, trip: r.trip, body: r.body.trim(), visibility: r.visibility, visited_on: r.visited_on || todayISO() };
      var q = await sb.from('reviews').upsert(row, { onConflict: 'place_id,user_id' });
      if (q.error) throw q.error;
      var files = ui.files || [];
      for (var i = 0; i < files.length; i++) {
        var blob = await resizeImage(files[i]);
        var path = myId() + '/' + uuid() + '.jpg';
        var up = await sb.storage.from('photos').upload(path, blob, { contentType: 'image/jpeg', upsert: false });
        if (up.error) throw up.error;
        var ins = await sb.from('photos').insert({ place_id: r.place_id, user_id: myId(), path: path });
        if (ins.error) throw ins.error;
      }
      ui.files = [];
      await loadAll(); ui.busy = false; toast(r.existing ? 'Review updated' : 'Review posted'); go('place', { place: r.place_id });
    } catch (e) { ui.busy = false; render(); fail(e, 'Could not save'); }
  }

  async function updateProfile(patch, quiet) {
    var q = await sb.from('profiles').update(patch).eq('id', myId()).select().single();
    if (q.error) { fail(q.error, 'Could not save'); return false; }
    S.me = q.data; store('theme', S.me.theme);
    if (!quiet) toast('Saved');
    return true;
  }

  var noteTimer = null, notePending = null;
  function saveNoteSoon(pid, body) {
    S.notes[pid] = body;
    notePending = { pid: pid, body: body };
    clearTimeout(noteTimer);
    noteTimer = setTimeout(flushNote, 700);
  }
  async function flushNote() {
    clearTimeout(noteTimer);
    var n = notePending; notePending = null;
    if (!n) return;
    var q = n.body.trim() ? await sb.from('notes').upsert({ user_id: myId(), place_id: n.pid, body: n.body, updated_at: new Date().toISOString() }, { onConflict: 'user_id,place_id' })
      : await sb.from('notes').delete().eq('user_id', myId()).eq('place_id', n.pid);
    if (q.error) fail(q.error, 'Note not saved');
  }

  async function sharePlace(p) {
    var text = shareText(p);
    if (navigator.share) { try { await navigator.share({ title: p.name, text: text }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
    try { await navigator.clipboard.writeText(text); toast('Copied. Paste it into any message.'); } catch (e) { toast('Use the WhatsApp button to send it'); }
  }
  async function shareInvite() {
    var link = location.origin + location.pathname;
    var text = 'Join me on Vouch, where friends rate places for each other. Open ' + link + ', sign in, and add my code: ' + S.me.invite_code;
    if (navigator.share) { try { await navigator.share({ title: 'Join me on Vouch', text: text }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
    try { await navigator.clipboard.writeText(text); toast('Invite copied. Paste it into a message.'); } catch (e) { toast('Your code is ' + S.me.invite_code); }
  }

  // ---------- Events ----------
  document.addEventListener('click', async function (e) {
    if (e.target.closest('#viewer')) { $('viewer').hidden = true; $('viewer').innerHTML = ''; return; }
    var el = e.target.closest('button, a, [data-place]');
    if (!el || el.tagName === 'A') return;
    var d = el.dataset;
    if (d.mode) { ui.mode = d.mode; render(); return; }
    if (d.place) { go('place', { place: d.place }); return; }
    if (d.placeRate) { startRate(d.placeRate); return; }
    if (d.person) { go('person', { person: d.person }); return; }
    if (d.cat) { ui.cats[d.cat] = !ui.cats[d.cat]; render(); return; }
    if (d.deg) { ui.deg = Number(d.deg); render(); return; }
    if (d.tab) { if (d.tab === 'add') { ui.add = { q: '', results: [], form: null }; } ui.groupEdit = null; go(d.tab); return; }
    if (d.score) { syncRate(); var s = d.score.split(':'); ui.rate[s[0]] = Number(s[1]); render(); return; }
    if (d.trip) { syncRate(); ui.rate.trip = d.trip; render(); return; }
    if (d.vis) { syncRate(); ui.rate.vis = d.vis; ui.rate.visibility = d.vis; render(); return; }
    if (d.style) { S.me.style = d.style; render(); return; }
    if (d.pref) { var pr = d.pref.split(':'); var val = /degree/.test(pr[0]) ? Number(pr[1]) : pr[1]; var patch = {}; patch[pr[0]] = val; if (await updateProfile(patch, true)) { if (pr[0] === 'see_degree') ui.deg = val; await refresh(); toast('Saved'); } return; }
    if (d.themepick) { await updateProfile({ theme: d.themepick }, true); render(); return; }
    if (d.photo) { var v = $('viewer'); v.innerHTML = '<img src="' + esc(photoUrl(d.photo)) + '" alt="Photo"><button class="round" aria-label="Close photo">' + svg(P.close) + '</button>'; v.hidden = false; return; }
    if (d.pick != null) { var r = ui.add.results[Number(d.pick)]; var ex = S.places.filter(function (p) { return p.osm_id === r.osm_id; })[0]; if (ex) { startRate(ex.id); return; } ui.add.form = r; render(); return; }
    if (d.groupEdit) { ui.groupEdit = d.groupEdit; render(); window.scrollTo(0, 0); return; }
    if (d.delgroup) { var dg = await sb.from('groups').delete().eq('id', d.delgroup); if (dg.error) return fail(dg.error); if (ui.group === d.delgroup) ui.group = ''; ui.groupEdit = null; await refresh(); return; }
    if (d.deltip) { var dt = await sb.from('tips').delete().eq('id', d.deltip); if (dt.error) return fail(dt.error); await refresh(); return; }
    var a = d.act; if (!a) return;
    if (false) {}
    else if (a === 'work' || a === 'leisure') { ui[a] = !ui[a]; if (!ui.work && !ui.leisure) ui[a === 'work' ? 'leisure' : 'work'] = true; render(); }
    else if (a === 'indie') { ui.indie = !ui.indie; render(); }
    else if (a === 'near') { locate(function () { if (map) { showMe(); map.setView([ui.here.lat, ui.here.lng], Math.max(map.getZoom(), 14)); } render(); }); }
    else if (a === 'back') { var to = ui.view === 'rate' ? 'place' : ui.view === 'person' && ui.prev === 'place' ? 'place' : ui.view === 'person' && ui.prev === 'friends' ? 'friends' : 'map'; if (to === 'place' && !place(ui.place)) to = 'map'; go(to); }
    else if (a === 'rate') { startRate(ui.place); }
    else if (a === 'share') { sharePlace(place(ui.place)); }
    else if (a === 'invite') { shareInvite(); }
    else if (a === 'addtip') { ui.tipOpen = true; render(); var tb = $('tipBody'); if (tb) tb.focus(); }
    else if (a === 'canceltip') { ui.tipOpen = false; render(); }
    else if (a === 'best') {
      var p = place(ui.place);
      var cur = S.best.filter(function (b) { return b.user_id === myId() && b.category === p.category; })[0];
      var q = cur && cur.place_id === p.id ? await sb.from('best').delete().eq('user_id', myId()).eq('category', p.category)
        : await sb.from('best').upsert({ user_id: myId(), category: p.category, place_id: p.id, quote: '' }, { onConflict: 'user_id,category' });
      if (q.error) return fail(q.error);
      await refresh(); toast(cur && cur.place_id === p.id ? 'Removed from your best ever' : 'Added to your best ever');
    }
    else if (a === 'delreview') { var dr = await sb.from('reviews').delete().eq('id', ui.rate.existing); if (dr.error) return fail(dr.error); await refresh(); toast('Review deleted'); go('place', { place: ui.rate.place_id }); }
    else if (a === 'droppin') { var c = map ? map.getCenter() : centre(); var cc = store('view'); var lat = cc ? cc[0] : c.lat, lng = cc ? cc[1] : c.lng; ui.add.form = { name: ui.add.q || '', address: '', lat: lat, lng: lng, category: 'eat', osm_id: null, independent: true }; render(); }
    else if (a === 'unpick') { ui.add.form = null; render(); }
    else if (a === 'groupdone') { ui.groupEdit = null; await refresh(); }
    else if (a === 'unfriend') { ui.confirm = 'unfriend'; render(); }
    else if (a === 'confirm-no') { ui.confirm = null; render(); }
    else if (a === 'unfriend-yes') { var rf = await sb.rpc('remove_friend', { other: ui.person }); if (rf.error) return fail(rf.error); await refresh(); toast('Friend removed'); go('friends'); }
    else if (a === 'signout') { await sb.auth.signOut(); }
  });

  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('pin')) { e.preventDefault(); e.target.click(); }
  });

  document.addEventListener('change', async function (e) {
    var t = e.target;
    if (t.id === 'groupSel') { ui.group = t.value; render(); }
    else if (t.id === 'photoIn') { ui.files = Array.prototype.slice.call(t.files || [], 0, 6); if (ui.files.length) toast(ui.files.length + (ui.files.length === 1 ? ' photo' : ' photos') + ' ready to upload'); }
    else if (t.id === 'visitIn') { syncRate(); }
    else if (t.id === 'quoteIn') {
      var p = place(ui.place);
      var q = await sb.from('best').update({ quote: t.value.trim() }).eq('user_id', myId()).eq('category', p.category);
      if (q.error) fail(q.error); else { S.best.forEach(function (b) { if (b.user_id === myId() && b.category === p.category) b.quote = t.value.trim(); }); toast('Saved'); }
    }
    else if (t.classList.contains('gmember')) {
      var g = t.dataset.group, m = t.dataset.member;
      var q2 = t.checked ? await sb.from('group_members').insert({ group_id: g, member: m }) : await sb.from('group_members').delete().eq('group_id', g).eq('member', m);
      if (q2.error) { fail(q2.error); t.checked = !t.checked; return; }
      if (t.checked) S.members.push({ group_id: g, member: m }); else S.members = S.members.filter(function (x) { return !(x.group_id === g && x.member === m); });
    }
  });
  document.addEventListener('input', function (e) { if (e.target.id === 'noteIn') saveNoteSoon(ui.place, e.target.value); });

  document.addEventListener('submit', async function (e) {
    e.preventDefault();
    var id = e.target.id;
    if (id === 'authForm') {
      ui.email = $('emailIn').value.trim(); var pw = $('passIn').value;
      if (!ui.email || !pw) return;
      store('email', ui.email); ui.busy = true; render();
      var r = ui.mode === 'signup'
        ? await sb.auth.signUp({ email: ui.email, password: pw, options: { emailRedirectTo: location.origin + location.pathname } })
        : await sb.auth.signInWithPassword({ email: ui.email, password: pw });
      ui.busy = false;
      if (r.error) { render(); return fail(r.error, ui.mode === 'signup' ? 'Could not create the account' : 'Could not sign in'); }
      if (ui.mode === 'signup' && !r.data.session) { render(); toast('Check your email to confirm your account, then sign in.'); }
    }
    else if (id === 'resetForm') {
      ui.email = $('emailIn').value.trim(); if (!ui.email) return;
      ui.busy = true; render();
      var rr = await sb.auth.resetPasswordForEmail(ui.email, { redirectTo: location.origin + location.pathname });
      ui.busy = false; ui.mode = 'signin'; render();
      if (rr.error) return fail(rr.error, 'Could not send the email');
      toast('If that email has an account, a reset link is on its way.');
    }
    else if (id === 'newPassForm') {
      ui.busy = true; render();
      var np = await sb.auth.updateUser({ password: $('newPass').value });
      ui.busy = false;
      if (np.error) { render(); return fail(np.error, 'Could not save the password'); }
      ui.recovery = false; toast('Password saved'); onSession((await sb.auth.getSession()).data.session);
    }
    else if (id === 'onboardForm') {
      var name = $('obName').value.trim(); if (!name) return;
      var st = (document.querySelector('input[name="obStyle"]:checked') || {}).value || '';
      if (await updateProfile({ name: name, style: st }, true)) go('friends');
    }
    else if (id === 'profileForm') {
      await updateProfile({ name: $('meName').value.trim(), home: $('meHome').value.trim(), bio: $('meBio').value.trim(), style: S.me.style || '' });
      render();
    }
    else if (id === 'searchForm') { var q = $('searchIn').value.trim(); if (q.length > 1) searchPlaces(q); }
    else if (id === 'placeForm') {
      var f = ui.add.form; ui.busy = true;
      var row = { name: $('pName').value.trim(), category: $('pCat').value, address: $('pAddr').value.trim(), independent: $('pIndie').checked, lat: f.lat, lng: f.lng, osm_id: f.osm_id || null, created_by: myId() };
      var ins = await sb.from('places').insert(row).select().single();
      ui.busy = false;
      if (ins.error) {
        if (f.osm_id && /duplicate|unique/i.test(ins.error.message)) { await loadAll(); var ex = S.places.filter(function (p) { return p.osm_id === f.osm_id; })[0]; if (ex) return startRate(ex.id); }
        return fail(ins.error, 'Could not add the place');
      }
      S.places.push(ins.data); ui.place = ins.data.id; startRate(ins.data.id);
    }
    else if (id === 'rateForm') { saveReview(); }
    else if (id === 'tipForm') {
      var body = $('tipBody').value.trim(); if (!body) return;
      var url = safeUrl($('tipUrl').value);
      if ($('tipUrl').value.trim() && !url) return toast('Links need to start with https://');
      var tq = await sb.from('tips').insert({ place_id: ui.place, user_id: myId(), kind: $('tipKind').value, body: body, url: url });
      if (tq.error) return fail(tq.error);
      ui.tipOpen = false; await refresh(); toast('Tip shared');
    }
    else if (id === 'friendForm') {
      var fr = await sb.rpc('add_friend', { code: $('friendCode').value });
      if (fr.error) return fail(fr.error, 'Could not add');
      await refresh(); toast('You are now friends');
    }
    else if (id === 'groupForm') {
      var gq = await sb.from('groups').insert({ owner: myId(), name: $('groupName').value.trim() }).select().single();
      if (gq.error) return fail(gq.error);
      S.groups.push(gq.data); ui.groupEdit = gq.data.id; render(); window.scrollTo(0, 0);
    }
  });

  if (window.matchMedia) { var mq = window.matchMedia('(prefers-color-scheme: dark)'); if (mq.addEventListener) mq.addEventListener('change', applyTheme); }

  // ---------- Start ----------
  async function onSession(session) {
    S.session = session;
    if (ui.recovery) { ui.view = 'signin'; render(); return; }
    if (!session) { ui.view = 'signin'; ui.mode = ui.mode || 'signin'; ui.email = store('email') || ''; render(); return; }
    try {
      await loadAll();
      ui.view = S.me.name ? 'map' : 'onboard';
      render();
    } catch (e) { ui.view = 'signin'; render(); fail(e, 'Could not load your data'); }
  }
  function start() {
    applyTheme();
    if (!CONFIGURED || !window.supabase || !window.L) { ui.view = 'setup'; render(); return; }
    sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    var started = false;
    sb.auth.onAuthStateChange(function (event, session) {
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') { S.session = session; return; }
      if (event === 'PASSWORD_RECOVERY') { S.session = session; ui.recovery = true; ui.view = 'signin'; started = true; render(); return; }
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        if (event === 'SIGNED_IN' && started && S.me) return;
        started = true;
        setTimeout(function () { onSession(session); }, 0);
      }
    });
  }
  start();
})();
