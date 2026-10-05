/* Cenários: 6 filmes x 5 fases. Cada fase referencia um trecho do filme do personagem.
   As camadas são pré-desenhadas (parallax) e montadas só quando o personagem é usado. */
(function () {
  'use strict';
  const G = window.G;
  const W = 336, H = 144, GY = 120, TW = 672;

  // ------------------------------------------------------------------
  // utilitários
  // ------------------------------------------------------------------
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function mk(w, h) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    return [c, x];
  }
  function R(x, c, a, b, w, h) { x.fillStyle = c; x.fillRect(Math.round(a), Math.round(b), Math.round(w), Math.round(h)); }
  function disc(x, c, cx, cy, r) {
    x.fillStyle = c; cx = Math.round(cx); cy = Math.round(cy);
    for (let dy = -r; dy <= r; dy++) {
      const w = Math.floor(Math.sqrt(r * r - dy * dy) + 0.5);
      x.fillRect(cx - w, cy + dy, w * 2, 1);
    }
  }
  function sky(cols, fn, seed) {
    const [c, x] = mk(W, H);
    const n = cols.length, hh = GY / n;
    cols.forEach((col, i) => {
      const y = Math.floor(i * hh);
      R(x, col, 0, y, W, Math.ceil(hh) + 1);
      if (i > 0) { x.fillStyle = col; for (let px = 0; px < W; px += 2) { x.fillRect(px, y - 1, 1, 1); x.fillRect(px + 1, y - 3, 1, 1); } }
    });
    if (fn) fn(x, rng(seed || 5));
    return c;
  }
  function layer(seed, fn) { const [c, x] = mk(TW, H); fn(x, rng(seed)); return c; }
  function sun(x, cx, cy, r, halo, core, rays) {
    disc(x, halo, cx, cy, r + 5); disc(x, core, cx, cy, r);
    if (rays) for (let k = 0; k < 16; k++) {
      const a = k * Math.PI / 8, len = k % 2 ? 6 : 11;
      for (let d = r + 9; d < r + 9 + len; d++) R(x, halo, cx + Math.cos(a) * d, cy + Math.sin(a) * d, 1, 1);
    }
  }
  function moon(x, cx, cy, r, halo) {
    disc(x, halo, cx, cy, r + 4); disc(x, '#f6f2d4', cx, cy, r);
    disc(x, '#ddd8b0', cx - r * .35, cy - r * .3, Math.max(1, (r * .2) | 0)); disc(x, '#ddd8b0', cx + r * .35, cy + r * .3, Math.max(1, (r * .25) | 0));
  }
  function stars(x, r, n, maxY) { for (let i = 0; i < n; i++) R(x, r() < .2 ? '#fff7b8' : '#cfc6f0', r() * W, r() * maxY, 1, 1); }
  function cloud(x, px, py, c) { R(x, c, px, py, 22, 4); R(x, c, px + 4, py - 3, 12, 3); R(x, c, px + 10, py + 4, 16, 2); }
  // posição na tela de um ponto desenhado numa camada
  function onLayer(scroll, s, px) { let v = px - (Math.floor(scroll * s) % TW); if (v < -60) v += TW; return v; }

  // ------------------------------------------------------------------
  // chãos
  // ------------------------------------------------------------------
  function tile(base, edge, light, speck, dark, seed, deco) {
    const [c, x] = mk(TW, H - GY); const r = rng(seed);
    R(x, base, 0, 0, TW, H - GY); R(x, edge, 0, 0, TW, 1); R(x, light, 0, 1, TW, 2);
    for (let i = 0; i < 150; i++) R(x, r() < .5 ? speck : dark, r() * TW, 4 + r() * 19, 1 + ((r() * 3) | 0), 1);
    if (deco) deco(x, r);
    return c;
  }
  const cracks = c => (g, r) => {
    for (let i = 0; i < 40; i++) {
      const x = r() * TW, y = 6 + r() * 14, l = 4 + r() * 8;
      R(g, c, x, y, l, 1); R(g, c, x + l, y, 1, 3 + r() * 3); R(g, c, x + l / 2, y - 2, 1, 2);
    }
  };
  const tufts = (c, fl) => (g, r) => {
    R(g, c, 0, 3, TW, 1);
    for (let i = 0; i < 90; i++) R(g, c, r() * TW, 4, 1, 1 + r() * 2);
    if (fl) for (let i = 0; i < 16; i++) R(g, fl[i % fl.length], r() * TW, 1, 1, 1);
  };
  const cobble = c => (g) => {
    for (let y = 5; y < 24; y += 5) for (let x = (y % 2) * 4; x < TW; x += 8) { R(g, c, x, y, 1, 5); }
    for (let y = 4; y < 24; y += 5) R(g, c, 0, y, TW, 1);
  };
  const GROUNDS = {
    sertao: () => tile('#dba768', '#a86f3c', '#eac38a', '#f0cf9a', '#bf8a52', 12, cracks('#b98450')),
    sertaoClaro: () => tile('#eadab0', '#b89a68', '#f8eccc', '#fbf4dc', '#d2bd8c', 13, cracks('#c8b080')),
    sertaoRubro: () => tile('#b8744a', '#6a3a22', '#d89260', '#c98458', '#96583a', 14, cracks('#8a5030')),
    areia: () => tile('#f0dca0', '#c8a868', '#fbeec0', '#fff8dc', '#dcc486', 15, (g, r) => { for (let i = 0; i < 14; i++) { const x = r() * TW; R(g, '#ffffff', x, 6 + r() * 14, 2, 1); R(g, '#f4a8a0', x + 1, 5 + r() * 14, 1, 1); } }),
    grama: () => tile('#7a5230', '#2f7a34', '#5cc24f', '#8b6238', '#63401f', 22, tufts('#48a63f', ['#ffd23f', '#ff7675', '#ffffff'])),
    gramaNoite: () => tile('#3a3048', '#16241a', '#3f7a52', '#4a3e5a', '#2a2236', 23, tufts('#2f5e40')),
    terra: () => tile('#c98a52', '#8a5a30', '#dba36a', '#e3b888', '#a8703c', 32, (g, r) => { for (let k = 0; k < 20; k++) { const x = r() * TW; R(g, '#7f9a52', x, 1, 2, 1); R(g, '#7f9a52', x + 1, 0, 1, 1); } }),
    terraRubra: () => tile('#8a5238', '#4a2818', '#a86a48', '#9a6044', '#6e3e28', 33),
    terraNoite: () => tile('#3e3448', '#1c1626', '#5e5070', '#4a4056', '#2c2436', 34),
    terraClara: () => tile('#e4cfa0', '#a88a58', '#f4e4bc', '#f8ecd0', '#ccb480', 35),
    plataforma: () => tile('#8f9290', '#5c605f', '#b4b7b3', '#9da09d', '#7d807e', 42, (g) => { R(g, '#f1c40f', 0, 3, TW, 2); for (let px = 0; px < TW; px += 24) R(g, '#7d807e', px, 6, 1, 18); R(g, '#7d807e', 0, 14, TW, 1); }),
    asfalto: () => tile('#4c4c56', '#26262c', '#8a8a94', '#56565f', '#42424a', 43, (g) => { R(g, '#3c3c44', 0, 3, TW, 1); for (let px = 0; px < TW; px += 28) R(g, '#f1c40f', px, 13, 14, 2); }),
    brita: () => tile('#7a7068', '#3a3430', '#9a9088', '#8a8078', '#655c55', 44, (g) => { for (let px = 0; px < TW; px += 8) R(g, '#4e3c2e', px, 7, 4, 12); R(g, '#d0d4d8', 0, 8, TW, 1); R(g, '#8a8e92', 0, 9, TW, 1); R(g, '#d0d4d8', 0, 17, TW, 1); R(g, '#8a8e92', 0, 18, TW, 1); }),
    pedra: () => tile('#9a8f84', '#4a443e', '#b8ada0', '#a69b90', '#857a70', 45, cobble('#7a7067')),
    pedraNoite: () => tile('#4e4860', '#221e2c', '#746c8c', '#5a5470', '#403a50', 46, cobble('#38324a')),
    piso: () => tile('#eadfca', '#8a7a64', '#fbf4e2', '#eadfca', '#eadfca', 47, (g) => { for (let y = 3; y < 24; y += 7) for (let x = ((y / 7) | 0) % 2 * 10; x < TW; x += 20) R(g, '#c8785a', x, y, 10, 7); }),
    quadra: () => tile('#4a6a5a', '#243a30', '#6a8a78', '#527262', '#42604f', 48, (g) => { R(g, '#e8f0ea', 0, 11, TW, 1); for (let px = 40; px < TW; px += 168) R(g, '#e8f0ea', px, 4, 1, 20); }),
    nuvem: () => tile('#f4f8ff', '#ffffff', '#ffffff', '#ffffff', '#dce8f8', 49, (g, r) => { for (let i = 0; i < 46; i++) { const x = r() * TW; disc(g, '#dce8f8', x, 10 + r() * 12, 4 + ((r() * 4) | 0)); disc(g, '#ffffff', x + 2, 8 + r() * 12, 3 + ((r() * 3) | 0)); } }),
    calcada: () => tile('#cfcac0', '#7a756c', '#e6e2d8', '#d8d4ca', '#bdb8ae', 60, (g) => { for (let px = 0; px < TW; px += 16) R(g, '#b0aba0', px, 4, 1, 20); R(g, '#b0aba0', 0, 13, TW, 1); }),
    copacabana: () => tile('#f0ece2', '#6a655c', '#ffffff', '#f0ece2', '#f0ece2', 61, (g) => { g.fillStyle = '#2a2830'; for (let px = 0; px < TW; px++) for (let k = 0; k < 3; k++) g.fillRect(px, 6 + k * 6 + Math.round(Math.sin(px / 16 * Math.PI * 2) * 2), 1, 2); }),
    palco: () => tile('#8a5a30', '#3f2816', '#b07a44', '#96643a', '#7a4e28', 62, (g) => { for (let px = 0; px < TW; px += 21) R(g, '#6b4424', px, 3, 1, 21); R(g, '#6b4424', 0, 12, TW, 1); }),
    cozinha: () => tile('#e8e4dc', '#8a867e', '#ffffff', '#e8e4dc', '#e8e4dc', 63, (g) => { for (let y = 3; y < 24; y += 7) for (let x = ((y / 7) | 0) % 2 * 12; x < TW; x += 24) R(g, '#b8c4cc', x, y, 12, 7); }),
    deck: () => tile('#566078', '#2a3040', '#7a86a0', '#606a84', '#4a546a', 64, (g) => { for (let px = 0; px < TW; px += 14) R(g, '#444e64', px, 3, 1, 21); }),
    cemiterio: () => tile('#3c4a3e', '#232b25', '#6f8468', '#4d5e4d', '#2e3830', 52, (g, r) => { for (let k = 0; k < 12; k++) R(g, '#e8e3d0', r() * TW, 8 + r() * 12, 3, 1); }),
    folhas: () => tile('#33302a', '#15130f', '#4e5a3c', '#5a4a2c', '#262019', 53, (g, r) => { for (let k = 0; k < 40; k++) R(g, ['#7a5a2c', '#5a6a34', '#8a4a24'][k % 3], r() * TW, 3 + r() * 18, 2, 1); })
  };
  const gcache = {};
  function gnd(k) { return gcache[k] || (gcache[k] = GROUNDS[k]()); }

  // ------------------------------------------------------------------
  // elementos de cenário (todos apoiados na linha do chão)
  // ------------------------------------------------------------------
  const E = {
    mandacaru(x, px, h, c, d) {
      c = c || '#7f9a52'; d = d || '#637d3c';
      R(x, c, px, GY - h, 3, h); R(x, d, px + 2, GY - h, 1, h);
      R(x, c, px - 5, GY - h + 8, 5, 2); R(x, c, px - 5, GY - h + 3, 2, 6);
      R(x, c, px + 3, GY - h + 13, 5, 2); R(x, c, px + 6, GY - h + 7, 2, 7); R(x, d, px + 7, GY - h + 7, 1, 7);
    },
    xique(x, px, c) { c = c || '#8aa25e'; for (let i = 0; i < 5; i++) { const h = 4 + ((i * 7) % 5); R(x, c, px + i * 3, GY - h, 2, h); } },
    seca(x, px, h, c) {
      c = c || '#9a7450';
      R(x, c, px, GY - h, 2, h);
      for (let i = 0; i < 5; i++) { R(x, c, px - i - 1, GY - h - i + 3, 1, 2); R(x, c, px + 2 + i, GY - h - i, 1, 2); }
      for (let i = 0; i < 4; i++) R(x, c, px + 2 + i, GY - h + 8 - i, 1, 1);
    },
    secaGrande(x, px, h, c) {
      R(x, c, px, GY - h, 3, h);
      for (let i = 0; i < 8; i++) { R(x, c, px - i - 1, GY - h - i + 5, 1, 2); R(x, c, px + 3 + i, GY - h - i + 2, 1, 2); }
      for (let i = 0; i < 5; i++) { R(x, c, px + 3 + i, GY - h + 12 - i, 1, 1); R(x, c, px - 5 - i, GY - h - 2 - i, 1, 1); }
    },
    capela(x, px) {
      R(x, '#fbf4e2', px, GY - 16, 16, 16); R(x, '#e6dcc0', px + 12, GY - 16, 4, 16);
      R(x, '#fbf4e2', px + 3, GY - 22, 10, 6); R(x, '#fbf4e2', px + 6, GY - 25, 4, 3);
      R(x, '#7a5230', px + 7, GY - 31, 2, 6); R(x, '#7a5230', px + 5, GY - 29, 6, 1);
      R(x, '#5f86a8', px + 6, GY - 8, 4, 8); R(x, '#5f86a8', px + 7, GY - 19, 2, 3);
    },
    caveira(x, px) { R(x, '#f4ecd8', px + 2, GY - 5, 5, 5); R(x, '#f4ecd8', px + 3, GY - 1, 3, 1); R(x, '#f4ecd8', px, GY - 7, 2, 2); R(x, '#f4ecd8', px + 7, GY - 7, 2, 2); R(x, '#3a2a18', px + 3, GY - 4, 1, 1); R(x, '#3a2a18', px + 5, GY - 4, 1, 1); },
    cerca(x, x0, x1, c) { for (let p = x0; p <= x1; p += 10) R(x, c, p, GY - 10, 2, 10); R(x, c, x0, GY - 8, x1 - x0, 1); R(x, c, x0, GY - 4, x1 - x0, 1); },
    vaca(x, px, c, c2) {
      R(x, c, px, GY - 10, 13, 6); R(x, c, px - 4, GY - 11, 5, 4); R(x, c, px + 1, GY - 12, 4, 2);
      R(x, c2, px + 6, GY - 9, 4, 3); R(x, '#3a2a18', px - 4, GY - 12, 1, 1); R(x, '#3a2a18', px - 1, GY - 12, 1, 1);
      [1, 3, 9, 11].forEach(d => R(x, c, px + d, GY - 4, 1, 4)); R(x, c, px + 13, GY - 9, 1, 4);
    },
    pessoa(x, px, c, h, o) {
      o = o || {}; h = h || 12;
      R(x, c, px, GY - h + 3, 4, h - 3); R(x, o.head || c, px, GY - h, 3, 3);
      if (o.pedra) R(x, '#9a948c', px - 1, GY - h - 3, 5, 3);
      if (o.vela) { R(x, '#fff3bd', px + 4, GY - h + 4, 1, 3); R(x, '#ffd23f', px + 4, GY - h + 3, 1, 1); }
      if (o.chapeu) { R(x, o.chapeu, px - 2, GY - h - 1, 7, 1); R(x, o.chapeu, px - 1, GY - h - 2, 5, 1); }
      if (o.rifle) { for (let i = 0; i < 8; i++) R(x, '#1a1022', px + 4 + i * .5, GY - h + 1 + i * .7, 1, 1); }
      if (o.capuz) R(x, c, px - 1, GY - h - 1, 5, 2);
    },
    casa(x, px, w, h, wall, roof, o) {
      o = o || {};
      R(x, wall, px, GY - h, w, h); R(x, 'rgba(60,30,10,.18)', px + w - 4, GY - h, 4, h);
      R(x, roof, px - 1, GY - h - 3, w + 2, 3); R(x, 'rgba(0,0,0,.25)', px - 1, GY - h - 1, w + 2, 1);
      R(x, o.door || '#7a4a2a', px + 4, GY - 10, 5, 10);
      R(x, o.lit ? '#ffd86b' : '#5f86a8', px + 13, GY - 11, 6, 5); R(x, 'rgba(255,255,255,.7)', px + 15, GY - 11, 1, 5);
      if (o.antena) { R(x, '#5a4a3a', px + w - 6, GY - h - 11, 1, 8); R(x, '#5a4a3a', px + w - 8, GY - h - 11, 5, 1); R(x, '#5a4a3a', px + w - 7, GY - h - 9, 3, 1); }
      if (o.caixa) R(x, '#5d88a6', px + 6, GY - h - 8, 8, 5);
    },
    sobrado(x, px, w, h, wall, trim, o) {
      o = o || {};
      R(x, wall, px, GY - h, w, h);
      R(x, trim, px - 1, GY - h - 2, w + 2, 2); R(x, trim, px + 2, GY - h - 4, w - 4, 2);
      R(x, 'rgba(0,0,0,.18)', px, GY - 2, w, 2);
      R(x, trim, px + 3, GY - 13, 6, 13); R(x, o.door || '#6b4226', px + 4, GY - 12, 4, 12);
      for (let wx = px + 12; wx < px + w - 5; wx += 8) { R(x, trim, wx, GY - h + 5, 5, 8); R(x, o.lit ? '#ffd86b' : (o.win || '#4a6a86'), wx + 1, GY - h + 6, 3, 6); }
    },
    igreja(x, px, wall, trim, o) {
      o = o || {};
      const dk = o.dark || '#4a3a40';
      [0, 34].forEach(dx => {
        R(x, wall, px + dx, GY - 46, 10, 46); R(x, trim, px + dx - 1, GY - 47, 12, 2); R(x, dk, px + dx + 3, GY - 41, 4, 6);
        for (let i = 0; i < 6; i++) R(x, trim, px + dx + 5 - i, GY - 53 + i, i * 2, 1);
        R(x, o.cross || '#7a5230', px + dx + 4, GY - 60, 2, 7); R(x, o.cross || '#7a5230', px + dx + 2, GY - 58, 6, 1);
      });
      R(x, wall, px + 10, GY - 32, 24, 32);
      for (let i = 0; i < 9; i++) R(x, wall, px + 22 - i * 1.5, GY - 41 + i, i * 3, 1);
      R(x, trim, px + 10, GY - 32, 24, 1);
      R(x, trim, px + 18, GY - 15, 8, 15); R(x, o.door || '#6b4226', px + 19, GY - 14, 6, 14);
      disc(x, o.lit ? '#ffd86b' : '#4a6a86', px + 22, GY - 24, 3);
    },
    arvore(x, px, h, tr, l1, l2, vine) {
      tr = tr || '#6b4a2b'; l1 = l1 || '#2f8f4e'; l2 = l2 || '#3fa85e';
      R(x, tr, px, GY - h, 4, h); R(x, 'rgba(0,0,0,.2)', px + 3, GY - h, 1, h);
      disc(x, l1, px + 2, GY - h - 4, 13); disc(x, l2, px - 4, GY - h - 8, 8); disc(x, l2, px + 9, GY - h - 2, 7);
      if (vine) for (let i = 0; i < 3; i++) R(x, vine, px - 8 + i * 8, GY - h + 6, 1, 6 + i * 4);
    },
    palmeira(x, px, h, tr, c, coco) {
      tr = tr || '#7a5a36'; c = c || '#3fa85e';
      R(x, tr, px, GY - h, 2, h);
      for (let i = 0; i < 9; i++) { R(x, c, px - i, GY - h - 3 + (i * i) / 9, 2, 2); R(x, c, px + 1 + i, GY - h - 3 + (i * i) / 9, 2, 2); R(x, c, px - i * .6, GY - h - 6 + i * .2, 2, 2); R(x, c, px + 1 + i * .6, GY - h - 6 + i * .2, 2, 2); }
      if (coco) { R(x, '#5a3a1c', px - 1, GY - h, 2, 2); R(x, '#5a3a1c', px + 2, GY - h + 1, 2, 2); }
    },
    folhao(x, px, c) { for (let i = 0; i < 7; i++) R(x, c || '#2f8f4e', px + i, GY - 4 - i * 2 + (i > 3 ? (i - 3) * 3 : 0), 3, 5); },
    predio(x, px, w, h, c, win, r, litP, lit) {
      R(x, c, px, GY - h, w, h); R(x, 'rgba(0,0,0,.12)', px + w - 3, GY - h, 3, h);
      for (let yy = GY - h + 3; yy < GY - 3; yy += 4) for (let xx = px + 2; xx < px + w - 3; xx += 3) if (r() < .7) R(x, r() < (litP || 0) ? (lit || '#ffd86b') : win, xx, yy, 1, 2);
    },
    bloco(x, px, w, h, c, c2, win, lit) {
      R(x, c, px, GY - h, w, h); R(x, c2, px + w - 4, GY - h, 4, h); R(x, c2, px, GY - h, w, 2);
      for (let yy = GY - h + 5; yy < GY - 5; yy += 7) for (let xx = px + 3; xx < px + w - 7; xx += 6) R(x, (xx + yy) % 5 ? win : lit, xx, yy, 3, 3);
      R(x, '#7fa3b8', px + w / 2 - 3, GY - h - 5, 7, 5);
    },
    poste(x, px, h, c) { R(x, c, px, GY - h, 2, h); R(x, c, px - 4, GY - h + 2, 10, 1); },
    fios(x, y, step, phase, c, sag) { x.fillStyle = c; for (let px = 0; px < TW; px++) { const k = ((px - phase) % step + step) % step; x.fillRect(px, y + Math.round(Math.sin(k / step * Math.PI) * sag), 1, 1); } },
    lampiao(x, px, h, c) { R(x, c, px, GY - h, 1, h); R(x, c, px, GY - h, 4, 1); R(x, '#ffd86b', px + 3, GY - h + 1, 2, 3); },
    placa(x, px, y, txt, bg, fg, sc) { sc = sc || 1; const w = G.textWidth(txt, sc) + 6; R(x, bg, px, y, w, 5 * sc + 4); G.text(x, txt, px + 3, y + 2, fg, sc); return w; },
    bandeirinhas(x, x0, x1, y) {
      const cs = ['#d63031', '#ffd23f', '#2e86de', '#27ae60', '#ff7eb6', '#ffffff'];
      for (let p = x0, i = 0; p < x1; p += 5, i++) { const yy = y + Math.round(Math.sin((p - x0) / (x1 - x0) * Math.PI) * 4); R(x, '#5a4636', p, yy, 5, 1); R(x, cs[i % cs.length], p + 1, yy + 1, 3, 2); R(x, cs[i % cs.length], p + 2, yy + 3, 1, 1); }
    },
    fusca(x, px, c) {
      R(x, c, px + 4, GY - 10, 12, 4); R(x, c, px, GY - 7, 22, 5); R(x, '#bfe0f0', px + 6, GY - 9, 4, 3); R(x, '#bfe0f0', px + 11, GY - 9, 4, 3);
      disc(x, '#1a1022', px + 5, GY - 2, 2); disc(x, '#1a1022', px + 17, GY - 2, 2); R(x, '#fff3bd', px, GY - 6, 1, 2);
    },
    lapide(x, px, h, c, d) { R(x, c, px, GY - h + 2, 9, h - 2); R(x, c, px + 1, GY - h + 1, 7, 1); R(x, c, px + 2, GY - h, 5, 1); R(x, d, px + 7, GY - h + 2, 2, h - 2); R(x, d, px + 2, GY - h + 5, 4, 1); R(x, d, px + 2, GY - h + 7, 3, 1); },
    cruz(x, px, h, c, d) { R(x, c, px, GY - h, 3, h); R(x, c, px - 3, GY - h + 4, 9, 3); R(x, d || c, px + 2, GY - h, 1, h); },
    barril(x, px) { R(x, '#8a5a30', px, GY - 10, 8, 10); R(x, '#5a3a1c', px, GY - 8, 8, 1); R(x, '#5a3a1c', px, GY - 3, 8, 1); R(x, '#a8743e', px + 1, GY - 10, 2, 10); },
    caixao(x, px, c) { c = c || '#6b4226'; R(x, c, px + 1, GY - 22, 6, 22); R(x, c, px, GY - 18, 8, 9); R(x, '#3f2816', px + 6, GY - 22, 1, 22); R(x, '#e8d8a0', px + 3, GY - 17, 2, 7); R(x, '#e8d8a0', px + 2, GY - 15, 4, 1); },
    mesa(x, px, w, h, c, c2) {
      R(x, c, px + 5, GY - h, w - 10, h); R(x, c, px + 2, GY - h + 3, w - 4, h - 3); R(x, c, px, GY - h + 8, w, h - 8);
      R(x, c2, px + 5, GY - h, w - 10, 1);
      for (let i = 0; i < (w - 12) / 9; i++) R(x, c2, px + 8 + i * 9, GY - h + 3 + (i % 3) * 2, 1, h - 6 - (i % 3) * 2);
    },
    copas(x, r, c, base, amp) { for (let px = 0; px < TW; px += 9) disc(x, c, px + r() * 5, GY - base - r() * amp, 9 + ((r() * 5) | 0)); R(x, c, 0, GY - base + 2, TW, base); },
    morros(x, c, base, a1, a2) { x.fillStyle = c; for (let px = 0; px < TW; px++) { const a = px / TW * Math.PI * 2, h = base + Math.sin(a * 3) * a1 + Math.sin(a * 7 + 1) * a2; x.fillRect(px, GY - Math.round(h), 1, Math.round(h)); } },
    telhados(x, r, c, lit) {
      for (let px = 0; px < TW;) {
        const w = 12 + ((r() * 14) | 0), h = 8 + ((r() * 12) | 0);
        R(x, c, px, GY - h, w, h); for (let i = 0; i < 4; i++) R(x, c, px + i * 2, GY - h - 4 + i, w - i * 4 > 0 ? w - i * 4 : 1, 1);
        if (lit && r() < .5) R(x, lit, px + 3 + ((r() * (w - 7)) | 0), GY - h + 3, 2, 3);
        px += w + ((r() * 4) | 0);
      }
    }
  };

  // extras reutilizáveis
  function galinha(ctx, t, scroll) {
    const gx = W + 30 - ((t * .55 + scroll * .5) % (W + 420));
    const gy = GY - 9 - (Math.floor(t / 6) % 2);
    R(ctx, '#fbf4e2', gx + 2, gy + 2, 7, 5); R(ctx, '#fbf4e2', gx, gy, 3, 4); R(ctx, '#fbf4e2', gx + 8, gy, 2, 3);
    R(ctx, '#d63031', gx, gy - 1, 2, 1); R(ctx, '#f0a020', gx - 1, gy + 1, 1, 1); R(ctx, '#0d0d0d', gx + 1, gy + 1, 1, 1);
    const st = Math.floor(t / 5) % 2;
    R(ctx, '#f0a020', gx + 3 + st, gy + 7, 1, 2); R(ctx, '#f0a020', gx + 6 - st, gy + 7, 1, 2);
  }
  function trem(ctx, t, scroll, y, speedMul) {
    const period = W + 900, tx = W + 20 - ((t * 2.2 * (speedMul || 1) + scroll * .45) % period);
    if (tx > W || tx < -340) return;
    for (let k = 0; k < 4; k++) {
      const cx = Math.round(tx + k * 82);
      R(ctx, '#cfd6da', cx, y, 80, 22); R(ctx, '#aeb7bd', cx, y + 19, 80, 3); R(ctx, '#e8edef', cx, y, 80, 2);
      R(ctx, '#2456c4', cx, y + 13, 80, 2); R(ctx, '#d63031', cx, y + 15, 80, 1);
      for (let j = 0; j < 5; j++) R(ctx, '#34495e', cx + 5 + j * 15, y + 4, 10, 7);
      R(ctx, '#7f8c9a', cx + 36, y + 3, 7, 16);
      R(ctx, '#3a3a44', cx + 8, y + 22, 8, 3); R(ctx, '#3a3a44', cx + 62, y + 22, 8, 3);
    }
  }
  function morcegos(ctx, t, scroll) {
    for (let k = 0; k < 3; k++) {
      const bx = W + 20 - ((t * (.7 + k * .25) + scroll * .3 + k * 190) % (W + 260));
      const by = 26 + k * 17 + Math.sin(t / 14 + k * 2) * 5, up = Math.floor(t / 7 + k) % 2;
      R(ctx, '#0f0a1d', bx + 3, by, 2, 2);
      R(ctx, '#0f0a1d', bx, by - (up ? 2 : 0), 3, 1); R(ctx, '#0f0a1d', bx + 5, by - (up ? 2 : 0), 3, 1);
      R(ctx, '#0f0a1d', bx + 1, by + (up ? -1 : 1), 2, 1); R(ctx, '#0f0a1d', bx + 5, by + (up ? -1 : 1), 2, 1);
    }
  }
  function nevoa(ctx, t, scroll, c) {
    ctx.fillStyle = c || 'rgba(200,190,240,.10)';
    for (let k = 0; k < 4; k++) {
      const fx = ((k * 130 - scroll * .7 - t * .15) % (W + 160) + (W + 160)) % (W + 160) - 120;
      ctx.fillRect(Math.round(fx), GY - 7 - k * 2, 110, 3); ctx.fillRect(Math.round(fx) + 20, GY - 9 - k * 2, 60, 2);
    }
  }
  // chamas de vela piscando sobre pontos de uma camada
  function velas(ctx, t, scroll, s, pts) {
    pts.forEach((p, i) => {
      const vx = onLayer(scroll, s, p[0]);
      if (vx > -2 && vx < W && (Math.floor(t / 6) + i * 3) % 5) R(ctx, (t + i * 7) % 12 < 6 ? '#fff3bd' : '#ffb347', vx, p[1], 1, 1);
    });
  }
  function fumaca(ctx, t, scroll, s, pts) {
    pts.forEach((p, i) => {
      const fx = onLayer(scroll, s, p);
      if (fx < -30 || fx > W + 10) return;
      for (let k = 0; k < 9; k++) {
        const yy = GY - 14 - ((t * .5 + k * 9 + i * 13) % 80), sw = Math.sin((t + k * 20) / 18) * 3 + k;
        ctx.fillStyle = 'rgba(40,30,40,' + (0.35 - (GY - yy) / 300).toFixed(2) + ')';
        ctx.fillRect(Math.round(fx + sw), Math.round(yy), 5 + (k % 3) * 2, 4);
      }
      R(ctx, t % 10 < 5 ? '#ff7a1a' : '#ffd23f', fx + 1, GY - 12, 4, 4); R(ctx, '#ff7a1a', fx, GY - 9, 6, 3);
    });
  }

  // paletas de céu
  const SKY = {
    sertao: ['#fdeeb0', '#fbdc88', '#f7c56c', '#f2ad5a'],
    branco: ['#fffdf2', '#fdf6dc', '#f9ecc4', '#f3dfaa'],
    rubro: ['#4a1c3a', '#9a2e40', '#dc5e3a', '#f6a64a'],
    mata: ['#7fd0ea', '#9cdcec', '#bbe8e6', '#d8f3de'],
    dourado: ['#bfe8d0', '#d8f0c0', '#f0f4b0', '#fbe8a0'],
    rosa: ['#ffb3c7', '#ffc9b0', '#ffe0a8', '#fff2c0'],
    azul: ['#6ebcf0', '#98d4f4', '#c4e8f4', '#eaf4e0'],
    lilas: ['#2e2260', '#5e3a8a', '#aa5a9c', '#f09a8a'],
    cdd: ['#ffe9a6', '#ffd480', '#ffbc6a', '#ffa25f'],
    apes: ['#bfe3f0', '#d8ecd8', '#f4ecc0', '#fbdc9a'],
    noite: ['#0c1030', '#141a48', '#1f2a66', '#2d3c84'],
    roxo: ['#170e33', '#22154a', '#33205f', '#4a2c77'],
    vila: ['#2a1a4a', '#5a2a5a', '#a04a50', '#e08a50'],
    breu: ['#0a1420', '#10202c', '#183038', '#204048'],
    central: ['#9cc3dd', '#b6d3e4', '#d0e2ea', '#e6eeee'],
    tarde: ['#6a78a8', '#a890b0', '#e0a898', '#f8d0a0'],
    aurora: ['#8fa8d8', '#c4b0d8', '#f2b8c0', '#fcd8b0'],
    ceu: ['#fff8d8', '#fff0b8', '#ffe6a0', '#ffd98a'],
    taperoa: ['#8fd0f0', '#b0e0f4', '#d4eef0', '#f4f0d0']
  };

  // ==================================================================
  //  MACUNAÍMA (1969)
  // ==================================================================
  function farMata(seed, tep, canopy) {
    return layer(seed, (f, r) => {
      function tepui(x, w, h) {
        R(f, tep[0], x + 4, GY - h, w - 8, h); R(f, tep[0], x, GY - h + 10, w, h - 10); R(f, tep[1], x + 4, GY - h, w - 8, 2);
        for (let i = 0; i < w / 12; i++) R(f, tep[1], x + 8 + i * 12, GY - h + 3, 1, h * .5);
        R(f, '#f2fbff', x + w * .6, GY - h + 2, 2, h * .6);
      }
      tepui(60, 150, 62); tepui(420, 110, 48);
      E.copas(f, r, canopy, 12, 10);
    });
  }
  const MAC = [
    function () { // 1. o nascimento
      const mid = layer(101, (m) => {
        E.arvore(m, 50, 48, 0, 0, 0, '#256f3c'); E.palmeira(m, 120, 40); E.folhao(m, 150);
        // maloca
        for (let i = 0; i < 17; i++) R(m, i % 3 ? '#c9a45a' : '#a8843c', 196 - i, GY - 19 + i, 6 + i * 2, 1);
        R(m, '#3a2a18', 195, GY - 9, 7, 9); R(m, '#8a6a36', 198, GY - 22, 2, 4);
        // rede e fogueira
        R(m, '#e8e3d0', 228, GY - 9, 14, 2); R(m, '#6b4a2b', 226, GY - 14, 1, 14); R(m, '#6b4a2b', 243, GY - 14, 1, 14);
        E.arvore(m, 300, 56, 0, 0, 0, '#256f3c'); R(m, '#d63031', 316, GY - 70, 4, 2); R(m, '#ffd23f', 320, GY - 70, 1, 1);
        E.palmeira(m, 380, 34); E.arvore(m, 450, 44); E.folhao(m, 490); E.palmeira(m, 535, 44); E.arvore(m, 600, 52, 0, 0, 0, '#256f3c'); E.folhao(m, 640);
      });
      return { sky: sky(SKY.mata, x => disc(x, '#fff7b8', 60, 26, 9)), layers: [{ c: farMata(100, ['#7fb0c0', '#9cc6d2'], '#4c9a72'), s: .12 }, { c: mid, s: .45 }], ground: gnd('grama') };
    },
    function () { // 2. a fonte mágica
      const far = layer(110, (f, r) => {
        E.copas(f, r, '#5aa878', 22, 12);
        R(f, '#5bb8d8', 0, GY - 9, TW, 9); R(f, '#8fd8ec', 0, GY - 9, TW, 1);
        for (let i = 0; i < 60; i++) R(f, '#d8f4fb', r() * TW, GY - 7 + r() * 6, 3 + r() * 4, 1);
      });
      const mid = layer(111, (m) => {
        E.arvore(m, 40, 50, 0, '#3a9a58', '#56b86e'); E.folhao(m, 90, '#3a9a58');
        // a pedra com a pegada cheia d'água encantada
        [[150, 0], [470, 1]].forEach(([px]) => {
          disc(m, '#8a8f98', px + 14, GY - 2, 14); R(m, '#8a8f98', px, GY - 3, 28, 3); disc(m, '#a4a9b2', px + 9, GY - 8, 6);
          R(m, '#6fe0f4', px + 8, GY - 9, 12, 3); R(m, '#d8f8ff', px + 10, GY - 9, 4, 1);
          R(m, '#6fe0f4', px + 13, GY - 22, 2, 13); R(m, '#d8f8ff', px + 13, GY - 24, 2, 3); R(m, '#d8f8ff', px + 10, GY - 20, 1, 2); R(m, '#d8f8ff', px + 17, GY - 18, 1, 2);
        });
        E.palmeira(m, 230, 42); E.arvore(m, 300, 46, 0, '#3a9a58', '#56b86e', '#256f3c'); E.folhao(m, 360, '#3a9a58'); E.palmeira(m, 420, 36);
        E.arvore(m, 560, 54, 0, '#3a9a58', '#56b86e'); E.folhao(m, 620, '#3a9a58');
      });
      return { sky: sky(SKY.dourado, x => sun(x, 270, 30, 12, '#fff7b8', '#ffffff', true)), layers: [{ c: far, s: .15 }, { c: mid, s: .45 }], ground: gnd('grama') };
    },
    function () { // 3. São Paulo
      const far = layer(120, (f, r) => {
        const cs = ['#c98fb0', '#d9a0a8', '#b58ac0', '#e0b090', '#a898c8'];
        for (let x = 0; x < TW;) { const w = 16 + ((r() * 18) | 0), h = 30 + ((r() * 44) | 0); E.predio(f, x, w, h, cs[(r() * cs.length) | 0], '#fff2c0', r); x += w + ((r() * 5) | 0); }
        // um arranha-céu de topo escalonado
        [150, 480].forEach(px => { R(f, '#e8e0d0', px, GY - 60, 22, 60); R(f, '#e8e0d0', px + 3, GY - 76, 16, 16); R(f, '#e8e0d0', px + 6, GY - 88, 10, 12); R(f, '#e8e0d0', px + 10, GY - 98, 2, 10); R(f, '#c8bca8', px + 18, GY - 60, 4, 60); for (let yy = GY - 56; yy < GY - 4; yy += 5) R(f, '#8a7a98', px + 2, yy, 15, 2); });
      });
      const mid = layer(121, (m) => {
        const ads = [['COMPRE', '#d63031', '#ffffff'], ['TV', '#2e86de', '#ffd23f'], ['MAQUINA', '#27ae60', '#ffffff'], ['BANCO', '#ffd23f', '#1a1022'], ['HOJE', '#ff7eb6', '#1a1022']];
        for (let i = 0; i < 5; i++) { const px = 30 + i * 130; R(m, '#5a4a5a', px + 8, GY - 30, 2, 30); const w = E.placa(m, px, GY - 44, ads[i][0], ads[i][1], ads[i][2], 2); R(m, '#5a4a5a', px + w - 10, GY - 30, 2, 30); }
        ['#d63031', '#27ae60', '#f0f0f0', '#2e86de', '#ffd23f'].forEach((c, i) => E.fusca(m, 96 + i * 124, c));
        for (let px = 70; px < TW; px += 130) E.lampiao(m, px, 34, '#4a4050');
      });
      return { sky: sky(SKY.rosa, x => disc(x, '#fff7e0', 250, 40, 14)), layers: [{ c: far, s: .12 }, { c: mid, s: .45 }], ground: gnd('asfalto') };
    },
    function () { // 4. a feijoada do gigante
      const far = layer(130, (f, r) => {
        E.copas(f, r, '#5aa860', 10, 6);
        [70, 400].forEach(px => { // a mansão de Venceslau Pietro Pietra
          R(f, '#fbf4e2', px, GY - 44, 170, 44); R(f, '#e4d8bc', px, GY - 46, 170, 3);
          for (let i = 0; i < 22; i++) R(f, '#fbf4e2', px + 85 - i * 3, GY - 68 + i, i * 6, 1);
          R(f, '#e4d8bc', px + 19, GY - 47, 132, 2); disc(f, '#c8785a', px + 85, GY - 54, 4);
          for (let i = 0; i < 8; i++) { R(f, '#ffffff', px + 14 + i * 20, GY - 44, 5, 44); R(f, '#d4c8a8', px + 18 + i * 20, GY - 44, 1, 44); }
          for (let i = 0; i < 7; i++) R(f, '#6a9ab8', px + 23 + i * 20, GY - 34, 7, 16);
          R(f, '#8a5a30', px + 80, GY - 22, 12, 22);
        });
        for (let px = 20; px < TW; px += 96) E.palmeira(f, px, 54, '#b8a888', '#4ca060');
      });
      const mid = layer(131, (m) => {
        [60, 390].forEach(px => { // a piscina de feijoada, com trapézio
          R(m, '#fbf4e2', px, GY - 7, 120, 7); R(m, '#6b3a1e', px + 2, GY - 6, 116, 5); R(m, '#8a4e28', px + 2, GY - 6, 116, 1);
          [[10, '#d63031'], [26, '#f4ecd8'], [40, '#27ae60'], [58, '#d63031'], [74, '#e8a060'], [90, '#f4ecd8'], [104, '#27ae60']].forEach(b => R(m, b[1], px + b[0], GY - 5, 4, 2));
          R(m, '#c8ccd0', px + 30, GY - 46, 2, 40); R(m, '#c8ccd0', px + 88, GY - 46, 2, 40); R(m, '#c8ccd0', px + 30, GY - 46, 60, 2);
          R(m, '#e8e3d0', px + 52, GY - 44, 1, 20); R(m, '#e8e3d0', px + 66, GY - 44, 1, 20); R(m, '#8a5a30', px + 51, GY - 24, 17, 2);
          E.bandeirinhas(m, px - 10, px + 30, GY - 40); E.bandeirinhas(m, px + 90, px + 150, GY - 40);
        });
        ['#ff7eb6', '#2e86de', '#ffd23f', '#27ae60', '#d63031', '#f0f0f0', '#b58ac0'].forEach((c, i) => E.pessoa(m, 200 + i * 24 + (i > 3 ? 330 - 96 : 0), c, 13, { head: i % 2 ? '#e8bb94' : '#8a5a3a' }));
        [[250, '#d63031'], [270, '#ffd23f'], [290, '#2e86de'], [560, '#27ae60'], [600, '#ff7eb6']].forEach(b => { disc(m, b[1], b[0], GY - 40, 3); R(m, '#e8e3d0', b[0], GY - 37, 1, 12); });
      });
      return { sky: sky(SKY.azul, x => { cloud(x, 40, 20, '#ffffff'); cloud(x, 220, 32, '#ffffff'); }), layers: [{ c: far, s: .2 }, { c: mid, s: .45 }], ground: gnd('piso') };
    },
    function () { // 5. a Uiara
      const far = layer(140, (f, r) => {
        E.copas(f, r, '#2a2458', 26, 12);
        R(f, '#3a4a9a', 0, GY - 15, TW, 15); R(f, '#6a7ac8', 0, GY - 15, TW, 1);
        for (let i = 0; i < 70; i++) R(f, i % 4 ? '#5a6ab8' : '#f6f2d4', r() * TW, GY - 13 + r() * 12, 3 + r() * 5, 1);
        for (let i = 0; i < 12; i++) { const px = r() * TW; R(f, '#3f9a5e', px, GY - 4 - r() * 8, 7, 1); R(f, '#3f9a5e', px + 1, GY - 5 - r() * 0, 0, 0); }
        [230, 540].forEach(px => { // a Uiara na água
          R(f, '#16100e', px - 1, GY - 17, 5, 2); R(f, '#e8bb94', px, GY - 16, 3, 3); R(f, '#16100e', px - 1, GY - 15, 1, 7); R(f, '#16100e', px + 3, GY - 15, 1, 7);
          R(f, '#e8bb94', px, GY - 13, 3, 4); R(f, '#f6f2d4', px - 4, GY - 9, 11, 1); R(f, '#f6f2d4', px - 2, GY - 7, 7, 1);
        });
      });
      const mid = layer(141, (m) => {
        const d = '#1c1840';
        E.arvore(m, 40, 52, d, '#241e52', '#2e2866'); E.palmeira(m, 130, 44, d, '#2e2866'); E.arvore(m, 320, 60, d, '#241e52', '#2e2866', d);
        E.palmeira(m, 420, 38, d, '#2e2866'); E.arvore(m, 610, 50, d, '#241e52', '#2e2866'); E.folhao(m, 180, '#2e2866'); E.folhao(m, 500, '#2e2866');
      });
      return {
        sky: sky(SKY.lilas, (x, r) => { stars(x, r, 30, 40); moon(x, 70, 30, 12, '#8a6ab0'); }), layers: [{ c: far, s: .2 }, { c: mid, s: .45 }], ground: gnd('gramaNoite'), light: true,
        extras(ctx, t, scroll) { for (let k = 0; k < 6; k++) { const fx = (k * 67 + scroll * .2) % W, fy = 60 + Math.sin(t / 30 + k) * 20 + k * 6; if (Math.floor(t / 20 + k) % 3) R(ctx, '#d8ff8a', W - fx, fy, 1, 1); } }
      };
    }
  ];

  // ==================================================================
  //  DEUS E O DIABO NA TERRA DO SOL (1964)
  // ==================================================================
  function farMesas(seed, c1, c2, c3, c4) {
    return layer(seed, (f) => {
      E.mesa(f, 10, 110, 30, c1, c2); E.mesa(f, 160, 56, 18, c3, c4); E.mesa(f, 290, 150, 40, c1, c2); E.mesa(f, 470, 70, 22, c3, c4); E.mesa(f, 575, 80, 28, c1, c2);
    });
  }
  const sertaoSol = x => sun(x, 252, 34, 16, '#fff3bd', '#ffffff', true);
  const DEUS = [
    function () { // 1. a feira de gado
      const mid = layer(201, (m) => {
        E.cerca(m, 20, 170, '#8a6a48'); E.vaca(m, 50, '#f4ecd8', '#c8a880'); E.vaca(m, 96, '#b8845a', '#8a5a38'); E.vaca(m, 136, '#f4ecd8', '#9a7a5a');
        E.casa(m, 210, 40, 20, '#fbf4e2', '#b9603a', { door: '#5f86a8' }); E.mandacaru(m, 270, 26);
        E.seca(m, 320, 20); E.cerca(m, 370, 520, '#8a6a48'); E.vaca(m, 400, '#f4ecd8', '#c8a880'); E.vaca(m, 470, '#8a6a4a', '#6a4a30'); E.caveira(m, 548);
        E.mandacaru(m, 590, 22); E.seca(m, 636, 16);
      });
      return { sky: sky(SKY.sertao, sertaoSol), layers: [{ c: farMesas(200, '#e6a868', '#efbd84', '#e9b072', '#f1c48e'), s: .12 }, { c: mid, s: .45 }], ground: gnd('sertao') };
    },
    function () { // 2. Monte Santo
      const far = layer(210, (f) => {
        [[40, 300, 78], [400, 230, 56]].forEach(([x0, w, hh], n) => {
          for (let px = 0; px < w; px++) { const d = (px / w) * 2 - 1, h = hh * (1 - d * d); R(f, n ? '#ecd0a0' : '#e4c490', x0 + px, GY - h, 1, h); }
          const cx = x0 + w / 2;
          for (let i = 0; i < hh - 2; i++) { const xx = cx + Math.sin(i / 5) * 26 * (1 - i / hh); R(f, '#fffaf0', xx, GY - i, 2, 1); if (i % 12 === 6) { R(f, '#fffaf0', xx + 4, GY - i - 4, 3, 4); R(f, '#7a5230', xx + 5, GY - i - 7, 1, 3); } }
          R(f, '#fffaf0', cx - 6, GY - hh - 8, 12, 9); R(f, '#fffaf0', cx - 2, GY - hh - 13, 4, 5); R(f, '#7a5230', cx - 1, GY - hh - 19, 2, 6); R(f, '#7a5230', cx - 3, GY - hh - 17, 6, 1); R(f, '#5f86a8', cx - 1, GY - hh - 4, 3, 5);
        });
      });
      const mid = layer(211, (m) => {
        for (let i = 0; i < 12; i++) E.pessoa(m, 30 + i * 52 + (i % 3) * 7, ['#e8dcc0', '#c8b898', '#f4ecd8'][i % 3], 12 + (i % 2), { head: '#8a5a3a', pedra: i % 3 !== 1 });
        E.cruz(m, 110, 22, '#8a6a48'); E.mandacaru(m, 260, 24); E.cruz(m, 380, 26, '#8a6a48'); E.seca(m, 470, 18); E.cruz(m, 600, 20, '#8a6a48');
      });
      return { sky: sky(SKY.branco, x => sun(x, 60, 30, 15, '#fff6c8', '#ffffff', true)), layers: [{ c: far, s: .12 }, { c: mid, s: .45 }], ground: gnd('sertaoClaro') };
    },
    function () { // 3. Antônio das Mortes
      const far = layer(220, (f) => {
        const c = '#3e1630', c2 = '#55203c';
        E.mesa(f, 10, 110, 30, c, c2); E.mesa(f, 160, 56, 18, c, c2); E.mesa(f, 290, 150, 40, c, c2); E.mesa(f, 470, 70, 22, c, c2); E.mesa(f, 575, 80, 28, c, c2);
        [[350, 40], [50, 30]].forEach(([px, h]) => { // o matador de cangaceiro
          const y = GY - h, k = '#12060e';
          R(f, k, px - 4, y - 20, 11, 1); R(f, k, px - 1, y - 22, 5, 2); R(f, k, px, y - 19, 3, 3);
          for (let i = 0; i < 16; i++) R(f, k, px - 1 - i * .25, y - 16 + i, 5 + i * .5, 1);
          R(f, k, px + 6, y - 23, 1, 18);
        });
      });
      const mid = layer(221, (m) => {
        const d = '#2a1020';
        E.secaGrande(m, 60, 36, d); E.cruz(m, 130, 16, d); E.cruz(m, 146, 12, d); E.seca(m, 220, 22, d); E.mandacaru(m, 300, 28, d, d);
        E.cruz(m, 380, 18, d); E.secaGrande(m, 460, 42, d); E.caveira(m, 520); E.cruz(m, 570, 14, d); E.mandacaru(m, 630, 20, d, d);
      });
      return { sky: sky(SKY.rubro, x => { disc(x, '#ffd27a', 250, 100, 22); disc(x, '#fff3bd', 250, 100, 17); }), layers: [{ c: far, s: .12 }, { c: mid, s: .45 }], ground: gnd('sertaoRubro') };
    },
    function () { // 4. o sertão de Corisco
      const mid = layer(231, (m, r) => {
        for (let i = 0; i < 9; i++) E.mandacaru(m, 30 + i * 74 + r() * 20, 18 + r() * 16, '#9aae72', '#7e9458');
        for (let i = 0; i < 12; i++) E.xique(m, 12 + i * 55 + r() * 20, '#a8ba80');
        E.caveira(m, 200); E.caveira(m, 500); E.seca(m, 120, 20, '#b8a888'); E.seca(m, 420, 24, '#b8a888'); E.seca(m, 610, 18, '#b8a888');
      });
      return { sky: sky(SKY.branco, x => sun(x, 168, 40, 22, '#fffbe6', '#ffffff', true)), layers: [{ c: farMesas(230, '#f0dcb4', '#f8eccc', '#f4e4c0', '#fbf2d8'), s: .12 }, { c: mid, s: .45 }], ground: gnd('sertaoClaro') };
    },
    function () { // 5. o sertão vai virar mar
      const far = layer(240, (f, r) => {
        R(f, '#2a7ab8', 0, GY - 34, TW, 34); R(f, '#6ac0e0', 0, GY - 34, TW, 2); R(f, '#3a8ac4', 0, GY - 26, TW, 8);
        for (let i = 0; i < 90; i++) R(f, '#eaf8ff', r() * TW, GY - 30 + r() * 28, 3 + r() * 6, 1);
        [120, 430].forEach(px => { for (let i = 0; i < 10; i++) R(f, '#fffaf0', px + 4 - i * .3, GY - 44 + i, 1 + i * .8, 1); R(f, '#8a5a30', px - 2, GY - 34, 14, 2); });
      });
      const mid = layer(241, (m, r) => {
        for (let i = 0; i < 9; i++) { const px = i * 80 + r() * 20; disc(m, '#f0dca0', px, GY + 12, 22 + ((r() * 8) | 0)); }
        E.palmeira(m, 60, 40, '#a88a5a', '#4ca060', true); E.mandacaru(m, 150, 24); E.palmeira(m, 260, 48, '#a88a5a', '#4ca060', true); E.palmeira(m, 284, 34, '#a88a5a', '#4ca060', true);
        E.seca(m, 370, 18); E.palmeira(m, 450, 44, '#a88a5a', '#4ca060', true); E.mandacaru(m, 540, 20); E.palmeira(m, 620, 38, '#a88a5a', '#4ca060', true);
      });
      return {
        sky: sky(['#5ab4ec', '#8ed0f4', '#c8e8f4', '#f8ecc0'], x => sun(x, 252, 30, 15, '#fff3bd', '#ffffff', true)), layers: [{ c: far, s: .08 }, { c: mid, s: .45 }], ground: gnd('areia'),
        extras(ctx, t, scroll) { for (let k = 0; k < 3; k++) { const gx = W - ((t * .4 + k * 150 + scroll * .1) % (W + 40)), gy = 30 + k * 12 + Math.sin(t / 20 + k) * 3, up = Math.floor(t / 10 + k) % 2; R(ctx, '#ffffff', gx, gy - up, 3, 1); R(ctx, '#ffffff', gx + 4, gy - up, 3, 1); R(ctx, '#ffffff', gx + 3, gy, 1, 1); } }
      };
    }
  ];

  // ==================================================================
  //  CIDADE DE DEUS (2002)
  // ==================================================================
  function casinhas(m, r, walls, roof, o) {
    let x = 4, i = 0;
    while (x < TW - 34) {
      const w = 24 + ((r() * 8) | 0), h = 16 + ((r() * 5) | 0);
      if (o && o.skip && o.skip(i, x)) { x += 40; i++; continue; }
      E.casa(m, x, w, h, walls[i % walls.length], roof, { antena: i % 3 === 0, caixa: i % 4 === 1, lit: o && o.lit && i % 2 === 0 });
      x += w + 2 + ((r() * 10) | 0); i++;
    }
  }
  const pipa = (f, x, y, c) => { R(f, c, x, y, 1, 1); R(f, c, x - 1, y + 1, 3, 1); R(f, c, x - 2, y + 2, 5, 1); R(f, c, x - 1, y + 3, 3, 1); R(f, c, x, y + 4, 1, 1); for (let i = 0; i < 6; i++) R(f, '#fff', x + (i % 2), y + 5 + i * 2, 1, 1); };
  const CDD = [
    function () { // 1. anos 60: Trio Ternura
      const far = layer(300, (f, r) => { E.morros(f, '#e8b878', 20, 6, 3); E.telhados(f, r, '#d8a468'); pipa(f, 150, 22, '#d63031'); pipa(f, 500, 16, '#27ae60'); });
      const mid = layer(301, (m, r) => {
        casinhas(m, r, ['#f6e6b8', '#ecd198', '#f3dcae', '#fbf4e2'], '#b9603a', { skip: (i) => i === 3 || i === 11 });
        [118, 420].forEach(px => { // o caminhão de gás
          R(m, '#d8dce0', px, GY - 16, 14, 12); R(m, '#bfe0f0', px + 2, GY - 14, 7, 5); R(m, '#8a5a30', px + 14, GY - 8, 30, 4);
          for (let i = 0; i < 5; i++) { R(m, '#2e86de', px + 16 + i * 5, GY - 16, 4, 8); R(m, '#8ab8e8', px + 17 + i * 5, GY - 18, 2, 2); }
          disc(m, '#1a1022', px + 6, GY - 3, 3); disc(m, '#1a1022', px + 36, GY - 3, 3);
        });
        for (let px = 60; px < TW; px += 168) E.poste(m, px, 42, '#5a4636');
        E.fios(m, GY - 40, 168, 60, '#5a4636', 5);
      });
      return { sky: sky(SKY.cdd, x => { disc(x, '#fff1b0', 84, 84, 20); disc(x, '#fffbe0', 84, 84, 15); }), layers: [{ c: far, s: .12 }, { c: mid, s: .45 }], ground: gnd('terra'), extras: galinha };
    },
    function () { // 2. o motel
      const far = layer(310, (f, r) => { E.morros(f, '#1a2050', 26, 8, 4); for (let i = 0; i < 80; i++) R(f, r() < .5 ? '#ffd86b' : '#ff9e5e', r() * TW, GY - 4 - r() * 22, 1, 1); });
      const mid = layer(311, (m) => {
        [30, 370].forEach(px => {
          R(m, '#4a2a5a', px, GY - 22, 200, 22); R(m, '#6a3a7a', px, GY - 24, 200, 3); R(m, '#ff5fa8', px, GY - 21, 200, 1);
          for (let i = 0; i < 8; i++) { R(m, '#2a1838', px + 8 + i * 24, GY - 15, 8, 15); R(m, '#ffd86b', px + 18 + i * 24, GY - 14, 5, 5); R(m, '#ff5fa8', px + 10 + i * 24, GY - 18, 4, 1); }
          R(m, '#3a3a44', px + 96, GY - 58, 3, 36);
          R(m, '#ff5fa8', px + 70, GY - 62, 56, 18); R(m, '#1a0a20', px + 72, GY - 60, 52, 14); G.text(m, 'MOTEL', px + 79, GY - 58, '#ff7ec0', 2);
          R(m, '#ff3b3b', px + 132, GY - 60, 2, 2); R(m, '#ff3b3b', px + 136, GY - 60, 2, 2); R(m, '#ff3b3b', px + 131, GY - 58, 8, 2); R(m, '#ff3b3b', px + 133, GY - 56, 4, 1); R(m, '#ff3b3b', px + 134, GY - 55, 2, 1);
          E.fusca(m, px + 210, '#d8dce0'); E.palmeira(m, px + 250, 40, '#3a2a40', '#2a6a50'); E.fusca(m, px + 270, '#d63031');
        });
      });
      return { sky: sky(SKY.noite, (x, r) => { stars(x, r, 60, 70); moon(x, 60, 28, 9, '#3a4a9a'); }), layers: [{ c: far, s: .12 }, { c: mid, s: .45 }], ground: gnd('asfalto'), light: true };
    },
    function () { // 3. anos 70: os apês
      const far = layer(320, (f, r) => {
        [[30, 46, 40], [84, 46, 46], [220, 52, 36], [360, 46, 44], [414, 46, 38], [560, 60, 42]].forEach(b => E.bloco(f, b[0], b[1], b[2], '#d9a877', '#c4925f', '#8a6240', '#fff0b0'));
        pipa(f, 150, 22, '#d63031'); pipa(f, 330, 34, '#2e86de'); pipa(f, 500, 16, '#27ae60'); pipa(f, 640, 40, '#e84393');
      });
      const mid = layer(321, (m) => {
        [10, 240, 470].forEach((px, n) => {
          const w = 150, h = 56, c = ['#e4c090', '#d8b888', '#ecc898'][n];
          R(m, c, px, GY - h, w, h); R(m, '#b88656', px, GY - h, w, 3); R(m, 'rgba(60,30,10,.2)', px + w - 6, GY - h, 6, h);
          for (let row = 0; row < 3; row++) for (let col = 0; col < 8; col++) { const wx = px + 8 + col * 17, wy = GY - h + 8 + row * 16; R(m, '#6a5038', wx, wy, 9, 8); R(m, (row + col) % 3 ? '#5f86a8' : '#3a2a20', wx + 1, wy + 1, 7, 6); if ((row * 3 + col) % 5 === 0) R(m, ['#d63031', '#fff', '#2e86de'][col % 3], wx, wy + 8, 9, 3); }
          R(m, '#7fa3b8', px + 60, GY - h - 8, 12, 8); R(m, '#5a4a3a', px + 20, GY - h - 12, 1, 12); R(m, '#5a4a3a', px + 17, GY - h - 12, 7, 1);
          G.text(m, 'CDD', px + w + 12, GY - 14, '#d63031', 2); R(m, '#c8b090', px + w + 6, GY - 20, 50, 20); G.text(m, 'CDD', px + w + 18, GY - 16, '#d63031', 2);
        });
      });
      return { sky: sky(SKY.apes, x => disc(x, '#fffbe0', 250, 30, 12)), layers: [{ c: far, s: .12 }, { c: mid, s: .45 }], ground: gnd('terra'), extras: galinha };
    },
    function () { // 4. o baile do Bené
      const far = layer(330, (f) => { [[30, 46, 40], [84, 46, 46], [220, 52, 36], [360, 46, 44], [414, 46, 38], [560, 60, 42]].forEach(b => E.bloco(f, b[0], b[1], b[2], '#2a2050', '#1e1640', '#1a1236', '#ffd86b')); });
      const mid = layer(331, (m, r) => {
        R(m, '#3a2a5a', 0, GY - 34, TW, 34); R(m, '#5a4a8a', 0, GY - 36, TW, 2);
        for (let px = 20; px < TW; px += 224) { // caixas de som e globo
          [0, 14].forEach(d => { R(m, '#14101e', px + d, GY - 30, 12, 30); disc(m, '#4a4458', px + d + 6, GY - 22, 4); disc(m, '#4a4458', px + d + 6, GY - 9, 5); disc(m, '#14101e', px + d + 6, GY - 9, 2); });
          R(m, '#c8ccd0', px + 110, GY - 62, 1, 12); disc(m, '#c8ccd0', px + 110, GY - 46, 5); R(m, '#ffffff', px + 108, GY - 49, 2, 2); R(m, '#8a8e92', px + 111, GY - 45, 3, 3);
          E.bandeirinhas(m, px + 30, px + 105, GY - 56); E.bandeirinhas(m, px + 116, px + 210, GY - 56);
        }
        for (let i = 0; i < 46; i++) { const px = 34 + i * 14 + r() * 6; if ((px % 224) < 30) continue; E.pessoa(m, px, ['#1e1640', '#2a2050', '#14101e'][i % 3], 11 + ((r() * 4) | 0)); if (i % 4 === 0) R(m, '#1e1640', px + 4, GY - 14, 1, 5); }
      });
      const cols = ['255,80,160', '80,200,255', '255,220,80', '120,255,140', '200,120,255'];
      return {
        sky: sky(SKY.roxo, (x, r) => stars(x, r, 50, 60)), layers: [{ c: far, s: .12 }, { c: mid, s: .45 }], ground: gnd('quadra'), light: true,
        extras(ctx, t) {
          for (let k = 0; k < 5; k++) {
            const bx = (k * 70 + Math.sin(t / 40 + k * 1.7) * 40 + 30), on = Math.floor(t / 14 + k) % 3;
            if (!on) continue;
            ctx.fillStyle = 'rgba(' + cols[(k + Math.floor(t / 30)) % 5] + ',.13)';
            ctx.beginPath(); ctx.moveTo(bx, 0); ctx.lineTo(bx - 26, GY); ctx.lineTo(bx + 26, GY); ctx.fill();
          }
          for (let k = 0; k < 14; k++) { const h = (k * 97 + Math.floor(t / 5) * 31) % 1000; R(ctx, '#ffffff', (h * 7) % W, 20 + (h * 13) % 80, 1, 1); }
        }
      };
    },
    function () { // 5. a guerra
      const far = layer(340, (f) => { [[30, 46, 40], [84, 46, 46], [220, 52, 36], [360, 46, 44], [414, 46, 38], [560, 60, 42]].forEach(b => E.bloco(f, b[0], b[1], b[2], '#4a2430', '#3a1a26', '#2a1018', '#ff9e5e')); });
      const mid = layer(341, (m, r) => {
        casinhas(m, r, ['#8a5a50', '#7a5048', '#96645a', '#6e463e'], '#4a2a22', { skip: (i) => i % 5 === 2 });
        for (let i = 0; i < 40; i++) R(m, '#1a0a10', r() * TW, GY - 4 - r() * 14, 1, 1); // marcas de bala
        [130, 300, 470, 640].forEach(px => { for (let k = 0; k < 3; k++) { disc(m, '#14101e', px - 8 + k * 8, GY - 3, 3); disc(m, '#3a3440', px - 8 + k * 8, GY - 3, 1); } R(m, '#6b4a2b', px - 12, GY - 9, 26, 2); });
      });
      const fogos = [150, 320, 490, 660];
      return {
        sky: sky(['#2e1a2e', '#6e2a34', '#b85238', '#f09a48']), layers: [{ c: far, s: .12 }, { c: mid, s: .45 }], ground: gnd('terraRubra'),
        extras(ctx, t, scroll) { fumaca(ctx, t, scroll, .45, fogos); galinha(ctx, t * 1.6, scroll); }
      };
    }
  ];

  // ==================================================================
  //  À MEIA-NOITE LEVAREI SUA ALMA (1964)
  // ==================================================================
  const vilaFar = (seed, c, lit) => layer(seed, (f, r) => {
    E.morros(f, c, 24, 8, 4); E.telhados(f, r, c, lit);
    E.igreja(f, 300, c, c, { dark: lit || c, cross: c, door: c });
  });
  const ZE = [
    function () { // 1. sexta-feira santa
      const velasPts = [];
      const mid = layer(401, (m) => {
        const ws = ['#6a5068', '#5a4860', '#74586a', '#4e4058'];
        for (let i = 0; i < 9; i++) E.sobrado(m, 6 + i * 74, 40 + (i % 3) * 8, 26 + (i % 2) * 6, ws[i % 4], '#2a2038', { lit: i % 2 === 0, door: '#2a1a20', win: '#2a2038' });
        for (let i = 0; i < 20; i++) { const px = 14 + i * 33; E.pessoa(m, px, i % 5 === 2 ? '#e8e0f0' : '#14101e', 12, { capuz: true, vela: true }); velasPts.push([px + 4, GY - 9]); }
        [200, 530].forEach(px => { R(m, '#3a2a20', px, GY - 30, 2, 22); R(m, '#3a2a20', px - 5, GY - 26, 12, 2); }); // o andor com a cruz
      });
      return {
        sky: sky(SKY.vila, (x, r) => stars(x, r, 24, 30)), layers: [{ c: vilaFar(400, '#2a1a40', '#ffb347'), s: .12 }, { c: mid, s: .45 }], ground: gnd('pedraNoite'), light: true,
        extras(ctx, t, scroll) { velas(ctx, t, scroll, .45, velasPts); }
      };
    },
    function () { // 2. a taberna
      const mid = layer(411, (m) => {
        [40, 380].forEach(px => {
          R(m, '#5a3a24', px, GY - 34, 130, 34); R(m, '#3f2816', px - 2, GY - 38, 134, 5); for (let i = 0; i < 13; i++) R(m, '#4a2e1a', px + i * 10, GY - 33, 1, 33);
          E.placa(m, px + 34, GY - 52, 'TABERNA', '#2a1a10', '#ffd86b', 2); R(m, '#3f2816', px + 40, GY - 40, 1, 3); R(m, '#3f2816', px + 90, GY - 40, 1, 3);
          R(m, '#2a1a10', px + 56, GY - 18, 14, 18); R(m, '#ffb347', px + 58, GY - 16, 10, 16);
          [14, 34, 84, 106].forEach(d => { R(m, '#2a1a10', px + d, GY - 24, 12, 10); R(m, '#ffd86b', px + d + 1, GY - 23, 10, 8); R(m, '#2a1a10', px + d + 5, GY - 23, 1, 8); });
          E.barril(m, px + 136); E.barril(m, px + 146);
          R(m, '#8a5a30', px + 141, GY - 20, 8, 10); R(m, '#5a3a1c', px + 141, GY - 18, 8, 1);
          E.lampiao(m, px - 14, 30, '#2a2038'); E.lampiao(m, px + 170, 30, '#2a2038');
          E.pessoa(m, px + 186, '#14101e', 13, { chapeu: '#14101e' }); E.pessoa(m, px + 200, '#2a2038', 12);
        });
        E.sobrado(m, 250, 50, 28, '#4e4058', '#2a2038', { lit: true, door: '#2a1a20' }); E.sobrado(m, 590, 60, 26, '#5a4860', '#2a2038', { door: '#2a1a20', win: '#2a2038' });
      });
      return { sky: sky(SKY.roxo, (x, r) => { stars(x, r, 60, 70); moon(x, 280, 26, 8, '#5b3f8a'); }), layers: [{ c: vilaFar(410, '#241640', '#ffb347'), s: .12 }, { c: mid, s: .45 }], ground: gnd('pedraNoite'), light: true };
    },
    function () { // 3. a funerária
      const mid = layer(421, (m) => {
        [30, 370].forEach(px => {
          R(m, '#3e3450', px, GY - 36, 150, 36); R(m, '#221a30', px - 2, GY - 40, 154, 5);
          E.placa(m, px + 34, GY - 54, 'FUNERARIA', '#14101e', '#e8e0f0', 2);
          R(m, '#14101e', px + 8, GY - 28, 60, 28); R(m, '#5a5070', px + 10, GY - 26, 56, 24); // vitrine
          E.caixao(m, px + 14); E.caixao(m, px + 28, '#3f2816'); E.caixao(m, px + 42); E.caixao(m, px + 56, '#14101e');
          R(m, '#14101e', px + 80, GY - 20, 14, 20); R(m, '#ffb347', px + 82, GY - 18, 10, 18);
          [108, 128].forEach(d => { disc(m, '#3f8a5a', px + d + 5, GY - 20, 6); disc(m, '#3e3450', px + d + 5, GY - 20, 3); R(m, '#d63031', px + d + 3, GY - 27, 4, 2); R(m, '#e8e0f0', px + d + 2, GY - 13, 6, 1); });
          E.caixao(m, px + 162); E.caixao(m, px + 174, '#3f2816'); E.lampiao(m, px + 196, 30, '#2a2038');
          // carro fúnebre
          R(m, '#14101e', px + 224, GY - 18, 40, 13); R(m, '#5a5070', px + 228, GY - 16, 22, 7); R(m, '#e8d8a0', px + 238, GY - 15, 2, 5); R(m, '#e8d8a0', px + 236, GY - 13, 6, 1);
          disc(m, '#14101e', px + 232, GY - 4, 4); disc(m, '#5a5070', px + 232, GY - 4, 2); disc(m, '#14101e', px + 256, GY - 4, 4); disc(m, '#5a5070', px + 256, GY - 4, 2);
        });
      });
      return { sky: sky(SKY.roxo, (x, r) => { stars(x, r, 60, 70); moon(x, 60, 30, 14, '#5b3f8a'); }), layers: [{ c: vilaFar(420, '#241640', '#ffb347'), s: .12 }, { c: mid, s: .45 }], ground: gnd('pedraNoite'), light: true, extras: morcegos };
    },
    function () { // 4. a profecia
      const far = layer(430, (f, r) => { for (let px = 0; px < TW; px += 14) { const h = 50 + r() * 34; R(f, '#0e1a22', px + 5, GY - h, 3, h); disc(f, '#0e1a22', px + 6, GY - h, 9 + ((r() * 5) | 0)); } R(f, '#0e1a22', 0, GY - 30, TW, 30); });
      const olhos = [];
      const mid = layer(431, (m) => {
        const d = '#05090c';
        [40, 150, 300, 440, 590].forEach((px, i) => { E.secaGrande(m, px, 44 + (i % 3) * 8, d); R(m, d, px - 2, GY - 12, 7, 12); olhos.push([px - 6 - (i % 2) * 3, GY - 40 - (i % 3) * 6]); });
        [220, 520].forEach(px => { // a tenda da cigana
          for (let i = 0; i < 20; i++) R(m, i % 4 < 2 ? '#5a1a3a' : '#7a2a4a', px + 20 - i, GY - 20 + i, i * 2, 1);
          R(m, '#ffb347', px + 16, GY - 8, 8, 8); R(m, '#05090c', px + 19, GY - 26, 2, 6);
          R(m, '#e8e0d0', px + 44, GY - 8, 5, 5); R(m, '#e8e0d0', px + 45, GY - 3, 3, 1); R(m, '#05090c', px + 45, GY - 7, 1, 2); R(m, '#05090c', px + 47, GY - 7, 1, 2);
          E.pessoa(m, px + 30, '#3a1028', 11, { capuz: true, head: '#c8a888' });
        });
        // teias
        [[100, 30], [380, 36]].forEach(([px, y]) => { for (let i = 0; i < 10; i++) { R(m, 'rgba(220,230,240,.5)', px + i, GY - y - i, 1, 1); R(m, 'rgba(220,230,240,.5)', px + i, GY - y, 1, 1); R(m, 'rgba(220,230,240,.5)', px + 9, GY - y - i, 1, 1); } });
      });
      return {
        sky: sky(SKY.breu, (x, r) => { stars(x, r, 30, 40); moon(x, 250, 30, 10, '#1e3a48'); }), layers: [{ c: far, s: .15 }, { c: mid, s: .45 }], ground: gnd('folhas'), light: true,
        extras(ctx, t, scroll) {
          olhos.forEach((p, i) => { const ox = onLayer(scroll, .45, p[0]); if (ox > -4 && ox < W && Math.floor(t / 50 + i * 1.3) % 4) { R(ctx, '#ffe04a', ox, p[1], 1, 1); R(ctx, '#ffe04a', ox + 3, p[1], 1, 1); } });
          nevoa(ctx, t, scroll, 'rgba(180,220,210,.10)');
        }
      };
    },
    function () { // 5. à meia-noite
      const far = layer(440, (f) => {
        f.fillStyle = '#2c1c52';
        for (let px = 0; px < TW; px++) { const a = px / TW * Math.PI * 2, h = Math.round(22 + Math.sin(a * 3) * 9 + Math.sin(a * 7 + 1) * 4); f.fillRect(px, GY - h, 1, h); if (px % 37 === 5) { f.fillRect(px, GY - h - 6, 1, 6); f.fillRect(px - 1, GY - h - 4, 3, 1); } }
        R(f, '#2c1c52', 420, GY - 50, 18, 30); R(f, '#2c1c52', 426, GY - 60, 6, 10); R(f, '#2c1c52', 428, GY - 68, 2, 8); R(f, '#2c1c52', 426, GY - 65, 6, 1); R(f, '#ffd23f', 427, GY - 44, 3, 5);
      });
      const mid = layer(441, (m) => {
        const c = '#857ba3', d = '#62597f', k = '#1c1130';
        R(m, k, 0, GY - 9, TW, 1); R(m, k, 0, GY - 3, TW, 1); for (let px = 0; px < TW; px += 4) R(m, k, px, GY - 12, 1, 12);
        E.lapide(m, 30, 14, c, d); E.cruz(m, 70, 20, c, d); E.secaGrande(m, 120, 40, k); E.lapide(m, 160, 12, c, d); E.lapide(m, 178, 16, c, d); E.cruz(m, 240, 24, c, d); E.lapide(m, 290, 13, c, d);
        E.secaGrande(m, 350, 34, k); E.cruz(m, 400, 18, c, d); E.lapide(m, 440, 15, c, d); E.cruz(m, 540, 22, c, d); E.secaGrande(m, 600, 44, k); E.lapide(m, 645, 14, c, d);
        // a cripta
        R(m, c, 474, GY - 26, 34, 26); R(m, d, 502, GY - 26, 6, 26); for (let i = 0; i < 9; i++) R(m, c, 491 - i * 2, GY - 35 + i, i * 4, 1); R(m, k, 484, GY - 16, 12, 16); R(m, c, 489, GY - 44, 3, 10); R(m, c, 486, GY - 41, 9, 2);
      });
      return {
        sky: sky(SKY.roxo, (x, r) => { stars(x, r, 70, 80); moon(x, 262, 36, 21, '#5b3f8a'); }), layers: [{ c: far, s: .1 }, { c: mid, s: .45 }], ground: gnd('cemiterio'), light: true,
        extras(ctx, t, scroll) {
          morcegos(ctx, t, scroll);
          // a procissão dos mortos
          const base = W + 40 - ((t * .3 + scroll * .5) % (W + 420));
          for (let k = 0; k < 7; k++) {
            const gx = Math.round(base + k * 15), gy = GY - 16 + Math.round(Math.sin(t / 16 + k) * 1.5);
            ctx.fillStyle = 'rgba(210,225,255,.30)'; ctx.fillRect(gx, gy + 3, 5, 12); ctx.fillRect(gx + 1, gy, 3, 3);
            if ((t + k * 5) % 14 < 10) R(ctx, '#fff3bd', gx - 1, gy + 5, 1, 2);
          }
          nevoa(ctx, t, scroll);
        }
      };
    }
  ];

  // ==================================================================
  //  O AUTO DA COMPADECIDA (2000)
  // ==================================================================
  const TAP = ['#f4a8b0', '#8fc8e8', '#f8d878', '#a8d8a0', '#f0b890', '#fbf4e2', '#c8a8e0'];
  function casario(m, x0, x1, o) {
    o = o || {};
    for (let x = x0, i = o.i0 || 0; x < x1 - 30; i++) {
      const w = 30 + (i % 3) * 8, h = 24 + (i % 2) * 6;
      E.sobrado(m, x, w, h, (o.walls || TAP)[i % (o.walls || TAP).length], o.trim || '#ffffff', { door: i % 2 ? '#3a6a8a' : '#6b4226', win: o.win, lit: o.lit && i % 2 === 0 });
      x += w + 3;
    }
  }
  const farTaperoa = (seed, c, c2, ch) => layer(seed, (f, r) => { E.mesa(f, 20, 120, 26, c, c2); E.mesa(f, 250, 90, 34, c, c2); E.mesa(f, 470, 140, 24, c, c2); E.telhados(f, r, ch); });
  const AUTO = [
    function () { // 1. Taperoá
      const mid = layer(501, (m) => {
        casario(m, 4, 300);
        // o cinema da cidade
        R(m, '#fbf4e2', 306, GY - 40, 62, 40); R(m, '#d63031', 304, GY - 44, 66, 5); R(m, '#d63031', 312, GY - 48, 50, 4);
        E.placa(m, 319, GY - 38, 'CINE', '#1a1022', '#ffd23f', 2); R(m, '#6b4226', 330, GY - 16, 14, 16);
        R(m, '#f8d878', 310, GY - 22, 14, 18); R(m, '#8a5a30', 313, GY - 19, 8, 8); R(m, '#f8d878', 350, GY - 22, 14, 18); R(m, '#5f86a8', 353, GY - 19, 8, 8);
        casario(m, 376, TW, { i0: 2 });
        E.bandeirinhas(m, 20, 150, GY - 46); E.bandeirinhas(m, 160, 300, GY - 46); E.bandeirinhas(m, 380, 520, GY - 46); E.bandeirinhas(m, 530, 660, GY - 46);
      });
      return { sky: sky(SKY.taperoa, x => sun(x, 262, 30, 13, '#fff3bd', '#ffffff', true)), layers: [{ c: farTaperoa(500, '#e8c898', '#f2d8ac', '#e0b888'), s: .12 }, { c: mid, s: .45 }], ground: gnd('terraClara') };
    },
    function () { // 2. o enterro da cachorra
      const mid = layer(511, (m) => {
        [60, 400].forEach(px => {
          E.igreja(m, px, '#fbf4e2', '#5f9ac8');
          E.pessoa(m, px + 54, '#14101e', 14, { head: '#e8bb94' }); R(m, '#ffffff', px + 54, GY - 11, 3, 1); // o padre
          // a covinha da cachorra
          disc(m, '#b98450', px + 86, GY, 7); R(m, '#8a5a30', px + 85, GY - 14, 2, 9); R(m, '#8a5a30', px + 82, GY - 11, 8, 2);
          [[78, '#d63031'], [92, '#ffd23f'], [95, '#ff7eb6']].forEach(fl => { R(m, '#3f8a5a', px + fl[0], GY - 5, 1, 4); R(m, fl[1], px + fl[0] - 1, GY - 7, 3, 2); });
          R(m, '#f4ecd8', px + 100, GY - 2, 6, 1); R(m, '#f4ecd8', px + 99, GY - 3, 2, 3); R(m, '#f4ecd8', px + 105, GY - 3, 2, 3); // o osso
        });
        casario(m, 180, 390, { i0: 1 }); casario(m, 520, TW, { i0: 4 });
      });
      return { sky: sky(SKY.taperoa, x => { cloud(x, 40, 24, '#ffffff'); cloud(x, 200, 14, '#ffffff'); }), layers: [{ c: farTaperoa(510, '#e8c898', '#f2d8ac', '#e0b888'), s: .12 }, { c: mid, s: .45 }], ground: gnd('terraClara') };
    },
    function () { // 3. o gato que descome dinheiro
      const mid = layer(521, (m) => {
        [40, 380].forEach(px => {
          R(m, '#f8d878', px, GY - 36, 96, 36); R(m, '#ffffff', px - 1, GY - 38, 98, 2); R(m, '#ffffff', px + 2, GY - 40, 92, 2);
          E.placa(m, px + 18, GY - 54, 'PADARIA', '#8a3a1a', '#fff3bd', 2);
          R(m, '#6b4226', px + 6, GY - 16, 10, 16); R(m, '#ffffff', px + 22, GY - 24, 66, 18); R(m, '#bfe0f0', px + 24, GY - 22, 62, 14);
          for (let i = 0; i < 7; i++) { R(m, '#d8943c', px + 27 + i * 8, GY - 13, 6, 3); R(m, '#b8742c', px + 28 + i * 8, GY - 12, 1, 1); R(m, '#e8b45c', px + 27 + i * 8, GY - 19, 5, 3); }
          // muro, gato e moedas
          R(m, '#e0b890', px + 104, GY - 14, 44, 14); R(m, '#c89868', px + 104, GY - 15, 44, 2);
          const gx = px + 118; R(m, '#f0f0f0', gx, GY - 21, 9, 6); R(m, '#f0f0f0', gx - 3, GY - 24, 5, 5); R(m, '#f0f0f0', gx - 3, GY - 26, 1, 2); R(m, '#f0f0f0', gx + 1, GY - 26, 1, 2);
          R(m, '#1a1022', gx - 2, GY - 23, 1, 1); R(m, '#1a1022', gx, GY - 23, 1, 1); R(m, '#3a3a44', gx + 5, GY - 21, 3, 3); R(m, '#f0f0f0', gx + 9, GY - 26, 1, 7);
          [[12, 12], [14, 8], [11, 4], [15, 1]].forEach(c => { R(m, '#ffd23f', gx + c[0], GY - c[1], 2, 2); R(m, '#b8860b', gx + c[0] + 1, GY - c[1] + 1, 1, 1); });
        });
        casario(m, 196, 370, { i0: 3 }); casario(m, 536, TW, { i0: 5 });
      });
      return { sky: sky(['#9ed0e8', '#c4e0e0', '#f0e4c0', '#fbd898'], x => disc(x, '#fff7d0', 70, 44, 13)), layers: [{ c: farTaperoa(520, '#e8c898', '#f2d8ac', '#e0b888'), s: .12 }, { c: mid, s: .45 }], ground: gnd('terraClara') };
    },
    function () { // 4. Severino de Aracaju
      const mid = layer(531, (m) => {
        casario(m, 4, TW, { walls: ['#a8605a', '#8a5058', '#b87858', '#7e4a50', '#9a6460'], trim: '#3a1a26', win: '#2a1018' });
        const k = '#1a0a14';
        [50, 130, 148, 270, 400, 416, 530, 640].forEach((px, i) => E.pessoa(m, px, k, 14, { chapeu: k, rifle: i % 2 === 0 })); // o bando
        [220, 580].forEach(px => { R(m, '#f5c518', px, GY - 22, 1, 1); for (let i = 0; i < 5; i++) R(m, '#ff7a1a', px - 2 + i, GY - 8 - (i % 2) * 2, 1, 4); R(m, '#6b4a2b', px - 3, GY - 3, 8, 3); });
      });
      return { sky: sky(SKY.rubro, x => { disc(x, '#ffd27a', 80, 96, 20); disc(x, '#fff3bd', 80, 96, 15); }), layers: [{ c: farTaperoa(530, '#3e1630', '#55203c', '#3e1630'), s: .12 }, { c: mid, s: .45 }], ground: gnd('sertaoRubro') };
    },
    function () { // 5. o julgamento
      const far = layer(540, (f, r) => {
        for (let i = 0; i < 26; i++) { const px = r() * TW, py = GY - 10 - r() * 50; disc(f, '#fffdf4', px, py, 8 + ((r() * 8) | 0)); disc(f, '#fffdf4', px + 12, py + 4, 6 + ((r() * 5) | 0)); }
        R(f, '#fffdf4', 0, GY - 12, TW, 12);
        // a Compadecida
        [150, 486].forEach(px => {
          disc(f, '#ffe680', px + 5, GY - 60, 7); disc(f, '#fff8d8', px + 5, GY - 60, 5);
          for (let i = 0; i < 26; i++) R(f, '#3f7ad0', px + 3 - i * .35, GY - 62 + i, 5 + i * .7, 1);
          R(f, '#fbf4e2', px + 3, GY - 54, 5, 18); R(f, '#b97a4a', px + 4, GY - 60, 3, 4); R(f, '#ffd23f', px + 3, GY - 64, 5, 2);
        });
        // Manuel, o juiz
        [250].forEach(px => { disc(f, '#ffe680', px + 4, GY - 54, 6); for (let i = 0; i < 22; i++) R(f, '#fbf4e2', px + 2 - i * .25, GY - 50 + i, 5 + i * .5, 1); R(f, '#5e3822', px + 2, GY - 56, 4, 5); R(f, '#d63031', px + 1, GY - 46, 7, 2); });
        // o Encourado
        [360].forEach(px => { disc(f, '#ff7a1a', px + 4, GY - 26, 12); disc(f, '#ffd23f', px + 4, GY - 24, 7); for (let i = 0; i < 20; i++) R(f, '#3a1410', px + 2 - i * .2, GY - 46 + i, 5 + i * .4, 1); R(f, '#3a1410', px, GY - 52, 8, 2); R(f, '#3a1410', px + 2, GY - 54, 4, 2); R(f, '#8a2a1a', px + 2, GY - 50, 4, 4); R(f, '#ffe04a', px + 2, GY - 49, 1, 1); R(f, '#ffe04a', px + 5, GY - 49, 1, 1); R(f, '#3a1410', px, GY - 56, 1, 3); R(f, '#3a1410', px + 7, GY - 56, 1, 3); });
      });
      const mid = layer(541, (m, r) => {
        for (let px = 30; px < TW; px += 112) { R(m, '#fffdf4', px, GY - 50, 8, 50); R(m, '#e0d8c0', px + 6, GY - 50, 2, 50); R(m, '#fffdf4', px - 3, GY - 54, 14, 4); R(m, '#fffdf4', px - 2, GY - 4, 12, 4); R(m, '#e0d8c0', px + 2, GY - 48, 1, 42); }
        for (let i = 0; i < 16; i++) { const px = r() * TW; disc(m, '#ffffff', px, GY - 2, 6 + ((r() * 5) | 0)); disc(m, '#eef4ff', px + 8, GY, 5); }
      });
      return {
        sky: sky(SKY.ceu, x => { for (let k = 0; k < 9; k++) { x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.moveTo(168, -20); x.lineTo(k * 44 - 20, GY); x.lineTo(k * 44, GY); x.fill(); } }), layers: [{ c: far, s: .15 }, { c: mid, s: .45 }], ground: gnd('nuvem'),
        extras(ctx, t) { for (let k = 0; k < 16; k++) { const h = (k * 131 + Math.floor(t / 9) * 17) % 997; if (h % 3 === 0) { const sx = (h * 5) % W, sy = (h * 3) % 100; R(ctx, '#ffffff', sx, sy, 1, 3); R(ctx, '#ffffff', sx - 1, sy + 1, 3, 1); } } }
      };
    }
  ];

  // ==================================================================
  //  CENTRAL DO BRASIL (1998)
  // ==================================================================
  function farCidade(seed, cs, win, litP, tower) {
    return layer(seed, (f, r) => {
      for (let x = 0; x < TW;) { const w = 14 + ((r() * 18) | 0), h = 22 + ((r() * 34) | 0); E.predio(f, x, w, h, cs[(r() * cs.length) | 0], win, r, litP); x += w + ((r() * 6) | 0); }
      if (tower) { // a torre do relógio da Central
        const x = 310, c = '#e4d7b6', d = '#c7b890';
        R(f, c, x, GY - 50, 30, 50); R(f, d, x + 24, GY - 50, 6, 50); R(f, c, x + 4, GY - 72, 22, 22); R(f, d, x + 21, GY - 72, 5, 22);
        R(f, c, x + 7, GY - 96, 16, 24); R(f, d, x + 19, GY - 96, 4, 24); R(f, c, x + 10, GY - 104, 10, 8); R(f, c, x + 13, GY - 110, 4, 6);
        for (let k = 0; k < 5; k++) R(f, d, x + 4 + k * 5, GY - 46, 2, 40);
        for (let k = 0; k < 3; k++) R(f, d, x + 8 + k * 5, GY - 68, 2, 14);
        disc(f, '#3a3a44', x + 15, GY - 86, 6); disc(f, '#ffffff', x + 15, GY - 86, 5); R(f, '#1a1022', x + 15, GY - 90, 1, 5); R(f, '#1a1022', x + 15, GY - 86, 3, 1);
      }
    });
  }
  const DORA = [
    function () { // 1. Central do Brasil
      const mid = layer(601, (m) => {
        R(m, '#56616b', 0, GY - 52, TW, 4); R(m, '#6d7a85', 0, GY - 53, TW, 1); R(m, '#3f4850', 0, GY - 48, TW, 1);
        for (let px = 20; px < TW; px += 84) { R(m, '#6d7a85', px, GY - 48, 4, 48); R(m, '#56616b', px + 3, GY - 48, 1, 48); R(m, '#6d7a85', px - 4, GY - 48, 12, 3); }
        const placa = (px, t) => { const w = G.textWidth(t) + 6; R(m, '#1f4e8c', px, GY - 44, w, 9); R(m, '#ffffff', px, GY - 44, w, 1); G.text(m, t, px + 3, GY - 42, '#ffffff'); };
        placa(34, 'CENTRAL DO BRASIL'); placa(370, 'CENTRAL DO BRASIL'); placa(230, 'PLATAFORMA 3'); placa(560, 'CARTAS');
        [146, 580].forEach(px => { // a banca da escrevedora
          R(m, '#8d6e4a', px, GY - 12, 20, 2); R(m, '#6f5436', px + 2, GY - 10, 2, 10); R(m, '#6f5436', px + 16, GY - 10, 2, 10); R(m, '#fffdf0', px + 6, GY - 14, 5, 2); R(m, '#fffdf0', px + 12, GY - 15, 4, 3);
          E.pessoa(m, px + 24, '#7a6a8a', 12, { head: '#8a5a3a' }); E.pessoa(m, px + 32, '#b85a4a', 13, { head: '#e8bb94' }); E.pessoa(m, px + 40, '#5a7a6a', 11, { head: '#5e3822' });
        });
        for (let px = 300; px < TW; px += 190) { R(m, '#7a8792', px, GY - 8, 18, 2); R(m, '#56616b', px + 2, GY - 6, 2, 6); R(m, '#56616b', px + 14, GY - 6, 2, 6); }
      });
      return {
        sky: sky(SKY.central, x => { cloud(x, 40, 22, '#f7fbfd'); cloud(x, 230, 12, '#f7fbfd'); }), layers: [{ c: farCidade(600, ['#93abbe', '#a3b8c8', '#869fb3'], '#c9dbe6', 0, true), s: .1 }, { c: mid, s: .45 }], ground: gnd('plataforma'),
        extras(ctx, t, scroll) { trem(ctx, t, scroll, GY - 30); }, extrasBehindMid: true
      };
    },
    function () { // 2. o trem do subúrbio
      const mid = layer(611, (m, r) => {
        R(m, '#8a7a70', 0, GY - 16, TW, 16); R(m, '#6a5a52', 0, GY - 17, TW, 2); // o muro da linha
        ['SUBURBIO', 'JOSUE', 'RIO', 'SAUDADE'].forEach((t, i) => G.text(m, t, 40 + i * 170, GY - 12, ['#d63031', '#2e86de', '#27ae60', '#ffd23f'][i], 2));
        for (let px = 30; px < TW; px += 112) { R(m, '#4a4a54', px, GY - 60, 3, 60); R(m, '#4a4a54', px - 10, GY - 58, 24, 2); R(m, '#4a4a54', px - 10, GY - 58, 1, 6); R(m, '#4a4a54', px + 13, GY - 58, 1, 6); }
        E.fios(m, GY - 52, 112, 30, '#3a3a44', 3); E.fios(m, GY - 56, 112, 30, '#3a3a44', 2);
        [200, 540].forEach(px => { R(m, '#3a3a44', px, GY - 34, 2, 18); R(m, '#1a1022', px - 2, GY - 44, 6, 10); R(m, '#ff3b3b', px, GY - 42, 2, 2); R(m, '#3ddc84', px, GY - 38, 2, 2); });
        for (let i = 0; i < 20; i++) R(m, '#7a7068', r() * TW, GY - 15 + r() * 12, 4, 1);
      });
      return {
        sky: sky(SKY.tarde, x => { disc(x, '#ffd8a0', 270, 86, 16); disc(x, '#fff0d0', 270, 86, 12); }), layers: [{ c: farCidade(610, ['#5a5a80', '#68648c', '#4e5078'], '#3e3e60', .35), s: .1 }, { c: mid, s: .45 }], ground: gnd('brita'),
        extras(ctx, t, scroll) { trem(ctx, t, scroll, GY - 40, 1.4); }, extrasBehindMid: true
      };
    },
    function () { // 3. a estrada
      const mid = layer(621, (m) => {
        for (let px = 50; px < TW; px += 150) E.poste(m, px, 44, '#6a5a4a');
        E.fios(m, GY - 42, 150, 50, '#6a5a4a', 6);
        const sign = (px, t) => { R(m, '#8a8e92', px + 10, GY - 22, 2, 22); const w = E.placa(m, px, GY - 34, t, '#1f7a3c', '#ffffff'); R(m, '#ffffff', px, GY - 34, w, 1); };
        sign(90, 'BOM JESUS 300'); sign(430, 'BOM JESUS 50');
        [200, 540].forEach(px => { // parada de caminhoneiro
          R(m, '#f4ecd8', px, GY - 20, 54, 20); R(m, '#b9603a', px - 2, GY - 24, 58, 5); E.placa(m, px + 8, GY - 38, 'PARADA', '#d63031', '#ffffff', 2);
          R(m, '#6b4226', px + 6, GY - 12, 7, 12); R(m, '#3a2a20', px + 20, GY - 14, 26, 8);
          // o caminhão
          R(m, '#2e86de', px + 70, GY - 20, 14, 16); R(m, '#bfe0f0', px + 72, GY - 18, 8, 6); R(m, '#c8ccd0', px + 84, GY - 26, 44, 22); R(m, '#a0a4a8', px + 84, GY - 26, 44, 2);
          disc(m, '#1a1022', px + 76, GY - 3, 3); disc(m, '#1a1022', px + 98, GY - 3, 3); disc(m, '#1a1022', px + 118, GY - 3, 3);
        });
        E.mandacaru(m, 30, 22); E.mandacaru(m, 360, 28); E.seca(m, 400, 16); E.mandacaru(m, 660, 20);
      });
      return {
        sky: sky(SKY.azul, x => sun(x, 80, 30, 13, '#fff3bd', '#ffffff', true)), layers: [{ c: farMesas(620, '#d8b888', '#e6caa0', '#dcc090', '#ead2a8'), s: .12 }, { c: mid, s: .45 }], ground: gnd('asfalto'),
        extras(ctx, t, scroll) { // o ônibus ao longe
          const bx = W + 30 - ((t * 1.1 + scroll * .3) % (W + 700)), by = GY - 16;
          R(ctx, '#f4ecd8', bx, by, 40, 13); R(ctx, '#d63031', bx, by + 7, 40, 2); for (let i = 0; i < 6; i++) R(ctx, '#5f86a8', bx + 3 + i * 6, by + 2, 4, 4);
          disc(ctx, '#1a1022', bx + 8, by + 13, 2); disc(ctx, '#1a1022', bx + 32, by + 13, 2);
        }, extrasBehindMid: true
      };
    },
    function () { // 4. a romaria
      const velasPts = [];
      const far = layer(630, (f, r) => { E.morros(f, '#141a48', 26, 8, 4); E.telhados(f, r, '#1a2050', '#ffb347'); E.igreja(f, 300, '#e8e0f0', '#8a8ab8', { lit: true, dark: '#ffd86b', cross: '#ffd86b' }); });
      const mid = layer(631, (m, r) => {
        for (let px = 20; px < TW; px += 170) { // barracas com gambiarra de luz
          R(m, '#5a3a24', px, GY - 22, 2, 22); R(m, '#5a3a24', px + 44, GY - 22, 2, 22);
          for (let i = 0; i < 6; i++) R(m, i % 2 ? '#d63031' : '#f4ecd8', px - 2 + i * 8, GY - 28, 8, 6);
          R(m, '#8a5a30', px, GY - 10, 46, 2); for (let i = 0; i < 6; i++) R(m, ['#ffd23f', '#ff7eb6', '#3ddc84', '#6fe0f4'][i % 4], px + 4 + i * 7, GY - 13, 3, 3);
          for (let i = 0; i < 12; i++) R(m, ['#ffd23f', '#ff5f5f', '#6fe0f4', '#3ddc84'][i % 4], px + 50 + i * 9, GY - 34 + Math.round(Math.sin(i / 11 * Math.PI) * 4), 2, 2);
        }
        E.placa(m, 96, GY - 44, 'FOTO COM O SANTO', '#1a1022', '#ffd86b'); E.placa(m, 420, GY - 44, 'BOM JESUS DO NORTE', '#1a1022', '#ffd86b');
        for (let i = 0; i < 40; i++) { const px = 8 + i * 16.5 + r() * 5; E.pessoa(m, px, ['#1a2050', '#141a48', '#242a60'][i % 3], 11 + ((r() * 3) | 0), { vela: true }); velasPts.push([px + 4, GY - 8 - (i % 2)]); }
      });
      return {
        sky: sky(SKY.noite, (x, r) => stars(x, r, 70, 80)), layers: [{ c: far, s: .12 }, { c: mid, s: .45 }], ground: gnd('terraNoite'), light: true,
        extras(ctx, t, scroll) {
          velas(ctx, t, scroll, .45, velasPts);
          const k = Math.floor(t / 90), ph = (t % 90) / 90, fx = 60 + (k * 97) % 220, fy = 20 + (k * 41) % 30; // fogos
          if (ph < .6) for (let a = 0; a < 10; a++) R(ctx, ['#ffd23f', '#ff7eb6', '#6fe0f4'][k % 3], fx + Math.cos(a * .63) * ph * 26, fy + Math.sin(a * .63) * ph * 26 + ph * ph * 10, 1, 1);
        }
      };
    },
    function () { // 5. Vila do João
      const mid = layer(641, (m) => {
        for (let i = 0; i < 16; i++) { // as casinhas todas iguais
          const px = 6 + i * 41;
          R(m, '#fbf4e2', px, GY - 20, 34, 20); R(m, 'rgba(60,30,10,.12)', px + 30, GY - 20, 4, 20);
          for (let k = 0; k < 6; k++) R(m, '#c87850', px + 3 - k, GY - 26 + k, 28 + k * 2, 1);
          R(m, '#c87850', px - 2, GY - 21, 38, 2);
          R(m, ['#5f86a8', '#3f8a5a', '#d8943c', '#b85a6a'][i % 4], px + 5, GY - 12, 6, 12); R(m, '#8ab8d0', px + 17, GY - 13, 9, 6); R(m, '#fbf4e2', px + 21, GY - 13, 1, 6);
        }
        for (let px = 44; px < TW; px += 164) E.lampiao(m, px, 34, '#7a6a70');
        E.pessoa(m, 260, '#3a5a8a', 9, { head: '#8a5a3a' }); E.pessoa(m, 590, '#3a5a8a', 9, { head: '#8a5a3a' });
      });
      return {
        sky: sky(SKY.aurora, x => { disc(x, '#fff0c8', 60, 104, 18); disc(x, '#fffbe8', 60, 104, 13); cloud(x, 200, 30, '#fbe0e0'); }), layers: [{ c: farMesas(640, '#c8a8c0', '#d8bcd0', '#d0b0c4', '#e0c4d4'), s: .12 }, { c: mid, s: .45 }], ground: gnd('terraClara'),
        extras(ctx, t, scroll) { // o ônibus da volta
          const bx = onLayer(scroll, .3, 400), by = GY - 17;
          if (bx > -50 && bx < W) { R(ctx, '#e8e3d0', bx, by, 44, 14); R(ctx, '#2e86de', bx, by + 8, 44, 2); for (let i = 0; i < 6; i++) R(ctx, '#5f86a8', bx + 3 + i * 7, by + 2, 5, 4); disc(ctx, '#1a1022', bx + 9, by + 14, 2); disc(ctx, '#1a1022', bx + 35, by + 14, 2); }
        }, extrasBehindMid: true
      };
    }
  ];

  // ==================================================================
  //  ELEMENTOS EXTRAS (Rio, Minas colonial, interiores)
  // ==================================================================
  function dome(x, c, cx, w, h, p) {
    for (let px = -w / 2; px <= w / 2; px++) { const hh = h * Math.pow(Math.max(0, 1 - Math.pow(2 * px / w, 2)), p || .6); R(x, c, cx + px, GY - hh, 1, hh); }
  }
  function rio(f, c, cx, o) { // Pão de Açúcar, Morro da Urca e Corcovado
    o = o || {};
    dome(f, c, cx, 30, 50, .5); dome(f, c, cx - 30, 36, 24, .6);
    if (o.cabo) { for (let i = 0; i < 28; i++) R(f, o.cabo, cx - 30 + i, GY - 25 - i * .85, 1, 1); R(f, o.cabo, cx - 18, GY - 33, 4, 3); }
    dome(f, c, cx + 150, 120, 34, .8); dome(f, c, cx + 170, 26, 60, .7);
    if (!o.semCristo) { R(f, o.cristo || c, cx + 170, GY - 67, 1, 7); R(f, o.cristo || c, cx + 167, GY - 65, 7, 1); }
  }
  function baia(f, r, c, c2, h) { R(f, c, 0, GY - h, TW, h); R(f, c2, 0, GY - h, TW, 1); for (let i = 0; i < 70; i++) R(f, c2, r() * TW, GY - h + 2 + r() * (h - 3), 3 + r() * 5, 1); }
  function holofotes(ctx, t, xs, alpha, fromTop) {
    xs.forEach((bx, k) => {
      const a = Math.sin(t / 50 + k * 2) * .45;
      ctx.fillStyle = 'rgba(255,240,180,' + alpha + ')'; ctx.beginPath();
      if (fromTop) { ctx.moveTo(bx, 0); ctx.lineTo(bx + Math.sin(a) * 130 - 16, GY); ctx.lineTo(bx + Math.sin(a) * 130 + 16, GY); }
      else { ctx.moveTo(bx, GY); ctx.lineTo(bx + Math.sin(a - .1) * 200, GY - Math.cos(a - .1) * 200); ctx.lineTo(bx + Math.sin(a + .1) * 200, GY - Math.cos(a + .1) * 200); }
      ctx.fill();
    });
  }
  function brilhos(ctx, t, n, y0, yr, c1, c2) {
    for (let k = 0; k < n; k++) { const h = (k * 173 + Math.floor(t / 8) * 29) % 991; if (h % 3 === 0) R(ctx, k % 2 ? c1 : c2, (h * 11) % W, y0 + (h % yr), 1, 1); }
  }
  E.bananeira = function (x, px, h) {
    R(x, '#7aa85a', px, GY - h, 3, h); R(x, '#5c8a42', px + 2, GY - h, 1, h);
    for (let i = 0; i < 10; i++) { R(x, '#3fa85e', px - 2 - i, GY - h - 2 + (i * i) / 8, 3, 3); R(x, '#3fa85e', px + 2 + i, GY - h - 2 + (i * i) / 8, 3, 3); }
    for (let i = 0; i < 8; i++) { R(x, '#56b86e', px - i * .8, GY - h - 3 - i, 3, 2); R(x, '#56b86e', px + 1 + i * .8, GY - h - 3 - i, 3, 2); }
    R(x, '#ffd23f', px + 3, GY - h + 4, 3, 5); R(x, '#e8b020', px + 4, GY - h + 8, 2, 2);
  };
  E.carro = function (x, px, c, win) {
    R(x, c, px, GY - 8, 28, 6); R(x, c, px + 7, GY - 13, 13, 5); R(x, win || '#bfe0f0', px + 9, GY - 12, 4, 4); R(x, win || '#bfe0f0', px + 14, GY - 12, 4, 4);
    disc(x, '#1a1022', px + 6, GY - 2, 2); disc(x, '#1a1022', px + 22, GY - 2, 2); R(x, '#fff3bd', px, GY - 7, 1, 2);
  };
  E.baiana = function (x, px) {
    for (let i = 0; i < 9; i++) R(x, '#fbf4e2', px + 3 - i * .6, GY - 9 + i, 3 + i * 1.2, 1);
    R(x, '#fbf4e2', px + 2, GY - 13, 5, 4); R(x, '#6b4226', px + 3, GY - 16, 3, 3); R(x, '#fbf4e2', px + 2, GY - 18, 5, 2);
    R(x, '#8a5a30', px, GY - 20, 9, 1); R(x, '#ffd23f', px + 1, GY - 22, 3, 2); R(x, '#d63031', px + 5, GY - 22, 2, 2); R(x, '#27ae60', px + 7, GY - 21, 1, 1);
  };
  E.balao = function (x, px, y, c) { disc(x, c, px, y, 3); R(x, '#e8e3d0', px, y + 3, 1, 10); };

  // ==================================================================
  //  XICA DA SILVA (1976)
  // ==================================================================
  const MINAS = ['#3f6aa0', '#c8963c', '#3f8a5a', '#8a3a3a'];
  function tijuco(m, x0, x1, o) {
    o = o || {};
    for (let x = x0, i = o.i0 || 0; x < x1 - 30; i++) {
      const w = 30 + (i % 3) * 8, h = 24 + (i % 2) * 7, t = MINAS[i % 4];
      E.sobrado(m, x, w, h, o.wall || '#fbf4e2', o.trim || t, { door: o.trim ? '#2a1a20' : t, win: o.win || t, lit: o.lit && i % 2 === 0 });
      R(m, o.roof || '#b9603a', x - 1, GY - h - 4, w + 2, 2);
      x += w + 2;
    }
  }
  function farMinas(seed, c1, c2, roofs, o) {
    o = o || {};
    return layer(seed, (f, r) => {
      E.morros(f, c1, 40, 10, 5); E.morros(f, c2, 26, 7, 4);
      (o.igreja || []).forEach(px => { dome(f, c2, px + 22, 110, 34, .6); f.save(); f.translate(0, -24); E.igreja(f, px, o.wall || '#fbf4e2', o.trim || '#3f6aa0', o.io); f.restore(); });
      E.telhados(f, r, roofs, o.lit);
    });
  }
  const XICA = [
    function () { // 1. Arraial do Tijuco
      const mid = layer(701, (m) => {
        tijuco(m, 4, 250);
        R(m, '#9a948c', 258, GY - 6, 22, 6); R(m, '#b8b2a8', 258, GY - 7, 22, 2); R(m, '#9a948c', 267, GY - 20, 4, 14); disc(m, '#9a948c', 269, GY - 21, 3); // chafariz
        R(m, '#8ad0f0', 264, GY - 16, 2, 9); R(m, '#8ad0f0', 272, GY - 16, 2, 9); R(m, '#8ad0f0', 260, GY - 6, 18, 1);
        E.palmeira(m, 300, 58, '#b8a888', '#4ca060');
        tijuco(m, 320, TW, { i0: 2 });
        [[70, 0], [180, 1], [400, 0], [560, 1]].forEach(([px, k]) => E.pessoa(m, px, '#e8e0d0', 12, { head: '#5e3822', pedra: k === 0 }));
      });
      return { sky: sky(SKY.azul, x => { cloud(x, 60, 20, '#ffffff'); cloud(x, 240, 30, '#ffffff'); }), layers: [{ c: farMinas(700, '#a8bc98', '#8aa878', '#e8dcc4', { igreja: [310] }), s: .12 }, { c: mid, s: .45 }], ground: gnd('pedra') };
    },
    function () { // 2. o contratador de diamantes
      const far = layer(710, (f, r) => {
        E.mesa(f, 10, 130, 44, '#a898b0', '#bcaec4'); E.mesa(f, 180, 80, 28, '#b0a2b8', '#c4b8cc'); E.mesa(f, 320, 170, 52, '#a898b0', '#bcaec4'); E.mesa(f, 540, 110, 36, '#b0a2b8', '#c4b8cc');
        baia(f, r, '#5bb0d0', '#b8e8f4', 11);
      });
      const mid = layer(711, (m) => {
        for (let i = 0; i < 11; i++) { const px = 20 + i * 60 + (i % 3) * 8; E.pessoa(m, px, '#e8e0d0', 11, { head: '#5e3822' }); R(m, '#8a8e92', px + 4, GY - 6, 6, 1); R(m, '#b8e8f4', px + 5, GY - 7, 3, 1); }
        [140, 470].forEach(px => { // a calha de lavagem
          for (let i = 0; i < 30; i++) R(m, '#8a6a48', px + i, GY - 26 + i * .6, 1, 2);
          for (let i = 0; i < 30; i += 2) R(m, '#8ad0f0', px + i, GY - 27 + i * .6, 1, 1);
          R(m, '#6b4a2b', px, GY - 25, 2, 25); R(m, '#6b4a2b', px + 14, GY - 17, 2, 17); R(m, '#6b4a2b', px + 28, GY - 8, 2, 8);
          disc(m, '#a89a8c', px + 44, GY, 8); disc(m, '#bcaea0', px + 40, GY - 2, 3);
        });
        [300, 610].forEach(px => { // a tenda do contratador e o baú
          for (let i = 0; i < 20; i++) R(m, '#fbf4e2', px + 20 - i, GY - 22 + i, i * 2, 1);
          R(m, '#3a2a18', px + 16, GY - 9, 8, 9); R(m, '#5a3a1c', px + 19, GY - 30, 1, 9); R(m, '#d63031', px + 20, GY - 30, 6, 4);
          R(m, '#8a5a30', px + 44, GY - 7, 12, 7); R(m, '#f5c518', px + 44, GY - 5, 12, 1); R(m, '#ffffff', px + 47, GY - 9, 1, 1); R(m, '#8af0ff', px + 50, GY - 10, 2, 2); R(m, '#ffffff', px + 53, GY - 9, 1, 1);
        });
      });
      return {
        sky: sky(SKY.sertao, x => sun(x, 262, 30, 14, '#fff3bd', '#ffffff', true)), layers: [{ c: far, s: .12 }, { c: mid, s: .45 }], ground: gnd('terra'),
        extras(ctx, t) { brilhos(ctx, t, 12, GY - 10, 8, '#ffffff', '#8af0ff'); }, extrasBehindMid: true
      };
    },
    function () { // 3. a alforria
      const mid = layer(721, (m) => {
        tijuco(m, 4, 200, { i0: 1 });
        E.igreja(m, 214, '#fbf4e2', '#3f6aa0');
        tijuco(m, 270, 520, { i0: 3 });
        tijuco(m, 520, TW, { i0: 0 });
        [120, 440].forEach(px => { // a liteira de Xica
          R(m, '#5a3a1c', px - 9, GY - 13, 36, 1);
          R(m, '#8e2a20', px, GY - 24, 18, 15); R(m, '#f5c518', px - 1, GY - 26, 20, 2); R(m, '#f5c518', px, GY - 10, 18, 1);
          R(m, '#3a1410', px + 4, GY - 22, 10, 9); R(m, '#f4f0e6', px + 6, GY - 22, 6, 3); R(m, '#6b4226', px + 7, GY - 19, 4, 4); R(m, '#f5c518', px + 7, GY - 15, 4, 1);
          E.pessoa(m, px - 10, '#e8e0d0', 13, { head: '#5e3822' }); E.pessoa(m, px + 24, '#e8e0d0', 13, { head: '#5e3822' });
        });
        E.bandeirinhas(m, 10, 200, GY - 48); E.bandeirinhas(m, 290, 500, GY - 48);
      });
      return { sky: sky(SKY.azul, x => { cloud(x, 30, 26, '#ffffff'); cloud(x, 190, 14, '#ffffff'); }), layers: [{ c: farMinas(720, '#a8bc98', '#8aa878', '#e8dcc4'), s: .12 }, { c: mid, s: .45 }], ground: gnd('pedra') };
    },
    function () { // 4. o mar de Xica
      const far = layer(730, (f, r) => {
        E.morros(f, '#8ab08a', 44, 10, 5);
        baia(f, r, '#3a8ac4', '#a8dcf4', 20);
        [150, 480].forEach(px => { // o navio no lago
          R(f, '#6b4226', px, GY - 17, 42, 5); R(f, '#6b4226', px + 3, GY - 12, 36, 3); R(f, '#6b4226', px + 36, GY - 23, 8, 6); R(f, '#6b4226', px - 4, GY - 19, 5, 3); R(f, '#f5c518', px, GY - 17, 44, 1);
          R(f, '#3f2816', px + 11, GY - 48, 1, 31); R(f, '#3f2816', px + 26, GY - 52, 1, 35);
          R(f, '#fffaf0', px + 5, GY - 44, 13, 10); R(f, '#fffaf0', px + 6, GY - 32, 11, 9); R(f, '#fffaf0', px + 20, GY - 48, 13, 11); R(f, '#fffaf0', px + 21, GY - 35, 11, 10);
          R(f, '#d63031', px + 12, GY - 51, 5, 2); R(f, '#d63031', px + 27, GY - 55, 5, 2);
        });
      });
      const mid = layer(731, (m) => {
        [20, 360].forEach(px => { // o palácio do contratador
          R(m, '#fbf4e2', px, GY - 34, 150, 34); R(m, '#b9603a', px - 2, GY - 38, 154, 5); R(m, '#8f4426', px - 2, GY - 34, 154, 1);
          for (let i = 0; i < 9; i++) { R(m, '#3f6aa0', px + 6 + i * 16, GY - 28, 8, 12); R(m, '#8ab8e8', px + 7 + i * 16, GY - 27, 6, 10); R(m, '#3f6aa0', px + 10 + i * 16, GY - 27, 1, 10); }
          R(m, '#3f6aa0', px + 68, GY - 14, 12, 14); R(m, '#2a1a20', px + 70, GY - 12, 8, 12);
          E.palmeira(m, px + 170, 60, '#b8a888', '#4ca060'); E.palmeira(m, px + 196, 52, '#b8a888', '#4ca060');
          [220, 250, 280].forEach(d => { R(m, '#6b4a2b', px + d, GY - 8, 2, 8); disc(m, '#3f8a5a', px + d + 1, GY - 12, 5); });
          R(m, '#c8ccd0', px + 300, GY - 6, 10, 6); R(m, '#e8ecf0', px + 303, GY - 18, 4, 12); R(m, '#e8ecf0', px + 302, GY - 21, 6, 3);
        });
      });
      return { sky: sky(SKY.mata, x => disc(x, '#fff7b8', 280, 26, 10)), layers: [{ c: far, s: .15 }, { c: mid, s: .45 }], ground: gnd('grama') };
    },
    function () { // 5. o Conde de Valadares
      const tochas = [];
      const mid = layer(741, (m) => {
        tijuco(m, 4, TW, { wall: '#6a5a78', trim: '#2a2038', lit: true, win: '#2a2038', roof: '#3a2030' });
        [90, 420].forEach(px => { // a carruagem do conde
          const k = '#14101e';
          R(m, k, px, GY - 22, 26, 14); R(m, '#f5c518', px, GY - 22, 26, 1); R(m, '#ffd86b', px + 4, GY - 19, 6, 6); R(m, '#ffd86b', px + 15, GY - 19, 6, 6);
          disc(m, k, px + 5, GY - 5, 5); disc(m, '#6a5a78', px + 5, GY - 5, 3); disc(m, k, px + 21, GY - 5, 5); disc(m, '#6a5a78', px + 21, GY - 5, 3);
          R(m, k, px - 24, GY - 14, 14, 6); R(m, k, px - 28, GY - 19, 5, 7); R(m, k, px - 30, GY - 20, 3, 3); [0, 3, 9, 12].forEach(d => R(m, k, px - 24 + d, GY - 8, 1, 8)); R(m, k, px - 10, GY - 12, 10, 1);
        });
        for (let i = 0; i < 16; i++) { const px = 170 + i * 30 + (i > 7 ? 90 : 0); if (px > TW - 10) continue; E.pessoa(m, px, '#1a1026', 12); R(m, '#5a3a1c', px + 4, GY - 15, 1, 7); tochas.push([px + 4, GY - 17]); }
      });
      const far = farMinas(740, '#2e2050', '#241640', '#241640', { igreja: [300], wall: '#241640', trim: '#241640', io: { dark: '#ffb347', cross: '#241640', door: '#241640', lit: true }, lit: '#ffb347' });
      return {
        sky: sky(SKY.vila, (x, r) => stars(x, r, 30, 36)), layers: [{ c: far, s: .12 }, { c: mid, s: .45 }], ground: gnd('pedraNoite'), light: true,
        extras(ctx, t, scroll) { tochas.forEach((p, i) => { const vx = onLayer(scroll, .45, p[0]); if (vx > -3 && vx < W) { R(ctx, (t + i * 5) % 10 < 5 ? '#ff7a1a' : '#ffd23f', vx - 1, p[1], 3, 2); R(ctx, '#ffd23f', vx, p[1] - 1 - ((t + i) % 6 < 3 ? 1 : 0), 1, 2); } }); }
      };
    }
  ];

  // ==================================================================
  //  MINHA MÃE É UMA PEÇA (2013)
  // ==================================================================
  function predioRes(m, px, w, h, c, c2) {
    R(m, c, px, GY - h, w, h); R(m, 'rgba(0,0,0,.14)', px + w - 5, GY - h, 5, h); R(m, c2, px - 1, GY - h - 2, w + 2, 3);
    for (let yy = GY - h + 6; yy < GY - 20; yy += 11) { R(m, c2, px + 3, yy + 6, w - 8, 2); for (let xx = px + 5; xx < px + w - 12; xx += 10) { R(m, '#5f86a8', xx, yy, 6, 6); R(m, '#bfe0f0', xx, yy, 3, 6); } }
    R(m, '#3a4a5a', px + w / 2 - 7, GY - 15, 14, 15); R(m, '#bfe0f0', px + w / 2 - 6, GY - 14, 5, 14); R(m, '#bfe0f0', px + w / 2 + 1, GY - 14, 5, 14); R(m, '#b23a3a', px + w / 2 - 11, GY - 19, 22, 3);
  }
  const HERMINIA = [
    function () { // 1. Niterói
      const far = layer(800, (f, r) => {
        rio(f, '#7aa8c4', 110, { cristo: '#e8f0f4' });
        baia(f, r, '#3a8ac4', '#a8dcf4', 18);
        [430].forEach(px => { // o MAC, do outro lado da baía
          dome(f, '#7a8a70', px + 20, 90, 16, .5);
          for (let i = 0; i < 8; i++) R(f, '#fbf8f0', px + 20 - (5 + i * 3), GY - 18 - i * 2, (5 + i * 3) * 2, 2);
          R(f, '#3a4a5a', px - 7, GY - 36, 54, 2); R(f, '#fbf8f0', px - 8, GY - 40, 56, 4); R(f, '#d63031', px + 42, GY - 20, 22, 2);
        });
      });
      const mid = layer(801, (m) => {
        [[10, 70, 62, '#e8dcc8', '#c8b898'], [150, 60, 74, '#d8e4e0', '#a8bcb4'], [300, 76, 58, '#f0d8c0', '#d0a888'], [470, 64, 70, '#e0d8e8', '#b8a8c8'], [590, 70, 60, '#e8dcc8', '#c8b898']].forEach(b => predioRes(m, b[0], b[1], b[2], b[3], b[4]));
        [100, 240, 400, 560].forEach(px => E.palmeira(m, px, 40, '#a88a5a', '#4ca060', true));
        E.carro(m, 250, '#d63031'); E.carro(m, 420, '#f0f0f0'); E.pessoa(m, 126, '#ff7eb6', 12, { head: '#e8bb94' }); E.pessoa(m, 536, '#2e86de', 13, { head: '#8a5a3a' });
      });
      return { sky: sky(SKY.azul, x => { cloud(x, 50, 18, '#ffffff'); cloud(x, 260, 28, '#ffffff'); }), layers: [{ c: far, s: .1 }, { c: mid, s: .45 }], ground: gnd('calcada') };
    },
    function () { // 2. o prédio
      const mid = layer(811, (m) => {
        [[0, '#e8dcc8', '#c8b898'], [226, '#d8e4e0', '#a8bcb4'], [452, '#f0d8c0', '#d0a888']].forEach(([px, c, c2], n) => {
          R(m, c, px, 0, 210, GY); R(m, 'rgba(0,0,0,.12)', px + 204, 0, 6, GY);
          for (let yy = 8; yy < GY - 40; yy += 20) { R(m, c2, px, yy + 14, 210, 2); for (let i = 0; i < 6; i++) { const wx = px + 10 + i * 33; R(m, '#5f86a8', wx, yy, 20, 12); R(m, '#bfe0f0', wx, yy, 9, 12); R(m, ['#ff7eb6', '#ffd23f', '#fbf4e2'][(i + n) % 3], wx + 11, yy, 9, 5); R(m, c2, wx - 2, yy + 12, 24, 4); if ((i + n) % 3 === 0) { R(m, '#3f8a5a', wx + 2, yy + 9, 4, 3); R(m, '#d63031', wx + 3, yy + 8, 2, 1); } } }
          // a portaria
          R(m, '#b23a3a', px + 70, GY - 34, 70, 5); R(m, '#8a2a2a', px + 70, GY - 30, 70, 1); G.text(m, 'EDIFICIO', px + 89, GY - 43, '#5a4a3a');
          R(m, '#3a4a5a', px + 84, GY - 28, 42, 28); R(m, '#bfe0f0', px + 86, GY - 26, 18, 26); R(m, '#bfe0f0', px + 106, GY - 26, 18, 26); R(m, '#e8f4fb', px + 88, GY - 24, 4, 20);
          R(m, '#8a8e92', px + 132, GY - 20, 5, 8); R(m, '#3ddc84', px + 133, GY - 19, 1, 1); // interfone
          E.pessoa(m, px + 148, '#2e5a8a', 13, { head: '#8a5a3a', chapeu: '#1a2a4a' }); // o porteiro
          R(m, '#6a7078', px + 8, GY - 26, 50, 26); for (let i = 0; i < 6; i++) R(m, '#565c64', px + 8, GY - 24 + i * 4, 50, 1); // garagem
          [164, 186].forEach(d => { R(m, '#b9603a', px + d, GY - 7, 8, 7); disc(m, '#3f8a5a', px + d + 4, GY - 11, 5); });
        });
      });
      return { sky: sky(SKY.azul), layers: [{ c: farCidade(810, ['#b0c4d4', '#c0d0dc', '#a4b8c8'], '#dce8f0', 0), s: .1 }, { c: mid, s: .45 }], ground: gnd('calcada') };
    },
    function () { // 3. a casa da tia Zélia
      const far = layer(820, (f, r) => { E.morros(f, '#7a9a8a', 40, 10, 5); E.copas(f, r, '#5a8a6a', 18, 10); });
      const mid = layer(821, (m) => {
        [30, 260, 500].forEach((px, n) => {
          const wall = ['#f4e4c0', '#e0ecd8', '#f0d4c8'][n];
          R(m, wall, px, GY - 30, 70, 30); for (let k = 0; k < 9; k++) R(m, '#b9603a', px - 4 + k, GY - 39 + k, 78 - k * 2, 1); R(m, '#8f4426', px - 4, GY - 31, 78, 2);
          R(m, '#6b4226', px + 8, GY - 16, 9, 16); R(m, '#ffffff', px + 24, GY - 22, 14, 11); R(m, '#8ab8d0', px + 25, GY - 21, 12, 9); R(m, '#ffffff', px + 30, GY - 21, 1, 9); R(m, '#ffffff', px + 44, GY - 22, 14, 11); R(m, '#8ab8d0', px + 45, GY - 21, 12, 9);
          // varanda com cadeira de balanço
          [0, 22, 44, 68].forEach(d => R(m, '#ffffff', px + d, GY - 20, 2, 20)); R(m, '#ffffff', px, GY - 8, 70, 1);
          R(m, '#5a3a1c', px + 52, GY - 12, 8, 2); R(m, '#5a3a1c', px + 58, GY - 20, 2, 10); R(m, '#5a3a1c', px + 50, GY - 4, 12, 1);
          // murinho, portão e jardim
          R(m, '#e8e0d0', px + 76, GY - 9, 90, 9); R(m, '#c8c0b0', px + 76, GY - 10, 90, 2); for (let k = 0; k < 6; k++) R(m, '#3a3a44', px + 108 + k * 3, GY - 14, 1, 14);
          [[84, '#d63031'], [92, '#ffd23f'], [136, '#ff7eb6'], [146, '#d63031'], [156, '#ffffff']].forEach(fl => { R(m, '#3f8a5a', px + fl[0], GY - 14, 1, 5); R(m, fl[1], px + fl[0] - 1, GY - 16, 3, 2); });
          E.arvore(m, px + 190, 40, 0, '#3a8a50', '#56a868');
        });
        // o táxi e a mala
        R(m, '#ffd23f', 150, GY - 8, 28, 6); R(m, '#ffd23f', 157, GY - 13, 13, 5); R(m, '#bfe0f0', 159, GY - 12, 4, 4); R(m, '#bfe0f0', 164, GY - 12, 4, 4); R(m, '#1a1022', 150, GY - 5, 28, 1); R(m, '#1a1022', 161, GY - 15, 5, 2);
        disc(m, '#1a1022', 156, GY - 2, 2); disc(m, '#1a1022', 172, GY - 2, 2);
        R(m, '#8a3a3a', 186, GY - 8, 9, 8); R(m, '#5a2020', 189, GY - 10, 3, 2); R(m, '#f5c518', 186, GY - 5, 9, 1);
      });
      return { sky: sky(SKY.tarde, x => { disc(x, '#ffd8a0', 60, 84, 16); disc(x, '#fff0d0', 60, 84, 12); }), layers: [{ c: far, s: .12 }, { c: mid, s: .45 }], ground: gnd('calcada') };
    },
    function () { // 4. lembranças
      const far = layer(830, (f, r) => { E.morros(f, '#e8b878', 30, 8, 4); E.telhados(f, r, '#d8a468'); });
      const mid = layer(831, (m) => {
        R(m, '#f0d8a8', 0, GY - 20, TW, 20); R(m, '#d8b880', 0, GY - 21, TW, 2); // o muro do quintal
        [40, 380].forEach(px => {
          // a mesa do bolo
          R(m, '#ffffff', px, GY - 12, 50, 3); R(m, '#ff7eb6', px, GY - 9, 50, 9); for (let k = 0; k < 6; k++) R(m, '#ffffff', px + 2 + k * 8, GY - 7, 4, 4);
          R(m, '#fffaf0', px + 16, GY - 22, 18, 10); R(m, '#ff7eb6', px + 16, GY - 18, 18, 2); [19, 24, 29].forEach(d => { R(m, '#6fc8f0', px + d, GY - 26, 1, 4); R(m, '#ffd23f', px + d, GY - 27, 1, 1); });
          [4, 10, 38, 44].forEach((d, k) => R(m, ['#5a3a1c', '#d63031', '#ffd23f', '#5a3a1c'][k], px + d, GY - 14, 3, 2));
          [['#d63031', -8, 44], ['#ffd23f', -2, 52], ['#2e86de', 6, 46], ['#27ae60', 56, 50], ['#ff7eb6', 62, 44], ['#ffd23f', 68, 52]].forEach(b => E.balao(m, px + b[1], GY - b[2], b[0]));
          E.bandeirinhas(m, px - 20, px + 90, GY - 56); E.bandeirinhas(m, px + 90, px + 250, GY - 56);
          // a criançada
          ['#2e86de', '#ffd23f', '#d63031', '#27ae60', '#ff7eb6', '#fbf4e2'].forEach((c, k) => { const kx = px + 84 + k * 16; E.pessoa(m, kx, c, 8 + (k % 2), { head: k % 2 ? '#e8bb94' : '#8a5a3a' }); if (k % 3 === 0) { for (let i = 0; i < 5; i++) R(m, ['#d63031', '#ffd23f'][k % 2], kx + 2 - i * .5, GY - 14 + i, 1 + i, 1); } });
          // o balanço
          R(m, '#8a8e92', px + 200, GY - 34, 2, 34); R(m, '#8a8e92', px + 236, GY - 34, 2, 34); R(m, '#8a8e92', px + 200, GY - 34, 38, 2); R(m, '#e8e3d0', px + 212, GY - 32, 1, 20); R(m, '#e8e3d0', px + 224, GY - 32, 1, 20); R(m, '#d63031', px + 211, GY - 12, 15, 2);
          E.arvore(m, px + 270, 44, 0, '#5a9a50', '#78b868');
        });
      });
      return { sky: sky(SKY.cdd, x => { disc(x, '#fff1b0', 250, 40, 16); disc(x, '#fffbe0', 250, 40, 12); }), layers: [{ c: far, s: .12 }, { c: mid, s: .45 }], ground: gnd('grama') };
    },
    function () { // 5. a peça
      const far = layer(840, (f) => {
        for (let px = 0; px < TW; px += 6) R(f, (px / 6) % 4 < 2 ? '#a01828' : ((px / 6) % 4 < 3 ? '#7a1020' : '#b82030'), px, 0, 6, GY);
        R(f, '#d4a017', 0, 0, TW, 8); for (let px = 0; px < TW; px += 14) { disc(f, '#d4a017', px + 7, 8, 7); R(f, '#ffe066', px + 6, 15, 2, 3); }
      });
      const mid = layer(841, (m) => {
        [60, 400].forEach(px => { // a sala de Dona Hermínia montada no palco
          R(m, '#3f7a8a', px, GY - 22, 34, 22); R(m, '#2f6272', px, GY - 22, 6, 22); R(m, '#2f6272', px + 28, GY - 22, 6, 22); R(m, '#56a0b0', px + 6, GY - 12, 22, 4); R(m, '#fbf4e2', px + 8, GY - 30, 18, 9);
          R(m, '#6b4226', px + 46, GY - 14, 16, 2); R(m, '#6b4226', px + 53, GY - 12, 2, 12); R(m, '#d63031', px + 48, GY - 18, 8, 4); R(m, '#1a1022', px + 47, GY - 20, 10, 2); // o telefone
          R(m, '#8a8e92', px + 76, GY - 36, 1, 36); for (let i = 0; i < 7; i++) R(m, '#ffd86b', px + 76 - i, GY - 44 + i, 1 + i * 2, 1);
          R(m, '#c8ccd0', px + 110, GY - 16, 40, 2); R(m, '#8a8e92', px + 118, GY - 14, 1, 14); R(m, '#8a8e92', px + 142, GY - 14, 1, 14); R(m, '#fbf4e2', px + 122, GY - 20, 14, 4); // tábua de passar
          R(m, '#5a3a1c', px + 180, GY - 40, 30, 40); R(m, '#3f2816', px + 183, GY - 37, 24, 34); R(m, '#f5c518', px + 204, GY - 20, 2, 2);
        });
        for (let px = 6; px < TW; px += 22) { R(m, '#3a2a20', px, GY - 3, 6, 3); R(m, '#ffe066', px + 1, GY - 5, 4, 2); } // ribalta
      });
      return {
        sky: sky(['#2a0a14', '#3a0e1a', '#4a1220', '#5a1626']), layers: [{ c: far, s: .2 }, { c: mid, s: .45 }], ground: gnd('palco'), light: true,
        extras(ctx, t) { holofotes(ctx, t, [70, 190, 290], .12, true); }
      };
    }
  ];

  // ==================================================================
  //  QUE HORAS ELA VOLTA? (2015)
  // ==================================================================
  function casaModerna(m, px, lit) {
    const g = lit ? '#ffd86b' : '#8ab8d0';
    R(m, '#f4f0e8', px, GY - 52, 170, 26); R(m, '#d8d4cc', px, GY - 54, 170, 3); R(m, g, px + 8, GY - 46, 110, 14); for (let i = 1; i < 6; i++) R(m, '#f4f0e8', px + 8 + i * 18, GY - 46, 1, 14);
    R(m, '#d8d4cc', px + 126, GY - 46, 36, 14); R(m, '#8a5a30', px + 136, GY - 44, 12, 12);
    [14, 60, 110, 156].forEach(d => R(m, '#c8c4bc', px + d, GY - 26, 4, 26));
    R(m, lit ? '#e8c060' : '#6a9ab8', px + 20, GY - 24, 86, 24); for (let i = 1; i < 4; i++) R(m, '#f4f0e8', px + 20 + i * 21, GY - 24, 1, 24);
  }
  const VAL = [
    function () { // 1. a casa do Morumbi
      const far = layer(900, (f, r) => {
        for (let x = 0; x < TW;) { const w = 14 + ((r() * 18) | 0), h = 30 + ((r() * 40) | 0); E.predio(f, x, w, h, ['#a8b8c8', '#b8c4d0', '#98a8b8'][(r() * 3) | 0], '#dce8f0', r); x += w + ((r() * 6) | 0); }
        E.copas(f, r, '#5aa060', 16, 8);
      });
      const mid = layer(901, (m) => {
        [20, 360].forEach(px => {
          casaModerna(m, px);
          R(m, '#c8c4bc', px + 180, GY - 26, 130, 26); R(m, '#b0aca4', px + 180, GY - 27, 130, 2); // o muro
          R(m, '#8a5a30', px + 214, GY - 22, 40, 22); for (let i = 1; i < 8; i++) R(m, '#6b4424', px + 214 + i * 5, GY - 22, 1, 22); R(m, '#8a8e92', px + 258, GY - 16, 4, 6);
          for (let k = 0; k < 14; k++) disc(m, '#4c9a56', px + 184 + k * 9.5, GY - 30, 5); // cerca viva por cima do muro
          E.palmeira(m, px + 196, 54, '#a88a5a', '#4ca060'); E.palmeira(m, px + 290, 46, '#a88a5a', '#4ca060');
          E.carro(m, px + 264, '#2a2a34', '#6a7a8a');
        });
      });
      return { sky: sky(SKY.azul, x => { cloud(x, 70, 22, '#ffffff'); cloud(x, 250, 14, '#ffffff'); }), layers: [{ c: far, s: .12 }, { c: mid, s: .45 }], ground: gnd('calcada') };
    },
    function () { // 2. a cozinha
      const mid = layer(911, (m) => {
        R(m, '#f4f0e8', 0, 0, TW, GY);
        for (let y = GY - 56; y < GY; y += 8) R(m, '#dcd6c8', 0, y, TW, 1);
        for (let x = 0; x < TW; x += 8) R(m, '#dcd6c8', x, GY - 56, 1, 56);
        R(m, '#8fc0e0', 0, GY - 58, TW, 2);
        [0, 336].forEach(px => {
          // armários de cima
          for (let i = 0; i < 4; i++) { R(m, '#ffffff', px + 8 + i * 26, GY - 92, 24, 26); R(m, '#d8d4cc', px + 8 + i * 26, GY - 67, 24, 1); R(m, '#8a8e92', px + 27 + i * 26, GY - 78, 2, 4); }
          // bancada, pia e janela
          R(m, '#5a5e66', px + 4, GY - 26, 124, 3); R(m, '#ffffff', px + 4, GY - 23, 124, 23); for (let i = 0; i < 5; i++) { R(m, '#d8d4cc', px + 4 + i * 25, GY - 23, 1, 23); R(m, '#8a8e92', px + 15 + i * 25, GY - 19, 4, 1); }
          R(m, '#c8ccd0', px + 60, GY - 27, 22, 2); R(m, '#8a8e92', px + 70, GY - 34, 2, 7); R(m, '#8a8e92', px + 70, GY - 34, 6, 2);
          R(m, '#ffffff', px + 116, GY - 96, 44, 32); R(m, '#8fd0f0', px + 118, GY - 94, 40, 28); R(m, '#5aa060', px + 118, GY - 76, 40, 10); R(m, '#ffffff', px + 137, GY - 94, 2, 28);
          // o jogo de café preto e branco, na bandeja
          R(m, '#c8ccd0', px + 16, GY - 28, 30, 2); R(m, '#17141f', px + 19, GY - 40, 7, 12); R(m, '#ffffff', px + 19, GY - 36, 7, 3); R(m, '#17141f', px + 21, GY - 43, 3, 3);
          [30, 37].forEach((d, k) => { R(m, k ? '#17141f' : '#ffffff', px + d, GY - 33, 5, 5); R(m, k ? '#ffffff' : '#17141f', px + d, GY - 31, 5, 1); });
          // o sorvete do Fabinho
          R(m, '#fbf4e2', px + 98, GY - 34, 14, 8); R(m, '#8a5a30', px + 98, GY - 31, 14, 3); R(m, '#d63031', px + 97, GY - 36, 16, 2);
          // fogão e coifa
          R(m, '#e8e8ec', px + 168, GY - 26, 26, 26); R(m, '#3a3a44', px + 168, GY - 28, 26, 2); R(m, '#3a3a44', px + 172, GY - 18, 18, 12); R(m, '#d63031', px + 171, GY - 35, 10, 7); R(m, '#8a2a2a', px + 181, GY - 33, 5, 1); R(m, '#c8ccd0', px + 184, GY - 33, 8, 5);
          R(m, '#c8ccd0', px + 166, GY - 70, 30, 6); R(m, '#c8ccd0', px + 176, GY - 96, 10, 26);
          // geladeira
          R(m, '#eef0f4', px + 204, GY - 58, 26, 58); R(m, '#c8ccd0', px + 204, GY - 38, 26, 1); R(m, '#8a8e92', px + 207, GY - 52, 1, 10); R(m, '#8a8e92', px + 207, GY - 32, 1, 14);
          R(m, '#ffd23f', px + 216, GY - 50, 5, 5); R(m, '#ff7eb6', px + 222, GY - 46, 4, 4);
          // a porta para a sala
          R(m, '#6b4226', px + 246, GY - 60, 34, 60); R(m, '#fff3bd', px + 250, GY - 56, 26, 56); R(m, '#ffe8a0', px + 250, GY - 56, 26, 8); R(m, '#8a5a30', px + 270, GY - 30, 6, 30);
          // relógio e mesa
          disc(m, '#3a3a44', px + 298, GY - 78, 6); disc(m, '#ffffff', px + 298, GY - 78, 5); R(m, '#1a1022', px + 298, GY - 82, 1, 5); R(m, '#1a1022', px + 298, GY - 78, 3, 1);
          R(m, '#8a5a30', px + 288, GY - 16, 40, 3); R(m, '#6b4424', px + 292, GY - 13, 2, 13); R(m, '#6b4424', px + 322, GY - 13, 2, 13); R(m, '#fbf4e2', px + 300, GY - 20, 14, 4); disc(m, '#d63031', px + 304, GY - 22, 2); disc(m, '#ffd23f', px + 309, GY - 22, 2);
        });
      });
      return { sky: sky(['#f4f0e8', '#f4f0e8', '#f4f0e8', '#f4f0e8']), layers: [{ c: mid, s: .45 }], ground: gnd('cozinha') };
    },
    function () { // 3. Jéssica chega
      const mid = layer(921, (m) => {
        R(m, '#dce4ec', 0, GY - 46, TW, 46); R(m, '#f4f6f8', 0, GY - 50, TW, 5); R(m, '#b0bcc8', 0, GY - 45, TW, 1);
        for (let px = 0; px < TW; px += 24) { R(m, '#7ab0d8', px + 2, GY - 42, 20, 26); R(m, '#a8d0ec', px + 2, GY - 42, 8, 26); R(m, '#f4f6f8', px, GY - 46, 2, 46); }
        R(m, '#c8d0d8', 0, GY - 16, TW, 16);
        [40, 376].forEach(px => {
          E.placa(m, px, GY - 64, 'DESEMBARQUE', '#1f4e8c', '#ffffff', 2); R(m, '#8a8e92', px + 10, GY - 51, 2, 6); R(m, '#8a8e92', px + 80, GY - 51, 2, 6);
          R(m, '#3a4a5a', px + 110, GY - 30, 40, 30); R(m, '#bfe0f0', px + 112, GY - 28, 17, 28); R(m, '#bfe0f0', px + 131, GY - 28, 17, 28);
          // táxis brancos de São Paulo
          [170, 250].forEach(d => { E.carro(m, px + d, '#f4f4f4'); R(m, '#27ae60', px + d, GY - 5, 28, 1); R(m, '#ffd23f', px + d + 11, GY - 15, 5, 2); });
          // gente chegando, com mala
          [[8, '#d63031'], [30, '#3a5a8a'], [60, '#ffd23f'], [92, '#5a7a6a'], [214, '#b85a8a'], [300, '#3a3a44']].forEach((p, k) => { E.pessoa(m, px + p[0], p[1], 12 + (k % 2), { head: k % 2 ? '#e8bb94' : '#8a5a3a' }); R(m, ['#2a2a34', '#8a3a3a', '#3f6aa0'][k % 3], px + p[0] + 5, GY - 7, 5, 7); R(m, '#8a8e92', px + p[0] + 7, GY - 10, 1, 3); });
        });
      });
      return {
        sky: sky(SKY.central, x => { cloud(x, 40, 30, '#f7fbfd'); cloud(x, 210, 44, '#f7fbfd'); }), layers: [{ c: farCidade(920, ['#93abbe', '#a3b8c8', '#869fb3'], '#c9dbe6', 0), s: .1 }, { c: mid, s: .45 }], ground: gnd('asfalto'),
        extras(ctx, t, scroll) { // o avião chegando
          const ax = W + 40 - ((t * .9 + scroll * .15) % (W + 500)), ay = 14 + ((t * .9 + scroll * .15) % (W + 500)) * .03;
          R(ctx, '#ffffff', ax, ay, 26, 4); R(ctx, '#ffffff', ax - 2, ay + 1, 3, 2); R(ctx, '#d63031', ax + 22, ay - 5, 4, 6); R(ctx, '#c8d0d8', ax + 9, ay + 3, 9, 2); for (let i = 0; i < 6; i++) R(ctx, '#5f86a8', ax + 3 + i * 3, ay + 1, 1, 1);
        }, extrasBehindMid: true
      };
    },
    function () { // 4. a piscina
      const far = layer(930, (f, r) => { E.copas(f, r, '#141a40', 34, 12); });
      const brilho = [];
      const mid = layer(931, (m) => {
        [10, 346].forEach(px => {
          casaModerna(m, px, true);
          // a piscina, pela metade
          const p0 = px + 186;
          R(m, '#c8d0dc', p0, GY - 8, 130, 8); R(m, '#a8dce8', p0 + 2, GY - 7, 126, 3); R(m, '#2ab0d0', p0 + 2, GY - 4, 126, 4); R(m, '#8ae8f4', p0 + 2, GY - 4, 126, 1);
          for (let i = 0; i < 9; i++) brilho.push([p0 + 8 + i * 14, GY - 3 + (i % 2)]);
          R(m, '#e8ecf0', p0 + 10, GY - 16, 1, 12); R(m, '#e8ecf0', p0 + 15, GY - 16, 1, 12); R(m, '#e8ecf0', p0 + 10, GY - 16, 6, 1); R(m, '#e8ecf0', p0 + 10, GY - 11, 6, 1);
          // espreguiçadeiras e guarda-sol fechado
          [40, 74].forEach(d => { R(m, '#fbf4e2', p0 + d, GY - 13, 20, 2); R(m, '#fbf4e2', p0 + d + 16, GY - 19, 2, 7); R(m, '#8a8e92', p0 + d + 2, GY - 11, 1, 3); R(m, '#8a8e92', p0 + d + 17, GY - 11, 1, 3); });
          R(m, '#8a8e92', p0 + 108, GY - 38, 1, 30); for (let i = 0; i < 12; i++) R(m, '#fbf4e2', p0 + 108 - i * .2, GY - 38 + i, 1 + i * .4, 1);
          E.palmeira(m, px + 176, 50, '#3a3048', '#2a6a50'); E.lampiao(m, px + 326, 20, '#3a3048');
        });
      });
      return {
        sky: sky(SKY.noite, (x, r) => { stars(x, r, 60, 70); moon(x, 270, 26, 9, '#3a4a9a'); }), layers: [{ c: far, s: .12 }, { c: mid, s: .45 }], ground: gnd('deck'), light: true,
        extras(ctx, t, scroll) { brilho.forEach((p, i) => { const bx = onLayer(scroll, .45, p[0]); if (bx > -4 && bx < W && Math.floor(t / 9 + i) % 3) R(ctx, '#e8fbff', bx + Math.round(Math.sin(t / 12 + i) * 2), p[1], 3, 1); }); }
      };
    },
    function () { // 5. a casa dela
      const far = layer(940, (f, r) => {
        E.morros(f, '#c89a78', 44, 10, 5);
        for (let i = 0; i < 150; i++) { const px = r() * TW, py = GY - 6 - r() * 40; R(f, ['#c8703c', '#b86434', '#d88850', '#e8e0d0', '#8ab8d0'][(r() * 5) | 0], px, py, 7, 5); R(f, '#3a2a20', px + 2, py + 1, 2, 2); }
      });
      const mid = layer(941, (m, r) => {
        for (let x = 4, i = 0; x < TW - 40; i++) {
          const w = 34 + ((r() * 10) | 0), h = 22 + ((r() * 8) | 0), tijolo = i % 3 !== 1, wall = tijolo ? '#c8703c' : ['#8ac0a8', '#f0d8a0', '#a8c8e8'][i % 3];
          R(m, wall, x, GY - h, w, h); if (tijolo) { for (let yy = GY - h + 3; yy < GY; yy += 4) R(m, '#a85a2c', x, yy, w, 1); for (let xx = x + 4; xx < x + w; xx += 7) R(m, '#a85a2c', xx, GY - h, 1, h); }
          R(m, '#b0aca4', x - 1, GY - h - 2, w + 2, 2); // laje
          R(m, '#5a3a1c', x + 4, GY - 12, 6, 12); R(m, '#3a4a5a', x + 16, GY - 13, 9, 7); R(m, '#8ab8d0', x + 17, GY - 12, 7, 5);
          if (i % 2 === 0) { R(m, '#2e86de', x + w - 12, GY - h - 9, 8, 7); R(m, '#5aa8f0', x + w - 12, GY - h - 9, 8, 1); }
          if (i % 3 === 0) { R(m, '#8a8e92', x + 6, GY - h - 9, 1, 7); disc(m, '#c8ccd0', x + 6, GY - h - 10, 3); }
          if (i % 4 === 2) { for (let k = 0; k < 4; k++) R(m, '#8a8e92', x + w + 1, GY - h + k * 5, 6 - k, 1); }
          x += w + 4 + ((r() * 6) | 0);
        }
        for (let px = 50; px < TW; px += 150) E.poste(m, px, 46, '#5a4636');
        E.fios(m, GY - 44, 150, 50, '#5a4636', 5); E.fios(m, GY - 40, 150, 50, '#5a4636', 7);
        [206, 520].forEach(px => { // a mesinha com o jogo de café
          R(m, '#8a5a30', px, GY - 10, 24, 2); R(m, '#6b4424', px + 2, GY - 8, 2, 8); R(m, '#6b4424', px + 20, GY - 8, 2, 8);
          R(m, '#17141f', px + 3, GY - 22, 7, 12); R(m, '#ffffff', px + 3, GY - 18, 7, 3); R(m, '#17141f', px + 5, GY - 25, 3, 3);
          R(m, '#ffffff', px + 12, GY - 15, 5, 5); R(m, '#17141f', px + 12, GY - 13, 5, 1); R(m, '#17141f', px + 18, GY - 15, 5, 5); R(m, '#ffffff', px + 18, GY - 13, 5, 1);
        });
      });
      return { sky: sky(SKY.aurora, x => { disc(x, '#fff0c8', 270, 96, 18); disc(x, '#fffbe8', 270, 96, 13); }), layers: [{ c: far, s: .12 }, { c: mid, s: .45 }], ground: gnd('terra') };
    }
  ];

  // ==================================================================
  //  CARMEN MIRANDA (Alô, Alô, Carnaval, 1936 · Banana da Terra, 1939)
  // ==================================================================
  const CARMEN = [
    function () { // 1. a rainha do rádio
      const far = layer(1000, (f, r) => { rio(f, '#7aa8c4', 420, { cabo: '#4a6a80', cristo: '#e8f0f4' }); baia(f, r, '#3a8ac4', '#a8dcf4', 16); });
      const mid = layer(1001, (m) => {
        [30, 366].forEach(px => { // o prédio da rádio
          R(m, '#f0e4c8', px, GY - 46, 90, 46); R(m, '#f0e4c8', px + 20, GY - 58, 50, 12); R(m, '#f0e4c8', px + 36, GY - 66, 18, 8); R(m, '#d8c8a4', px - 1, GY - 47, 92, 2);
          for (let i = 0; i < 6; i++) { R(m, '#d8c8a4', px + 6 + i * 14, GY - 42, 3, 28); R(m, '#5f86a8', px + 10 + i * 14, GY - 40, 8, 10); R(m, '#5f86a8', px + 10 + i * 14, GY - 26, 8, 10); }
          R(m, '#8a3a2a', px + 34, GY - 14, 22, 14); R(m, '#2a1a20', px + 37, GY - 12, 16, 12);
          E.placa(m, px + 23, GY - 57, 'RADIO', '#8a2a2a', '#ffe066', 2);
          for (let i = 0; i < 30; i++) { R(m, '#5a5e66', px + 44 - i * .2, GY - 96 + i, 1, 1); R(m, '#5a5e66', px + 45 + i * .2, GY - 96 + i, 1, 1); if (i % 6 === 0) R(m, '#5a5e66', px + 44 - i * .2, GY - 96 + i, 1 + i * .4, 1); }
          [6, 10, 14].forEach(d => { for (let a = -6; a <= 6; a++) { const yy = Math.round(Math.sqrt(Math.max(0, d * d - a * a * 1.2))); R(m, '#d63031', px + 44 - yy - 4, GY - 96 + a, 1, 1); R(m, '#d63031', px + 45 + yy + 4, GY - 96 + a, 1, 1); } });
          // o bonde
          const b = px + 130;
          R(m, '#27ae60', b, GY - 14, 70, 10); R(m, '#ffd23f', b, GY - 24, 70, 3); R(m, '#f0e4c8', b, GY - 21, 70, 7); for (let i = 0; i < 8; i++) R(m, '#5a3a1c', b + i * 10, GY - 21, 1, 9);
          [8, 28, 48].forEach((d, k) => E.pessoa(m, b + d + 2, ['#2a2a34', '#8a3a3a', '#3f6aa0'][k], 14, { chapeu: '#2a2a34', head: '#e8bb94' }));
          R(m, '#27ae60', b, GY - 14, 70, 10); R(m, '#ffd23f', b, GY - 9, 70, 1); disc(m, '#1a1022', b + 12, GY - 3, 3); disc(m, '#1a1022', b + 58, GY - 3, 3);
          R(m, '#3a3a44', b + 34, GY - 40, 1, 16);
          E.palmeira(m, px + 226, 46, '#a88a5a', '#4ca060'); E.carro(m, px + 252, '#17141f', '#8a9aa8'); E.lampiao(m, px + 300, 34, '#3a3a44');
          E.pessoa(m, px + 100, '#fbf4e2', 13, { chapeu: '#e8dcc0', head: '#e8bb94' }); E.pessoa(m, px + 312, '#3a3a44', 13, { chapeu: '#17141f', head: '#8a5a3a' });
        });
        E.fios(m, GY - 40, 336, 0, '#3a3a44', 2);
      });
      return { sky: sky(SKY.azul, x => { cloud(x, 30, 18, '#ffffff'); cloud(x, 150, 34, '#ffffff'); }), layers: [{ c: far, s: .1 }, { c: mid, s: .45 }], ground: gnd('copacabana') };
    },
    function () { // 2. Alô, Alô, Carnaval
      const far = layer(1010, (f, r) => {
        for (let x = 0; x < TW;) { const w = 18 + ((r() * 22) | 0), h = 40 + ((r() * 46) | 0); R(f, '#b8c0d8', x, GY - h, w, h); R(f, '#dce4f4', x, GY - h, 3, h); R(f, '#dce4f4', x + w / 2 - 2, GY - h - 8, 4, 8); for (let yy = GY - h + 5; yy < GY - 4; yy += 6) R(f, '#7a84a8', x + 5, yy, w - 8, 2); x += w + 4; }
        [120, 456].forEach(px => { for (let i = 0; i < 9; i++) { R(f, '#f4f6ff', px + i * 6, GY - 6 - i * 6, 110 - i * 12, 6); R(f, '#b8c0d8', px + i * 6, GY - 1 - i * 6, 110 - i * 12, 1); } }); // a escadaria
        [[40, 30], [300, 20], [520, 36], [640, 24]].forEach(([px, y]) => { R(f, '#ffe066', px, y, 1, 7); R(f, '#ffe066', px - 3, y + 3, 7, 1); R(f, '#ffe066', px - 1, y + 1, 3, 5); R(f, '#ffe066', px - 2, y + 2, 5, 3); });
      });
      const mid = layer(1011, (m) => {
        [30, 366].forEach(px => {
          // a câmera da Cinédia
          const k = '#14101e';
          R(m, k, px + 4, GY - 34, 16, 11); disc(m, k, px + 8, GY - 39, 5); disc(m, k, px + 17, GY - 39, 5); disc(m, '#4a4458', px + 8, GY - 39, 2); disc(m, '#4a4458', px + 17, GY - 39, 2); R(m, k, px + 20, GY - 31, 6, 5); R(m, '#8ab8d0', px + 25, GY - 30, 2, 3);
          for (let i = 0; i < 23; i++) { R(m, k, px + 12 - i * .35, GY - 23 + i, 1, 1); R(m, k, px + 12 + i * .35, GY - 23 + i, 1, 1); } R(m, k, px + 12, GY - 23, 1, 23);
          E.pessoa(m, px - 8, '#3a3a50', 14, { chapeu: '#2a2a3a', head: '#e8bb94' });
          // refletores
          [56, 250].forEach(d => { R(m, '#5a5e66', px + d, GY - 44, 1, 44); R(m, '#5a5e66', px + d - 4, GY - 1, 9, 1); R(m, k, px + d - 5, GY - 54, 11, 10); R(m, '#fff7b8', px + d - 3, GY - 52, 7, 6); });
          E.placa(m, px + 96, GY - 70, 'CINEDIA', '#14101e', '#ffe066', 2); R(m, '#ffe066', px + 94, GY - 72, 64, 1); R(m, '#ffe066', px + 94, GY - 55, 64, 1);
          // a orquestra de fraque
          for (let i = 0; i < 7; i++) { const ox = px + 84 + i * 16; E.pessoa(m, ox, '#14101e', 13, { head: i % 2 ? '#e8bb94' : '#8a5a3a' }); R(m, '#ffffff', ox + 1, GY - 9, 2, 3); if (i % 3 === 0) { R(m, '#f5c518', ox + 4, GY - 10, 5, 2); disc(m, '#f5c518', ox + 10, GY - 10, 2); } else if (i % 3 === 1) { R(m, '#8a5a30', ox + 4, GY - 9, 3, 6); R(m, '#8a5a30', ox + 5, GY - 14, 1, 5); } }
          // as cartolas da dupla, esperando no cabide
          [210, 226].forEach(d => { R(m, '#8a8e92', px + d + 4, GY - 26, 1, 26); R(m, '#e8e8f4', px + d, GY - 30, 9, 1); R(m, '#e8e8f4', px + d + 2, GY - 36, 5, 6); R(m, '#ffe066', px + d + 2, GY - 32, 5, 1); });
          R(m, '#8a5a30', px + 280, GY - 16, 14, 2); R(m, '#8a5a30', px + 282, GY - 24, 2, 24); R(m, '#8a5a30', px + 292, GY - 14, 2, 14); R(m, '#fbf4e2', px + 283, GY - 22, 9, 6);
        });
      });
      return {
        sky: sky(['#101438', '#181c4a', '#22285e', '#2c3472']), layers: [{ c: far, s: .15 }, { c: mid, s: .45 }], ground: gnd('palco'), light: true,
        extras(ctx, t) { holofotes(ctx, t, [60, 170, 280], .10, true); brilhos(ctx, t, 14, 10, 90, '#ffffff', '#ffe066'); }
      };
    },
    function () { // 3. Banana da Terra
      const far = layer(1020, (f, r) => {
        baia(f, r, '#2a9ac8', '#b0e8f4', 26);
        [140, 500].forEach(px => { for (let i = 0; i < 10; i++) R(f, '#fffaf0', px + 4 - i * .3, GY - 38 + i, 1 + i * .8, 1); R(f, '#8a5a30', px - 2, GY - 28, 14, 2); });
        for (let px = 30; px < TW; px += 110) E.palmeira(f, px, 50 + (px % 3) * 6, '#b89a6a', '#4ca060', true);
      });
      const mid = layer(1021, (m) => {
        casario(m, 4, 190);
        [200, 236, 262].forEach((px, k) => E.bananeira(m, px, 34 + k * 6));
        E.baiana(m, 290); E.baiana(m, 316);
        // o tabuleiro de frutas
        R(m, '#8a5a30', 340, GY - 10, 40, 2); R(m, '#6b4424', 344, GY - 8, 2, 8); R(m, '#6b4424', 374, GY - 8, 2, 8);
        [[344, '#ffd23f'], [350, '#ff8c1a'], [356, '#d63031'], [362, '#27ae60'], [368, '#ffd23f'], [374, '#ff8c1a']].forEach(fr => disc(m, fr[1], fr[0], GY - 13, 3));
        for (let i = 0; i < 6; i++) R(m, i % 2 ? '#d63031' : '#fbf4e2', 336 + i * 8, GY - 34, 8, 5); R(m, '#5a3a1c', 338, GY - 30, 1, 20); R(m, '#5a3a1c', 381, GY - 30, 1, 20);
        casario(m, 400, 560, { i0: 3 });
        [570, 604, 634].forEach((px, k) => E.bananeira(m, px, 38 - k * 4)); E.baiana(m, 652);
        E.bandeirinhas(m, 10, 190, GY - 46); E.bandeirinhas(m, 400, 560, GY - 46);
      });
      return { sky: sky(SKY.cdd, x => sun(x, 262, 34, 13, '#fff3bd', '#ffffff', true)), layers: [{ c: far, s: .12 }, { c: mid, s: .45 }], ground: gnd('pedra') };
    },
    function () { // 4. o Cassino da Urca
      const far = layer(1030, (f, r) => { rio(f, '#141a48', 200, { cabo: '#3a4a9a', cristo: '#8a9ad8' }); baia(f, r, '#1a2460', '#ffd86b', 14); for (let i = 0; i < 50; i++) R(f, '#ffd86b', r() * TW, GY - 15 - r() * 8, 1, 1); });
      const luzes = [];
      const mid = layer(1031, (m) => {
        [20, 356].forEach(px => {
          R(m, '#f0ecf8', px, GY - 44, 220, 44); R(m, '#c8c0dc', px - 2, GY - 47, 224, 4); R(m, '#f0ecf8', px + 70, GY - 60, 80, 14); R(m, '#c8c0dc', px + 68, GY - 62, 84, 3);
          for (let i = 0; i < 11; i++) { const ax = px + 6 + i * 19; R(m, '#ffd86b', ax + 2, GY - 34, 12, 20); disc(m, '#ffd86b', ax + 8, GY - 34, 6); R(m, '#c8c0dc', ax + 7, GY - 40, 1, 26); if (i !== 5) R(m, '#f0ecf8', ax, GY - 14, 16, 14); }
          R(m, '#8a2a3a', px + 96, GY - 22, 28, 22); R(m, '#2a1020', px + 100, GY - 18, 20, 18); R(m, '#d63031', px + 90, GY, 40, 0);
          R(m, '#ff5fa8', px + 26, GY - 78, 170, 15); R(m, '#14101e', px + 28, GY - 76, 166, 11); G.text(m, 'CASSINO DA URCA', px + 52, GY - 73, '#ffe066', 2);
          R(m, '#3a3a44', px + 60, GY - 63, 2, 3); R(m, '#3a3a44', px + 158, GY - 63, 2, 3);
          for (let i = 0; i < 22; i++) luzes.push([px + 4 + i * 10, GY - 49]);
          E.palmeira(m, px + 236, 50, '#3a3048', '#2a6a50'); E.carro(m, px + 250, '#14101e', '#8a9aa8'); E.carro(m, px + 290, '#2a2a3a', '#8a9aa8');
          [226, 244, 282, 322].forEach((d, k) => E.pessoa(m, px + d, k % 2 ? '#fbf4e2' : '#14101e', 13, { chapeu: k % 2 ? null : '#14101e', head: '#e8bb94' }));
        });
      });
      return {
        sky: sky(SKY.noite, (x, r) => { stars(x, r, 60, 70); moon(x, 50, 26, 8, '#3a4a9a'); }), layers: [{ c: far, s: .1 }, { c: mid, s: .45 }], ground: gnd('asfalto'), light: true,
        extras(ctx, t, scroll) { luzes.forEach((p, i) => { const lx = onLayer(scroll, .45, p[0]); if (lx > -3 && lx < W) R(ctx, (Math.floor(t / 8) + i) % 3 === 0 ? '#ffffff' : '#ffb347', lx, p[1], 2, 2); }); holofotes(ctx, t, [40, 300], .08, false); }
      };
    },
    function () { // 5. Hollywood
      const far = layer(1040, (f) => {
        E.morros(f, '#c8a088', 52, 10, 5); E.morros(f, '#b08a70', 34, 8, 4);
        [90, 420].forEach(px => { G.text(f, 'HOLLYWOOD', px, GY - 56, '#ffffff', 2); for (let i = 0; i < 9; i++) { R(f, '#e8e0d8', px + 1 + i * 8, GY - 46, 1, 6); R(f, '#e8e0d8', px + 5 + i * 8, GY - 46, 1, 6); } });
        for (let px = 20; px < TW; px += 62) { const h = 62 + (px % 4) * 5; R(f, '#8a6a58', px, GY - h, 1, h); for (let i = 0; i < 6; i++) { R(f, '#5a8a60', px - i, GY - h - 2 + i * .8, 2, 1); R(f, '#5a8a60', px + i, GY - h - 2 + i * .8, 2, 1); } }
      });
      const mid = layer(1041, (m) => {
        [30, 366].forEach(px => {
          // o Chinese Theatre, onde Carmen deixou as mãos no cimento
          R(m, '#d8d0c0', px, GY - 34, 30, 34); R(m, '#d8d0c0', px + 90, GY - 34, 30, 34); R(m, '#b0a898', px + 30, GY - 40, 60, 40); R(m, '#2a1a20', px + 44, GY - 26, 32, 26);
          for (let i = 0; i < 14; i++) R(m, i < 3 ? '#b8860b' : '#3f8a6a', px + 60 - (6 + i * 3.4), GY - 70 + i * 2.2, (6 + i * 3.4) * 2, 3);
          R(m, '#b8860b', px + 59, GY - 78, 2, 9); [36, 82].forEach(d => { R(m, '#c0392b', px + d, GY - 40, 5, 40); R(m, '#f5c518', px + d - 1, GY - 41, 7, 2); });
          R(m, '#f5c518', px + 52, GY - 22, 16, 10); R(m, '#c0392b', px + 54, GY - 20, 12, 6);
          [8, 100].forEach(d => { R(m, '#fbf4e2', px + d, GY - 26, 14, 20); R(m, ['#ff7eb6', '#2e86de'][d > 50 ? 1 : 0], px + d + 1, GY - 25, 12, 14); R(m, '#ffd23f', px + d + 4, GY - 23, 6, 3); R(m, '#f0c9a0', px + d + 5, GY - 20, 4, 4); });
          // as placas de cimento do pátio
          [130, 144, 158].forEach(d => { R(m, '#c8c4bc', px + d, GY - 2, 12, 2); R(m, '#8a867e', px + d + 3, GY - 2, 2, 1); R(m, '#8a867e', px + d + 7, GY - 2, 2, 1); });
          // o portão do estúdio
          R(m, '#f0e4c8', px + 190, GY - 44, 10, 44); R(m, '#f0e4c8', px + 262, GY - 44, 10, 44); for (let i = 0; i < 8; i++) R(m, '#f0e4c8', px + 196 + i * 2, GY - 52 - (i < 4 ? i : 7 - i) * 2 + 4, 72 - i * 4, 2); R(m, '#f0e4c8', px + 196, GY - 50, 72, 8);
          G.text(m, 'STUDIO', px + 209, GY - 48, '#8a2a2a', 2); for (let i = 0; i < 10; i++) R(m, '#3a3a44', px + 202 + i * 6, GY - 30, 1, 30); R(m, '#3a3a44', px + 200, GY - 30, 62, 1);
          // a limusine
          R(m, '#14101e', px + 284, GY - 9, 44, 7); R(m, '#14101e', px + 294, GY - 14, 24, 5); for (let i = 0; i < 3; i++) R(m, '#8a9aa8', px + 296 + i * 7, GY - 13, 5, 4); disc(m, '#14101e', px + 292, GY - 2, 3); disc(m, '#14101e', px + 320, GY - 2, 3); R(m, '#c8ccd0', px + 284, GY - 5, 44, 1);
          for (let i = 0; i < 3; i++) { const sx = px + 166 + i * 8; R(m, '#f5c518', sx, GY - 12, 1, 12); R(m, '#c0392b', sx, GY - 10, 9, 1); }
        });
      });
      return {
        sky: sky(['#ff9ec0', '#ffb8a0', '#ffd890', '#fff0b0'], x => { disc(x, '#fff0c0', 60, 80, 20); disc(x, '#fffbe8', 60, 80, 15); }), layers: [{ c: far, s: .12 }, { c: mid, s: .45 }], ground: gnd('calcada'),
        extras(ctx, t) { holofotes(ctx, t, [110, 250], .10, false); }
      };
    }
  ];

  // ==================================================================
  //  CARLOTA JOAQUINA, PRINCESA DO BRAZIL (1995)
  // ==================================================================
  E.nau = function (f, px, y) { // y = linha d'água
    const h = '#6b4226';
    R(f, h, px, y - 7, 42, 5); R(f, h, px + 3, y - 2, 36, 3); R(f, h, px + 36, y - 13, 8, 6); R(f, h, px - 4, y - 9, 5, 3); R(f, '#f5c518', px, y - 7, 44, 1);
    R(f, '#3f2816', px + 11, y - 38, 1, 31); R(f, '#3f2816', px + 26, y - 42, 1, 35);
    R(f, '#fffaf0', px + 5, y - 34, 13, 10); R(f, '#fffaf0', px + 6, y - 22, 11, 9); R(f, '#fffaf0', px + 20, y - 38, 13, 11); R(f, '#fffaf0', px + 21, y - 25, 11, 10);
    R(f, '#d63031', px + 12, y - 41, 5, 2); R(f, '#d63031', px + 27, y - 45, 5, 2);
  };
  function palacio(m, px, w, h, wall, trim, roof, o) {
    o = o || {};
    R(m, wall, px, GY - h, w, h); R(m, roof, px - 2, GY - h - 4, w + 4, 5); R(m, 'rgba(0,0,0,.25)', px - 2, GY - h, w + 4, 1);
    const n = Math.floor((w - 8) / 16);
    for (let i = 0; i < n; i++) {
      const wx = px + 6 + i * 16;
      R(m, trim, wx, GY - h + 6, 8, 10); R(m, o.glass || '#8ab8e8', wx + 1, GY - h + 7, 6, 8);
      if (!o.arcos) { R(m, trim, wx, GY - 16, 8, 12); R(m, o.glass || '#8ab8e8', wx + 1, GY - 15, 6, 10); }
    }
    if (!o.arcos) { R(m, trim, px + w / 2 - 7, GY - 18, 14, 18); R(m, o.door || '#2a1a20', px + w / 2 - 5, GY - 16, 10, 16); }
  }
  const CARLOTA = [
    function () { // 1. Madri
      const far = layer(1100, (f, r) => { E.morros(f, '#d8b078', 38, 9, 4); E.telhados(f, r, '#c88a58'); });
      const mid = layer(1101, (m) => {
        [20, 356].forEach(px => {
          palacio(m, px, 170, 46, '#f0e0c0', '#c8a878', '#b9603a', { glass: '#6a8aa8', arcos: true });
          for (let i = 0; i < 9; i++) { R(m, '#c8a878', px + 8 + i * 18, GY - 18, 12, 18); disc(m, '#c8a878', px + 14 + i * 18, GY - 18, 6); R(m, '#5a4030', px + 10 + i * 18, GY - 16, 8, 16); disc(m, '#5a4030', px + 14 + i * 18, GY - 16, 4); }
          [2, 84, 166].forEach(d => { R(m, '#5a3a1c', px + d, GY - 66, 1, 16); R(m, '#c0392b', px + d + 1, GY - 66, 9, 2); R(m, '#f5c518', px + d + 1, GY - 64, 9, 3); R(m, '#c0392b', px + d + 1, GY - 61, 9, 2); });
          // laranjeiras, fonte e baile flamenco
          [186, 300].forEach(d => { R(m, '#6b4a2b', px + d, GY - 16, 3, 16); disc(m, '#3f8a5a', px + d + 1, GY - 22, 9); [[-4, -24], [3, -19], [-1, -27], [5, -25]].forEach(o => R(m, '#ff8c1a', px + d + o[0], GY + o[1], 2, 2)); });
          R(m, '#b8b2a8', px + 210, GY - 6, 26, 6); R(m, '#9a948c', px + 221, GY - 18, 4, 12); disc(m, '#b8b2a8', px + 223, GY - 19, 4); R(m, '#8ad0f0', px + 217, GY - 15, 2, 9); R(m, '#8ad0f0', px + 227, GY - 15, 2, 9);
          E.pessoa(m, px + 250, '#c0392b', 13, { head: '#e8bb94' }); for (let i = 0; i < 6; i++) R(m, '#c0392b', px + 249 - i * .5, GY - 6 + i, 6 + i, 1); R(m, '#14101e', px + 250, GY - 14, 3, 1);
          E.pessoa(m, px + 268, '#14101e', 13, { head: '#e8bb94', chapeu: '#14101e' }); R(m, '#8a5a30', px + 272, GY - 8, 5, 3); R(m, '#8a5a30', px + 276, GY - 10, 6, 1);
        });
      });
      return { sky: sky(SKY.sertao, x => sun(x, 262, 30, 14, '#fff3bd', '#ffffff', true)), layers: [{ c: far, s: .12 }, { c: mid, s: .45 }], ground: gnd('pedra') };
    },
    function () { // 2. Queluz
      const far = layer(1110, (f, r) => { E.morros(f, '#8ab08a', 36, 8, 4); E.copas(f, r, '#5aa060', 18, 8); });
      const mid = layer(1111, (m) => {
        [10, 346].forEach(px => {
          palacio(m, px, 190, 44, '#f4c8c0', '#ffffff', '#6a7a8a', { glass: '#7aa0c0', door: '#3f6aa0' });
          for (let i = 0; i < 13; i++) R(m, '#ffffff', px + 1 + i * 15.7, GY - 44, 2, 44); // pilastras
          for (let i = 0; i < 12; i++) { R(m, '#ffffff', px + 4 + i * 16, GY - 52, 8, 2); R(m, '#ffffff', px + 7 + i * 16, GY - 55, 2, 3); }
          // jardim de buxo
          [198, 212, 322].forEach(d => { for (let i = 0; i < 12; i++) R(m, '#3f8a5a', px + d + 6 - i * .5, GY - 14 + i, 1 + i, 1); R(m, '#6b4a2b', px + d + 5, GY - 2, 3, 2); });
          // a mesa de Dom João: frango, frango e frango
          const tx = px + 232;
          R(m, '#fbf4e2', tx, GY - 12, 44, 3); R(m, '#8a2a3a', tx, GY - 9, 44, 9); R(m, '#f5c518', tx, GY - 9, 44, 1);
          [4, 18, 32].forEach(d => { R(m, '#c8ccd0', tx + d, GY - 13, 9, 1); R(m, '#c88a3c', tx + d + 1, GY - 17, 6, 4); R(m, '#a86a24', tx + d + 2, GY - 18, 4, 1); R(m, '#fbf4e2', tx + d + 7, GY - 16, 2, 1); });
          // Dom João, de coxa na mão
          const jx = tx + 50;
          R(m, '#3f6aa0', jx, GY - 12, 9, 9); R(m, '#fbf4e2', jx + 3, GY - 12, 3, 6); R(m, '#f0c9a0', jx + 2, GY - 16, 5, 4); R(m, '#f4f0e6', jx + 1, GY - 18, 7, 2); R(m, '#f4f0e6', jx + 1, GY - 16, 1, 3); R(m, '#f4f0e6', jx + 7, GY - 16, 1, 3);
          R(m, '#fbf4e2', jx + 1, GY - 3, 2, 3); R(m, '#fbf4e2', jx + 6, GY - 3, 2, 3); R(m, '#c88a3c', jx + 10, GY - 16, 3, 3); R(m, '#fbf4e2', jx + 9, GY - 13, 1, 2);
          // fonte
          R(m, '#e8ecf0', px + 296, GY - 6, 22, 6); R(m, '#e8ecf0', px + 304, GY - 20, 6, 14); R(m, '#e8ecf0', px + 302, GY - 24, 10, 4); R(m, '#8ad0f0', px + 299, GY - 7, 16, 1);
        });
      });
      return { sky: sky(SKY.azul, x => { cloud(x, 40, 20, '#ffffff'); cloud(x, 230, 30, '#ffffff'); }), layers: [{ c: far, s: .12 }, { c: mid, s: .45 }], ground: gnd('piso') };
    },
    function () { // 3. a fuga
      const far = layer(1120, (f, r) => {
        R(f, '#2a4a6a', 0, GY - 40, TW, 40); R(f, '#4a6a8a', 0, GY - 40, TW, 2);
        for (let i = 0; i < 120; i++) R(f, i % 3 ? '#3a5a7a' : '#dce8f0', r() * TW, GY - 36 + r() * 34, 4 + r() * 8, 1);
        [60, 250, 430, 590].forEach((px, k) => E.nau(f, px, GY - 20 - (k % 2) * 8));
      });
      const mid = layer(1121, (m) => {
        const w = '#6b4226', d = '#4a2e18';
        R(m, w, 0, GY - 13, TW, 2); R(m, d, 0, GY - 11, TW, 1); for (let px = 0; px < TW; px += 8) R(m, w, px, GY - 11, 2, 11); R(m, w, 0, GY - 3, TW, 3); // amurada
        [110, 446].forEach(px => { // mastro, vela e bagagem real
          for (let i = 0; i < 30; i++) R(m, '#e8e0cc', px - 38 + i * 2.7, 37 + Math.round(Math.sin(i / 29 * Math.PI) * 9), 3, 22);
          R(m, d, px, 0, 5, GY); R(m, w, px + 1, 0, 2, GY); R(m, d, px - 40, 34, 86, 3);
          for (let i = 0; i < 60; i++) { R(m, '#c8b890', px - i * .9, 36 + i * 1.3, 1, 1); R(m, '#c8b890', px + 5 + i * .9, 36 + i * 1.3, 1, 1); }
          E.barril(m, px + 64); E.barril(m, px + 74);
          [[100, 14, 10, '#8a3a3a'], [116, 18, 14, '#6b4a2b'], [136, 12, 9, '#3f6aa0'], [102, 12, 8, '#3f8a5a']].forEach((b, k) => { const by = k === 3 ? GY - 10 - b[2] : GY - b[2]; R(m, b[3], px + b[0], by, b[1], b[2]); R(m, '#f5c518', px + b[0], by + 3, b[1], 1); });
          R(m, '#3a3a44', px + 180, GY - 26, 1, 14); R(m, '#ffd86b', px + 178, GY - 30, 5, 5);
          E.pessoa(m, px + 200, '#f4f0e6', 12, { head: '#f0c9a0' }); R(m, '#f4f0e6', px + 199, GY - 14, 5, 2); // de turbante, por causa dos piolhos
          E.pessoa(m, px + 214, '#6a2c8a', 12, { head: '#f0c9a0' }); R(m, '#f4f0e6', px + 213, GY - 14, 5, 2);
        });
      });
      return {
        sky: sky(['#3a4460', '#56607c', '#7a849c', '#a0a8b8'], x => { cloud(x, 20, 16, '#8a94ac'); cloud(x, 130, 28, '#6a748c'); cloud(x, 250, 12, '#8a94ac'); }), layers: [{ c: far, s: .08 }, { c: mid, s: .45 }], ground: gnd('palco'),
        extras(ctx, t) {
          ctx.fillStyle = 'rgba(220,232,240,.5)';
          for (let k = 0; k < 40; k++) ctx.fillRect(W - (k * 37 + t * 3) % (W + 20), (k * 53 + t * 5) % GY, 1, 4);
          if (t % 260 < 4) { ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(0, 0, W, GY); }
        }
      };
    },
    function () { // 4. Rio de Janeiro, 1808
      const far = layer(1130, (f, r) => { rio(f, '#7aa888', 130, { semCristo: true }); baia(f, r, '#3a9ac4', '#b0e4f4', 16); [330, 560].forEach(px => E.nau(f, px, GY - 8)); });
      const mid = layer(1131, (m) => {
        [20, 356].forEach(px => {
          palacio(m, px, 180, 46, '#fbf4e2', '#3f6aa0', '#b9603a'); // o Paço
          R(m, '#5a3a1c', px + 90, GY - 66, 1, 16); R(m, '#3f6aa0', px + 91, GY - 66, 5, 6); R(m, '#fbf4e2', px + 96, GY - 66, 5, 6);
          const cx = px + 214; R(m, '#b8b2a8', cx, GY - 8, 26, 8); for (let i = 0; i < 16; i++) R(m, '#c8c2b8', cx + 13 - i * .5, GY - 24 + i, 1 + i, 1); R(m, '#8ad0f0', cx + 3, GY - 8, 20, 1); // chafariz
          E.palmeira(m, px + 198, 54, '#b8a888', '#4ca060'); E.palmeira(m, px + 250, 46, '#b8a888', '#4ca060');
          E.baiana(m, px + 264); E.pessoa(m, px + 284, '#e8e0d0', 12, { head: '#5e3822', pedra: true }); E.pessoa(m, px + 298, '#e8e0d0', 13, { head: '#5e3822', pedra: true }); E.baiana(m, px + 312);
        });
      });
      return {
        sky: sky(SKY.cdd, x => sun(x, 60, 30, 15, '#fff3bd', '#ffffff', true)), layers: [{ c: far, s: .1 }, { c: mid, s: .45 }], ground: gnd('pedra'),
        extras(ctx, t) { for (let k = 0; k < 9; k++) R(ctx, '#1a1022', 40 + k * 34 + Math.sin(t / 7 + k * 2) * 9, 70 + Math.cos(t / 5 + k * 3) * 12 + (k % 3) * 8, 1, 1); } // mosquitos
      };
    },
    function () { // 5. nem o pó
      const far = layer(1140, (f, r) => { rio(f, '#3e2a5a', 420, { semCristo: true }); baia(f, r, '#6a4a8a', '#ffc078', 20); [40, 230].forEach(px => E.nau(f, px, GY - 12)); });
      const mid = layer(1141, (m) => {
        [60, 396].forEach(px => {
          // o costado do navio, com a prancha de embarque
          R(m, '#fffaf0', px + 8, 20, 46, 30); R(m, '#fffaf0', px + 62, 14, 46, 34); R(m, '#e0d8c4', px + 8, 46, 46, 4); R(m, '#e0d8c4', px + 62, 44, 46, 4);
          R(m, '#3f2816', px + 30, 0, 3, GY - 40); R(m, '#3f2816', px + 84, 0, 3, GY - 40); R(m, '#3f6aa0', px + 33, 6, 8, 6); R(m, '#fbf4e2', px + 41, 6, 8, 6);
          R(m, '#4a2e18', px, GY - 40, 110, 40); R(m, '#6b4226', px, GY - 40, 110, 3); R(m, '#f5c518', px, GY - 34, 110, 1);
          for (let i = 0; i < 6; i++) { R(m, '#2a1a10', px + 10 + i * 17, GY - 28, 7, 6); R(m, '#ffd86b', px + 12 + i * 17, GY - 26, 3, 2); }
          for (let i = 0; i < 26; i++) R(m, '#8a6a48', px + 110 + i, GY - 20 + i * .75, 2, 2);
          // os baús da corte
          [[146, 16, 11, '#8a3a3a'], [164, 20, 14, '#6b4a2b'], [150, 14, 9, '#3f6aa0'], [188, 12, 9, '#3f8a5a']].forEach((b, k) => { const by = k === 2 ? GY - 11 - b[2] : GY - b[2]; R(m, b[3], px + b[0], by, b[1], b[2]); R(m, '#f5c518', px + b[0], by + 3, b[1], 1); R(m, '#f5c518', px + b[0] + b[1] / 2 - 1, by + 2, 2, 3); });
          // o povo no cais, de lenço na mão
          [210, 224, 240, 256, 270].forEach((d, k) => { E.pessoa(m, px + d, ['#3a2a50', '#5a3a4a', '#2a2a44'][k % 3], 12 + (k % 2), { head: k % 2 ? '#8a5a3a' : '#e8bb94' }); if (k % 2 === 0) R(m, '#ffffff', px + d + 4, GY - 16, 2, 2); });
          [286, 310].forEach(d => { R(m, '#5a5e66', px + d, GY - 8, 5, 8); R(m, '#7a7e86', px + d - 1, GY - 9, 7, 2); });
          // o par de sapatos que ficou para trás
          R(m, '#d63031', px + 294, GY - 3, 5, 3); R(m, '#f5c518', px + 296, GY - 3, 1, 1); R(m, '#d63031', px + 301, GY - 2, 5, 2); R(m, '#f5c518', px + 303, GY - 2, 1, 1);
        });
      });
      return { sky: sky(SKY.lilas, (x, r) => { stars(x, r, 20, 30); disc(x, '#ffd27a', 250, 104, 20); disc(x, '#fff3bd', 250, 104, 15); }), layers: [{ c: far, s: .1 }, { c: mid, s: .45 }], ground: gnd('pedra') };
    }
  ];

  // ------------------------------------------------------------------
  // roteiro: nome e referência de cada fase
  // ------------------------------------------------------------------
  const STAGES = [
    { film: 'MACUNAÍMA', trophies: [
      'Do livro de Mário de Andrade (1928) para o cinema em 1969',
      'FESTIVAL DE BRASÍLIA 1969! Grande Otelo, melhor ator',
      'SUCESSO! Mais de 2 milhões de pessoas viram “Macunaíma”',
      'MAR DEL PLATA 1970! “Macunaíma” eleito melhor filme',
      'CLÁSSICO! Uma das obras-primas do Cinema Novo'
    ], build: MAC, meta: [
      ['O NASCIMENTO', '“No fundo do mato-virgem nasceu Macunaíma,<br>herói de nossa gente.” Já nasceu grande e com preguiça.'],
      ['A FONTE MÁGICA', 'A água encantada que vira o herói do avesso.<br>Jiguê e Maanape chegam tarde e ficam na vontade.'],
      ['SÃO PAULO', 'A cidade grande: máquinas, anúncios, arranha-céus<br>e Ci, a guerrilheira, que guarda a muiraquitã.'],
      ['A FEIJOADA DO GIGANTE', 'Na mansão de Venceslau Pietro Pietra a piscina<br>é uma feijoada. A muiraquitã está com ele.'],
      ['A UIARA', 'De volta ao Uraricoera, sozinho. Cuidado com<br>a moça bonita que chama de dentro d’água.']
    ] },
    { film: 'DEUS E O DIABO NA TERRA DO SOL', trophies: [
      'CANNES 1964! O filme disputou a Palma de Ouro',
      'Glauber Rocha tinha só 25 anos quando o filme estreou',
      'Canções de Sérgio Ricardo com versos do próprio Glauber',
      'CANNES CLASSICS 2022! De volta à Croisette, restaurado em 4K',
      'ABRACCINE 2015: 2º melhor filme brasileiro de todos os tempos'
    ], build: DEUS, meta: [
      ['A FEIRA DE GADO', 'O vaqueiro Manuel acerta as contas com o<br>coronel Morais e cai no mundo com Rosa.'],
      ['MONTE SANTO', 'A escadaria do beato Sebastião: pedra na cabeça<br>e a promessa de uma ilha onde tudo é verde.'],
      ['ANTÔNIO DAS MORTES', 'Capa, chapelão e rifle. O matador de cangaceiro<br>foi contratado para acabar com os beatos.'],
      ['O SERTÃO DE CORISCO', 'Lampião morreu. Corisco rodopia de punhal na mão:<br>“Mais fortes são os poderes do povo!”'],
      ['O SERTÃO VAI VIRAR MAR', '…e o mar vai virar sertão. A corrida final<br>de Manuel termina na beira da praia.']
    ] },
    { film: 'CIDADE DE DEUS', trophies: [
      'Do romance de Paulo Lins, lançado em 1997',
      'Elenco formado por jovens atores de comunidades do Rio',
      'SUCESSO! Mais de 3 milhões de espectadores no Brasil',
      'BAFTA 2003! Melhor montagem para Daniel Rezende',
      'OSCAR 2004! 4 indicações, inclusive melhor direção'
    ], build: CDD, meta: [
      ['ANOS 60: TRIO TERNURA', 'As casinhas novas, a poeira dourada<br>e o assalto ao caminhão de gás.'],
      ['O MOTEL', 'Dadinho ficou de vigia do lado de fora.<br>Não ficou de vigia por muito tempo.'],
      ['ANOS 70: OS APÊS', 'Dadinho virou Zé Pequeno e tomou as bocas,<br>uma por uma. Só sobrou a do Cenoura.'],
      ['O BAILE DO BENÉ', 'A despedida do bandido mais gente fina<br>da Cidade de Deus. Luz, soul e black music.'],
      ['A GUERRA', 'Zé Pequeno contra Mané Galinha. E no meio<br>do tiroteio, a galinha que fugiu da panela.']
    ] },
    { film: 'À MEIA-NOITE LEVAREI SUA ALMA', trophies: [
      'PIONEIRO! Considerado o primeiro filme de terror brasileiro',
      'José Mojica Marins dirigiu e viveu o próprio Zé do Caixão',
      'Lá fora, Zé do Caixão ganhou o nome de “Coffin Joe”',
      'O personagem nasceu de um pesadelo de Mojica',
      'A trilogia só terminou em 2008, com “Encarnação do Demônio”'
    ], build: ZE, meta: [
      ['SEXTA-FEIRA SANTA', 'A vila inteira segue a procissão. O coveiro<br>Zé do Caixão come carne na janela e ri.'],
      ['A TABERNA', 'Carteado, cachaça e briga.<br>Ninguém na vila desafia o Zé e sai inteiro.'],
      ['A FUNERÁRIA', 'Caixões na vitrine e coroas de flores:<br>para o agente funerário, o negócio vai bem.'],
      ['A PROFECIA', 'Na estrada escura, a velha cigana avisa:<br>à meia-noite os mortos virão buscar sua alma.'],
      ['À MEIA-NOITE', 'Dia de Finados. O cemitério, a cripta<br>e a procissão dos mortos esperam por ele.']
    ] },
    { film: 'O AUTO DA COMPADECIDA', trophies: [
      'Da peça de Ariano Suassuna, escrita em 1955',
      'Antes do cinema, foi minissérie de TV em 1999',
      'SUCESSO! Mais de 2 milhões de espectadores em 2000',
      'A Compadecida do filme é Fernanda Montenegro',
      'A dupla voltou em 2024 com “O Auto da Compadecida 2”'
    ], build: AUTO, meta: [
      ['TAPEROÁ', 'João Grilo e Chicó correm a cidade anunciando<br>“A Paixão de Cristo” no cinema local.'],
      ['O ENTERRO DA CACHORRA', 'Em latim! A bichinha era tão inteligente que<br>deixou testamento para o padre e para o bispo.'],
      ['O GATO QUE DESCOME DINHEIRO', 'Negócio imperdível para a mulher do padeiro.<br>“Não sei, só sei que foi assim.”'],
      ['SEVERINO DE ARACAJU', 'O cangaceiro invade Taperoá. É hora de tocar<br>a gaita que ressuscita os mortos.'],
      ['O JULGAMENTO', 'O Encourado acusa, Manuel julga.<br>Valha-me Nossa Senhora, a Compadecida!']
    ] },
    { film: 'CENTRAL DO BRASIL', trophies: [
      'URSO DE OURO! Melhor filme no Festival de Berlim de 1998',
      'URSO DE PRATA! Fernanda Montenegro, melhor atriz em Berlim',
      'Vinícius de Oliveira, o Josué, era engraxate quando foi descoberto',
      'GLOBO DE OURO 1999! Melhor filme em língua estrangeira',
      'OSCAR 1999! Fernanda Montenegro indicada a melhor atriz'
    ], build: DORA, meta: [
      ['A ESTAÇÃO', 'Na Central do Brasil, Dora escreve as cartas<br>de quem nunca aprendeu a escrever.'],
      ['O TREM DO SUBÚRBIO', 'Lotado, todo santo dia. Na gaveta de casa,<br>as cartas que nunca foram para o correio.'],
      ['A ESTRADA', 'De ônibus e de carona, sertão adentro,<br>Dora e Josué vão atrás do pai do menino.'],
      ['A ROMARIA', 'Bom Jesus do Norte: velas, promessas,<br>fogos e retrato com o santo.'],
      ['VILA DO JOÃO', 'As casinhas todas iguais, o dia nascendo<br>e uma última carta: “Tenho saudade de tudo.”']
    ] },
    { film: 'XICA DA SILVA', trophies: [
      'FESTIVAL DE BRASÍLIA 1976! Melhor filme, direção e atriz',
      'Zezé Motta virou estrela nacional com o papel de Xica',
      'A canção-tema “Xica da Silva” é de Jorge Ben',
      'Roteiro de Cacá Diegues e Antônio Callado',
      'Inspirado em Chica da Silva, que viveu no Tijuco no século XVIII'
    ], build: XICA, meta: [
      ['ARRAIAL DO TIJUCO', 'Minas Gerais, século XVIII. Na terra dos diamantes,<br>a escrava Xica sonha muito mais alto que a senzala.'],
      ['O CONTRATADOR', 'João Fernandes chega para explorar os diamantes<br>da Coroa e se encanta por Xica.'],
      ['A ALFORRIA', 'Livre, Xica desfila de liteira, peruca e joias.<br>O arraial inteiro torce o nariz.'],
      ['O MAR DE XICA', 'Ela nunca viu o mar. O contratador manda fazer<br>um lago e um navio só para ela.'],
      ['O CONDE DE VALADARES', 'A Coroa manda um fiscal. João Fernandes volta<br>a Portugal e Xica corre para o mosteiro.']
    ] },
    { film: 'MINHA MÃE É UMA PEÇA', trophies: [
      'Dona Hermínia nasceu no teatro, no monólogo de Paulo Gustavo',
      'A personagem foi inspirada em Déa Lúcia, mãe de Paulo Gustavo',
      'SUCESSO! Filme nacional mais visto de 2013: 4,6 milhões',
      '“Minha Mãe é uma Peça 2” (2016) passou de 9 milhões de espectadores',
      'RECORDE! O terceiro filme (2019) passou de 11 milhões'
    ], build: HERMINIA, meta: [
      ['NITERÓI', 'Do outro lado da baía, Dona Hermínia cuida de tudo,<br>grita com todos e fala ao telefone sem parar.'],
      ['O PRÉDIO', 'No prédio, todo mundo ouve Dona Hermínia. E ela<br>ouve os filhos dizendo que a mãe é uma chata.'],
      ['A CASA DA TIA ZÉLIA', 'Magoada, ela faz a mala e some sem avisar:<br>vai se esconder na casa da tia Zélia.'],
      ['LEMBRANÇAS', 'Na casa da tia, a memória volta: os filhos<br>pequenos, as festas e as broncas de sempre.'],
      ['A PEÇA', 'Do palco para o cinema: a mãe mais famosa do Brasil<br>nasceu num monólogo de teatro.']
    ] },
    { film: 'QUE HORAS ELA VOLTA?', trophies: [
      'SUNDANCE 2015! Prêmio de atuação para Regina Casé e Camila Márdila',
      'BERLIM 2015! Prêmio do público na mostra Panorama',
      'Lá fora, o filme se chama “The Second Mother”',
      'Escolhido pelo Brasil para disputar uma vaga no Oscar 2016',
      'Regina Casé também brilhou em “Eu Tu Eles” (2000)'
    ], build: VAL, meta: [
      ['A CASA DO MORUMBI', 'São Paulo. Há mais de dez anos Val mora no emprego<br>e cria Fabinho, o filho dos patrões.'],
      ['A COZINHA', 'Da porta da cozinha para dentro, tudo tem lugar certo.<br>Até o sorvete, que é só do Fabinho.'],
      ['JÉSSICA CHEGA', 'A filha vem de Pernambuco prestar vestibular<br>e não aceita o quartinho dos fundos.'],
      ['A PISCINA', 'Jéssica passou na primeira fase. De madrugada,<br>Val entra na piscina pela primeira vez.'],
      ['A CASA DELA', 'Val pede as contas, leva o jogo de café<br>e vai morar com a filha.']
    ] },
    { film: 'ALÔ, ALÔ, CARNAVAL', trophies: [
      'Nascida em Portugal, Carmen chegou ao Brasil ainda bebê',
      'Em “Alô, Alô, Carnaval” ela canta com a irmã, Aurora Miranda',
      '“O que é que a baiana tem?” é de Dorival Caymmi',
      'Do Cassino da Urca direto para a Broadway, em 1939',
      'Em 1945, era a mulher mais bem paga dos Estados Unidos'
    ], build: CARMEN, meta: [
      ['A RAINHA DO RÁDIO', 'Rio de Janeiro, anos 30. A Pequena Notável<br>estoura no rádio, no disco e no carnaval.'],
      ['ALÔ, ALÔ, CARNAVAL', '1936, estúdios da Cinédia. De fraque e cartola,<br>ao lado da irmã Aurora, canta “Cantoras do Rádio”.'],
      ['BANANA DA TERRA', '1939. Pela primeira vez de baiana no cinema:<br>turbante, balangandãs e o samba de Caymmi.'],
      ['O CASSINO DA URCA', 'Aos pés do Pão de Açúcar, um empresário da Broadway<br>vê o show. O navio para Nova York já apita.'],
      ['HOLLYWOOD', 'A brasileira mais famosa do mundo deixa as mãos<br>no cimento do Chinese Theatre.']
    ] },
    { film: 'CARLOTA JOAQUINA, PRINCESA DO BRAZIL', trophies: [
      'MARCO DA RETOMADA! O filme reabriu as salas ao cinema nacional',
      'SUCESSO! Mais de 1 milhão de espectadores em 1995',
      'Primeiro longa dirigido por Carla Camurati',
      'Marieta Severo é Carlota; Marco Nanini é Dom João VI',
      'Carlota existiu: chegou ao Rio com a corte portuguesa em 1808'
    ], build: CARLOTA, meta: [
      ['MADRI', 'Espanha, 1785. Aos dez anos, a infanta Carlota<br>é prometida ao príncipe de Portugal.'],
      ['QUELUZ', 'Na corte portuguesa, um marido que só pensa em frango.<br>Dom João come; Carlota conspira.'],
      ['A FUGA', '1807. Napoleão invade Portugal e a corte inteira<br>embarca às pressas para o Brasil.'],
      ['RIO DE JANEIRO, 1808', 'O calor, os mosquitos, a colônia.<br>Carlota detesta tudo e não esconde de ninguém.'],
      ['NEM O PÓ', '1821. Na volta a Portugal, ela bate os sapatos:<br>desta terra não quer levar nem o pó.']
    ] }
  ];
  const built = {};
  G.FILMS = STAGES.map(s => s.film);
  G.getScene = function (ci, ph) {
    const k = ci + ':' + ph;
    if (!built[k]) {
      const st = STAGES[ci];
      built[k] = Object.assign(st.build[ph](), { name: st.meta[ph][0], sub: st.meta[ph][1], film: st.film, trophy: st.trophies[ph] });
    }
    return built[k];
  };

  G.drawScene = function (ctx, sc, scroll, t) {
    ctx.drawImage(sc.sky, 0, 0);
    sc.layers.forEach((L, i) => {
      if (sc.extrasBehindMid && i === 1 && sc.extras) sc.extras(ctx, t, scroll);
      const off = Math.floor(scroll * L.s) % TW;
      ctx.drawImage(L.c, -off, 0);
      if (off > TW - W) ctx.drawImage(L.c, TW - off, 0);
    });
    if (sc.extras && !sc.extrasBehindMid) sc.extras(ctx, t, scroll);
    const off = Math.floor(scroll) % TW;
    ctx.drawImage(sc.ground, -off, GY);
    if (off > TW - W) ctx.drawImage(sc.ground, TW - off, GY);
  };

  // ------------------------------------------------------------------
  // TELA DE ESTREIA
  // ------------------------------------------------------------------
  const winR = rng(77);
  const wstars = []; for (let i = 0; i < 60; i++) wstars.push([winR() * W, winR() * 60]);
  const crowd = []; for (let i = 0; i < 44; i++) crowd.push([i < 22 ? 4 + i * 5.2 : 216 + (i - 22) * 5.4, (winR() * 5) | 0, ['#2a2140', '#3a2d55', '#1f1830'][i % 3]]);
  G.drawWin = function (ctx, t, charSpr) {
    R(ctx, '#120b2a', 0, 0, W, H); R(ctx, '#1d1240', 0, 40, W, 40); R(ctx, '#2a1a55', 0, 70, W, 50);
    wstars.forEach((s, i) => R(ctx, (t / 20 + i) % 9 < 1 ? '#ffffff' : '#9a8fd0', s[0], s[1], 1, 1));
    for (let k = 0; k < 2; k++) {
      const bx = k ? 300 : 36, a = Math.sin(t / 50 + k * 2) * .5 + (k ? -.5 : .5);
      ctx.fillStyle = 'rgba(255,240,180,.13)';
      ctx.beginPath(); ctx.moveTo(bx, GY); ctx.lineTo(bx + Math.sin(a - .12) * 200, GY - Math.cos(a - .12) * 200); ctx.lineTo(bx + Math.sin(a + .12) * 200, GY - Math.cos(a + .12) * 200); ctx.fill();
    }
    const cx = 108;
    R(ctx, '#7a1f2b', cx, 34, 120, 86); R(ctx, '#5c1620', cx + 108, 34, 12, 86); R(ctx, '#9c2b39', cx, 34, 120, 3);
    R(ctx, '#f6f2d4', cx + 8, 42, 104, 30); R(ctx, '#1a1022', cx + 10, 44, 100, 26);
    G.text(ctx, 'CINE BRASIL', cx + 17, 47, '#ffd23f', 2);
    G.text(ctx, 'HOJE: ESTREIA NACIONAL', cx + 17, 62, '#ffffff');
    for (let i = 0; i < 27; i++) { const on = (Math.floor(t / 10) + i) % 3 === 0; R(ctx, on ? '#fff7b8' : '#c9902a', cx + 8 + i * 4, 40, 2, 2); R(ctx, on ? '#fff7b8' : '#c9902a', cx + 8 + i * 4, 72, 2, 2); }
    R(ctx, '#ffd23f', cx + 44, 86, 32, 34); R(ctx, '#1a1022', cx + 46, 88, 13, 32); R(ctx, '#1a1022', cx + 61, 88, 13, 32);
    R(ctx, '#3a2d55', cx + 10, 84, 22, 28); R(ctx, '#3a2d55', cx + 88, 84, 22, 28);
    R(ctx, '#f0a020', cx + 12, 86, 18, 24); R(ctx, '#2e86de', cx + 90, 86, 18, 24);
    R(ctx, '#fff3bd', cx + 17, 90, 8, 8); R(ctx, '#1a1022', cx + 14, 104, 14, 1); R(ctx, '#fff', cx + 95, 92, 8, 10); R(ctx, '#1a1022', cx + 92, 104, 14, 1);
    R(ctx, '#2b2438', 0, GY, W, H - GY); R(ctx, '#3a3150', 0, GY, W, 1);
    ctx.fillStyle = '#c0392b';
    for (let y = 0; y < H - GY; y++) ctx.fillRect(cx + 44 - y * 2, GY + y, 32 + y * 4, 1);
    ctx.fillStyle = '#ffd23f';
    for (let y = 0; y < H - GY; y++) { ctx.fillRect(cx + 44 - y * 2, GY + y, 1, 1); ctx.fillRect(cx + 75 + y * 2, GY + y, 1, 1); }
    crowd.forEach((p, i) => {
      const jump = Math.floor(t / 9 + i * 1.7) % 4 === 0 ? 1 : 0;
      R(ctx, p[2], p[0], GY - 12 - p[1] - jump, 5, 14 + p[1]); R(ctx, p[2], p[0] + 1, GY - 16 - p[1] - jump, 3, 4);
      if ((Math.floor(t / 5) + i * 7) % 41 === 0) { R(ctx, '#ffffff', p[0] + 1, GY - 19 - p[1], 3, 3); R(ctx, '#ffffff', p[0] + 2, GY - 21 - p[1], 1, 7); R(ctx, '#ffffff', p[0] - 1, GY - 18 - p[1], 7, 1); }
    });
    for (let i = 0; i < 26; i++) {
      const fx = (i * 53 + Math.sin(t / 30 + i) * 8) % W, fy = (t * (.4 + (i % 5) * .12) + i * 31) % (GY + 10);
      R(ctx, ['#ffd23f', '#3ddc84', '#2e86de', '#ffffff'][i % 4], fx, fy, 1, 2);
    }
    const hop = Math.abs(Math.sin(t / 12)) * 5;
    G.draw(ctx, charSpr, cx + 48, GY - G.CH - hop + 6);
  };
})();
