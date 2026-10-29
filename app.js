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
    restaurant: '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 2-2.5 5-2.5 8h2.5v10"/>',
    bite: '<path d="M4 11h16l-1.5 8h-13L4 11zM7 11a5 5 0 0 1 10 0"/>',
    drink: '<path d="M8 3h8l-1 7a3 3 0 0 1-6 0L8 3zM12 13v7M8 21h8"/>',
    pub: '<path d="M5 8h10v12H5zM15 11h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2M5 8a3 3 0 0 1 3-4h4a3 3 0 0 1 3 4"/>',
    cocktails: '<path d="M4 4h16l-8 9-8-9zM12 13v7M8 20h8"/>',
    parking: '<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M10 17V7h3a3 3 0 0 1 0 6h-3"/>',
    explore: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5 5-2z"/>',
    outdoors: '<path d="M3 20l6-10 4 6 3-4 5 8H3z"/>',
    culture: '<path d="M3 21h18M5 21V10M9 21V10M15 21V10M19 21V10M2 10l10-6 10 6H2z"/>',
    camping: '<path d="M3 20L12 4l9 16H3zM12 20v-6"/>',
    bakery: '<path d="M5 12a7 5 0 0 1 14 0v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-4zM9 9v4M12 8v5M15 9v4"/>',
    pharmacy: '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M12 8v8M8 12h8"/>',
    books: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5zM19 19v2H6"/>',
    fashion: '<path d="M12 7a2 2 0 1 1 2-2M12 7v2L3 16h18l-9-7"/>'
  };
  var CATS = [['eat', 'Eat'], ['drink', 'Drink'], ['stay', 'Stay'], ['shop', 'Shop'], ['fuel', 'Fuel'], ['ev', 'EV charging'], ['parking', 'Parking'], ['work', 'Workspace'], ['explore', 'Explore']];
  var SUBS = {
    eat: [['restaurant', 'Restaurant'], ['bite', 'Grab a bite']],
    drink: [['coffee', 'Coffee shop'], ['pub', 'Pub'], ['cocktails', 'Cocktail bar']],
    stay: [['hotel', 'Hotel'], ['bnb', 'B&B or guesthouse'], ['rental', 'Holiday let'], ['camping', 'Campsite']],
    shop: [['supermarket', 'Supermarket'], ['convenience', 'Convenience store'], ['bakery', 'Bakery'], ['butcher', 'Butcher'], ['greengrocer', 'Greengrocer'], ['fishmonger', 'Fishmonger'], ['deli', 'Deli or farm shop'], ['wine', 'Wine or off-licence'], ['market', 'Market'], ['pharmacy', 'Pharmacy'], ['books', 'Bookshop'], ['fashion', 'Clothes and shoes'], ['gifts', 'Gifts and crafts'], ['outdoor', 'Outdoor and sports'], ['hardware', 'Hardware and DIY'], ['electronics', 'Electronics'], ['local', 'Other local shop']],
    explore: [['sights', 'Sights'], ['outdoors', 'Outdoors'], ['culture', 'Culture'], ['activities', 'Activities']]
  };
  var CATNAME = { eat: 'Eat', drink: 'Drink', stay: 'Stay', shop: 'Shop', fuel: 'Fuel', ev: 'EV charging', parking: 'Parking', work: 'Workspace', explore: 'Explore' };
  var SUBNAME = {};
  Object.keys(SUBS).forEach(function (k) { SUBS[k].forEach(function (x) { SUBNAME[x[0]] = x[1]; }); });
  var BESTLBL = { restaurant: 'restaurant', bite: 'quick bite', coffee: 'coffee shop', pub: 'pub', cocktails: 'cocktail bar', hotel: 'hotel', bnb: 'B&B', rental: 'holiday let', camping: 'campsite', supermarket: 'supermarket', convenience: 'corner shop', bakery: 'bakery', butcher: 'butcher', greengrocer: 'greengrocer', fishmonger: 'fishmonger', deli: 'deli', wine: 'wine shop', pharmacy: 'pharmacy', books: 'bookshop', fashion: 'clothes shop', gifts: 'gift shop', outdoor: 'outdoor shop', hardware: 'hardware shop', electronics: 'electronics shop', local: 'local shop', market: 'market', sights: 'sight', outdoors: 'outdoor spot', culture: 'culture spot', activities: 'activity', eat: 'place to eat', drink: 'place for a drink', stay: 'place to stay', shop: 'shop', fuel: 'petrol station', ev: 'EV charger', parking: 'car park', work: 'workspace', explore: 'day out' };
  function catCls(p) { return 'c-' + ((p && p.category) || 'eat'); }
  function iconFor(p) { return ICON[p.subcategory] || ICON[p.category] || ICON.eat; }
  // A place has a main category plus up to two extras, e.g. a pub that does food.
  function allCats(p) {
    var a = [{ category: p.category, subcategory: p.subcategory || '' }];
    (p.extra || []).forEach(function (x) {
      var v = String(x).split(':');
      if (v[0] && CATNAME[v[0]] && !a.some(function (c) { return c.category === v[0] && c.subcategory === (v[1] || ''); })) a.push({ category: v[0], subcategory: v[1] || '' });
    });
    return a.slice(0, 3);
  }
  function catName1(c) { return SUBNAME[c.subcategory] || CATNAME[c.category] || 'Place'; }
  function kindName(p) { return allCats(p).map(catName1).join(' · '); }
  function catOn(p, cats, subs) { return allCats(p).some(function (c) { return cats[c.category] && !(c.subcategory && subs[c.subcategory] === false); }); }
  function bestKey(p) { return p.subcategory || p.category; }
  function bestLabel(k) { return BESTLBL[k] || 'place'; }
  function catSelect(id, cat, sub, none) {
    return '<select id="' + id + '" class="field">' + (none ? '<option value="">None</option>' : '') + CATS.map(function (c) {
      var subs = SUBS[c[0]];
      if (!subs) return '<option value="' + c[0] + ':"' + (c[0] === cat ? ' selected' : '') + '>' + esc(c[1]) + '</option>';
      return '<optgroup label="' + esc(c[1]) + '">' + subs.map(function (x) { return '<option value="' + c[0] + ':' + x[0] + '"' + (c[0] === cat && (x[0] === sub || (!sub && x === subs[0])) ? ' selected' : '') + '>' + esc(x[1]) + '</option>'; }).join('') + '</optgroup>';
    }).join('') + '</select>';
  }
  function readCat(id) { var el = $(id); if (!el || !el.value) return { category: '', subcategory: '' }; var v = el.value.split(':'); return { category: v[0], subcategory: v[1] || '' }; }
  function extraFields(prefix, p) {
    if (S.needsCats) return '';
    var ex = allCats({ category: p.category, subcategory: p.subcategory, extra: p.extra }).slice(1);
    return '<span class="lbl-t">Also a… (optional)</span>' +
      catSelect(prefix + '2', ex[0] ? ex[0].category : '', ex[0] ? ex[0].subcategory : '', true) +
      catSelect(prefix + '3', ex[1] ? ex[1].category : '', ex[1] ? ex[1].subcategory : '', true) +
      '<span class="small muted">For a pub that does food, or a supermarket with fuel or EV charging.</span>';
  }
  function readExtra(prefix, main) {
    var out = [];
    [readCat(prefix + '2'), readCat(prefix + '3')].forEach(function (c) {
      if (!c.category) return;
      var k = c.category + ':' + c.subcategory;
      if (k !== main.category + ':' + main.subcategory && out.indexOf(k) < 0) out.push(k);
    });
    return out;
  }
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
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    bookmark: '<path d="M6 3h12v18l-6-4-6 4V3z"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    chevR: '<path d="M9 5l7 7-7 7"/>',
    chevL: '<path d="M15 5l-7 7 7 7"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    at: '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    car: '<path d="M5 16v-5l2-5h10l2 5v5M3 16h18v3H3zM7 19v2M17 19v2M7.5 13h.01M16.5 13h.01"/>',
    msg: '<path d="M4 5h16v11H9l-5 4V5z"/>',
    list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>'
  };
  var STARP = '<path d="M12 2.8l2.85 5.8 6.4.93-4.63 4.5 1.1 6.37L12 17.4l-5.72 3l1.1-6.37L2.75 9.53l6.4-.93L12 2.8z"/>';
  function svg(path, cls, size) { return '<svg class="' + (cls || '') + '"' + (size ? ' width="' + size + '" height="' + size + '"' : '') + ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + '</svg>'; }

  // ---------- State ----------
  var sb = null;
  var S = { session: null, me: null, friends: [], following: [], followers: [], saves: [], needsUpdate: false, places: [], reviews: [], tips: [], best: [], photos: [], notes: {}, groups: [], members: [], people: {}, links: [], needsLinks: false, needsCats: false, needsV6: false, silenced: [], needsV7: false, isAdmin: false, mySugg: [], inbox: [] };
  var ui = {
    view: 'loading', place: null, person: null, cats: {}, subs: {}, drawer: false, deg: 1, indie: false, work: true, leisure: true, group: '',
    mf: null, rate: null, add: null, email: '', mode: 'signin', recovery: false, busy: false, confirm: null, here: null, sheetClosed: false
  };
  CATS.forEach(function (c) { ui.cats[c[0]] = true; });
  function resetMineFilters(keepQ) { var q = keepQ && ui.mf ? ui.mf.q : ''; ui.mf = { q: q, cats: {}, subs: {}, work: true, leisure: true, indie: false, only: false, sort: 'new', open: ui.mf ? ui.mf.open : false }; CATS.forEach(function (c) { ui.mf.cats[c[0]] = true; }); }
  resetMineFilters();
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
  function overall(r) { return r.experience ? (r.quality + r.value + r.location + r.experience) / 4 : (r.quality + r.value + r.location) / 3; }
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
    return p.degree === 2 ? 'A friend of a friend' : p.degree === 3 ? 'A traveller' : 'A Vouch member';
  }
  function avClass(uid) { var d = degreeOf(uid); return d === 0 ? 'av me' : d === 1 ? 'av' : 'av wide'; }
  function avText(uid) { if (uid === myId()) return initials(S.me.name); var p = S.people[uid]; return p && p.name ? initials(p.name) : '?'; }
  function degLabel(uid) { var d = degreeOf(uid); return d === 0 ? 'You' : d === 1 ? 'Friend' : d === 2 ? '1st degree' : d === 3 ? '2nd degree' : S.following.indexOf(uid) >= 0 ? 'Kindred spirit' : 'Public'; }
  function edited(r) { if (!r.updated_at || !r.created_at) return ''; if (new Date(r.updated_at) - new Date(r.created_at) < 60000) return ''; return 'edited ' + agoText(daysSince(r.updated_at)); }
  var DEG_SHORT = [['Mine', 0], ['Friends', 1], ['1st', 2], ['2nd', 3], ['Public', 4]];
  function photoUrl(path) { return sb.storage.from('photos').getPublicUrl(path).data.publicUrl; }

  // "Your own" theme: four colours the person picks; everything else is mixed from them.
  var CUSTOM_DEFAULT = { main: '#102347', accent: '#D4A017', bg: '#FFFFFF', text: '#111418' };
  function customColours() {
    var c = ui.customDraft || (S.me && S.me.theme_custom) || store('themeCustom') || {};
    var out = {}; Object.keys(CUSTOM_DEFAULT).forEach(function (k) { out[k] = /^#[0-9a-f]{6}$/i.test(c[k] || '') ? c[k] : CUSTOM_DEFAULT[k]; }); return out;
  }
  function lum(hex) {
    var v = [1, 3, 5].map(function (i) { var x = parseInt(hex.substr(i, 2), 16) / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function effectiveDark() {
    var t = S.me ? S.me.theme : store('theme');
    if (t === 'custom') return lum(customColours().bg) < 0.3;
    if (t === 'midnight') return true;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function applyTheme() {
    var t = (S.me && S.me.theme) || store('theme') || 'navy-gold';
    var root = document.documentElement;
    if (t === 'navy-gold') root.removeAttribute('data-vtheme'); else root.setAttribute('data-vtheme', t);
    ['--c-main', '--c-accent', '--c-bg', '--c-text', '--c-on-main', '--c-link'].forEach(function (k) { root.style.removeProperty(k); });
    root.style.colorScheme = '';
    if (t === 'custom') {
      var cc = customColours();
      root.style.setProperty('--c-main', cc.main); root.style.setProperty('--c-accent', cc.accent);
      root.style.setProperty('--c-bg', cc.bg); root.style.setProperty('--c-text', contrast(cc.text, cc.bg) >= 4.5 ? cc.text : (lum(cc.bg) < 0.3 ? '#F5F5F7' : '#111418'));
      root.style.setProperty('--c-on-main', contrast('#FFFFFF', cc.main) >= contrast('#111418', cc.main) ? '#FFFFFF' : '#111418');
      root.style.setProperty('--c-link', contrast(cc.main, cc.bg) >= 3 ? cc.main : (lum(cc.bg) < 0.3 ? '#F5F5F7' : '#111418'));
      root.style.colorScheme = lum(cc.bg) < 0.3 ? 'dark' : 'light';
    }
    var meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.setAttribute('content', t === 'custom' ? customColours().bg : effectiveDark() ? '#0B0D12' : '#FFFFFF');
    document.documentElement.classList.toggle('map-dark', effectiveDark());
  }
  function tileUrl() { return 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'; }

  // ---------- Visibility maths ----------
  function isSilenced(uid) { return S.silenced.indexOf(uid) >= 0; }
  function inScope(r) {
    if (r.user_id === myId()) return true;
    if (isSilenced(r.user_id)) return false;
    if (ui.group === 'aliens') return S.following.indexOf(r.user_id) >= 0;
    if (ui.group === 'friends') return degreeOf(r.user_id) === 1;
    if (ui.group) {
      var ids = S.members.filter(function (m) { return m.group_id === ui.group; }).map(function (m) { return m.member; });
      return ids.indexOf(r.user_id) >= 0;
    }
    if (ui.deg === 0) return false;  // Mine: only your own ratings
    return ui.deg >= 4 ? true : degreeOf(r.user_id) <= ui.deg;
  }
  function reviewsFor(pid, all) { return S.reviews.filter(function (r) { return r.place_id === pid && (all || inScope(r)); }); }
  function stats(pid) {
    var rs = reviewsFor(pid);
    var close = rs.filter(function (r) { return degreeOf(r.user_id) <= 1; });
    return { rs: rs, score: rs.length ? mean(rs.map(overall)) : 0, top: close.length > 0 && mean(close.map(overall)) >= 8.5, wide: rs.length > 0 && close.length === 0 };
  }
  function favsFor(pid) { return S.best.filter(function (b) { return b.place_id === pid && !isSilenced(b.user_id) && (b.user_id === myId() || degreeOf(b.user_id) <= (ui.deg >= 4 ? 99 : ui.deg)); }); }
  function tipsFor(pid) { return S.tips.filter(function (t) { return t.place_id === pid; }); }
  function photosFor(pid) { return S.photos.filter(function (p) { return p.place_id === pid; }).sort(function (a, b) { return a.created_at < b.created_at ? 1 : -1; }); }
  function centre() { if (ui.here) return ui.here; if (map) { var c = map.getCenter(); return { lat: c.lat, lng: c.lng }; } var v = store('view'); return v ? { lat: v[0], lng: v[1] } : { lat: 51.5074, lng: -0.1278 }; }
  function visiblePlaces() {
    return S.places.filter(function (p) {
      if (!catOn(p, ui.cats, ui.subs)) return false;
      if (ui.indie && !p.independent) return false;
      var rs = reviewsFor(p.id), saved = S.saves.indexOf(p.id) >= 0;
      if (!rs.length) return saved || (p.created_by === myId() && !ui.group);
      return saved || rs.some(function (r) { return (ui.work && r.trip === 'Work') || (ui.leisure && r.trip === 'Leisure'); });
    });
  }
  // How closely someone's scores match yours on places you've both rated.
  function tasteMatch(uid) {
    var mine = {};
    S.reviews.forEach(function (r) { if (r.user_id === myId()) mine[r.place_id] = overall(r); });
    var diffs = [];
    S.reviews.forEach(function (r) { if (r.user_id === uid && mine[r.place_id] != null) diffs.push(Math.abs(mine[r.place_id] - overall(r))); });
    if (!diffs.length) return null;
    return { n: diffs.length, pct: Math.max(0, Math.round(100 - mean(diffs) * 12)) };
  }
  function matchText(m) { return m ? m.pct + '% taste match · ' + m.n + (m.n === 1 ? ' place' : ' places') + ' in common' : ''; }
  function discoverPeople() {
    var seen = {};
    S.reviews.forEach(function (r) { if (r.user_id !== myId()) seen[r.user_id] = 1; });
    return Object.keys(seen).filter(function (id) { return S.friends.indexOf(id) < 0 && S.following.indexOf(id) < 0; })
      .map(function (id) { return { id: id, m: tasteMatch(id) }; })
      .filter(function (o) { return o.m; })
      .sort(function (a, b) { return (b.m.pct - a.m.pct) || (b.m.n - a.m.n); });
  }

  // ---------- Data ----------
  async function loadAll() {
    if (notePending) await flushNote();
    var uid = S.session.user.id;
    var res = await Promise.all([
      sb.from('profiles').select('*').eq('id', uid).maybeSingle(),
      sb.from('friends').select('*'),
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
    var rows = res[1].data;
    function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }
    var out = uniq(rows.filter(function (r) { return r.user_id === uid; }).map(function (r) { return r.friend_id; }));
    var inc = uniq(rows.filter(function (r) { return r.friend_id === uid; }).map(function (r) { return r.user_id; }));
    var sv; try { sv = await sb.from('saves').select('place_id'); } catch (e) { sv = { error: e }; }
    S.needsUpdate = !!sv.error;
    S.saves = sv.error ? [] : sv.data.map(function (x) { return x.place_id; });
    var lk; try { lk = await sb.from('place_links').select('*'); } catch (e) { lk = { error: e }; }
    S.needsLinks = !!lk.error; S.links = lk.error ? [] : lk.data;
    var ck; try { ck = await sb.from('places').select('extra').limit(1); } catch (e) { ck = { error: e }; }
    S.needsCats = !!ck.error;
    var sl; try { sl = await sb.from('silenced').select('target'); } catch (e) { sl = { error: e }; }
    var ex6; try { ex6 = await sb.from('reviews').select('experience').limit(1); } catch (e) { ex6 = { error: e }; }
    S.needsV6 = !!(sl.error || ex6.error);
    S.silenced = sl.error ? [] : sl.data.map(function (x) { return x.target; });
    await loadSuggestions();
    if (S.needsUpdate) { S.friends = out; S.following = []; S.followers = []; }
    else {
      S.friends = out.filter(function (id) { return inc.indexOf(id) >= 0; });
      S.following = out.filter(function (id) { return inc.indexOf(id) < 0; });
      S.followers = inc.filter(function (id) { return out.indexOf(id) < 0; });
    }
    S.places = res[2].data.map(function (p) {
      if (p.subcategory == null) p.subcategory = '';
      if (p.category === 'coffee') { p.category = 'drink'; p.subcategory = p.subcategory || 'coffee'; }
      if (p.category === 'do') p.category = 'explore';
      if (!Array.isArray(p.extra)) p.extra = [];
      return p;
    });
    S.reviews = res[3].data; S.tips = res[4].data; S.best = res[5].data; S.photos = res[6].data;
    S.notes = {}; res[7].data.forEach(function (n) { S.notes[n.place_id] = n.body; });
    S.groups = res[8].data; S.members = res[9].data;
    var ids = {};
    S.friends.concat(S.following, S.followers, S.reviews.map(function (r) { return r.user_id; }), S.tips.map(function (t) { return t.user_id; }), S.best.map(function (b) { return b.user_id; }), S.photos.map(function (p) { return p.user_id; }))
      .forEach(function (id) { if (id && id !== uid) ids[id] = 1; });
    await loadPeople(Object.keys(ids));
    store('theme', S.me.theme);
    if (ui.view === 'loading') ui.deg = S.me.see_degree || 1;
  }
  // Beta suggestions: your own, plus the owner's inbox if you're the owner.
  async function loadSuggestions() {
    var ad; try { ad = await sb.rpc('is_admin'); } catch (e) { ad = { error: e }; }
    S.needsV7 = !!ad.error || typeof ad.data !== 'boolean';
    S.isAdmin = !S.needsV7 && ad.data === true;
    S.mySugg = []; S.inbox = [];
    if (S.needsV7) return;
    var ms = await sb.from('suggestions').select('*').eq('user_id', S.session.user.id);
    if (!ms.error && ms.data) S.mySugg = ms.data.slice().sort(function (a, b) { return a.created_at < b.created_at ? 1 : -1; });
    if (S.isAdmin) { var ib = await sb.rpc('admin_suggestions'); if (!ib.error && ib.data) S.inbox = ib.data; }
  }
  async function loadPeople(ids) {
    S.people = {};
    if (!ids.length) return;
    var r = await sb.rpc('people', { ids: ids });
    if (r.error) throw r.error;
    r.data.forEach(function (p) { S.people[p.id] = { name: p.display_name, nickname: p.nickname || '', style: p.style, home: p.home, degree: p.degree, isPublic: !!p.is_public }; });
  }
  async function refresh() { try { await loadAll(); render(); } catch (e) { fail(e, 'Could not load'); } }
  // Fetch friends' latest changes in the background without disturbing what you're doing.
  var lastQuiet = 0;
  async function refreshQuietly() {
    if (Date.now() - lastQuiet < 4000 || !S.session) return;
    lastQuiet = Date.now();
    var view = ui.view;
    try { await loadAll(); if (ui.view === view && !document.activeElement.matches('input, textarea, select')) render(); } catch (e) { console.error(e); }
  }

  // New friend requests show up without you having to refresh.
  async function checkRequests() {
    if (!S.session || !S.me || S.needsUpdate || document.hidden) return;
    var q; try { q = await sb.from('friends').select('user_id').eq('friend_id', myId()); } catch (e) { return; }
    if (!q || q.error || !q.data) return;
    var inc = []; q.data.forEach(function (r) { if (inc.indexOf(r.user_id) < 0) inc.push(r.user_id); });
    var out = S.friends.concat(S.following);
    var reqs = inc.filter(function (id) { return out.indexOf(id) < 0; });
    var fresh = reqs.filter(function (id) { return S.followers.indexOf(id) < 0; });
    if (!fresh.length && reqs.length === S.followers.length) return;
    if (fresh.length) {
      var pr = await sb.rpc('people', { ids: fresh });
      if (!pr.error && pr.data) pr.data.forEach(function (p) { S.people[p.id] = { name: p.display_name, nickname: p.nickname || '', home: p.home, degree: p.degree, isPublic: !!p.is_public }; });
    }
    S.followers = reqs;
    renderTabs(); renderPrompt();
    if (ui.view === 'friends' && !document.activeElement.matches('input, textarea, select')) render();
    if (fresh.length) toast('New friend request from ' + nameOf(fresh[0]));
  }
  setInterval(checkRequests, 45000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) checkRequests(); });
  window.addEventListener('focus', function () { checkRequests(); });

  // ---------- Views ----------
  function viewSetup() {
    return '<div class="wrap stack" style="padding-block: 48px">' + logo() + '<h1>Almost ready</h1><p class="muted" style="margin:0">Vouch is not connected to its database yet. Add the Supabase Project URL and publishable key to <b>config.js</b>.</p></div>';
  }
  function logo() { return '<div class="logo"><svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="var(--primary)"/><path d="M9.5 16.5l4.5 4.5 8.5-10" fill="none" stroke="var(--trim)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>Vouch</div>'; }

  function pwField(id, auto, label) {
    return '<label for="' + id + '" class="lbl-t">' + label + '</label><div class="pw"><input id="' + id + '" class="field" type="password" autocomplete="' + auto + '"' + (auto === 'new-password' ? ' minlength="8"' : '') + ' required>' +
      '<button type="button" class="pwtoggle" data-pw="' + id + '" aria-label="Show password" aria-pressed="false">Show</button></div>';
  }
  var PW_RULE = '<span class="small muted">At least 8 characters, with letters and at least one number, e.g. travel24</span>';
  // Mirrors the Supabase rule "Letters and digits" with a minimum length of 8.
  function pwProblem(p) {
    var miss = [];
    if (!p || p.length < 8) miss.push('at least 8 characters');
    if (!/[A-Za-z]/.test(p || '')) miss.push('a letter');
    if (!/[0-9]/.test(p || '')) miss.push('a number');
    return miss.length ? 'Your password still needs ' + miss.join(', ').replace(/, ([^,]*)$/, ' and $1') + '.' : '';
  }
  function pwErrorText(err) {
    var m = String((err && err.message) || '');
    if (/different from the old|same_password|same password/i.test(m)) return 'Your new password must be different from your old one.';
    if (/weak|should contain|at least|characters/i.test(m)) return 'That password doesn\'t meet the rules. ' + pwProblem($('newPass') ? $('newPass').value : '') + ' (' + m + ')';
    if (/session|expired|jwt|not authenticated|missing/i.test(m)) return 'expired';
    return m || 'Something went wrong. Please try again.';
  }


  function splashArt() {
    // Stylised map: streets, a gold route and friends' rating pins.
    return '<svg class="splash-art" viewBox="0 0 400 860" preserveAspectRatio="xMidYMin slice" aria-hidden="true">' +
      '<g stroke="rgba(255,255,255,0.07)" stroke-width="10" fill="none" stroke-linecap="round">' +
      '<path d="M-20 150 L420 110"/><path d="M-20 340 L420 380"/><path d="M90 -20 L140 880"/><path d="M310 -20 L270 880"/><path d="M-20 520 L420 490"/></g>' +
      '<g stroke="rgba(255,255,255,0.05)" stroke-width="4" fill="none"><path d="M-20 250 L420 260"/><path d="M200 -20 L210 880"/><path d="M30 -20 L60 880"/><path d="M370 -20 L350 880"/><path d="M-20 440 L420 450"/></g>' +
      '<path d="M270 420 C 220 380, 150 350, 140 300 S 270 230, 285 190 S 170 140, 120 110" fill="none" stroke="#D4A017" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>' +
      [[270, 420, '8.4', 0], [140, 300, '9.2', 1], [285, 190, '8.9', 0], [120, 110, '9.6', 1]].map(function (p) {
        return '<g transform="translate(' + p[0] + ' ' + p[1] + ')"><rect x="-34" y="-17" width="68" height="34" rx="17" fill="' + (p[3] ? '#D4A017' : '#FFFFFF') + '"/>' +
          '<text x="0" y="6" text-anchor="middle" font-family="Inter Tight, Arial, sans-serif" font-weight="700" font-size="16" fill="#102347">★ ' + p[2] + '</text></g>';
      }).join('') +
      '</svg>';
  }
  function viewSplash() {
    return '<div class="splash">' + splashArt() +
      '<div class="splash-in">' +
      '<div class="splash-mark"><svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#102347"/><rect x="0.75" y="0.75" width="30.5" height="30.5" rx="8.4" fill="none" stroke="#D4A017" stroke-width="1"/><path d="M9.5 16.5l4.5 4.5 8.5-10" fill="none" stroke="#D4A017" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
      '<h1 class="splash-name">Vouch</h1>' +
      '<p class="splash-tag">Places, rated by people you trust.</p>' +
      (store('invite') ? '<p class="splash-invite">You\'ve been invited. Create an account and you\'ll be friends straight away.</p>' : '') +
      '<div class="splash-actions"><button class="btn gold" data-auth="signin">Log in</button><button class="btn outline-light" data-auth="signup">Create account</button><button class="linkbtn light" data-act="about">What is Vouch?</button></div>' +
      '</div></div>';
  }
  function friendsArt() {
    var av = [[18, 22, 'SO'], [82, 18, 'PS'], [12, 78, 'TM'], [86, 74, 'AK']];
    return '<div class="friends-art" aria-hidden="true"><svg viewBox="0 0 100 100" preserveAspectRatio="none">' +
      av.map(function (a) { return '<path d="M' + a[0] + ' ' + a[1] + ' Q 50 50 50 50" stroke="var(--line)" stroke-width="0.6" stroke-dasharray="1.5 2" fill="none" vector-effect="non-scaling-stroke"/>'; }).join('') + '</svg>' +
      av.map(function (a) { return '<span class="fa-av" style="left:' + a[0] + '%;top:' + a[1] + '%">' + a[2] + '</span>'; }).join('') +
      '<span class="fa-score"><b>8.6</b><small>4 FRIENDS</small></span></div>';
  }

  function viewSignIn() {
    var up = ui.mode === 'signup', reset = ui.mode === 'reset';
    var form, title, sub;
    if (ui.recovery) {
      title = 'Choose a new password'; sub = 'You followed a reset link. Pick a new password to finish.';
      form = ui.passError === 'expired'
        ? '<div class="alert" role="alert"><b>This reset link has expired or was already used.</b><span>Links work once and only for a short time. Request a new one and open it straight away.</span><button class="btn soft" type="button" data-act="newlink">Send me a new link</button></div>'
        : '<form id="newPassForm" class="stack">' + pwField('newPass', 'new-password', 'New password') + pwField('newPass2', 'new-password', 'Type it again') + PW_RULE +
          (ui.passError ? '<div class="alert" role="alert"><b>Password not saved.</b><span>' + esc(ui.passError) + '</span></div>' : '') +
          '<button class="btn primary" type="submit"' + (ui.busy ? ' disabled' : '') + '>' + (ui.busy ? 'Saving…' : 'Save password') + '</button></form>';
    } else if (reset) {
      title = 'Reset your password'; sub = 'We\'ll email you a link. Open it on this phone, in this browser, to choose a new password.';
      form = (ui.linkError ? '<div class="alert" role="alert"><b>That reset link didn\'t work.</b><span>It has expired or was already used. Links work once and only for about an hour. Send a new one below and open it straight away.</span></div>' : '') +
        '<form id="resetForm" class="stack"><label for="emailIn" class="lbl-t">Your email</label><input id="emailIn" class="field" type="email" autocomplete="email" inputmode="email" required value="' + esc(ui.email) + '">' +
        '<button class="btn primary" type="submit"' + (ui.busy ? ' disabled' : '') + '>Email me a reset link</button>' +
        '<button class="btn soft" type="button" data-mode="signin">Back to log in</button></form>';
    } else {
      title = up ? 'Create your account' : 'Welcome back';
      sub = up ? 'Join friends who rate restaurants, hotels, fuel, EV chargers and more, wherever you travel.' : 'Log in to see what your friends recommend near you.';
      form = '<form id="authForm" class="stack"><label for="emailIn" class="lbl-t">Email</label><input id="emailIn" class="field" type="email" autocomplete="email" inputmode="email" required value="' + esc(ui.email) + '" placeholder="you@example.com">' +
        pwField('passIn', up ? 'new-password' : 'current-password', 'Password') + (up ? PW_RULE : '') +
        (ui.failed && !up ? '<div class="alert" role="alert"><b>That email and password don\'t match.</b><span>Check for typos, or reset your password.</span><button class="btn soft" type="button" data-mode="reset">Reset my password</button></div>' : '') +
        '<button class="btn primary" type="submit"' + (ui.busy ? ' disabled' : '') + '>' + (ui.busy ? 'Please wait…' : up ? 'Create account' : 'Log in') + '</button>' +
        (up ? '<button class="btn soft" type="button" data-mode="signin">I already have an account</button>' : '<button class="linkbtn" type="button" data-mode="reset">Forgotten your password?</button><button class="btn soft" type="button" data-mode="signup">New here? Create an account</button>') + '</form>';
    }
    return '<div class="authpage">' +
      '<div class="authhero"><div class="wrap"><div class="topbar">' + (ui.recovery ? '<span></span>' : '<button class="round onnavy" data-act="splash" aria-label="Back">' + svg(P.back) + '</button>') + '<span class="logo light"><svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#0B1A36"/><path d="M9.5 16.5l4.5 4.5 8.5-10" fill="none" stroke="#D4A017" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>Vouch</span>' + (ui.recovery ? '<span style="width:44px"></span>' : '<button class="pill onnavy" data-act="about">' + svg(P.info, '', 16) + 'About</button>') + '</div>' + friendsArt() + '</div></div>' +
      '<div class="wrap stack authbody"><h1>' + title + '</h1><p class="muted" style="margin:0">' + sub + '</p>' + form + '</div></div>';
  }

  function viewOnboard() {
    return '<div class="wrap stack" style="padding-block: 40px">' + logo() + '<h1>Welcome. What should friends call you?</h1>' +
      '<form id="onboardForm" class="stack section"><div class="grid2"><div class="stack" style="gap:6px"><label for="obFirst" class="lbl-t">First name</label><input id="obFirst" class="field" autocomplete="given-name" required></div>' +
      '<div class="stack" style="gap:6px"><label for="obLast" class="lbl-t">Last name</label><input id="obLast" class="field" autocomplete="family-name"></div></div>' +
      '<label for="obNick" class="lbl-t">Nickname (optional)</label><input id="obNick" class="field" autocomplete="nickname" placeholder="What friends call you">' +
      '<span class="lbl-t">Who can see your reviews?</span>' +
      '<label class="check"><input type="radio" name="obShare" value="2" checked>Friends and friends of friends</label>' +
      '<label class="check"><input type="radio" name="obShare" value="4">Everyone (public). Helps people with similar taste find you.</label>' +
      '<span class="small muted">You can change this any time in Me › Privacy. Private notes are never shared.</span>' +
      '<button class="btn primary" type="submit">Continue</button></form></div>';
  }

  function pinHtml(p) {
    var st = stats(p.id);
    var fav = favsFor(p.id).length > 0;
    var tip = tipsFor(p.id).length > 0;
    var saved = S.saves.indexOf(p.id) >= 0;
    var cls = 'pin' + (st.top ? ' top' : '') + (st.wide ? ' wide' : '') + (!st.rs.length ? ' new' : '') + (fav ? ' fav' : '') + (saved ? ' saved' : '');
    return '<div class="' + cls + '" role="button" tabindex="0" aria-label="' + esc(p.name + (st.rs.length ? ', rated ' + st.score.toFixed(1) : ', not rated yet') + (fav ? ', a favourite' : '')) + '">' +
      '<span class="ic ' + catCls(p) + '">' + svg(iconFor(p)) + '</span>' + STAR + (st.rs.length ? st.score.toFixed(1) : 'New') + (tip ? svg(P.tag, 'tag') : '') + (saved ? svg(P.bookmark, 'tag') : '') + '</div>';
  }

  // ---------- Website and social links ----------
  var LINK_KINDS = ['Website', 'Instagram', 'Facebook', 'TikTok', 'X', 'Other'];
  function kindFromUrl(u) {
    var m = String(u).toLowerCase();
    if (/\/\/([a-z]+\.)?instagram\.com/.test(m)) return 'Instagram';
    if (/\/\/([a-z]+\.)?(facebook|fb)\.com/.test(m)) return 'Facebook';
    if (/\/\/([a-z]+\.)?tiktok\.com/.test(m)) return 'TikTok';
    if (/\/\/([a-z]+\.)?(twitter|x)\.com/.test(m)) return 'X';
    return '';
  }
  // Turns "@name", "theplace.co.uk" or a full address into a safe https link.
  function normLink(kind, raw) {
    var v = String(raw || '').trim(); if (!v) return null;
    if (!/^https?:\/\//i.test(v)) {
      var h = v.replace(/^@/, '');
      var base = { Instagram: 'https://www.instagram.com/', Facebook: 'https://www.facebook.com/', TikTok: 'https://www.tiktok.com/@', X: 'https://x.com/' }[kind];
      if (base && /^@?[A-Za-z0-9._-]+$/.test(v)) return { kind: kind, url: base + h };
      if (/^[^\s@\/]+\.[a-z]{2,}(\/\S*)?$/i.test(v)) v = 'https://' + v; else return null;
    }
    if (/\s/.test(v)) return null;
    return { kind: kindFromUrl(v) || (kind && kind !== 'Other' ? kind : 'Website'), url: v };
  }
  function extractLinks(tags) {
    var out = []; if (!tags) return out;
    [['website', 'Website'], ['contact:website', 'Website'], ['url', 'Website'], ['contact:instagram', 'Instagram'], ['contact:facebook', 'Facebook'], ['contact:tiktok', 'TikTok'], ['contact:twitter', 'X']].forEach(function (k) {
      var v = tags[k[0]]; if (!v) return;
      var l = normLink(k[1], String(v).split(';')[0]);
      if (l && !out.some(function (o) { return o.url === l.url; })) out.push(l);
    });
    return out;
  }
  function hostOf(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return 'Link'; } }
  function linkChip(l) {
    var u = safeUrl(l.url); if (!u) return '';
    var ic = l.kind === 'Website' ? P.globe : l.kind === 'Other' || !l.kind ? P.link : P.at;
    var label = l.kind === 'Other' || !l.kind ? hostOf(u) : l.kind;
    return '<span class="linkwrap"><a class="linkchip" href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + svg(ic, '', 16) + esc(label) + '</a>' +
      (l.id && l.user_id === myId() ? '<button class="linkx" data-dellink="' + esc(l.id) + '" aria-label="Remove ' + esc(label) + ' link">' + svg(P.close, '', 12) + '</button>' : '') + '</span>';
  }
  function linkForm() {
    return '<form id="linkForm" class="stack card"><label for="linkKind" class="lbl-t">Type of link</label><select id="linkKind" class="field">' + LINK_KINDS.map(function (k) { return '<option>' + k + '</option>'; }).join('') + '</select>' +
      '<label for="linkUrl" class="lbl-t">Link or @name</label><input id="linkUrl" class="field" required autocapitalize="off" autocomplete="off" spellcheck="false" placeholder="e.g. @theplace or https://…">' +
      '<span class="small muted">Paste their website or social page, or type their @name.</span>' +
      '<div class="row"><button class="btn soft" type="button" data-act="cancellink" style="flex:1">Cancel</button><button class="btn primary" type="submit" style="flex:1">Add link</button></div></form>';
  }
  function titleHead(p) {
    var cs = allCats(p);
    return '<div class="catchips">' + cs.map(function (c) { return '<span class="catchip c-' + c.category + '">' + svg(ICON[c.subcategory] || ICON[c.category] || ICON.eat, '', 15) + esc(catName1(c)) + '</span>'; }).join('') +
      (p.independent ? '<span class="catchip indie">Independent</span>' : '') + '</div><h1>' + esc(p.name) + '</h1>';
  }
  function heroArt(p) { return '<div class="hero-art ' + catCls(p) + '" aria-hidden="true"><span class="hero-ic">' + svg(iconFor(p)) + '</span></div>'; }
  function gettingThere(p, text) {
    var lat = p.lat, lng = p.lng, q = encodeURIComponent(p.name);
    var items = [['https://maps.apple.com/?daddr=' + lat + ',' + lng + '&q=' + q, P.map, 'Apple Maps'], ['https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lng, P.near, 'Google Maps'],
      ['https://waze.com/ul?ll=' + lat + ',' + lng + '&navigate=yes', P.car, 'Waze'], ['https://wa.me/?text=' + encodeURIComponent(text), P.msg, 'WhatsApp']];
    return '<div class="navrow">' + items.map(function (x) { return '<a class="navbtn" href="' + esc(x[0]) + '" target="_blank" rel="noopener">' + svg(x[1], '', 22) + '<span>' + x[2] + '</span></a>'; }).join('') + '</div>';
  }
  function updatesNeeded() {
    var u = [];
    if (S.needsUpdate) u.push('002_public_follow_saves.sql');
    if (S.me && S.me.first_name === undefined) u.push('003_categories_names_tips.sql');
    if (S.needsLinks) u.push('004_links_and_saves.sql');
    if (S.needsCats) u.push('005_extra_categories.sql');
    if (S.needsV6) u.push('006_silence_experience.sql');
    if (S.needsV7) u.push('007_suggestions.sql');
    return u;
  }
  // Search results shown on the map: places already on Vouch, then new ones.
  function searchItems() {
    var a = ui.add || {}, seen = {}, out = [];
    (a.existing || []).forEach(function (p) { if (!seen[p.id]) { seen[p.id] = 1; out.push({ p: p }); } });
    (a.results || []).forEach(function (r, i) {
      var on = S.places.filter(function (p) { return p.osm_id === r.osm_id; })[0];
      if (on) { if (!seen[on.id]) { seen[on.id] = 1; out.push({ p: on }); } } else out.push({ r: r, i: i });
    });
    return out;
  }

  function groupSelHtml() {
    return '<select id="groupSel" class="field" aria-label="Whose ratings"><option value="">Everyone in range</option>' +
      '<option value="friends"' + (ui.group === 'friends' ? ' selected' : '') + '>Friends only</option>' +
      '<option value="aliens"' + (ui.group === 'aliens' ? ' selected' : '') + '>Kindred spirits (people you follow)</option>' +
      S.groups.map(function (g) { return '<option value="' + g.id + '"' + (ui.group === g.id ? ' selected' : '') + '>' + esc(g.name) + '</option>'; }).join('') + '</select>';
  }
  function viewMapSearch() {
    var its = searchItems();
    var rows = its.map(function (o) {
      var p = o.p || o.r, st = o.p ? stats(o.p.id) : null;
      return '<button class="item" ' + (o.p ? 'data-place="' + o.p.id + '"' : 'data-pick="' + o.i + '"') + '><span class="tile ' + catCls(p) + '">' + svg(iconFor(p)) + '</span><span class="t"><span class="n">' + esc(p.name) + '</span><span class="small muted">' + esc(kindName(p)) + ' · ' + (o.p ? (st.rs.length ? st.rs.length + ' rated' : 'On Vouch') : 'Not on Vouch yet') + '</span></span>' +
        (st && st.rs.length ? badge(st.score) : '') + '</button>';
    }).join('');
    return '<div class="mapbox"><div id="map" aria-label="Map of search results"></div>' +
      '<div class="map-top wrap"><div class="row"><button class="searchbar" data-act="searchlist" aria-label="Back to the list of results">' + svg(P.search, '', 18) + '<span class="q">' + esc((ui.add || {}).q || '') + '</span></button>' +
      '<button class="fab" data-act="searchclear" aria-label="Clear search">' + svg(P.close) + '</button></div>' +
      (ui.areaMoved || (ui.add || {}).searching ? '<div class="row areawrap"><button class="areabtn" data-act="searcharea"' + ((ui.add || {}).searching ? ' disabled' : '') + '>' + svg(P.search, '', 16) + ((ui.add || {}).searching ? 'Searching…' : 'Search this area') + '</button></div>' : '') +
      '</div></div>' +
      '<div class="sheet' + (ui.sheetClosed ? ' closed' : '') + '" id="sheet">' +
      '<div class="grab wrap" id="grab" role="button" tabindex="0" aria-expanded="' + !ui.sheetClosed + '" aria-label="' + (ui.sheetClosed ? 'Show the list' : 'Hide the list') + '"><div class="handle"></div>' +
      '<div class="row between"><h2>Results · ' + its.length + '</h2><button class="pill iconpill" data-act="searchlist">' + svg(P.list, '', 16) + 'Back to list</button></div></div>' +
      '<div class="sheet-body wrap"><div class="list">' + (rows || '<p class="empty">No results to show.</p>') + '</div></div></div>';
  }
  function viewMap() {
    if (ui.searchMap) return viewMapSearch();
    var c = centre();
    var vis = visiblePlaces().map(function (p) { return { p: p, d: miles(c, p) }; }).sort(function (a, b) { return a.d - b.d; });
    var nOff = CATS.filter(function (k) { return !ui.cats[k[0]]; }).length + Object.keys(ui.subs).filter(function (k) { return ui.subs[k] === false; }).length + (ui.indie ? 1 : 0) + (!ui.work || !ui.leisure ? 1 : 0) + (ui.group ? 1 : 0);
    var drawer = '<div class="drawerwrap"><button class="drawer-tab' + (ui.drawer ? ' open' : '') + '" data-act="drawer" aria-expanded="' + ui.drawer + '" aria-controls="drawer" aria-label="' + (ui.drawer ? 'Hide filters' : 'Show filters') + '">' + svg(P.filter, '', 18) + (nOff ? '<span class="dot">' + nOff + '</span>' : '') + svg(ui.drawer ? P.chevL : P.chevR, '', 14) + '</button>' +
      '<aside class="drawer' + (ui.drawer ? ' open' : '') + '" id="drawer" aria-label="Filters"' + (ui.drawer ? '' : ' inert') + '><div class="drawer-in">' +
      '<button class="aboutrow mine-link" data-act="mine" style="margin:0 0 6px">' + svg(P.list, '', 20) + '<span><b>My reviews</b><span class="small muted">' + myReviews().length + ' · search and filter</span></span>' + svg(P.chevR, '', 16) + '</button>' +
      '<div class="row between"><h2>Show on map</h2>' + (nOff ? '<button class="linkbtn" data-act="showall">Show all</button>' : '') + '</div>' +
      CATS.map(function (k) {
        var on = ui.cats[k[0]], subs = SUBS[k[0]];
        return '<div class="dcat"><button class="dcat-main" data-cat="' + k[0] + '" aria-pressed="' + on + '"><span class="tile c-' + k[0] + '">' + svg(ICON[k[0]]) + '</span><span class="dname">' + k[1] + '</span><span class="tog" aria-hidden="true"></span></button>' +
          (subs && on ? '<div class="dsubs">' + subs.map(function (x) { return '<button class="pill" data-sub="' + x[0] + '" aria-pressed="' + (ui.subs[x[0]] !== false) + '">' + esc(x[1]) + '</button>'; }).join('') + '</div>' : '') + '</div>';
      }).join('') +
      '<h3 class="dh">Trips</h3><div class="filters"><button class="pill" data-act="work" aria-pressed="' + ui.work + '">Work</button><button class="pill" data-act="leisure" aria-pressed="' + ui.leisure + '">Leisure</button></div>' +
      '<h3 class="dh">Only show</h3><div class="filters"><button class="pill" data-act="indie" aria-pressed="' + ui.indie + '">Independent businesses</button></div>' +
      '<h3 class="dh">Whose ratings</h3>' + groupSelHtml() +
      '</div></aside></div>';
    var segs = DEG_SHORT.map(function (d) { return '<button data-deg="' + d[1] + '"' + (!ui.group && ui.deg >= d[1] ? ' class="in"' : '') + ' aria-pressed="' + (!ui.group && ui.deg === d[1]) + '">' + d[0] + '</button>'; }).join('');
    var list = vis.slice(0, 40).map(function (o) {
      var p = o.p, st = stats(p.id);
      var friendsN = st.rs.filter(function (r) { return degreeOf(r.user_id) === 1; }).length;
      var who = !st.rs.length ? (S.saves.indexOf(p.id) >= 0 ? 'On your map' : 'Not rated yet') : friendsN ? friendsN + (friendsN === 1 ? ' friend' : ' friends') : st.rs.length + (st.rs.length === 1 ? ' person' : ' people');
      return '<button class="item" data-place="' + p.id + '"><span class="tile ' + catCls(p) + '">' + svg(iconFor(p)) + '</span><span class="t"><span class="n">' + esc(p.name) + '</span><span class="small muted">' + (p.independent ? 'Independent · ' : '') + esc(kindName(p)) + ' · ' + fmtMiles(o.d) + ' · ' + who + '</span></span>' +
        (st.rs.length ? '<span class="badge' + (st.top ? ' top' : '') + '">' + st.score.toFixed(1) + '</span>' : '') + '</button>';
    }).join('');
    var emptyMsg = !S.places.length ? 'No places yet. Tap Rate to add the first one, or invite friends from the Friends tab.'
      : !ui.group && ui.deg === 0 ? 'None of your own pins here. Tap Rate to add a place, or move the map.'
      : ui.group === 'friends' ? 'None of your friends have rated places here yet. Widen to 1st, 2nd or Public with the buttons at the top.'
      : ui.group === 'aliens' ? 'No ratings from people you follow here yet. Find people who rate like you on the Friends tab.'
      : 'Nothing matches here. Open the filters on the left, widen to 1st, 2nd or Public, or move the map.';
    return '<div class="mapbox"><div id="map" aria-label="Map"></div>' +
      '<div class="map-top wrap"><div class="row"><button class="searchbar" data-act="search">' + svg(P.search, '', 18) + '<span>Search places</span></button>' +
      '<button class="fab" data-act="near" aria-label="Near me">' + svg(P.near) + '</button><button class="fab" data-act="about" aria-label="About Vouch and how it works">' + svg(P.info) + '</button></div>' +
      '<div class="row"><div class="seg" role="group" aria-label="Whose ratings: only mine, friends, 1st degree, 2nd degree or public">' + segs + '</div></div></div></div>' +
      '<div class="sheet' + (ui.sheetClosed ? ' closed' : '') + '" id="sheet">' +
      '<div class="grab wrap" id="grab" role="button" tabindex="0" aria-expanded="' + !ui.sheetClosed + '" aria-label="' + (ui.sheetClosed ? 'Show the list' : 'Hide the list') + '"><div class="handle"></div>' +
      '<div class="row between" style="align-items:baseline"><h2>Near you</h2><span class="small muted">' + vis.length + (vis.length === 1 ? ' place' : ' places') + ' · ' + (ui.sheetClosed ? 'drag up' : 'drag down to hide') + '</span></div></div>' +
      '<div class="sheet-body wrap">' +
      (updatesNeeded().length ? '<div class="alert" role="alert"><b>Database update needed.</b><span>Run ' + updatesNeeded().map(function (f) { return 'supabase/' + f; }).join(', then ') + ' in Supabase.</span></div>' : '') +
      '<div class="list">' + (list || '<p class="empty">' + emptyMsg + '</p>') + '</div>' +
      '<p class="attrib">Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors</p></div></div>' + drawer;
  }

  function badge(s) { return '<span class="badge' + (s >= 8.5 ? ' top' : '') + '">' + s.toFixed(1) + '</span>'; }

  function viewPlace() {
    var p = place(ui.place); if (!p) { ui.view = 'map'; return viewMap(); }
    var st = stats(p.id), rs = st.rs;
    var friendsN = rs.filter(function (r) { return degreeOf(r.user_id) === 1; }).length;
    var mine = S.reviews.filter(function (r) { return r.place_id === p.id && r.user_id === myId(); })[0];
    var photos = photosFor(p.id);
    var bars = [['Quality', 'quality'], ['Experience', 'experience'], ['Value', 'value'], ['Location', 'location']].filter(function (b) { return rs.some(function (r) { return r[b[1]]; }); }).map(function (b) {
      var m = mean(rs.filter(function (r) { return r[b[1]]; }).map(function (r) { return r[b[1]]; }));
      return '<div class="bar"><span>' + b[0] + '</span><span class="track"><span class="fill" style="width:' + (m * 10) + '%"></span></span><b>' + m.toFixed(1) + '</b></div>';
    }).join('');
    var said = rs.slice().sort(function (a, b) { return a.visited_on < b.visited_on ? 1 : -1; }).map(function (r) {
      var n = daysSince(r.visited_on), ed = edited(r), link = safeUrl(r.link);
      return '<article class="review">' +
        '<button class="person" data-person="' + r.user_id + '"><span class="' + avClass(r.user_id) + '">' + esc(avText(r.user_id)) + '</span><span class="pt"><span class="pn">' + esc(nameOf(r.user_id)) + '</span><span class="small muted">' + degLabel(r.user_id) + '</span></span>' + badge(overall(r)) + '</button>' +
        '<div class="row" style="flex-wrap:wrap;gap:6px"><span class="date">' + fmtDate(r.visited_on) + '</span><span class="ago' + (n > 60 ? ' old' : '') + '">' + agoText(n) + '</span><span class="lbl grey">' + r.trip + '</span>' + (r.visibility === 'me' ? '<span class="lbl grey">Only you</span>' : '') + '</div>' +
        (r.body ? '<p class="rbody">' + esc(r.body) + '</p>' : '') +
        '<span class="small muted">Quality ' + r.quality + (r.experience ? ' · Experience ' + r.experience : '') + ' · Value ' + r.value + ' · Location ' + r.location + (ed ? ' · ' + ed : '') + '</span>' +
        (link ? '<a class="linkchip sm" href="' + esc(link) + '" target="_blank" rel="noopener noreferrer">' + svg(P.link, '', 15) + 'View post</a>' : '') +
        '</article>';
    }).join('');
    var favs = favsFor(p.id).map(function (b) {
      var who = b.user_id === myId() ? 'Your' : (nameOf(b.user_id).split(' ')[0] + '\'s');
      return '<span class="favbadge">' + STAR.replace('class="star"', 'width="13" height="13"') + esc(who + ' best ' + bestLabel(b.category) + ' ever') + '</span>' + (b.quote ? '<span class="small muted" style="margin-top:-6px">“' + esc(b.quote) + '”</span>' : '');
    }).join('');
    var tips = tipsFor(p.id).map(function (t) {
      var link = safeUrl(t.url);
      return '<div class="tip"><span class="tg">' + svg(P.tag) + '</span><span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px"><span class="eyebrow">' + esc(t.kind) + '</span><span style="font-weight:600">' + esc(t.body) + '</span>' +
        (link ? '<a href="' + esc(link) + '" target="_blank" rel="noopener noreferrer" class="small" style="font-weight:600;word-break:break-all">' + esc(link.replace(/^https?:\/\//, '')) + '</a>' : '') +
        '<span class="small muted">Shared by ' + esc(nameOf(t.user_id)) + ' · ' + agoText(daysSince(t.created_at)) + '</span>' +
        (t.user_id === myId() ? '<button class="pill" style="align-self:flex-start" data-deltip="' + t.id + '">Remove</button>' : '') + '</span></div>';
    }).join('');
    var links = S.links.filter(function (l) { return l.place_id === p.id; }).map(linkChip).join('');
    var bkeys = []; allCats(p).forEach(function (c) { var k = c.subcategory || c.category; if (bkeys.indexOf(k) < 0) bkeys.push(k); });
    var myBestKeys = bkeys.filter(function (k) { return S.best.some(function (b) { return b.user_id === myId() && b.category === k && b.place_id === p.id; }); });
    function orList(ks, word) { var l = ks.map(bestLabel); return l.length < 2 ? l[0] : l.slice(0, -1).join(', ') + ' ' + word + ' ' + l[l.length - 1]; }
    var myBest = myBestKeys.length ? S.best.filter(function (b) { return b.user_id === myId() && b.category === myBestKeys[0] && b.place_id === p.id; })[0] : null;
    var bestBtns = (bkeys.length > 1 && !ui.bestPick)
      ? '<button class="btn ' + (myBestKeys.length ? 'gold' : 'ghost') + '" data-act="bestpick">' + STAR.replace('class="star"', 'width="16" height="16"') + (myBestKeys.length ? 'My best ' + esc(orList(myBestKeys, 'and')) + ' ever · Change' : 'Make this my best ' + esc(orList(bkeys, 'or')) + ' ever') + '</button>'
      : (bkeys.length > 1 ? '<span class="lbl-t">Best ever for which?</span>' : '') + bkeys.map(function (k) {
          var on = myBestKeys.indexOf(k) >= 0;
          return '<button class="btn ' + (on ? 'gold' : 'ghost') + '" data-bestkey="' + k + '" aria-pressed="' + on + '">' + STAR.replace('class="star"', 'width="16" height="16"') + (bkeys.length > 1 ? 'My best ' + esc(bestLabel(k)) + ' ever' : on ? 'Remove from my best ' + esc(bestLabel(k)) + ' ever' : 'Make this my best ' + esc(bestLabel(k)) + ' ever') + '</button>';
        }).join('') + (bkeys.length > 1 ? '<button class="linkbtn" data-act="bestpick">Done</button>' : '');
    var degSeg = [['Mine', 0], ['Friends', 1], ['+1st', 2], ['+2nd', 3], ['Public', 4]].map(function (d) { return '<button data-deg="' + d[1] + '"' + (!ui.group && ui.deg >= d[1] ? ' class="in"' : '') + ' aria-pressed="' + (!ui.group && ui.deg === d[1]) + '">' + d[0] + '</button>'; }).join('');
    var saved = S.saves.indexOf(p.id) >= 0;
    var mineEd = mine ? edited(mine) : '';
    var myCard = mine ? '<div class="section card mine"><div class="row between"><span class="eyebrow">Your rating</span>' + badge(overall(mine)) + '</div>' +
      '<span class="small muted">Visited ' + fmtDate(mine.visited_on) + ' · ' + mine.trip + (mineEd ? ' · ' + mineEd.charAt(0).toUpperCase() + mineEd.slice(1) : '') + (mine.visibility === 'me' ? ' · Only you can see it' : '') + '</span>' +
      '<button class="btn soft" data-act="rate">Edit or delete rating</button></div>' : '';
    var dist = ui.here ? ' · ' + fmtMiles(miles(ui.here, p)) + ' away' : '';
    return '<div class="wrap page">' +
      '<div class="topbar"><button class="round" data-act="back" aria-label="Back">' + svg(P.back) + '</button><button class="round" data-act="share" aria-label="Share this place">' + svg(P.share) + '</button></div>' +
      (photos.length ? '<div class="photos hero">' + photos.slice(0, 4).map(function (ph) { return '<button class="photo" data-photo="' + esc(ph.path) + '" aria-label="View photo by ' + esc(nameOf(ph.user_id)) + '"><img src="' + esc(photoUrl(ph.path)) + '" alt="" loading="lazy"></button>'; }).join('') + '</div>' : '') +
      '<div class="section titlecard">' + titleHead(p) + (p.address ? '<span class="muted">' + esc(p.address) + dist + '</span>' : '') + favs +
      (links ? '<div class="linkchips">' + links + '</div>' : '') +
      (mine ? '<span class="onmap">' + svg(P.bookmark, '', 15) + 'On your map</span>'
        : '<div class="row"><button class="btn ' + (saved ? 'soft' : 'ghost') + '" data-act="save" style="flex:1" aria-pressed="' + saved + '">' + svg(P.bookmark, '', 18) + (saved ? 'On your map' : 'Add to my map') + '</button><button class="btn primary" data-act="rate" style="flex:1">Rate it</button></div>') + '</div>' +
      '<div class="section"><div class="segwide" role="group" aria-label="Whose ratings">' + degSeg + '</div>' +
      '<div class="row" style="gap:16px">' + (rs.length ? '<div class="big' + (st.top ? ' top' : '') + '">' + st.score.toFixed(1) + '</div>' : '<div class="big">–</div>') +
      '<div class="pt" style="gap:4px"><span style="font-weight:600;font-size:17px">' + (!ui.group && ui.deg === 0 ? 'Your score' : ui.group === 'friends' || (!ui.group && ui.deg === 1) ? 'Friends\' score' : 'Wider circle score') + '</span><span class="small muted">' + (rs.length ? 'From ' + rs.length + (rs.length === 1 ? ' person' : ' people') + (friendsN ? ', ' + friendsN + (friendsN === 1 ? ' friend' : ' friends') : '') : 'No ratings at this level yet. Be the first, or widen to 1st, 2nd or Public.') + '</span></div></div>' +
      (rs.length ? bars + '<span class="small muted">Scores out of 10. 10 is best, 1 is worst.</span>' : '') + '</div>' +
      myCard +
      (rs.length ? '<div class="section"><h2>What people said</h2><div class="list">' + said + '</div></div>' : '') +
      '<div class="section"><div class="row between"><h2>Tips</h2><button class="pill" data-act="addtip">Add a tip</button></div>' + (tips || '<p class="small muted" style="margin:0">No tips yet. Avoid the table by the door? Ask for the lunch menu? Add it.</p>') +
      (ui.tipOpen ? tipForm() : '') + '</div>' +
      '<div class="section"><label for="noteIn" class="row" style="gap:6px;font-weight:700">' + svg(P.lock, '', 16) + 'Your note <span class="small muted" style="font-weight:500">Only you can see this</span></label><textarea id="noteIn" class="note" placeholder="e.g. Ask for the window table">' + esc(S.notes[p.id] || '') + '</textarea></div>' +
      '<div class="section"><h2>Getting there</h2>' + gettingThere(p, shareText(p)) + '<button class="btn soft" data-act="share">' + svg(P.share, '', 18) + 'Send this place</button></div>' +
      (S.needsLinks ? '' : '<div class="section" id="sec-links"><div class="row between"><h2>Website and social</h2>' + (ui.linkOpen ? '' : '<button class="pill" data-act="addlink">Add a link</button>') + '</div>' +
        (links ? '' : '<p class="small muted" style="margin:0">Know their website, Instagram or Facebook? Add it for everyone.</p>') + (ui.linkOpen ? linkForm() : '') + '</div>') +
      '<div class="section">' +
      (myBest ? '<label for="quoteIn" class="lbl-t">Why it\'s your best ' + esc(bestLabel(myBest.category)) + ' ever</label><input id="quoteIn" class="field" maxlength="140" data-key="' + esc(myBest.category) + '" value="' + esc(myBest.quote) + '" placeholder="e.g. The best flat white I have ever had">' : '') +
      bestBtns +
      (p.created_by === myId() ? '<button class="btn ghost" data-act="editplace">Change rating details or category</button>' : '') + '</div>' +
      '</div>';
  }

  function viewAbout() {
    var signed = !!(S.session && S.me);
    function act(goto, hint, inner, cls) {
      return signed ? '<button class="' + cls + ' go" data-goto="' + goto + '"' + (hint ? ' data-hint="' + esc(hint) + '"' : '') + '>' + inner + '<span class="gol">Show me' + svg(P.chevR, '', 14) + '</span></button>'
        : '<div class="' + cls + '">' + inner + '</div>';
    }
    var steps = [
      ['Rate the places you go', 'Score quality, experience, value and location from 1 (worst) to 10 (best). It goes straight onto your map.', 'add', ''],
      ['See what your friends rate', 'The map shows places your friends have scored. Navy pins are their top picks (8.5+). A gold pin means it\'s someone\'s best ever. Tap Mine to see only your own pins.', 'map', ''],
      ['Widen the circle when you travel', 'Somewhere new? Switch to 1st or 2nd degree for friends of friends, or Public for everyone. Follow kindred spirits who rate like you.', 'friends:discover', '']
    ];
    var things = [
      [P.search, 'Search any place', 'Restaurants, pubs, hotels, shops, fuel, EV chargers and more. See results as a list or on the map, then move the map and tap Search this area.', 'search', ''],
      [P.list, 'My reviews', 'Your own library of reviews. Search them, sort them and filter them like the map.', 'mine', ''],
      [P.plus, 'Up to three categories', 'A pub that does food, a supermarket with fuel or EV charging. Pick up to three when you add a place.', 'add', ''],
      [P.bookmark, 'Save for later', 'Add a friend\'s pick to your map, then rate it when you\'ve been.', 'map', 'Tap any pin, then Add to my map'],
      [P.tag, 'Tips', 'Avoid the table by the door. Ask for the lunch menu. Loyalty schemes.', 'map', 'Tap any pin, then Add a tip'],
      [P.globe, 'Website and social', 'Add a place\'s website or Instagram, or link your own post.', 'map', 'Tap any pin, then Add a link'],
      [P.near, 'Directions', 'Open in Apple Maps, Google Maps or Waze, or send it on WhatsApp.', 'map', 'Tap any pin, then see Getting there'],
      [P.friends, 'Friends you approve', 'New requests wait in To be approved until you say yes. Silence a friend to hide their reviews without unfriending.', 'friends:requests', ''],
      [STARP, 'Best ever', 'Your best pub, EV charger, bakery or guitar shop. It shows as a gold pin on friends\' maps.', 'map', 'Open a place, then Make this my best … ever'],
      [P.friends, 'Groups', 'Family, uni friends, event crew. Filter the map to one group.', 'friends:groups', ''],
      [P.lock, 'Private notes', 'Notes only you can see, like which room to ask for.', 'map', 'Tap any pin, then Your note'],
      [P.filter, 'Filters', 'Slide out the tab on the left of the map to pick categories, trips and whose ratings.', 'map:filters', '']
    ];
    var back = ui.aboutFirst ? '<span style="width:44px"></span>' : '<button class="round onnavy" data-act="aboutback" aria-label="Back">' + svg(P.back) + '</button>';
    return '<div class="about">' +
      '<div class="authhero"><div class="wrap"><div class="topbar">' + back + '<span class="logo light"><svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#0B1A36"/><path d="M9.5 16.5l4.5 4.5 8.5-10" fill="none" stroke="#D4A017" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>Vouch</span><span style="width:44px"></span></div>' +
      '<div class="about-hero"><h1>Places, rated by people you trust.</h1><p>Star ratings from strangers can\'t tell you if a place suits you. Vouch shows what your friends really think, so a 9 means something.</p></div></div></div>' +
      '<div class="wrap about-body">' +
      (signed ? '' : '<p class="small muted about-note">' + svg(P.lock, '', 14) + 'Log in or create an account to try these. Read all about them first.</p>') +
      '<section><h2>How it works</h2><ol class="steps">' + steps.map(function (st, i) { return '<li>' + act(st[2], st[3], '<span class="stepn">' + (i + 1) + '</span><span class="pt"><b>' + st[0] + '</b><span class="muted">' + st[1] + '</span></span>', 'steprow') + '</li>'; }).join('') + '</ol></section>' +
      '<section><h2>Reading the map</h2><div class="legend">' +
      '<div><span class="pin top demo"><span class="ic c-eat">' + svg(ICON.eat) + '</span>' + STAR + '9.1</span><span class="small">Friends\' top pick</span></div>' +
      '<div><span class="pin demo"><span class="ic c-drink">' + svg(ICON.drink) + '</span>' + STAR + '7.6</span><span class="small">Rated by friends</span></div>' +
      '<div><span class="pin fav demo"><span class="ic c-stay">' + svg(ICON.stay) + '</span>' + STAR + '8.8</span><span class="small">Someone\'s best ever</span></div>' +
      '<div><span class="pin wide demo"><span class="ic c-explore">' + svg(ICON.explore) + '</span>' + STAR + '8.2</span><span class="small">Wider circle or public</span></div>' +
      '</div>' + (signed ? '<button class="btn soft" data-goto="map">' + svg(P.map, '', 18) + 'Open the map</button>' : '') + '</section>' +
      '<section><h2>What you can do</h2><div class="things">' + things.map(function (x) { return act(x[3], x[4], '<span class="tile">' + svg(x[0]) + '</span><b>' + x[1] + '</b><span class="small muted">' + x[2] + '</span>', 'thing'); }).join('') + '</div></section>' +
      '<section><h2>You\'re in control</h2><ul class="ticks"><li>You choose who sees your reviews: friends, friends of friends, or everyone.</li><li>You choose how your name shows to people you don\'t know.</li><li>Private notes and "Only me" reviews are never shared.</li></ul>' +
      (signed ? '<button class="btn soft" data-goto="me:privacy">' + svg(P.lock, '', 18) + 'Privacy settings</button>' : '') + '</section>' +
      (signed
        ? '<div class="stack"><button class="btn primary" data-goto="map">Explore the map</button><button class="btn ghost" data-goto="friends:invite">Invite friends</button></div>'
        : '<div class="stack"><button class="btn primary" data-auth="signup">Create account</button><button class="btn ghost" data-auth="signin">Log in</button></div>') +
      '</div></div>';
  }

  // ---------- My reviews: search and filter your own library ----------
  function myReviews() { return S.reviews.filter(function (r) { return r.user_id === myId(); }); }
  function mineOff() { var f = ui.mf; return CATS.filter(function (k) { return !f.cats[k[0]]; }).length + Object.keys(f.subs).filter(function (k) { return f.subs[k] === false; }).length + (f.indie ? 1 : 0) + (!f.work || !f.leisure ? 1 : 0) + (f.only ? 1 : 0); }
  function mineFiltered() {
    var f = ui.mf, words = f.q.toLowerCase().split(/\s+/).filter(Boolean);
    var list = myReviews().map(function (r) { return { r: r, p: place(r.place_id) }; }).filter(function (o) {
      var p = o.p, r = o.r; if (!p) return false;
      if (!catOn(p, f.cats, f.subs)) return false;
      if (f.indie && !p.independent) return false;
      if (f.only && r.visibility !== 'me') return false;
      if (!((f.work && r.trip === 'Work') || (f.leisure && r.trip === 'Leisure'))) return false;
      if (words.length) {
        var hay = [p.name, p.address, kindName(p), allCats(p).map(function (c) { return CATNAME[c.category]; }).join(' '), r.body, S.notes[p.id] || '', r.trip, fmtDate(r.visited_on)].join(' ').toLowerCase();
        if (!words.every(function (w) { return hay.indexOf(w) >= 0; })) return false;
      }
      return true;
    });
    var by = { new: function (a, b) { return a.r.visited_on < b.r.visited_on ? 1 : -1; }, old: function (a, b) { return a.r.visited_on > b.r.visited_on ? 1 : -1; },
      high: function (a, b) { return overall(b.r) - overall(a.r); }, low: function (a, b) { return overall(a.r) - overall(b.r); }, az: function (a, b) { return a.p.name.localeCompare(b.p.name); } }[f.sort];
    return list.sort(by);
  }
  function mineListHtml() {
    var list = mineFiltered(), all = myReviews().length;
    var rows = list.map(function (o) {
      var p = o.p, r = o.r;
      return '<button class="item" data-place="' + p.id + '"><span class="tile ' + catCls(p) + '">' + svg(iconFor(p)) + '</span><span class="t"><span class="n">' + esc(p.name) + '</span><span class="small muted">' + esc(kindName(p)) + ' · ' + fmtDate(r.visited_on) + ' · ' + r.trip + (r.visibility === 'me' ? ' · only me' : '') + '</span>' +
        (r.body ? '<span class="small snippet">' + esc(r.body) + '</span>' : '') + '</span>' + badge(overall(r)) + '</button>';
    }).join('');
    var head = '<div class="row between mine-count"><span class="small muted" id="mineCount">' + (list.length === all ? all + (all === 1 ? ' review' : ' reviews') : list.length + ' of ' + all + ' reviews') + '</span>' +
      (list.length ? '<span class="small muted">Average ' + mean(list.map(function (o) { return overall(o.r); })).toFixed(1) + '</span>' : '') + '</div>';
    return head + (rows ? '<div class="list">' + rows + '</div>'
      : '<p class="empty">' + (all ? 'Nothing matches. Try another word, or <button class="linkbtn inline" data-mact="clear">clear the filters</button>.' : 'No reviews yet. Tap Rate to add your first.') + '</p>');
  }
  function viewMine() {
    var f = ui.mf, off = mineOff();
    var sorts = [['new', 'Newest first'], ['old', 'Oldest first'], ['high', 'Highest score'], ['low', 'Lowest score'], ['az', 'A to Z']];
    var panel = '<div class="section mine-filters"><div class="row between"><h2>Show</h2>' + (off ? '<button class="linkbtn" data-mact="clear">Show all</button>' : '') + '</div>' +
      CATS.map(function (k) {
        var on = f.cats[k[0]], subs = SUBS[k[0]];
        return '<div class="dcat"><button class="dcat-main" data-mcat="' + k[0] + '" aria-pressed="' + on + '"><span class="tile c-' + k[0] + '">' + svg(ICON[k[0]]) + '</span><span class="dname">' + k[1] + '</span><span class="tog" aria-hidden="true"></span></button>' +
          (subs && on ? '<div class="dsubs">' + subs.map(function (x) { return '<button class="pill" data-msub="' + x[0] + '" aria-pressed="' + (f.subs[x[0]] !== false) + '">' + esc(x[1]) + '</button>'; }).join('') + '</div>' : '') + '</div>';
      }).join('') +
      '<h3 class="dh">Trips</h3><div class="filters"><button class="pill" data-mact="work" aria-pressed="' + f.work + '">Work</button><button class="pill" data-mact="leisure" aria-pressed="' + f.leisure + '">Leisure</button></div>' +
      '<h3 class="dh">Only show</h3><div class="filters"><button class="pill" data-mact="indie" aria-pressed="' + f.indie + '">Independent businesses</button><button class="pill" data-mact="only" aria-pressed="' + f.only + '">Only-me reviews</button></div></div>';
    return '<div class="wrap page"><div class="topbar"><button class="round" data-act="back" aria-label="Back">' + svg(P.back) + '</button><h2>My reviews</h2><span style="width:44px"></span></div>' +
      '<div class="section"><div class="mine-search">' + svg(P.search, '', 18) + '<input id="mineQ" class="field" type="search" enterkeyhint="search" autocomplete="off" placeholder="Search my reviews" aria-label="Search your reviews" value="' + esc(f.q) + '"></div>' +
      '<div class="row" style="gap:8px;flex-wrap:wrap"><button class="pill iconpill" data-mact="open" aria-expanded="' + f.open + '">' + svg(P.filter, '', 16) + 'Filters' + (off ? ' · ' + off : '') + '</button>' +
      '<select id="mineSort" class="pill" aria-label="Sort by">' + sorts.map(function (s) { return '<option value="' + s[0] + '"' + (f.sort === s[0] ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select></div></div>' +
      (f.open ? panel : '') +
      '<div class="section" id="mineList">' + mineListHtml() + '</div></div>';
  }

  // ---------- Beta: suggestions ----------
  var SUGG_AREAS = ['Map', 'Places and reviews', 'Search', 'Friends', 'My reviews', 'Design and look', 'Something broken', 'Other'];
  var SUGG_STATUS = { new: 'Sent', approved: 'Approved', declined: 'Not this time', done: 'Done' };
  function viewSuggest() {
    var list = S.mySugg.map(function (s) {
      return '<div class="sugg"><div class="row" style="flex-wrap:wrap;gap:6px"><span class="lbl grey">' + esc(s.area) + '</span><span class="sstat s-' + s.status + '">' + SUGG_STATUS[s.status] + '</span><span class="small muted" style="margin-left:auto">' + fmtDate(s.created_at) + '</span></div>' +
        '<p class="rbody">' + esc(s.body) + '</p>' + (s.reply ? '<p class="small sreply"><b>Reply:</b> ' + esc(s.reply) + '</p>' : '') + '</div>';
    }).join('');
    return '<div class="brandpage">' + '<div class="authhero"><div class="wrap"><div class="topbar"><button class="round onnavy" data-act="back" aria-label="Back">' + svg(P.back) + '</button><span class="logo light"><svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#0B1A36"/><path d="M9.5 16.5l4.5 4.5 8.5-10" fill="none" stroke="#D4A017" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>Vouch</span><span style="width:44px"></span></div>' +
      '<div class="about-hero"><span class="beta onnavy">Beta</span><h1>Help shape Vouch</h1><p>Tell us what to fix, change or add. Every idea is read.</p></div></div></div><div class="wrap page">' +
      (S.needsV7 ? '<div class="alert" role="alert"><b>Not switched on yet.</b><span>Suggestions start working once the database update is run.</span></div>' :
      '<form id="suggForm" class="section"><h2>Suggest an improvement</h2><p class="small muted" style="margin:0">Vouch is being tested with friends and colleagues.</p>' +
      '<label for="suggArea" class="lbl-t">What is it about?</label><select id="suggArea" class="field">' + SUGG_AREAS.map(function (a) { return '<option>' + a + '</option>'; }).join('') + '</select>' +
      '<label for="suggBody" class="lbl-t">Your suggestion</label><textarea id="suggBody" class="field" required maxlength="2000" placeholder="e.g. Let me filter the map to places open now"></textarea>' +
      '<span class="small muted">Sent with your name and email so we can follow up.</span>' +
      '<button class="btn primary" type="submit"' + (ui.busy ? ' disabled' : '') + '>' + (ui.busy ? 'Sending…' : 'Send suggestion') + '</button></form>' +
      '<div class="section"><h2>Your suggestions · ' + S.mySugg.length + '</h2>' + (list ? '<div class="list">' + list + '</div>' : '<p class="small muted" style="margin:0">Nothing sent yet. You\'ll see each one here with its status.</p>') + '</div>') +
      '</div></div>';
  }
  function inboxCounts() { var c = { new: 0, approved: 0, done: 0, declined: 0 }; S.inbox.forEach(function (s) { c[s.status]++; }); return c; }
  function viewInbox() {
    var tab = ui.inboxTab || 'new', c = inboxCounts();
    var tabs = [['new', 'New'], ['approved', 'Approved'], ['done', 'Done'], ['declined', 'Declined']].map(function (x) { return '<button data-inbox="' + x[0] + '" aria-pressed="' + (tab === x[0]) + '">' + x[1] + (c[x[0]] ? ' ' + c[x[0]] : '') + '</button>'; }).join('');
    var items = S.inbox.filter(function (s) { return s.status === tab; }).map(function (s) {
      var acts = s.status === 'new' ? [['declined', 'Decline', 'soft'], ['approved', 'Approve', 'primary']]
        : s.status === 'approved' ? [['new', 'Back to new', 'soft'], ['done', 'Mark done', 'primary']]
        : [['new', 'Back to new', 'soft']];
      return '<div class="sugg"><div class="row" style="gap:10px"><span class="av">' + esc(initials(s.name)) + '</span><span class="pt"><b>' + esc(s.name) + '</b><span class="small muted">' + esc(s.email || '') + ' · ' + fmtDate(s.created_at) + '</span></span><span class="lbl grey">' + esc(s.area) + '</span></div>' +
        '<p class="rbody">' + esc(s.body) + '</p>' +
        '<label class="lbl-t" for="reply-' + s.id + '">Reply they\'ll see (optional)</label><input id="reply-' + s.id + '" class="field" maxlength="300" value="' + esc(s.reply || '') + '" placeholder="e.g. Great idea, coming next week">' +
        '<div class="row">' + acts.map(function (a) { return '<button class="btn ' + a[2] + ' sm" style="flex:1" data-sugg="' + s.id + ':' + a[0] + '">' + a[1] + '</button>'; }).join('') + '</div></div>';
    }).join('');
    return '<div class="brandpage">' + '<div class="authhero"><div class="wrap"><div class="topbar"><button class="round onnavy" data-act="back" aria-label="Back">' + svg(P.back) + '</button><span class="logo light"><svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#0B1A36"/><path d="M9.5 16.5l4.5 4.5 8.5-10" fill="none" stroke="#D4A017" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>Vouch</span><span style="width:44px"></span></div>' +
      '<div class="about-hero"><span class="beta onnavy">Owner only</span><h1>Suggestions inbox</h1><p>' + (c.new ? c.new + ' new to review.' : 'You\'re all caught up.') + '</p></div></div></div><div class="wrap page">' +
      '<div class="section"><p class="small muted" style="margin:0">Only you can see this page. Approve the ideas you want, then copy them and paste them to Claude to build.</p>' +
      '<button class="btn primary" data-act="copyapproved"' + (c.approved ? '' : ' disabled') + '>' + svg(P.share, '', 18) + 'Copy approved for Claude' + (c.approved ? ' · ' + c.approved : '') + '</button>' +
      (ui.copyText ? '<label for="copyBox" class="lbl-t">Your phone blocked automatic copying. Press and hold in the box, Select All, then Copy.</label><textarea id="copyBox" class="field" readonly style="min-height:140px">' + esc(ui.copyText) + '</textarea>' : '') +
      '<div class="segwide" role="group" aria-label="Show suggestions">' + tabs + '</div></div>' +
      '<div class="section">' + (items ? '<div class="list">' + items + '</div>' : '<p class="small muted" style="margin:0">Nothing here.</p>') + '</div></div></div>';
  }

  function customThemeCard() {
    var cc = customColours(), on = S.me.theme === 'custom';
    var sw = [['main', 'Main'], ['accent', 'Accent'], ['bg', 'Background'], ['text', 'Text']].map(function (x) {
      return '<label class="cpick"><span class="cpsq" style="background:' + cc[x[0]] + '"><input type="color" data-ccol="' + x[0] + '" value="' + cc[x[0]] + '" aria-label="' + x[1] + ' colour"></span><span class="small">' + x[1] + '</span></label>';
    }).join('');
    return '<div class="theme custom" aria-current="' + on + '"><div class="row between"><span style="font-weight:700">Your own</span>' +
      (on ? '<button class="linkbtn" data-act="customreset">Reset</button>' : '<button class="pill" data-themepick="custom">Use this</button>') + '</div>' +
      '<div class="cpicks">' + sw + '</div><span class="small muted">Tap a square to pick a colour.</span></div>';
  }
  async function saveCustom(cc) {
    store('themeCustom', cc);
    var patch = { theme: 'custom' }; if (!S.needsV7) patch.theme_custom = cc;
    await updateProfile(patch, true);
  }

  function viewEditPlace() {
    var p = place(ui.place); if (!p) { ui.view = 'map'; return viewMap(); }
    var othersRated = S.reviews.some(function (r) { return r.place_id === p.id && r.user_id !== myId(); });
    return '<div class="wrap"><div class="topbar"><button class="round" data-act="back" aria-label="Back">' + svg(P.back) + '</button><h2>Details and category</h2><span style="width:44px"></span></div>' +
      '<form id="editPlaceForm" class="stack section"><label for="epName" class="lbl-t">Name</label><input id="epName" class="field" required maxlength="120" value="' + esc(p.name) + '">' +
      '<label for="epCat" class="lbl-t">Category</label>' + catSelect('epCat', p.category, p.subcategory) + extraFields('epCat', p) +
      '<label for="epAddr" class="lbl-t">Area or address</label><input id="epAddr" class="field" maxlength="200" value="' + esc(p.address) + '">' +
      '<label class="check"><input id="epIndie" type="checkbox"' + (p.independent ? ' checked' : '') + '>Independent business (not a chain)</label>' +
      '<button class="btn primary" type="submit">Save changes</button></form>' +
      '<div class="section"><h2>Added the wrong place?</h2>' +
      (othersRated ? '<p class="small muted" style="margin:0">Other people have rated this place, so it stays on Vouch. You can delete your own rating from the place page.</p>'
        : (ui.confirm === 'delplace'
          ? '<p style="margin:0"><b>Remove ' + esc(p.name) + ' from Vouch?</b> Your rating, photos, tips and notes for it go too.</p><div class="row"><button class="btn soft" data-act="confirm-no" style="flex:1">Keep it</button><button class="btn danger" data-act="delplace-yes" style="flex:1">Remove</button></div>'
          : '<button class="btn danger" data-act="delplace">Remove this place</button>')) + '</div></div>';
  }
  function tipForm() {
    return '<form id="tipForm" class="stack card"><label for="tipKind" class="lbl-t">Type of tip</label><select id="tipKind" class="field">' +
      '<option value="General tip">General tip</option><option value="Hidden value">Hidden value</option><option value="Loyalty">Loyalty scheme</option><option value="Where to look">Where to find offers</option></select>' +
      '<label for="tipBody" class="lbl-t">Tip</label><textarea id="tipBody" class="field" required maxlength="300" placeholder="e.g. Avoid the table by the door, it\'s draughty"></textarea>' +
      '<div id="tipUrlWrap" class="stack" style="gap:6px" hidden><label for="tipUrl" class="lbl-t">Link (optional)</label><input id="tipUrl" class="field" type="url" inputmode="url" placeholder="https://"></div>' +
      '<div class="row"><button class="btn soft" type="button" data-act="canceltip" style="flex:1">Cancel</button><button class="btn primary" type="submit" style="flex:1">Share tip</button></div></form>';
  }
  var TIP_PH = { 'General tip': 'e.g. Avoid the table by the door, it\'s draughty', 'Hidden value': 'e.g. Lunch menu is half the price of dinner', 'Loyalty': 'e.g. Stamp card at the till, 10th coffee free', 'Where to look': 'e.g. Check their app for weekday offers' };
  function shareText(p) {
    var st = stats(p.id);
    return p.name + (p.address ? ' (' + p.address.split(',')[0] + ')' : '') + (st.rs.length ? ' - rated ' + st.score.toFixed(1) + ' by friends on Vouch' : ' on Vouch') + '. https://www.google.com/maps/search/?api=1&query=' + p.lat + ',' + p.lng;
  }

  function viewRate() {
    var r = ui.rate; var p = place(r.place_id);
    function dots(k) { var b = ''; for (var n = 1; n <= 10; n++) b += '<button type="button" data-score="' + k + ':' + n + '" class="' + (n === r[k] ? 'cur' : n < r[k] ? 'on' : '') + '" aria-label="' + n + ' out of 10">' + n + '</button>'; return b; }
    return '<div class="wrap page"><div class="topbar"><button class="round" data-act="back" aria-label="Close">' + svg(P.close) + '</button><h2>' + (r.existing ? 'Edit review' : 'New review') + '</h2><span style="width:44px"></span></div>' +
      '<form id="rateForm" class="stack" style="gap:0;padding-bottom:24px">' +
      '<div class="section"><div class="row" style="gap:12px"><span class="tile ' + catCls(p) + '">' + svg(iconFor(p)) + '</span><span class="pt"><b>' + esc(p.name) + '</b><span class="small muted">' + esc(kindName(p)) + '</span></span>' +
      (p.created_by === myId() ? '<button type="button" class="pill" data-act="editplace">Change</button>' : '') + '</div>' +
      '<div class="row between"><label for="visitIn" class="lbl-t">Date of visit</label><input id="visitIn" type="date" class="field" style="width:auto" max="' + todayISO() + '" value="' + esc(r.visited_on) + '"></div>' +
      '<div class="row between"><span class="lbl-t">This trip was</span><span class="row" style="gap:8px"><button type="button" class="pill" data-trip="Work" aria-pressed="' + (r.trip === 'Work') + '">Work</button><button type="button" class="pill" data-trip="Leisure" aria-pressed="' + (r.trip === 'Leisure') + '">Leisure</button></span></div></div>' +
      '<div class="section"><div class="row between"><span class="lbl-t">Your scores</span><span style="font-weight:600">Overall <span style="font-family:var(--display);font-size:22px">' + overall(S.needsV6 ? { quality: r.quality, value: r.value, location: r.location } : r).toFixed(1) + '</span></span></div>' +
      '<p class="scalehint">Score each from <b>1 (worst)</b> to <b>10 (best)</b>.</p>' +
      [['Quality', 'quality', 'How good was it?'], ['Experience', 'experience', 'Service and atmosphere'], ['Value', 'value', 'Worth the money?'], ['Location', 'location', 'Easy to get to?']].filter(function (x) { return x[1] !== 'experience' || !S.needsV6; }).map(function (x) { return '<div class="stack" style="gap:6px"><div class="row between"><span><b>' + x[0] + '</b> <span class="small muted">' + x[2] + '</span></span><b>' + r[x[1]] + '<span class="small muted">/10</span></b></div><div class="dots" role="group" aria-label="' + x[0] + ' score, 1 worst to 10 best">' + dots(x[1]) + '</div><div class="scaleends"><span>1 Worst</span><span>10 Best</span></div></div>'; }).join('') + '</div>' +
      '<div class="section"><label for="revText" class="lbl-t">Your review</label><textarea id="revText" class="field" maxlength="2000" placeholder="What should your friends know? Tips like a better bakery down the road are gold.">' + esc(r.body) + '</textarea>' +
      (S.needsLinks ? '' : '<label for="revLink" class="lbl-t">Link to your post (optional)</label><input id="revLink" class="field" type="text" inputmode="url" autocapitalize="off" spellcheck="false" placeholder="e.g. your Instagram post about it" value="' + esc(r.link || '') + '"><span class="small muted">Shows as "View post" on your review.</span>') +
      '<label for="photoIn" class="lbl-t">Photos (optional)</label><input id="photoIn" type="file" accept="image/*" multiple class="field"><span class="small muted">Menus, rooms, the view, what you ate. Shared with the same people as your review.</span></div>' +
      '<div class="section"><span class="lbl-t">Who sees this review</span><div class="segwide"><button type="button" data-vis="circle" aria-pressed="' + (r.visibility === 'circle') + '">My circle</button><button type="button" data-vis="me" aria-pressed="' + (r.visibility === 'me') + '">Only me</button></div>' +
      '<span class="small muted">' + (r.visibility === 'circle' ? 'Friends, and friends of friends up to your privacy setting.' : 'Kept private, like a notebook.') + '</span></div>' +
      '<button class="btn primary" type="submit" style="margin-top:18px"' + (ui.busy ? ' disabled' : '') + '>' + (ui.busy ? 'Saving…' : r.existing ? 'Save changes' : 'Post review') + '</button>' +
      (r.existing ? '' : '<span class="small muted" style="text-align:center;margin-top:8px">It\'s added to your map automatically.</span>') +
      (r.existing ? (ui.confirm === 'delreview'
        ? '<div class="stack card" style="margin-top:28px"><b>Delete your rating for ' + esc(p.name) + '?</b>' + (p.created_by === myId() && !S.reviews.some(function (x) { return x.place_id === p.id && x.user_id !== myId(); }) ? '<span class="small muted">You added this place and nobody else has rated it, so it will be removed from Vouch too.</span>' : '') + '<div class="row"><button class="btn soft" type="button" data-act="confirm-no" style="flex:1">Keep it</button><button class="btn danger" type="button" data-act="delreview-yes" style="flex:1">Delete</button></div></div>'
        : '<button class="btn danger" type="button" data-act="delreview" style="margin-top:36px">Delete this rating</button>') : '') + '</form></div>';
  }

  function viewAdd() {
    var a = ui.add, browse = a.mode === 'browse';
    var results = (a.results || []).map(function (r, i) {
      var onV = S.places.filter(function (p) { return p.osm_id === r.osm_id; })[0];
      var st = onV ? stats(onV.id) : null;
      return '<button class="item" data-pick="' + i + '"><span class="tile ' + catCls(r) + '">' + svg(iconFor(r)) + '</span><span class="t"><span class="n">' + esc(r.name) + '</span><span class="small muted">' + esc(r.address) + (ui.here ? ' · ' + fmtMiles(miles(ui.here, r)) : '') + '</span></span>' +
        (st && st.rs.length ? badge(st.score) : '') + '</button>';
    }).join('');
    var f = a.form;
    var existing = (a.existing || []).map(function (p) {
      var st = stats(p.id);
      return '<button class="item" ' + (browse ? 'data-place' : 'data-place-rate') + '="' + p.id + '"><span class="tile ' + catCls(p) + '">' + svg(iconFor(p)) + '</span><span class="t"><span class="n">' + esc(p.name) + '</span><span class="small muted">' + esc(p.address) + '</span></span>' + (st.rs.length ? badge(st.score) : '') + '</button>';
    }).join('');
    return '<div class="wrap"><div class="topbar"><button class="round" data-act="back" aria-label="Close">' + svg(P.close) + '</button><h2>' + (browse ? 'Search places' : 'Rate a place') + '</h2><span style="width:44px"></span></div>' +
      (!f ?
        '<form id="searchForm" class="stack section"><label for="searchIn" class="lbl-t">' + (browse ? 'What are you looking for?' : 'Which place are you rating?') + '</label><div class="row"><input id="searchIn" class="field" type="search" enterkeyhint="search" placeholder="Name and town, e.g. Forno Bakery Leeds" value="' + esc(a.q) + '"><button class="round" type="submit" aria-label="Search">' + svg(P.search) + '</button></div>' +
        '<span class="small muted">Searches near where your map is. Add a town to search somewhere else.</span></form>' +
        (a.searching ? '<p class="empty">Searching…</p>' : '') +
        (browse && !a.searching && (results || existing) ? '<button class="btn soft showmap" data-act="searchmap">' + svg(P.map, '', 18) + 'Show these on the map</button>' : '') +
        (existing ? '<div class="section"><span class="eyebrow">Already on Vouch</span><div class="list">' + existing + '</div></div>' : '') +
        (results ? '<div class="section"><span class="eyebrow">' + (browse ? 'All places' : 'From the map') + '</span><div class="list">' + results + '</div></div>' : (a.done && !a.searching ? '<p class="empty">No matches. Try adding the town' + (browse ? '.' : ', or drop a pin instead.') + '</p>' : '')) +
        (browse ? '' : '<div class="section"><button class="btn ghost" data-act="droppin">Can\'t find it? Add it where the map is centred</button><span class="small muted">Move the map to the spot first.</span></div>')
        :
        '<form id="placeForm" class="stack section"><label for="pName" class="lbl-t">Name</label><input id="pName" class="field" required maxlength="120" value="' + esc(f.name) + '">' +
        '<label for="pCat" class="lbl-t">Category</label>' + catSelect('pCat', f.category, f.subcategory) + extraFields('pCat', f) +
        '<label for="pAddr" class="lbl-t">Area or address</label><input id="pAddr" class="field" maxlength="200" value="' + esc(f.address) + '">' +
        '<label class="check"><input id="pIndie" type="checkbox"' + (f.independent ? ' checked' : '') + '>Independent business (not a chain)</label>' +
        '<button class="btn primary" type="submit"' + (ui.busy ? ' disabled' : '') + '>Next: rate it</button><button class="btn soft" type="button" data-act="unpick">Back to search</button></form>') +
      '</div>';
  }

  function viewPreview() {
    var r = ui.preview; if (!r) { ui.view = 'map'; return viewMap(); }
    var links = (r.links || []).map(linkChip).join('');
    return '<div class="wrap page"><div class="topbar"><button class="round" data-act="back" aria-label="Back to results">' + svg(P.back) + '</button><span></span></div>' +
      '<div class="section titlecard">' + titleHead(r) + '<span class="muted">' + esc(r.address) + (ui.here ? ' · ' + fmtMiles(miles(ui.here, r)) + ' away' : '') + '</span>' +
      (links ? '<div class="linkchips">' + links + '</div>' : '') + '</div>' +
      '<div class="section"><div class="row" style="gap:16px"><div class="big">–</div><div class="pt" style="gap:4px"><span style="font-weight:600;font-size:17px">Not on Vouch yet</span><span class="small muted">None of your friends have rated it. Been there? Be the first.</span></div></div>' +
      '<button class="btn primary" data-act="ratepreview">Rate this place</button></div>' +
      '<div class="section"><h2>Getting there</h2>' + gettingThere(r, r.name + ' (' + String(r.address || '').split(',')[0] + '). https://www.google.com/maps/search/?api=1&query=' + r.lat + ',' + r.lng) + '</div></div>';
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
    function row(id, sub, extra) {
      return '<div class="person"><button class="person-main" data-person="' + id + '"><span class="' + avClass(id) + '">' + esc(avText(id)) + '</span><span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;text-align:left"><span style="font-weight:600">' + esc(nameOf(id)) + '</span><span class="small muted">' + esc(sub) + '</span></span></button>' + (extra || '') + '</div>';
    }
    var reqs = S.followers.slice();
    var following = S.following.slice().sort(function (a, b) { return nameOf(a).localeCompare(nameOf(b)); });
    var disc = discoverPeople().slice(0, 12);
    return '<div class="wrap" style="padding-top:20px">' +
      '<h1>Friends</h1>' +
      (S.needsUpdate ? '<div class="alert" role="alert" style="margin-top:12px"><b>Database update needed.</b><span>Run supabase/002_public_follow_saves.sql in Supabase to switch on friend requests, following and public reviews.</span></div>' : '') +
      (reqs.length ? '<div class="section approve" id="sec-requests"><h2>To be approved · ' + reqs.length + '</h2><p class="small muted" style="margin:0">These people want to be friends. Nothing is shared until you approve.</p><div class="list">' +
        reqs.map(function (id) { return row(id, 'Wants to be friends', '<span class="row" style="gap:6px"><button class="btn soft sm" data-decline="' + id + '">Decline</button><button class="btn primary sm" data-friendback="' + id + '">Approve</button></span>'); }).join('') + '</div></div>' : '') +
      '<div class="section" id="sec-friends"><h2>Your friends · ' + S.friends.length + '</h2><div class="list">' +
      (friends.length ? friends.map(function (id) { var p = S.people[id] || {}; return row(id, [isSilenced(id) ? 'Silenced' : '', p.nickname ? '“' + p.nickname + '”' : '', p.home].filter(Boolean).join(' · ') || 'Friend'); }).join('') : '<p class="empty">No friends yet. Invite someone to get started.</p>') +
      '</div></div>' +
      '<div class="section" id="sec-groups"><h2>Groups</h2><p class="small muted" style="margin:0">Like Family, Uni friends or Event crew. Filter the map to one group. Only you can see your groups.</p><div class="list">' +
      S.groups.map(function (gr) { var n = S.members.filter(function (m) { return m.group_id === gr.id; }).length; return '<button class="item" data-group-edit="' + gr.id + '"><span class="t"><span class="n">' + esc(gr.name) + '</span><span class="small muted">' + n + (n === 1 ? ' person' : ' people') + '</span></span></button>'; }).join('') +
      '</div><form id="groupForm" class="row"><label for="groupName" hidden>New group name</label><input id="groupName" class="field" maxlength="40" placeholder="New group, e.g. Family" required><button class="btn soft" type="submit">Create</button></form></div>' +
      (following.length ? '<div class="section" id="sec-following"><h2>Following · ' + following.length + '</h2><p class="small muted" style="margin:0">Kindred spirits you follow for their taste, and friends who haven\'t added you back yet.</p><div class="list">' +
        following.map(function (id) { var m = tasteMatch(id); var pub = (S.people[id] || {}).isPublic; return row(id, pub ? 'Kindred spirit' + (m ? ' · ' + m.pct + '% taste match' : '') : 'Waiting for them to add you back', '<button class="pill" data-unfollow="' + id + '">Unfollow</button>'); }).join('') + '</div></div>' : '') +
      '<div class="section" id="sec-discover"><h2>People who rate like you</h2><p class="small muted" style="margin:0">From public reviews of places you\'ve rated too. Follow them to see their picks in the Kindred spirits filter on the map.</p><div class="list">' +
      (disc.length ? disc.map(function (o) { return row(o.id, matchText(o.m), '<button class="btn primary sm" data-follow="' + o.id + '">Follow</button>'); }).join('')
        : '<p class="empty">No matches yet. Rate a few more places, and tap Public on the map to see what everyone recommends.</p>') + '</div></div>' +
      '<div class="section" id="sec-invite"><h2>Invite friends</h2>' +
      '<button class="btn primary" data-act="invite-new">' + svg(P.share, '', 18) + 'Invite someone new</button>' +
      '<span class="small muted">Sends a link to Vouch. You become friends automatically when they sign up with it.</span>' +
      '<button class="btn ghost" data-act="invite-code">Send my friend code · <b style="letter-spacing:0.08em">' + esc(S.me.invite_code) + '</b></button>' +
      '<span class="small muted">For people already on Vouch. They add your code, then you add them back.</span></div>' +
      '<form id="friendForm" class="section"><label for="friendCode" class="lbl-t">Add a friend by their code</label><div class="row"><input id="friendCode" class="field code" style="font-size:20px" maxlength="10" autocapitalize="characters" autocomplete="off" placeholder="ABC123" required><button class="btn primary" type="submit">Add</button></div><span class="small muted">They get a request to add you back. Once they do, you\'re friends.</span></form>' +
      '</div>';
  }

  function viewPerson() {
    var id = ui.person;
    if (id === myId()) { ui.view = 'me'; return viewMe(); }
    var p = S.people[id] || { degree: 9 };
    var best = S.best.filter(function (b) { return b.user_id === id; });
    var revs = S.reviews.filter(function (r) { return r.user_id === id; }).sort(function (a, b) { return a.visited_on < b.visited_on ? 1 : -1; });
    var isFriend = S.friends.indexOf(id) >= 0, iFollow = S.following.indexOf(id) >= 0, followsMe = S.followers.indexOf(id) >= 0;
    var m = tasteMatch(id);
    var relation = isFriend ? '' :
      followsMe ? '<div class="section card"><b>' + esc(nameOf(id)) + ' added you as a friend.</b><span class="small muted">Add them back and you\'ll be friends.</span><button class="btn primary" data-friendback="' + id + '">Add as friend</button></div>' :
      iFollow ? '<div class="section"><span class="small muted">' + (p.isPublic ? 'You follow them as a kindred spirit. Their public reviews show in the Kindred spirits filter.' : 'Waiting for them to add you back.') + '</span><button class="btn ghost" data-unfollow="' + id + '">Unfollow</button></div>' :
      '<div class="section"><button class="btn primary" data-follow="' + id + '">Follow</button><span class="small muted">See their public reviews in the Kindred spirits filter. If they follow you back, you become friends.</span></div>';
    return '<div class="wrap"><div class="topbar"><button class="round" data-act="back" aria-label="Back">' + svg(P.back) + '</button><span></span></div>' +
      '<div class="row" style="gap:16px"><span class="' + avClass(id) + '" style="width:72px;height:72px;border-radius:36px;font-size:22px">' + esc(avText(id)) + '</span><div class="stack" style="gap:4px"><h1 style="font-size:26px">' + esc(nameOf(id)) + '</h1><span class="small muted">' + degLabel(id) + (p.home ? ' · ' + esc(p.home) : '') + '</span>' + (m ? '<span class="small" style="font-weight:600">' + matchText(m) + '</span>' : '') + '</div></div>' +
      relation +
      (isFriend ? '<div class="section" id="sec-friendset"><h2>Friend settings</h2>' +
        (S.needsV6 ? '' : '<button class="setrow" data-act="silence" aria-pressed="' + isSilenced(id) + '"><span class="pt"><b>Silence ' + esc(nameOf(id).split(' ')[0]) + '</b><span class="small muted">' + (isSilenced(id) ? 'Silenced. Their reviews are hidden from your map and searches. You\'re still friends.' : 'Hide their reviews from your map and searches. You stay friends, and their friends still count as your 1st and 2nd degree.') + '</span></span><span class="tog" aria-hidden="true"></span></button>') +
        (ui.confirm === 'unfriend' ? '<p style="margin:0">Remove ' + esc(nameOf(id)) + ' as a friend?</p><div class="row"><button class="btn soft" data-act="confirm-no" style="flex:1">Keep</button><button class="btn danger" data-act="unfriend-yes" style="flex:1">Remove</button></div>' : '<button class="btn danger" data-act="unfriend">Remove friend</button>') + '</div>' : '') +
      '<div class="section"><h2>' + esc(p.name ? p.name.split(' ')[0] + '\'s' : 'Their') + ' best ever</h2>' +
      (best.length ? '<div class="list">' + best.map(function (b) { var pl = place(b.place_id); return pl ? '<button class="item" data-place="' + pl.id + '"><span class="tile ' + catCls(pl) + '" style="box-shadow:0 0 0 3px var(--fav)">' + svg(iconFor(pl)) + '</span><span class="t"><span class="eyebrow" style="color:var(--fav-text)">Best ' + esc(bestLabel(b.category)) + '</span><span class="n">' + esc(pl.name) + '</span>' + (b.quote ? '<span class="small">“' + esc(b.quote) + '”</span>' : '') + '</span></button>' : ''; }).join('') + '</div>' : '<p class="small muted" style="margin:0">Nothing picked yet.</p>') + '</div>' +
      '<div class="section"><h2>Reviews you can see · ' + revs.length + '</h2>' + (revs.length ? '<div class="list">' + revs.map(function (r) { var pl = place(r.place_id); return pl ? '<button class="item" data-place="' + pl.id + '"><span class="tile ' + catCls(pl) + '">' + svg(iconFor(pl)) + '</span><span class="t"><span class="n">' + esc(pl.name) + '</span><span class="small muted">' + fmtDate(r.visited_on) + ' · ' + r.trip + '</span></span>' + badge(overall(r)) + '</button>' : ''; }).join('') + '</div>' : '<p class="small muted" style="margin:0">None visible yet.</p>') + '</div>' +

      '</div>';
  }

  function viewMe() {
    var me = S.me;
    var mine = S.reviews.filter(function (r) { return r.user_id === me.id; }).sort(function (a, b) { return a.visited_on < b.visited_on ? 1 : -1; });
    var best = S.best.filter(function (b) { return b.user_id === me.id; });
    function opt(field, val, label) { var inr = /degree/.test(field) && Number(me[field]) >= Number(val); return '<button data-pref="' + field + ':' + val + '"' + (inr ? ' class="in"' : '') + ' aria-pressed="' + (String(me[field]) === String(val)) + '">' + label + '</button>'; }
    return '<div class="wrap" style="padding-top:20px">' +
      '<div class="section"><div class="row" style="gap:14px"><span class="av me" style="width:64px;height:64px;border-radius:32px;font-size:20px">' + esc(initials(me.name)) + '</span><div class="stack" style="gap:2px;min-width:0"><h1 style="font-size:26px">' + esc(me.name || 'You') + '</h1><span class="small muted">' + esc(S.session.user.email || '') + '</span></div></div></div>' +
      (S.isAdmin ? '<button class="aboutrow mine-link" data-act="inbox">' + svg(P.tag, '', 20) + '<span><b>Suggestions inbox</b><span class="small muted">' + (inboxCounts().new ? inboxCounts().new + ' new to review' : 'Only you can see this') + '</span></span>' + (inboxCounts().new ? '<span class="dot static">' + inboxCounts().new + '</span>' : '') + svg(P.chevR, '', 16) + '</button>' : '') +
      '<button class="aboutrow mine-link beta-link" data-act="suggest">' + svg(P.plus, '', 20) + '<span><b>Suggest an improvement</b><span class="small muted">Beta testing: tell us what to fix or add</span></span>' + svg(P.chevR, '', 16) + '</button>' +
      '<button class="aboutrow mine-link" data-act="mine">' + svg(P.list, '', 20) + '<span><b>My reviews</b><span class="small muted">' + myReviews().length + (myReviews().length === 1 ? ' review' : ' reviews') + ' · search and filter</span></span>' + svg(P.chevR, '', 16) + '</button>' +
      '<form id="profileForm" class="section"><h2>Your profile</h2>' +
      '<div class="grid2"><div class="stack" style="gap:6px"><label for="meFirst" class="lbl-t">First name</label><input id="meFirst" class="field" maxlength="40" autocomplete="given-name" value="' + esc(me.first_name != null ? me.first_name : me.name) + '"></div>' +
      '<div class="stack" style="gap:6px"><label for="meLast" class="lbl-t">Last name</label><input id="meLast" class="field" maxlength="40" autocomplete="family-name" value="' + esc(me.last_name || '') + '"></div></div>' +
      '<label for="meNick" class="lbl-t">Nickname (optional)</label><input id="meNick" class="field" maxlength="30" autocomplete="nickname" placeholder="What friends call you" value="' + esc(me.nickname || '') + '">' +
      '<label for="meHome" class="lbl-t">Home town</label><input id="meHome" class="field" maxlength="60" value="' + esc(me.home) + '" placeholder="e.g. Leeds">' +
      '<label for="meBio" class="lbl-t">About you</label><textarea id="meBio" class="field" style="min-height:72px" maxlength="280" placeholder="e.g. Always on the road for events. Love a good bakery and a cheap EV charge.">' + esc(me.bio) + '</textarea>' +
      '<button class="btn primary" type="submit">Save profile</button></form>' +
      '<div class="section"><h2>Your best ever</h2>' + (best.length ? '<div class="list">' + best.map(function (b) { var pl = place(b.place_id); return pl ? '<button class="item" data-place="' + pl.id + '"><span class="tile ' + catCls(pl) + '" style="box-shadow:0 0 0 3px var(--fav)">' + svg(iconFor(pl)) + '</span><span class="t"><span class="eyebrow" style="color:var(--fav-text)">Best ' + esc(bestLabel(b.category)) + '</span><span class="n">' + esc(pl.name) + '</span>' + (b.quote ? '<span class="small">“' + esc(b.quote) + '”</span>' : '') + '</span></button>' : ''; }).join('') + '</div>' : '<p class="small muted" style="margin:0">Open a place and tap "Make this my best ever". It shows as a gold pin on friends\' maps.</p>') + '</div>' +
      '<div class="section" id="sec-privacy"><h2>Privacy</h2>' +
      '<p class="small muted" style="margin:0">Friends are people you\'ve both added. 1st degree are their friends, 2nd degree are friends of those.</p>' +
      '<span class="lbl-t">Recommendations I see by default</span><div class="segwide">' + opt('see_degree', 1, 'Friends') + opt('see_degree', 2, '+1st') + opt('see_degree', 3, '+2nd') + opt('see_degree', 4, 'Public') + '</div>' +
      '<span class="lbl-t">Who can see my reviews</span><div class="segwide">' + opt('share_degree', 1, 'Friends') + opt('share_degree', 2, '+1st') + opt('share_degree', 3, '+2nd') + opt('share_degree', 4, 'Everyone') + '</div>' +
      '<span class="small muted">' + (S.me.share_degree === 4 ? 'Public: anyone on Vouch can see your reviews and find you by taste.' : 'Choose Everyone to let people with similar taste find you.') + '</span>' +
      '<span class="lbl-t">How 1st degree see my name</span><div class="segwide">' + opt('show_as_2', 'full', 'Full') + opt('show_as_2', 'first', 'First') + opt('show_as_2', 'nick', 'Nickname') + opt('show_as_2', 'anon', 'Hidden') + '</div>' +
      '<span class="lbl-t">How 2nd degree and the public see my name</span><div class="segwide">' + opt('show_as_3', 'first', 'First') + opt('show_as_3', 'nick', 'Nickname') + opt('show_as_3', 'anon', 'Hidden') + '</div>' +
      '<span class="small muted">Friends always see your full name and nickname.</span>' +
      '<span class="small muted">Private notes and "Only me" reviews are never shared, whatever these say.</span></div>' +
      '<div class="section" id="sec-theme"><h2>Theme</h2><div class="themes">' + THEMES.map(function (t) { return '<button class="theme" data-themepick="' + t[0] + '" aria-pressed="' + (me.theme === t[0]) + '"><span style="font-weight:700">' + t[1] + '</span><span class="sw"><span style="background:' + t[2] + '"></span><span style="background:' + t[3] + '"></span><span style="background:' + t[4] + '"></span></span></button>'; }).join('') + customThemeCard() + '</div><span class="small muted">Navy &amp; Gold, Coastal and Forest follow your phone\'s dark mode. Your own theme always uses your colours.</span></div>' +
      '<div class="section"><h2>Install on your phone</h2><p class="small muted" style="margin:0">iPhone: open this page in Safari, tap Share, then Add to Home Screen. Android: open the browser menu and choose Add to Home screen.</p></div>' +
      '<form id="changePassForm" class="section"><h2>Password</h2>' + pwField('chPass', 'new-password', 'New password') + pwField('chPass2', 'new-password', 'Type it again') + PW_RULE + '<button class="btn ghost" type="submit">Change password</button></form>' +
      '<div class="section"><button class="btn ghost" data-act="signout">Sign out</button></div>' +
      '</div>';
  }

  function renderTabs() {
    var t = $('tabs');
    var show = (['map', 'place', 'friends', 'person', 'me', 'mine', 'suggest', 'inbox', 'rate', 'add', 'preview', 'editplace'].indexOf(ui.view) >= 0) || (ui.view === 'about' && !!S.me && !ui.aboutFirst);
    var browsing = (ui.view === 'add' && ui.add && ui.add.mode === 'browse') || ui.view === 'preview';
    t.hidden = !show; if (!show) return;
    function cur(v) { return v.indexOf(ui.view) >= 0 ? ' aria-current="page"' : ''; }
    t.innerHTML = '<div class="in">' +
      '<button class="tab" data-tab="map"' + (browsing ? ' aria-current="page"' : cur(['map', 'place', 'editplace'])) + '>' + svg(P.map) + 'Map</button>' +
      '<button class="tab" data-tab="add"' + (browsing ? '' : cur(['add', 'rate'])) + '><span class="plus">' + svg(P.plus, '', 18) + '</span>Rate</button>' +
      '<button class="tab" data-tab="friends"' + cur(['friends', 'person']) + '>' + svg(P.friends) + 'Friends' + (S.followers.length ? '<span class="dot" aria-label="' + S.followers.length + ' friend requests">' + S.followers.length + '</span>' : '') + '</button>' +
      '<button class="tab" data-tab="me"' + cur(['me', 'mine', 'suggest', 'inbox']) + '>' + svg(P.me) + 'Me' + (S.isAdmin && inboxCounts().new ? '<span class="dot" aria-label="' + inboxCounts().new + ' new suggestions">' + inboxCounts().new + '</span>' : '') + '</button></div>';
  }

  function render() {
    applyTheme();
    if (map && ui.view !== 'map') { saveView(); try { map.off(); map.stop(); map.remove(); } catch (e) { console.warn(e); } map = null; markerLayer = null; meMarker = null; tileLayer = null; }
    var v = ui.view, h;
    if (v === 'setup') h = viewSetup();
    else if (v === 'splash') h = viewSplash();
    else if (v === 'signin') h = viewSignIn();
    else if (v === 'onboard') h = viewOnboard();
    else if (v === 'place') h = viewPlace();
    else if (v === 'rate') h = viewRate();
    else if (v === 'add') h = viewAdd();
    else if (v === 'preview') h = viewPreview();
    else if (v === 'editplace') h = viewEditPlace();
    else if (v === 'about') h = viewAbout();
    else if (v === 'friends') h = viewFriends();
    else if (v === 'person') h = viewPerson();
    else if (v === 'me') h = viewMe();
    else if (v === 'mine') h = viewMine();
    else if (v === 'suggest') h = viewSuggest();
    else if (v === 'inbox') h = viewInbox();
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
    renderPrompt();
  }
  function renderPrompt() {
    var el = $('prompt'); if (!el) return;
    var dismissed = store('dismissed') || [];
    var main = ['map', 'friends', 'me', 'place'].indexOf(ui.view) >= 0;
    var id = main && S.me ? S.followers.filter(function (x) { return dismissed.indexOf(x) < 0; })[0] : null;
    if (!id) { el.hidden = true; el.innerHTML = ''; return; }
    el.hidden = false;
    el.innerHTML = '<div class="prompt-card" role="dialog" aria-labelledby="promptText"><div class="row"><span class="' + avClass(id) + '">' + esc(avText(id)) + '</span><p id="promptText" style="margin:0;flex:1"><b>' + esc(nameOf(id)) + '</b> wants to be friends. Approve?</p></div>' +
      '<div class="row"><button class="btn soft" data-dismiss="' + id + '" style="flex:1">Later</button><button class="btn soft" data-decline="' + id + '" style="flex:1">Decline</button><button class="btn primary" data-friendback="' + id + '" style="flex:1">Approve</button></div></div>';
  }
  function refreshMapPanel() {
    // Re-render the overlay and list but keep the live map.
    var mapEl = $('map');
    var holder = document.createElement('div'); holder.innerHTML = viewMap();
    var newTop = holder.querySelector('.map-top'), newSheet = holder.querySelector('.sheet');
    var app = $('app');
    app.querySelector('.map-top').replaceWith(newTop);
    app.querySelector('.sheet').replaceWith(newSheet);
    var oldD = app.querySelector('.drawerwrap'), newD = holder.querySelector('.drawerwrap');
    if (oldD && newD) oldD.replaceWith(newD); else if (newD) app.appendChild(newD); else if (oldD) oldD.remove();
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
    if (!v && S.places.length > 1) map.fitBounds(L.latLngBounds(S.places.map(function (p) { return [p.lat, p.lng]; })), { padding: [40, 40], maxZoom: 15, animate: false });
    if (ui.searchMap) fitResults();
    if (ui.here) showMe();
    map.on('moveend', function () {
      saveView();
      if (ui.searchMap) {
        if (Date.now() - lastFit > 700 && !(ui.add && ui.add.searching)) ui.areaMoved = true;
        var hold = document.createElement('div'); hold.innerHTML = viewMap();
        var top = $('app').querySelector('.map-top'); if (top) top.replaceWith(hold.querySelector('.map-top'));
        return;
      }
      if (!ui.here) { var app = $('app'); var holder = document.createElement('div'); holder.innerHTML = viewMap(); var s = app.querySelector('.sheet'); if (s) s.replaceWith(holder.querySelector('.sheet')); } });
  }
  function drawMarkers() {
    if (!markerLayer) return;
    markerLayer.clearLayers();
    if (ui.searchMap) {
      searchItems().forEach(function (o) {
        var p = o.p || o.r;
        var html = o.p ? pinHtml(o.p) : '<div class="pin new result" role="button" tabindex="0" aria-label="' + esc(p.name) + ', not on Vouch yet"><span class="ic ' + catCls(p) + '">' + svg(iconFor(p)) + '</span><span class="pname">' + esc(p.name) + '</span></div>';
        var m = L.marker([p.lat, p.lng], { icon: L.divIcon({ className: 'vpin', html: html, iconSize: null }), keyboard: true, title: p.name });
        m.on('click', function () { if (o.p) go('place', { place: o.p.id }); else go('preview', { preview: o.r }); });
        markerLayer.addLayer(m);
      });
      return;
    }
    visiblePlaces().forEach(function (p) {
      var icon = L.divIcon({ className: 'vpin', html: pinHtml(p), iconSize: null });
      var st = stats(p.id);
      var m = L.marker([p.lat, p.lng], { icon: icon, keyboard: true, title: p.name, zIndexOffset: st.top ? 500 : favsFor(p.id).length ? 400 : 0 });
      m.on('click', function () { go('place', { place: p.id }); });
      markerLayer.addLayer(m);
    });
  }
  var lastFit = 0;
  function fitResults() {
    var its = searchItems(); if (!its.length || !map) return;
    lastFit = Date.now();
    var pts = its.map(function (o) { var p = o.p || o.r; return [p.lat, p.lng]; });
    var bottom = ui.sheetClosed ? 90 : Math.min(window.innerHeight * 0.5, 470) + 20;
    if (pts.length === 1) map.setView(pts[0], 15, { animate: false });
    else map.fitBounds(L.latLngBounds(pts), { paddingTopLeft: [30, 110], paddingBottomRight: [30, bottom], maxZoom: 16, animate: false });
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
    function k(a, b) { return { category: a, subcategory: b || '' }; }
    if (c === 'amenity') {
      if (t === 'cafe') return k('drink', 'coffee');
      if (t === 'pub' || t === 'biergarten') return k('drink', 'pub');
      if (t === 'bar' || t === 'nightclub') return k('drink', 'cocktails');
      if (t === 'fuel') return k('fuel');
      if (t === 'charging_station') return k('ev');
      if (t === 'parking' || t === 'parking_space') return k('parking');
      if (t === 'coworking_space') return k('work');
      if (t === 'restaurant') return k('eat', 'restaurant');
      if (['fast_food', 'food_court', 'ice_cream'].indexOf(t) >= 0) return k('eat', 'bite');
      if (['cinema', 'theatre', 'arts_centre'].indexOf(t) >= 0) return k('explore', 'culture');
      if (t === 'marketplace') return k('shop', 'market');
      if (t === 'pharmacy') return k('shop', 'pharmacy');
    }
    if (c === 'tourism') {
      if (t === 'hotel' || t === 'motel' || t === 'hostel') return k('stay', 'hotel');
      if (t === 'guest_house') return k('stay', 'bnb');
      if (t === 'apartment' || t === 'chalet') return k('stay', 'rental');
      if (t === 'camp_site' || t === 'caravan_site') return k('stay', 'camping');
      if (t === 'museum' || t === 'gallery') return k('explore', 'culture');
      return k('explore', 'sights');
    }
    if (c === 'shop') {
      var SM = { supermarket: 'supermarket', convenience: 'convenience', bakery: 'bakery', pastry: 'bakery', butcher: 'butcher', greengrocer: 'greengrocer', farm: 'deli', deli: 'deli', cheese: 'deli',
        seafood: 'fishmonger', fishmonger: 'fishmonger', wine: 'wine', alcohol: 'wine', beverages: 'wine', chemist: 'pharmacy', books: 'books', clothes: 'fashion', shoes: 'fashion', boutique: 'fashion',
        gift: 'gifts', craft: 'gifts', art: 'gifts', outdoor: 'outdoor', sports: 'outdoor', bicycle: 'outdoor', hardware: 'hardware', doityourself: 'hardware', electronics: 'electronics', mobile_phone: 'electronics', computer: 'electronics' };
      if (t === 'coffee') return k('drink', 'coffee');
      return k('shop', SM[t] || 'local');
    }
    if (c === 'office' && t === 'coworking') return k('work');
    if (c === 'leisure') return ['park', 'nature_reserve', 'garden', 'beach_resort'].indexOf(t) >= 0 ? k('explore', 'outdoors') : k('explore', 'activities');
    if (c === 'natural') return k('explore', 'outdoors');
    if (c === 'historic') return k('explore', 'sights');
    return k('eat', 'restaurant');
  }
  function osmExtra(r) {
    var x = r.extratags || {}, m = osmCategory(r), out = [];
    if (m.category === 'drink' && (x.food === 'yes' || x.cuisine)) out.push('eat:restaurant');
    if (m.category === 'shop' && (x.fuel === 'yes' || x['amenity:fuel'] === 'yes')) out.push('fuel:');
    if (x['amenity:charging_station'] === 'yes' || x['charging_station'] === 'yes') out.push('ev:');
    return out.filter(function (k) { return k.split(':')[0] !== m.category; }).slice(0, 2);
  }
  async function searchPlaces(q, box) {
    var c = centre();
    var a = ui.add; a.searching = true; a.done = false; a.q = q;
    function inBox(p) { return !box || (p.lat <= box.n && p.lat >= box.s && p.lng >= box.w && p.lng <= box.e); }
    var words = q.toLowerCase().split(/\s+/).filter(function (w) { return w.length > 1; });
    a.existing = S.places.filter(function (p) { var hay = (p.name + ' ' + p.address).toLowerCase(); var hits = words.filter(function (w) { return hay.indexOf(w) >= 0; }).length; return hits > 0 && (hits === words.length || p.name.toLowerCase().indexOf(words[0]) >= 0) && inBox(p); }).slice(0, 8);
    render();
    try {
      var url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&extratags=1&limit=10&accept-language=en-GB&q=' + encodeURIComponent(q) +
        (box ? '&bounded=1&viewbox=' + box.w + ',' + box.n + ',' + box.e + ',' + box.s : '&viewbox=' + (c.lng - 0.5) + ',' + (c.lat + 0.35) + ',' + (c.lng + 0.5) + ',' + (c.lat - 0.35));
      var res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error('search service returned ' + res.status);
      var data = await res.json();
      a.results = data.map(function (r) {
        var ad = r.address || {};
        var area = [ad.road, ad.suburb || ad.neighbourhood, ad.town || ad.city || ad.village].filter(Boolean).join(', ');
        return {
          name: r.name || (r.display_name || '').split(',')[0], address: area || r.display_name, lat: Number(r.lat), lng: Number(r.lon),
          category: osmCategory(r).category, subcategory: osmCategory(r).subcategory, osm_id: r.osm_type + ':' + r.osm_id, independent: !(r.extratags && (r.extratags.brand || r.extratags['brand:wikidata'])), links: extractLinks(r.extratags), extra: osmExtra(r)
        };
      }).filter(function (r) { return r.name; });
    } catch (e) { a.results = []; fail(e, 'Search failed'); }
    a.searching = false; a.done = true;
    if (box) a.results = a.results.filter(inBox);
    render();
    if (box && !searchItems().length) toast('Nothing called "' + q + '" in this area. Move the map and try again.');
  }

  // ---------- Actions ----------
  // The page itself never scrolls (that keeps the tab bar pinned on iPhone); the #app area does.
  function toTop() { var el = $('app'); if (el) el.scrollTop = 0; window.scrollTo(0, 0); }
  function go(view, extra) {
    if (notePending) flushNote();
    if (extra) for (var k in extra) ui[k] = extra[k];
    if (view !== 'person') ui.confirm = null;
    if (view !== 'place') { ui.tipOpen = false; ui.linkOpen = false; ui.bestPick = false; }
    ui.prev = ui.view === view ? ui.prev : ui.view;
    if (view === 'place' && ['rate', 'editplace', 'place', 'person'].indexOf(ui.view) < 0) ui.placeFrom = ui.view;
    ui.view = view; render(); toTop();
  }
  function startRate(pid) {
    var mine = S.reviews.filter(function (r) { return r.place_id === pid && r.user_id === myId(); })[0];
    ui.rate = mine ? { place_id: pid, quality: mine.quality, experience: mine.experience || Math.round(overall(mine)), value: mine.value, location: mine.location, trip: mine.trip, body: mine.body, visibility: mine.visibility, visited_on: mine.visited_on, link: mine.link || '', existing: mine.id }
      : { place_id: pid, quality: 7, experience: 7, value: 7, location: 7, trip: 'Leisure', body: '', visibility: 'circle', visited_on: todayISO(), link: '', existing: null };
    go('rate');
  }
  function syncEmail() { var e = $('emailIn'); if (e) ui.email = e.value.trim(); }
  function syncRate() { var t = $('revText'); if (t && ui.rate) ui.rate.body = t.value; var d = $('visitIn'); if (d && ui.rate && d.value) ui.rate.visited_on = d.value; var l = $('revLink'); if (l && ui.rate) ui.rate.link = l.value.trim(); }

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
    syncRate(); var r = ui.rate;
    var lk = null;
    if (!S.needsLinks && r.link) { lk = normLink('Other', r.link); if (!lk) return toast('The post link should look like https://…'); }
    ui.busy = true; render();
    try {
      var row = { place_id: r.place_id, user_id: myId(), quality: r.quality, value: r.value, location: r.location, trip: r.trip, body: r.body.trim(), visibility: r.visibility, visited_on: r.visited_on || todayISO() };
      if (!S.needsLinks) row.link = lk ? lk.url : '';
      if (!S.needsV6) row.experience = r.experience;
      var q = await sb.from('reviews').upsert(row, { onConflict: 'place_id,user_id' });
      if (q.error) throw q.error;
      // Anything you rate goes on your map.
      if (!S.needsUpdate && S.saves.indexOf(r.place_id) < 0) {
        var sv = await sb.from('saves').insert({ user_id: myId(), place_id: r.place_id });
        if (sv.error && !/duplicate|unique/i.test(sv.error.message)) console.warn(sv.error);
      }
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
      await loadAll(); ui.busy = false; toast(r.existing ? 'Review updated' : 'Review posted and added to your map'); go('place', { place: r.place_id });
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
  async function shareInvite(kind) {
    var code = S.me.invite_code;
    var link = location.origin + location.pathname + '?invite=' + encodeURIComponent(code);
    var text = kind === 'code'
      ? 'Add me as a friend on Vouch. My friend code is ' + code + '. Open Vouch, go to Friends, and enter it.'
      : 'Join me on Vouch, where friends rate places for each other. Sign up with this link and we\'ll be friends straight away: ' + link;
    if (navigator.share) { try { await navigator.share({ title: kind === 'code' ? 'My Vouch friend code' : 'Join me on Vouch', text: text }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
    try { await navigator.clipboard.writeText(text); toast('Copied. Paste it into a message.'); } catch (e) { toast(kind === 'code' ? 'Your code is ' + code : 'Copy this link: ' + link); }
  }
  async function processInvite() {
    var code = store('invite'); if (!code || !S.me) return;
    store('invite', '');
    if (String(code).toUpperCase() === S.me.invite_code) return;
    var r = await sb.rpc('accept_invite', { code: code });
    if (r.error) return fail(r.error, 'Could not use the invite');
    await loadAll(); render();
    toast('You\'re now friends with ' + nameOf(r.data));
  }
  async function follow(id, back) {
    var q = await sb.from('friends').insert({ user_id: myId(), friend_id: id });
    if (q.error && !/duplicate/i.test(q.error.message)) return fail(q.error, 'Could not follow');
    await loadAll(); render();
    toast(S.friends.indexOf(id) >= 0 ? (back ? 'Approved. ' : '') + 'You\'re now friends with ' + nameOf(id) : back ? 'Done' : 'Following ' + nameOf(id) + '. Their public picks are in the Kindred spirits filter.');
  }
  // Drag the list at the bottom of the map up and down.
  var drag = null;
  function setSheet(closed) {
    ui.sheetClosed = closed; store('sheetClosed', closed);
    var sh = $('sheet'), g = $('grab'); if (!sh) return;
    sh.classList.toggle('closed', closed);
    if (g) { g.setAttribute('aria-expanded', String(!closed)); g.setAttribute('aria-label', closed ? 'Show the list' : 'Hide the list'); var hint = g.querySelector('.small'); if (hint) hint.textContent = hint.textContent.replace(/drag (up|down to hide)/, closed ? 'drag up' : 'drag down to hide'); }
  }
  document.addEventListener('pointerdown', function (e) {
    var g = e.target.closest('#grab'); if (!g || e.target.closest('button')) return;
    var sh = $('sheet'); if (!sh) return;
    var max = sh.offsetHeight - 64;
    drag = { y: e.clientY, start: ui.sheetClosed ? max : 0, max: max, off: ui.sheetClosed ? max : 0, moved: false, sh: sh };
    sh.style.transition = 'none';
    try { g.setPointerCapture(e.pointerId); } catch (x) {}
  });
  document.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var dy = e.clientY - drag.y; if (Math.abs(dy) > 6) drag.moved = true;
    drag.off = Math.max(0, Math.min(drag.max, drag.start + dy));
    drag.sh.style.transform = 'translateY(' + drag.off + 'px)';
  });
  function endDrag() {
    if (!drag) return;
    var d = drag; drag = null;
    d.sh.style.transition = ''; d.sh.style.transform = '';
    setSheet(d.moved ? d.off > d.max / 2 : !ui.sheetClosed);
  }
  document.addEventListener('pointerup', endDrag);
  document.addEventListener('pointercancel', endDrag);

  // ---------- Events ----------
  document.addEventListener('click', async function (e) {
    if (e.target.closest('#viewer')) { $('viewer').hidden = true; $('viewer').innerHTML = ''; return; }
    var el = e.target.closest('button, a, [data-place]');
    if (!el || el.tagName === 'A') return;
    var d = el.dataset;
    if (d.mode) { syncEmail(); ui.mode = d.mode; ui.failed = false; render(); return; }
    if (d.auth) { ui.mode = d.auth; ui.failed = false; ui.view = 'signin'; render(); toTop(); return; }
    if (d.pw) { var inp = $(d.pw); if (inp) { var show = inp.type === 'password'; inp.type = show ? 'text' : 'password'; el.textContent = show ? 'Hide' : 'Show'; el.setAttribute('aria-pressed', String(show)); el.setAttribute('aria-label', show ? 'Hide password' : 'Show password'); } return; }
    if (d.place) { go('place', { place: d.place }); return; }
    if (d.placeRate) { startRate(d.placeRate); return; }
    if (d.person) { go('person', { person: d.person }); return; }
    if (d.cat) { ui.cats[d.cat] = !ui.cats[d.cat]; render(); return; }
    if (d.sub) { ui.subs[d.sub] = ui.subs[d.sub] === false; render(); return; }
    if (d.deg) { ui.deg = Number(d.deg); ui.group = ''; render(); return; }
    if (d.goto) {
      if (!S.session || !S.me) { toast('Log in or create an account to try this'); return; }
      var gt = d.goto.split(':'), hint = d.hint; ui.aboutFirst = false; ui.groupEdit = null; ui.searchMap = false;
      if (gt[0] === 'search' || gt[0] === 'add') { ui.add = { q: '', results: [], form: null, mode: gt[0] === 'search' ? 'browse' : 'rate' }; go('add'); var si2 = $('searchIn'); if (si2) si2.focus(); }
      else { if (gt[1] === 'filters') ui.drawer = true; if (gt[0] === 'mine') ui.mineFrom = 'me'; go(gt[0]); if (gt[1] && gt[1] !== 'filters') { var sec = $('sec-' + gt[1]) || $('sec-friends'); if (sec) sec.scrollIntoView({ block: 'start' }); } }
      if (hint) toast(hint);
      return;
    }
    if (d.mcat) { ui.mf.cats[d.mcat] = !ui.mf.cats[d.mcat]; render(); return; }
    if (d.msub) { ui.mf.subs[d.msub] = ui.mf.subs[d.msub] === false; render(); return; }
    if (d.mact) {
      var m = d.mact, f = ui.mf;
      if (m === 'open') f.open = !f.open;
      else if (m === 'clear') { resetMineFilters(false); ui.mf.open = f.open; }
      else if (m === 'work' || m === 'leisure') { f[m] = !f[m]; if (!f.work && !f.leisure) f[m === 'work' ? 'leisure' : 'work'] = true; }
      else f[m] = !f[m];
      render(); return;
    }
    if (d.bestkey) {
      var bk = d.bestkey, bp = place(ui.place);
      var cur = S.best.filter(function (b) { return b.user_id === myId() && b.category === bk; })[0];
      var was = cur && cur.place_id === bp.id;
      var bq = was ? await sb.from('best').delete().eq('user_id', myId()).eq('category', bk)
        : await sb.from('best').upsert({ user_id: myId(), category: bk, place_id: bp.id, quote: '' }, { onConflict: 'user_id,category' });
      if (bq.error) return fail(bq.error);
      await refresh();
      toast(was ? 'Removed from your best ' + bestLabel(bk) + ' ever' : 'Your best ' + bestLabel(bk) + ' ever' + (cur ? ', replacing ' + ((place(cur.place_id) || {}).name || 'your old one') : ''));
      return;
    }
    if (d.inbox) { ui.inboxTab = d.inbox; render(); return; }
    if (d.sugg) {
      var sp2 = d.sugg.split(':'), sidv = sp2[0], st2 = sp2[1], rin = $('reply-' + sidv);
      var up = await sb.from('suggestions').update({ status: st2, reply: rin ? rin.value.trim() : '', updated_at: new Date().toISOString() }).eq('id', sidv);
      if (up.error) return fail(up.error, 'Could not update');
      await loadSuggestions(); render();
      toast(st2 === 'approved' ? 'Approved' : st2 === 'declined' ? 'Declined' : st2 === 'done' ? 'Marked done' : 'Moved back to New');
      return;
    }
    if (d.dellink) { var dl = await sb.from('place_links').delete().eq('id', d.dellink); if (dl.error) return fail(dl.error); await refresh(); toast('Link removed'); return; }
    if (d.tab) { ui.searchMap = false; if (d.tab === 'add') { ui.add = { q: '', results: [], form: null, mode: 'rate' }; } ui.groupEdit = null; go(d.tab); if (d.tab === 'map' || d.tab === 'friends') refreshQuietly(); return; }
    if (d.score) { syncRate(); var s = d.score.split(':'); ui.rate[s[0]] = Number(s[1]); render(); return; }
    if (d.trip) { syncRate(); ui.rate.trip = d.trip; render(); return; }
    if (d.vis) { syncRate(); ui.rate.vis = d.vis; ui.rate.visibility = d.vis; render(); return; }
    if (d.pref) { var pr = d.pref.split(':'); var val = /degree/.test(pr[0]) ? Number(pr[1]) : pr[1]; var patch = {}; patch[pr[0]] = val; if (await updateProfile(patch, true)) { if (pr[0] === 'see_degree') ui.deg = val; await refresh(); toast('Saved'); } return; }
    if (d.themepick) { if (d.themepick === 'custom') { await saveCustom(customColours()); } else await updateProfile({ theme: d.themepick }, true); render(); return; }
    if (d.photo) { var v = $('viewer'); v.innerHTML = '<img src="' + esc(photoUrl(d.photo)) + '" alt="Photo"><button class="round" aria-label="Close photo">' + svg(P.close) + '</button>'; v.hidden = false; return; }
    if (d.pick != null) { var r = ui.add.results[Number(d.pick)]; var ex = S.places.filter(function (p) { return p.osm_id === r.osm_id; })[0]; if (ui.add.mode === 'browse') { if (ex) go('place', { place: ex.id }); else go('preview', { preview: r }); return; } if (ex) { startRate(ex.id); return; } ui.add.form = r; render(); return; }
    if (d.groupEdit) { ui.groupEdit = d.groupEdit; render(); toTop(); return; }
    if (d.delgroup) { var dg = await sb.from('groups').delete().eq('id', d.delgroup); if (dg.error) return fail(dg.error); if (ui.group === d.delgroup) ui.group = ''; ui.groupEdit = null; await refresh(); return; }
    if (d.deltip) { var dt = await sb.from('tips').delete().eq('id', d.deltip); if (dt.error) return fail(dt.error); await refresh(); return; }
    if (d.follow) { await follow(d.follow); return; }
    if (d.friendback) { await follow(d.friendback, true); return; }
    if (d.unfollow) { var uf = await sb.from('friends').delete().eq('user_id', myId()).eq('friend_id', d.unfollow); if (uf.error) return fail(uf.error); await refresh(); toast('Unfollowed'); return; }
    if (d.decline) {
      var dc = await sb.rpc('remove_friend', { other: d.decline }); if (dc.error) return fail(dc.error);
      var who = nameOf(d.decline); await refresh(); toast('Declined ' + who + '\'s request'); return;
    }
    if (d.dismiss) { var ds = store('dismissed') || []; ds.push(d.dismiss); store('dismissed', ds); renderPrompt(); return; }
    var a = d.act; if (!a) return;
    if (a === 'drawer') { ui.drawer = !ui.drawer; render(); var dt = document.querySelector(ui.drawer ? '#drawer .dcat-main' : '.drawer-tab'); if (dt) dt.focus(); return; }
    if (a === 'showall') { CATS.forEach(function (c) { ui.cats[c[0]] = true; }); ui.subs = {}; ui.indie = false; ui.work = true; ui.leisure = true; ui.group = ''; render(); return; }
    if (a === 'about') { ui.aboutFrom = ui.view; ui.aboutFirst = false; go('about'); return; }
    if (a === 'aboutback') {
      var from = ui.aboutFrom;
      if (!S.session || !S.me) go(from === 'signin' ? 'signin' : 'splash');
      else go(['map', 'place', 'friends', 'person', 'me', 'add', 'preview'].indexOf(from) >= 0 ? from : 'map');
      return;
    }
    if (a === 'suggest') { go('suggest'); return; }
    if (a === 'customreset') { ui.customDraft = null; await saveCustom(Object.assign({}, CUSTOM_DEFAULT)); render(); toast('Back to Navy & Gold colours'); return; }
    if (a === 'inbox') { ui.inboxTab = 'new'; ui.copyText = ''; go('inbox'); return; }
    if (a === 'copyapproved') {
      var ap = S.inbox.filter(function (s) { return s.status === 'approved'; }).slice().reverse();
      var txt = 'Approved Vouch suggestions from beta testers. Please build these:\n\n' + ap.map(function (s, i) { return (i + 1) + '. [' + s.area + '] ' + s.body.replace(/\s+/g, ' ').trim() + ' (from ' + s.name + ', ' + fmtDate(s.created_at) + ')'; }).join('\n');
      ui.copyText = txt;
      try { await navigator.clipboard.writeText(txt); ui.copyText = ''; render(); toast('Copied ' + ap.length + ' suggestion' + (ap.length === 1 ? '' : 's') + '. Paste them into your chat with Claude.'); }
      catch (e) { render(); var ct = $('copyBox'); if (ct) { ct.focus(); ct.select(); } }
      return;
    }
    if (a === 'mine') { ui.mineFrom = ui.view === 'map' ? 'map' : 'me'; ui.drawer = false; go('mine'); return; }
    if (a === 'searchmap') { ui.searchMap = true; ui.areaMoved = false; go('map'); return; }
    if (a === 'searcharea') { if (!map || !ui.add) return; var bx = map.getBounds(); ui.areaMoved = false; searchPlaces(ui.add.q, { w: bx.getWest(), n: bx.getNorth(), e: bx.getEast(), s: bx.getSouth() }); return; }
    if (a === 'searchlist') { ui.searchMap = false; go('add'); return; }
    if (a === 'searchclear') { ui.searchMap = false; render(); return; }
    if (a === 'addlink') { ui.linkOpen = true; render(); var lu = $('linkUrl'); if (lu) lu.focus(); return; }
    if (a === 'cancellink') { ui.linkOpen = false; render(); return; }
    if (a === 'splash') { ui.view = 'splash'; ui.linkError = false; render(); }
    else if (a === 'newlink') { ui.keepAuth = true; ui.recovery = false; ui.passError = ''; ui.mode = 'reset'; ui.view = 'signin'; try { await sb.auth.signOut(); } catch (e3) {} render(); }
    else if (a === 'work' || a === 'leisure') { ui[a] = !ui[a]; if (!ui.work && !ui.leisure) ui[a === 'work' ? 'leisure' : 'work'] = true; render(); }
    else if (a === 'indie') { ui.indie = !ui.indie; render(); }
    else if (a === 'near') { locate(function () { if (map) { showMe(); map.setView([ui.here.lat, ui.here.lng], Math.max(map.getZoom(), 14)); } render(); }); }
    else if (a === 'search') { ui.searchMap = false; ui.add = { q: '', results: [], form: null, mode: 'browse' }; go('add'); var si = $('searchIn'); if (si) si.focus(); }
    else if (a === 'ratepreview') { ui.add.mode = 'rate'; ui.add.form = ui.preview; go('add'); }
    else if (a === 'back') { var to = ui.view === 'editplace' ? 'place' : ui.view === 'preview' ? (ui.prev === 'map' && ui.searchMap ? 'map' : 'add') : ui.view === 'rate' ? 'place' : ui.view === 'person' && ui.prev === 'place' ? 'place' : ui.view === 'person' && ui.prev === 'friends' ? 'friends' : ui.view === 'mine' ? (ui.mineFrom === 'map' ? 'map' : 'me') : ui.view === 'suggest' || ui.view === 'inbox' ? 'me' : ui.view === 'place' && (ui.placeFrom === 'mine' || ui.placeFrom === 'me') ? ui.placeFrom : 'map'; if (to === 'place' && !place(ui.place)) to = 'map'; go(to); }
    else if (a === 'rate') { startRate(ui.place); }
    else if (a === 'share') { sharePlace(place(ui.place)); }
    else if (a === 'invite' || a === 'invite-new') { shareInvite('link'); }
    else if (a === 'invite-code') { shareInvite('code'); }
    else if (a === 'save') {
      var sp = ui.place, isSaved = S.saves.indexOf(sp) >= 0;
      var sq = isSaved ? await sb.from('saves').delete().eq('user_id', myId()).eq('place_id', sp) : await sb.from('saves').insert({ user_id: myId(), place_id: sp });
      if (sq.error) return fail(sq.error, S.needsUpdate ? 'Run the database update first' : 'Could not save');
      if (isSaved) S.saves = S.saves.filter(function (x) { return x !== sp; }); else S.saves.push(sp);
      render(); toast(isSaved ? 'Removed from your map' : 'Added to your map. Rate it when you\'ve been.');
    }
    else if (a === 'editplace') { if (ui.view === 'rate' && ui.rate) ui.place = ui.rate.place_id; ui.confirm = null; go('editplace'); }
    else if (a === 'delplace') { ui.confirm = 'delplace'; render(); }
    else if (a === 'delplace-yes') {
      var dp = await sb.rpc('delete_place_if_unused', { pid: ui.place });
      if (dp.error) return fail(dp.error);
      ui.confirm = null; await loadAll();
      if (dp.data) { toast('Place removed'); go('map'); } else { toast('Others have rated it, so it stays on Vouch'); render(); }
    }
    else if (a === 'delreview-yes') {
      var rid = ui.view === 'rate' && ui.rate ? ui.rate.existing : (S.reviews.filter(function (r) { return r.place_id === ui.place && r.user_id === myId(); })[0] || {}).id;
      var pid = ui.view === 'rate' && ui.rate ? ui.rate.place_id : ui.place;
      var dr = await sb.from('reviews').delete().eq('id', rid); if (dr.error) return fail(dr.error);
      var removed = false, pl = place(pid);
      if (pl && pl.created_by === myId()) { var gone = await sb.rpc('delete_place_if_unused', { pid: pid }); removed = !gone.error && gone.data === true; }
      ui.confirm = null; await loadAll();
      if (removed) { toast('Rating and place removed'); go('map'); } else { toast('Rating deleted'); go('place', { place: pid }); }
    }
    else if (a === 'addtip') { ui.tipOpen = true; render(); var tb = $('tipBody'); if (tb) tb.focus(); }
    else if (a === 'canceltip') { ui.tipOpen = false; render(); }
    else if (a === 'bestpick') { ui.bestPick = !ui.bestPick; render(); }
    else if (a === 'delreview') { ui.confirm = 'delreview'; render(); }
    else if (a === 'droppin') { var c = map ? map.getCenter() : centre(); var cc = store('view'); var lat = cc ? cc[0] : c.lat, lng = cc ? cc[1] : c.lng; ui.add.form = { name: ui.add.q || '', address: '', lat: lat, lng: lng, category: 'eat', subcategory: 'restaurant', osm_id: null, independent: true }; render(); }
    else if (a === 'unpick') { ui.add.form = null; render(); }
    else if (a === 'groupdone') { ui.groupEdit = null; await refresh(); }
    else if (a === 'silence') {
      var sid = ui.person, on = isSilenced(sid);
      var sq2 = on ? await sb.from('silenced').delete().eq('user_id', myId()).eq('target', sid) : await sb.from('silenced').insert({ user_id: myId(), target: sid });
      if (sq2.error) return fail(sq2.error);
      if (on) S.silenced = S.silenced.filter(function (x) { return x !== sid; }); else S.silenced.push(sid);
      render(); toast(on ? nameOf(sid) + ' is no longer silenced' : nameOf(sid) + ' is silenced. Their reviews are hidden from your map.');
    }
    else if (a === 'unfriend') { ui.confirm = 'unfriend'; render(); }
    else if (a === 'confirm-no') { ui.confirm = null; render(); }
    else if (a === 'unfriend-yes') { var rf = await sb.rpc('remove_friend', { other: ui.person }); if (rf.error) return fail(rf.error); await refresh(); toast('Friend removed'); go('friends'); }
    else if (a === 'signout') { await sb.auth.signOut(); }
  });

  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('pin')) { e.preventDefault(); e.target.click(); }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.id === 'grab') { e.preventDefault(); setSheet(!ui.sheetClosed); }
    if (e.key === 'Escape' && ui.drawer && ui.view === 'map') { ui.drawer = false; render(); }
  });

  document.addEventListener('change', async function (e) {
    var t = e.target;
    if (t.id === 'tipKind') { var w = $('tipUrlWrap'); if (w) w.hidden = !(t.value === 'Loyalty' || t.value === 'Where to look'); var tb = $('tipBody'); if (tb) tb.placeholder = TIP_PH[t.value] || ''; return; }
    if (t.dataset && t.dataset.ccol) { var cd2 = customColours(); cd2[t.dataset.ccol] = t.value; ui.customDraft = null; await saveCustom(cd2); render(); return; }
    if (t.id === 'groupSel') { ui.group = t.value; render(); }
    else if (t.id === 'mineSort') { ui.mf.sort = t.value; var ml = $('mineList'); if (ml) ml.innerHTML = mineListHtml(); }
    else if (t.id === 'photoIn') { ui.files = Array.prototype.slice.call(t.files || [], 0, 6); if (ui.files.length) toast(ui.files.length + (ui.files.length === 1 ? ' photo' : ' photos') + ' ready to upload'); }
    else if (t.id === 'visitIn') { syncRate(); }
    else if (t.id === 'quoteIn') {
      var p = place(ui.place);
      var qk = t.dataset.key || bestKey(p);
      var q = await sb.from('best').update({ quote: t.value.trim() }).eq('user_id', myId()).eq('category', qk);
      if (q.error) fail(q.error); else { S.best.forEach(function (b) { if (b.user_id === myId() && b.category === qk) b.quote = t.value.trim(); }); toast('Saved'); }
    }
    else if (t.classList.contains('gmember')) {
      var g = t.dataset.group, m = t.dataset.member;
      var q2 = t.checked ? await sb.from('group_members').insert({ group_id: g, member: m }) : await sb.from('group_members').delete().eq('group_id', g).eq('member', m);
      if (q2.error) { fail(q2.error); t.checked = !t.checked; return; }
      if (t.checked) S.members.push({ group_id: g, member: m }); else S.members = S.members.filter(function (x) { return !(x.group_id === g && x.member === m); });
    }
  });
  document.addEventListener('input', function (e) {
    if (e.target.dataset && e.target.dataset.ccol) {
      var cd = customColours(); cd[e.target.dataset.ccol] = e.target.value; ui.customDraft = cd;
      if (S.me) S.me.theme = 'custom'; applyTheme();
      var sq = e.target.closest('.cpsq'); if (sq) sq.style.background = e.target.value;
      return;
    }
    if (e.target.id === 'noteIn') saveNoteSoon(ui.place, e.target.value);
    if (e.target.id === 'mineQ') { ui.mf.q = e.target.value; var ml = $('mineList'); if (ml) ml.innerHTML = mineListHtml(); }
  });

  document.addEventListener('submit', async function (e) {
    e.preventDefault();
    var id = e.target.id;
    if (id === 'authForm') {
      ui.email = $('emailIn').value.trim(); var pw = $('passIn').value;
      if (!ui.email || !pw) return;
      if (ui.mode === 'signup') { var sprob = pwProblem(pw); if (sprob) return toast(sprob); }
      store('email', ui.email); ui.busy = true; render();
      var r = ui.mode === 'signup'
        ? await sb.auth.signUp({ email: ui.email, password: pw, options: { emailRedirectTo: location.origin + location.pathname } })
        : await sb.auth.signInWithPassword({ email: ui.email, password: pw });
      ui.busy = false;
      if (r.error) {
        if (ui.mode !== 'signup' && /invalid login|credentials/i.test(r.error.message)) { ui.failed = true; render(); var pi = $('passIn'); if (pi) pi.focus(); return; }
        render(); return fail(r.error, ui.mode === 'signup' ? 'Could not create the account' : 'Could not log in');
      }
      ui.failed = false;
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
      var n1 = $('newPass').value, n2 = $('newPass2').value;
      if (n1 !== n2) { ui.passError = 'The two passwords don\'t match. Type the same password in both boxes.'; render(); return; }
      var prob = pwProblem(n1);
      if (prob) { ui.passError = prob; render(); return; }
      ui.passError = ''; ui.busy = true; render();
      var np = await sb.auth.updateUser({ password: n1 });
      ui.busy = false;
      if (np.error) { ui.passError = pwErrorText(np.error); render(); return; }
      ui.recovery = false; ui.passError = ''; ui.linkError = false;
      try { history.replaceState(null, '', location.pathname); } catch (e2) {}
      var sess = (await sb.auth.getSession()).data.session;
      if (sess) toast('Password saved. You\'re logged in.');
      else { ui.mode = 'signin'; ui.keepAuth = true; toast('Password saved. Log in with your new password.'); }
      onSession(sess);
    }
    else if (id === 'onboardForm') {
      var first = $('obFirst').value.trim(), last = $('obLast').value.trim(), nick = $('obNick').value.trim();
      var name = (first + ' ' + last).trim(); if (!first) return;
      var shr = Number((document.querySelector('input[name="obShare"]:checked') || {}).value || 2);
      if (await updateProfile({ name: name, first_name: first, last_name: last, nickname: nick, share_degree: shr }, true)) { ui.aboutFirst = true; go('about'); processInvite(); }
    }
    else if (id === 'changePassForm') {
      var p1 = $('chPass').value, p2 = $('chPass2').value;
      if (p1 !== p2) return toast('The two passwords don\'t match');
      var cprob = pwProblem(p1); if (cprob) return toast(cprob);
      var cp = await sb.auth.updateUser({ password: p1 });
      if (cp.error) { var ct = pwErrorText(cp.error); return toast(ct === 'expired' ? 'Please log out and back in, then try again.' : ct); }
      $('chPass').value = ''; $('chPass2').value = ''; toast('Password changed');
    }
    else if (id === 'profileForm') {
      var mf = $('meFirst').value.trim(), ml = $('meLast').value.trim();
      await updateProfile({ name: (mf + ' ' + ml).trim(), first_name: mf, last_name: ml, nickname: $('meNick').value.trim(), home: $('meHome').value.trim(), bio: $('meBio').value.trim() });
      render();
    }
    else if (id === 'editPlaceForm') {
      var ec = readCat('epCat');
      var epRow = { name: $('epName').value.trim(), category: ec.category, subcategory: ec.subcategory, address: $('epAddr').value.trim(), independent: $('epIndie').checked };
      if (!S.needsCats) epRow.extra = readExtra('epCat', ec);
      var ep = await sb.from('places').update(epRow).eq('id', ui.place);
      if (ep.error) return fail(ep.error, 'Could not save');
      await loadAll(); toast('Place updated'); go('place', { place: ui.place });
    }
    else if (id === 'searchForm') { var q = $('searchIn').value.trim(); if (q.length > 1) searchPlaces(q); }
    else if (id === 'placeForm') {
      var f = ui.add.form; ui.busy = true;
      var pc = readCat('pCat');
      var row = { name: $('pName').value.trim(), category: pc.category, subcategory: pc.subcategory, address: $('pAddr').value.trim(), independent: $('pIndie').checked, lat: f.lat, lng: f.lng, osm_id: f.osm_id || null, created_by: myId() };
      if (!S.needsCats) row.extra = readExtra('pCat', pc);
      var ins = await sb.from('places').insert(row).select().single();
      ui.busy = false;
      if (ins.error) {
        if (f.osm_id && /duplicate|unique/i.test(ins.error.message)) { await loadAll(); var ex = S.places.filter(function (p) { return p.osm_id === f.osm_id; })[0]; if (ex) return startRate(ex.id); }
        return fail(ins.error, 'Could not add the place');
      }
      S.places.push(ins.data); ui.place = ins.data.id;
      if (!S.needsLinks && f.links && f.links.length) {
        for (var li = 0; li < f.links.length; li++) {
          var lq = await sb.from('place_links').insert({ place_id: ins.data.id, user_id: myId(), kind: f.links[li].kind, url: f.links[li].url }).select().single();
          if (!lq.error && lq.data) S.links.push(lq.data);
        }
      }
      startRate(ins.data.id);
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
    else if (id === 'suggForm') {
      var sb2 = $('suggBody').value.trim(), sarea = $('suggArea').value; if (!sb2) return;
      ui.busy = true; render();
      var sq3 = await sb.from('suggestions').insert({ user_id: myId(), area: sarea, body: sb2, status: 'new', reply: '' });
      ui.busy = false;
      if (sq3.error) { render(); return fail(sq3.error, 'Could not send'); }
      await loadSuggestions(); render(); toast('Thanks! Your suggestion has been sent.');
    }
    else if (id === 'linkForm') {
      var nl = normLink($('linkKind').value, $('linkUrl').value);
      if (!nl) return toast('That doesn\'t look like a link. Try https://… or @name');
      if (S.links.some(function (x) { return x.place_id === ui.place && x.url === nl.url; })) return toast('That link is already there');
      var lq2 = await sb.from('place_links').insert({ place_id: ui.place, user_id: myId(), kind: nl.kind, url: nl.url });
      if (lq2.error) return fail(lq2.error, /duplicate|unique/i.test(lq2.error.message) ? 'Already added' : 'Could not add the link');
      ui.linkOpen = false; await refresh(); toast('Link added');
    }
    else if (id === 'friendForm') {
      var fr = await sb.rpc('add_friend', { code: $('friendCode').value });
      if (fr.error) return fail(fr.error, 'Could not add');
      await loadAll(); render();
      toast(S.friends.indexOf(fr.data) >= 0 ? 'You\'re now friends with ' + nameOf(fr.data) : 'Request sent. You\'ll be friends when ' + ((S.people[fr.data] || {}).name || 'they') + ' ' + ((S.people[fr.data] || {}).name ? 'adds' : 'add') + ' you back.');
    }
    else if (id === 'groupForm') {
      var gq = await sb.from('groups').insert({ owner: myId(), name: $('groupName').value.trim() }).select().single();
      if (gq.error) return fail(gq.error);
      S.groups.push(gq.data); ui.groupEdit = gq.data.id; render(); toTop();
    }
  });

  if (window.matchMedia) { var mq = window.matchMedia('(prefers-color-scheme: dark)'); if (mq.addEventListener) mq.addEventListener('change', applyTheme); }

  // ---------- Start ----------
  async function onSession(session) {
    S.session = session;
    if (ui.recovery) { ui.view = 'signin'; render(); return; }
    if (!session) { ui.view = (ui.linkError || ui.keepAuth) ? 'signin' : 'splash'; ui.keepAuth = false; ui.failed = false; ui.email = store('email') || ''; render(); return; }
    try {
      await loadAll();
      ui.view = S.me.name ? 'map' : 'onboard';
      render();
      if (S.me.name) processInvite();
    } catch (e) { ui.view = 'signin'; render(); fail(e, 'Could not load your data'); }
  }
  function start() {
    applyTheme();
    if (!CONFIGURED || !window.supabase || !window.L) { ui.view = 'setup'; render(); return; }
    var hp = new URLSearchParams((location.hash || '').replace(/^#/, '')), qp = new URLSearchParams(location.search || '');
    ui.sheetClosed = !!store('sheetClosed');
    if (qp.get('invite')) { store('invite', qp.get('invite')); try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) {} }
    if (hp.get('type') === 'recovery' || qp.get('type') === 'recovery') ui.recovery = true;
    if (hp.get('error_code') || hp.get('error') || qp.get('error_code')) {
      ui.recovery = false; ui.linkError = true; ui.mode = 'reset'; ui.view = 'signin';
      try { history.replaceState(null, '', location.pathname); } catch (e) {}
    }
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
