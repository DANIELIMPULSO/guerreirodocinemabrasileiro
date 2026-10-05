/* Guerreiro do Cinema Brasileiro — lógica do jogo. */
(function () {
  'use strict';
  const G = window.G;
  const W = 336, H = 144, GROUND = 120, PX = 34;
  const GRAV = 0.36;
  const $ = id => document.getElementById(id);
  const canvas = $('game'), ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const stage = $('stage');

  const store = {
    get(k, d) { try { const v = localStorage.getItem('gcb_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('gcb_' + k, JSON.stringify(v)); } catch (e) { /* sem armazenamento: segue o jogo */ } }
  };

  // ------------------------------------------------------------------
  // Obstáculos: o que atrapalha o cinema nacional
  // ------------------------------------------------------------------
  const OB = {
    censura: {
      name: 'TESOURA DA CENSURA', label: 'CENSURA', spr: 'tesoura', kind: 'ground', pair: true,
      fact: 'Na ditadura militar (1964-85), a censura federal cortou e proibiu filmes. “Terra em Transe” (1967), de Glauber Rocha, chegou a ser interditado em todo o país.'
    },
    burocracia: {
      name: 'PILHA DE BUROCRACIA', label: 'BUROCRACIA', spr: 'burocracia', kind: 'ground', pair: true,
      fact: 'Em 2019, os editais do Fundo Setorial do Audiovisual ficaram paralisados em meio a um impasse sobre prestação de contas na Ancine. Projetos aprovados ficaram na gaveta.'
    },
    semverba: {
      name: 'COFRE VAZIO', label: 'SEM VERBA', spr: 'cofre', kind: 'ground',
      fact: 'Em 1990, o governo Collor extinguiu a Embrafilme e o Concine. A produção despencou: em 1992, apenas 3 longas brasileiros foram lançados.'
    },
    viralata: {
      name: 'COMPLEXO DE VIRA-LATA', label: 'VIRA-LATISMO', spr: 'viralata', kind: 'ground', pair: true,
      fact: '“Filme brasileiro é ruim”? Nelson Rodrigues chamou de complexo de vira-lata a mania de achar que o que é nosso vale menos. Assista antes de julgar!'
    },
    pirataria: {
      name: 'PIRATARIA', label: 'PIRATARIA', spr: 'pirataria', kind: 'fly',
      fact: 'Cada cópia pirata é um ingresso a menos para quem fez o filme. “Tropa de Elite” (2007) vazou e já circulava em camelôs antes mesmo da estreia.'
    },
    sala: {
      name: 'SALA FECHADA', label: 'SALA FECHADA', spr: 'sala', kind: 'ground',
      fact: 'Segundo o IBGE (2018), cerca de 40% dos brasileiros vivem em municípios sem nenhuma sala de cinema. Cinema de rua virou raridade.'
    },
    blockbuster: {
      name: 'BLOCKBUSTER', label: 'BLOCKBUSTER', spr: 'heroi', kind: 'ground',
      fact: 'Em 2019, “Vingadores: Ultimato” ocupou mais de 80% das salas do país. Quando um arrasa-quarteirão toma tudo, o filme nacional some de cartaz.'
    },
    streaming: {
      name: 'STREAMING SEM REGRAS', label: 'STREAMING', spr: 'streaming', kind: 'fly',
      fact: 'As plataformas operaram por mais de uma década no Brasil sem cota de conteúdo nacional nem contribuição ao setor. A regulamentação se arrastou por anos no Congresso.'
    },
    fogo: {
      name: 'ACERVO EM CHAMAS', label: 'DESCASO', spr: 'fogo', anim: 'fogo2', kind: 'ground',
      fact: 'Em 29 de julho de 2021, um incêndio destruiu parte do acervo da Cinemateca Brasileira em um galpão na Vila Leopoldina, em São Paulo. Memória não se refilma.'
    },
    hollywood: {
      name: 'HEGEMONIA DE HOLLYWOOD', label: 'HOLLYWOOD', spr: 'hollywood', kind: 'ground',
      fact: 'Em 2023, os filmes brasileiros ficaram com menos de 3% do público das salas. Em 2024, com “Ainda Estou Aqui”, a fatia subiu para cerca de 10%.'
    }
  };

  const PHASES = [
    { len: 5200, speed: 2.4, news: ['censura', 'burocracia'] },
    { len: 6200, speed: 2.75, news: ['semverba', 'viralata'] },
    { len: 7200, speed: 3.1, news: ['pirataria', 'sala'] },
    { len: 8200, speed: 3.45, news: ['blockbuster', 'streaming'] },
    { len: 9500, speed: 3.8, news: ['fogo', 'hollywood'] }
  ];
  // em cada fase, os perigos novos aparecem mais; os antigos continuam
  PHASES.forEach((p, i) => {
    p.pool = [];
    for (let k = 0; k <= i; k++) PHASES[k].news.forEach(id => { for (let j = 0; j < (k === i ? 3 : 1); j++) p.pool.push(id); });
  });
  const ALL = Object.keys(OB);


  // ------------------------------------------------------------------
  // Estado
  // ------------------------------------------------------------------
  const S = {
    mode: 'menu', t: 0, scroll: 0, charIdx: Math.min(G.CHARS.length - 1, store.get('char', 0)),
    endless: false, loop: 0, phase: 0, dist: 0, speed: 0, score: 0, reels: 0, shields: 0,
    gap: 0, finishing: false, seen: {}, paused: false, shake: 0, snap: null,
    trophyAt: 0, trophyDone: false, cardT: 0, lockT: 0, hi: store.get('hi', 0)
  };
  S.menuIdx = Math.min(G.CHARS.length, store.get('char', 0)); S.random = false;
  const P = { y: 0, vy: 0, ground: true, jumps: 0, hold: false, gliding: false, buf: 0, inv: 0, air: 0 };
  let obstacles = [], pickups = [], parts = [], shots = [];

  const ch = () => G.CHARS[S.charIdx];
  function cfg() {
    const p = PHASES[S.phase];
    if (!S.endless) return p;
    return { len: 5000, speed: Math.min(5.6, p.speed + S.loop * 0.45), pool: S.loop > 0 ? ALL : p.pool, news: p.news };
  }
  const reelsNeeded = () => ch().reelsPerShield || 5;

  // ------------------------------------------------------------------
  // Som (WebAudio, tudo sintetizado)
  // ------------------------------------------------------------------
  const audio = (function () {
    let ac = null, master = null, muted = store.get('mute', false), timer = null, stepN = 0, nextT = 0, playing = false;
    const hz = m => 440 * Math.pow(2, (m - 69) / 12);
    function init() {
      if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try { ac = new AC(); master = ac.createGain(); master.gain.value = muted ? 0 : 1; master.connect(ac.destination); } catch (e) { ac = null; }
    }
    function tone(f, t0, dur, type, vol, f2) {
      if (!ac) return;
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t0);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
      g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.02);
    }
    let noiseBuf = null;
    function noise(t0, dur, vol) {
      if (!ac) return;
      if (!noiseBuf) { noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.3, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
      const s = ac.createBufferSource(), g = ac.createGain();
      s.buffer = noiseBuf; g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      s.connect(g); g.connect(master); s.start(t0); s.stop(t0 + dur + 0.02);
    }
    const now = () => (ac ? ac.currentTime : 0);
    const sfx = {
      jump() { tone(420, now(), 0.13, 'square', 0.05, 760); },
      jump2() { tone(620, now(), 0.13, 'square', 0.05, 1100); },
      reel() { tone(988, now(), 0.07, 'square', 0.05); tone(1319, now() + 0.07, 0.12, 'square', 0.05); },
      trophy() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, now() + i * 0.08, 0.16, 'square', 0.06)); },
      shield() { tone(523, now(), 0.1, 'triangle', 0.12); tone(784, now() + 0.1, 0.2, 'triangle', 0.12); },
      save() { noise(now(), 0.2, 0.12); tone(300, now(), 0.25, 'sawtooth', 0.06, 600); },
      hit() { noise(now(), 0.3, 0.18); tone(220, now(), 0.45, 'sawtooth', 0.09, 55); },
      clap() { noise(now(), 0.06, 0.2); tone(180, now(), 0.06, 'square', 0.08); },
      win() { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, now() + i * 0.13, 0.22, 'square', 0.06)); }
    };
    // Trilhas: uma por personagem, na ordem de G.CHARS. São composições originais
    // no ESTILO da trilha de cada filme (gênero, ritmo, clima), não as músicas dos filmes.
    // Notas em número MIDI; 0 = pausa.
    const cat = (roots, fn) => roots.reduce((o, r) => o.concat(fn(r)), []);
    const TRACKS = [
      { // Macunaíma: marchinha de carnaval, deboche tropicalista
        dur: 0.15, melVol: 0.024,
        mel: [67, 67, 69, 67, 76, 0, 74, 0, 72, 72, 74, 72, 69, 0, 67, 0, 65, 65, 67, 69, 71, 0, 74, 0, 72, 76, 74, 71, 72, 0, 0, 0,
          76, 76, 77, 76, 74, 0, 72, 0, 74, 74, 76, 74, 72, 0, 69, 0, 65, 69, 72, 69, 67, 71, 74, 71, 72, 0, 76, 0, 72, 0, 0, 0],
        bass: [48, 0, 43, 0, 48, 0, 43, 0, 48, 0, 43, 0, 53, 0, 48, 0, 53, 0, 48, 0, 55, 0, 50, 0, 48, 0, 55, 0, 48, 0, 43, 0,
          48, 0, 43, 0, 55, 0, 50, 0, 55, 0, 50, 0, 53, 0, 48, 0, 53, 0, 48, 0, 55, 0, 50, 0, 48, 0, 43, 0, 48, 43, 48, 0],
        hat: [0, 1, 0, 1], kick: [1, 0, 1, 0]
      },
      { // Corisco: toada modal de cantador (ré dórico), viola em ostinato
        dur: 0.17, melWave: 'sawtooth', melVol: 0.016, melLen: 1.9,
        mel: [69, 0, 69, 69, 72, 0, 71, 69, 67, 0, 69, 0, 65, 0, 62, 0, 69, 0, 69, 69, 72, 0, 74, 72, 71, 0, 67, 0, 69, 0, 0, 0,
          74, 0, 74, 72, 71, 0, 69, 67, 69, 0, 72, 0, 71, 0, 67, 0, 65, 0, 67, 69, 67, 0, 64, 0, 62, 0, 0, 0, 0, 0, 0, 0],
        bass: cat([38, 38, 38, 43, 38, 36, 43, 38], r => [r, 0, 0, r + 7, 0, 0, r + 12, 0]), bassVol: 0.08,
        hat: [0, 0, 1, 0, 0, 0, 1, 0], kick: [1, 0, 0, 1, 0, 0, 0, 0]
      },
      { // Zé Pequeno: samba-funk dos anos 70 (mi menor), baixo sincopado e metais
        dur: 0.115, melVol: 0.02, melLen: 1.2,
        mel: [71, 0, 0, 71, 0, 74, 0, 0, 76, 0, 0, 74, 0, 71, 0, 0, 69, 0, 0, 69, 0, 71, 0, 0, 67, 0, 0, 64, 0, 0, 0, 0,
          71, 0, 0, 71, 0, 74, 0, 0, 76, 0, 0, 79, 0, 76, 0, 0, 78, 0, 76, 0, 74, 0, 71, 0, 76, 0, 0, 0, 0, 0, 0, 0],
        bass: [40, 0, 0, 40, 0, 0, 43, 0, 45, 0, 0, 45, 0, 47, 50, 0, 40, 0, 0, 40, 0, 0, 43, 0, 45, 0, 47, 0, 43, 0, 38, 0], bassLen: 1.1,
        hat: [1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0], kick: [1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 0]
      },
      { // Zé do Caixão: órgão de terror, cromatismo e trítono (ré menor)
        dur: 0.24, melWave: 'triangle', melVol: 0.07, melLen: 2.2, mel2: -12,
        mel: [62, 0, 65, 0, 68, 0, 67, 0, 65, 0, 64, 0, 62, 0, 61, 0, 62, 0, 69, 0, 70, 0, 69, 0, 68, 0, 67, 0, 66, 0, 0, 0],
        bass: [38, 0, 0, 0, 0, 0, 44, 0, 38, 0, 0, 0, 0, 0, 37, 0, 38, 0, 0, 0, 0, 0, 46, 0, 44, 0, 0, 0, 42, 0, 0, 0], bassWave: 'sawtooth', bassVol: 0.035, bassLen: 5,
        kick: [1, 0, 1, 0, 0, 0, 0, 0]
      },
      { // João Grilo: baião de pífano em modo nordestino (lá mixolídio com quarta aumentada)
        dur: 0.16,
        mel: [76, 0, 76, 78, 79, 0, 78, 76, 75, 0, 73, 0, 69, 0, 0, 0, 73, 0, 73, 75, 76, 0, 75, 73, 71, 0, 67, 0, 69, 0, 0, 0,
          81, 0, 79, 78, 76, 0, 78, 79, 81, 0, 79, 0, 76, 0, 0, 0, 79, 0, 78, 76, 75, 0, 73, 75, 76, 0, 73, 0, 69, 0, 0, 0],
        bass: cat([45, 45, 45, 43, 45, 45, 45, 43], r => [r, 0, 0, r, r + 7, 0, 0, 0]),
        hat: [0, 0, 1, 0, 0, 0, 1, 0], kick: [1, 0, 0, 1, 0, 0, 0, 0]
      },
      { // Dora: tema lento e saudoso (lá menor), arpejos de piano e melodia de cordas
        dur: 0.21, melWave: 'sine', melVol: 0.07, melLen: 3,
        mel: [76, 0, 0, 0, 72, 0, 69, 0, 74, 0, 0, 0, 77, 0, 76, 74, 71, 0, 0, 0, 74, 0, 79, 0, 76, 0, 0, 0, 0, 0, 72, 74,
          72, 0, 0, 0, 69, 0, 72, 0, 74, 0, 0, 0, 65, 0, 69, 0, 68, 0, 71, 0, 76, 0, 74, 71, 69, 0, 0, 0, 0, 0, 0, 0],
        bass: cat([45, 50, 43, 48, 41, 50, 40, 45], r => { const m = (r === 43 || r === 48 || r === 41 || r === 40) ? 4 : 3; return [r, r + 7, r + 12, r + 12 + m, r + 19, r + 12 + m, r + 12, r + 7]; }),
        bassVol: 0.05, bassLen: 1.8
      },
      { // Xica da Silva: samba-rock de violão suingado (lá menor)
        dur: 0.125, melVol: 0.02, melLen: 1.3,
        mel: [0, 0, 72, 0, 72, 0, 69, 0, 72, 0, 74, 0, 72, 0, 0, 0, 0, 0, 72, 0, 72, 0, 69, 0, 67, 0, 69, 0, 0, 0, 0, 0,
          0, 0, 76, 0, 76, 0, 74, 0, 72, 0, 74, 0, 76, 0, 0, 0, 0, 0, 74, 0, 72, 0, 69, 0, 67, 0, 69, 0, 0, 0, 0, 0],
        bass: [45, 0, 0, 45, 0, 52, 0, 0, 50, 0, 0, 50, 0, 54, 57, 0], bassLen: 1.1,
        hat: [1, 0, 1, 1, 0, 1, 1, 0], kick: [1, 0, 0, 0, 1, 0, 0, 0]
      },
      { // Dona Hermínia: tema de comédia, saltitante e em staccato (fá maior)
        dur: 0.14, melVol: 0.024, melLen: 0.8,
        mel: [65, 0, 69, 0, 72, 0, 69, 0, 70, 0, 74, 0, 77, 0, 0, 0, 76, 0, 72, 0, 69, 0, 72, 0, 67, 0, 64, 0, 60, 0, 0, 0,
          65, 0, 69, 0, 72, 0, 77, 0, 74, 0, 70, 0, 74, 0, 0, 0, 72, 74, 72, 70, 69, 0, 67, 0, 65, 0, 0, 0, 65, 0, 0, 0],
        bass: cat([41, 46, 48, 48, 41, 46, 48, 41], r => [r, 0, 0, 0, r + 7, 0, 0, 0]), bassLen: 1,
        hat: [0, 0, 1, 0, 0, 0, 1, 0], kick: [1, 0, 0, 0, 1, 0, 0, 0]
      },
      { // Val: bossa calma e contida (ré maior), violão e voz baixinha
        dur: 0.19, melWave: 'sine', melVol: 0.065, melLen: 2.6,
        mel: [0, 0, 69, 0, 66, 0, 69, 0, 71, 0, 0, 0, 67, 0, 0, 0, 0, 0, 67, 0, 64, 0, 67, 0, 69, 0, 0, 0, 64, 0, 0, 0,
          0, 0, 69, 0, 66, 0, 74, 0, 71, 0, 0, 0, 74, 0, 71, 0, 67, 0, 0, 0, 66, 0, 64, 0, 62, 0, 0, 0, 0, 0, 0, 0],
        bass: cat([38, 43, 40, 45, 38, 43, 40, 45], r => [r, 0, 0, r + 7, r + 12, 0, 0, r + 7]), bassVol: 0.06, bassLen: 1.6,
        hat: [1, 0, 1, 1, 0, 1, 0, 1], hatVol: 0.012
      },
      { // Carmen Miranda: choro-samba dos anos 30, ligeiro (sol maior)
        dur: 0.11, melVol: 0.022, melLen: 1.1,
        mel: [74, 0, 71, 74, 79, 0, 78, 76, 74, 0, 71, 0, 67, 0, 0, 0, 72, 0, 69, 72, 76, 0, 74, 72, 71, 0, 67, 0, 62, 0, 0, 0,
          74, 0, 71, 74, 79, 0, 78, 76, 79, 0, 83, 0, 81, 0, 79, 0, 78, 76, 74, 72, 71, 0, 69, 0, 67, 0, 0, 0, 67, 0, 0, 0],
        bass: cat([43, 43, 45, 43, 43, 48, 50, 43], r => [r, 0, 0, r + 7, 0, 0, r, 0]), bassLen: 1.1,
        hat: [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1], kick: [0, 0, 0, 0, 1, 0, 0, 0]
      },
      { // Carlota Joaquina: dança de corte com sotaque ibérico (cadência andaluza, cravo e castanholas)
        dur: 0.15, melVol: 0.02, melLen: 0.9,
        mel: [76, 0, 77, 76, 74, 0, 72, 0, 71, 0, 72, 71, 69, 0, 68, 0, 69, 0, 71, 72, 74, 0, 76, 0, 77, 0, 76, 0, 76, 0, 0, 0,
          81, 0, 79, 77, 76, 0, 77, 0, 76, 0, 74, 72, 71, 0, 72, 0, 71, 0, 69, 68, 69, 0, 71, 0, 64, 0, 0, 0, 64, 0, 0, 0],
        bass: cat([45, 43, 41, 40, 45, 43, 41, 40], r => [r, 0, r + 7, 0, r + 12, 0, r + 7, 0]), bassVol: 0.07, bassLen: 1,
        hat: [0, 0, 1, 1, 0, 0, 1, 0], kick: [1, 0, 0, 0, 1, 0, 0, 0]
      }
    ];
    let cur = 0;
    function tick() {
      if (!ac || !playing) return;
      const T = TRACKS[cur];
      const d = T.dur * (1 - (S.mode === 'menu' ? 0 : S.phase) * 0.035);
      while (nextT < ac.currentTime + 0.12) {
        const i = stepN, m = T.mel[i % T.mel.length], b = T.bass[i % T.bass.length];
        if (m) {
          tone(hz(m), nextT, d * (T.melLen || 1.6), T.melWave || 'square', T.melVol || 0.022);
          if (T.mel2) tone(hz(m + T.mel2), nextT, d * (T.melLen || 1.6), 'square', 0.012);
        }
        if (b) tone(hz(b), nextT, d * (T.bassLen || 1.4), T.bassWave || 'triangle', T.bassVol || 0.09);
        if (T.hat && T.hat[i % T.hat.length]) noise(nextT, 0.04, T.hatVol || 0.03);
        if (T.kick && T.kick[i % T.kick.length]) tone(120, nextT, 0.12, 'sine', 0.14, 45);
        nextT += d; stepN++;
      }
    }
    function music(on, track) {
      if (track === undefined) track = cur;
      if (on === playing && track === cur) return;
      playing = on; cur = track;
      if (on) { if (!ac) { playing = false; return; } nextT = ac.currentTime + 0.05; stepN = 0; if (!timer) timer = setInterval(tick, 30); }
    }
    function toggle() {
      muted = !muted; store.set('mute', muted);
      if (master) master.gain.value = muted ? 0 : 1;
      $('mute').classList.toggle('off', muted);
    }
    $('mute').classList.toggle('off', muted);
    return { init, sfx, music, toggle, tracks: TRACKS, state: () => ({ on: playing, track: cur, ctx: ac ? ac.state : 'none' }) };
  })();
  const sfx = audio.sfx;

  // ------------------------------------------------------------------
  // Telas (DOM)
  // ------------------------------------------------------------------
  function resize() { stage.style.setProperty('--u', (stage.clientWidth / W) + 'px'); }
  window.addEventListener('resize', resize); resize();

  const fmt = n => String(Math.floor(n)).padStart(6, '0');
  let toastTimer = null;
  function toast(msg) {
    const el = $('toast'); el.textContent = msg; el.classList.remove('hidden');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.add('hidden'), 3200);
  }

  function setMode(m) {
    S.mode = m; S.paused = false;
    $('menu').classList.toggle('hidden', m !== 'menu');
    $('hud').classList.toggle('hidden', m === 'menu' || m === 'win');
    $('card').classList.toggle('hidden', m !== 'card');
    $('over').classList.toggle('hidden', m !== 'dead');
    $('win').classList.toggle('hidden', m !== 'win');
    $('pause').classList.add('hidden');
    if (m !== 'play') $('toast').classList.add('hidden');
    audio.music(m === 'play' || m === 'card' || m === 'menu', S.charIdx);
    if (m === 'menu') $('btn-endless').classList.toggle('hidden', !store.get('won', false));
  }

  // menu de personagens: grade 6x2; a última casa sorteia
  const charsEl = $('chars'), N = G.CHARS.length;
  const pv = $('pv').getContext('2d');
  function cell(i, c) {
    const d = document.createElement('div'); d.className = 'char' + (c ? '' : ' rand');
    if (c) {
      const el = document.createElement('canvas'); el.width = G.CW + 2; el.height = G.CH + 2;
      el.getContext('2d').drawImage(c.frames.light.idle.c, 0, 0); d.appendChild(el);
    } else { const q = document.createElement('div'); q.className = 'q'; q.textContent = '?'; d.appendChild(q); }
    const nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = c ? c.name : 'SORTEAR';
    d.appendChild(nm);
    d.addEventListener('click', () => { audio.init(); selectChar(i); });
    d.addEventListener('dblclick', () => startFromMenu(false));
    charsEl.appendChild(d);
    return d;
  }
  const cells = G.CHARS.map((c, i) => cell(i, c));
  cells.push(cell(N, null));
  function selectChar(i) {
    const n = N + 1;
    S.menuIdx = ((i % n) + n) % n; store.set('char', S.menuIdx);
    S.random = S.menuIdx === N;
    if (!S.random) S.charIdx = S.menuIdx;
    if (S.mode === 'menu' && !S.random) audio.music(true, S.charIdx);
    cells.forEach((el, k) => el.classList.toggle('sel', k === S.menuIdx));
    const c = ch();
    $('info-name').textContent = S.random ? 'SORTEIO' : c.name;
    $('info-film').textContent = S.random ? 'Deixe o acaso escalar o elenco' : c.film;
    $('info-quote').textContent = S.random ? 'Qualquer um dos ' + N + ' pode entrar em cena' : c.quote;
    $('info-ab').innerHTML = S.random ? '★ <b>SURPRESA</b> — o poder especial você descobre na hora' : '★ <b>' + c.abName + '</b> — ' + c.abDesc;
  }
  function startFromMenu(endless) {
    if (S.random) S.charIdx = (Math.random() * N) | 0;
    startRun(endless);
  }
  function drawPortraits() { // retrato grande, animado
    const c = S.random ? G.CHARS[Math.floor(S.t / 8) % N] : ch();
    pv.clearRect(0, 0, G.CW + 2, G.CH + 2);
    pv.drawImage(c.frames.light[S.random ? 'idle' : (Math.floor(S.t / 9) % 2 ? 'run1' : 'run2')].c, 0, 0);
  }

  let hudKey = '';
  function updateHud() {
    const c = cfg(), sc = G.getScene(S.charIdx, S.phase);
    const head = S.endless ? 'SESSÃO CONTÍNUA · ' + sc.name : 'FASE ' + (S.phase + 1) + '/5 · ' + sc.name;
    const key = head + '|' + S.reels + '|' + S.shields;
    if (key !== hudKey) {
      hudKey = key;
      $('h-phase').textContent = head;
      let html = '<img src="' + ICON.reel + '" alt=""><span>' + S.reels + '/' + reelsNeeded() + '</span><span class="sep"></span>';
      for (let i = 0; i < S.shields; i++) html += '<img src="' + ICON.edital + '" alt="vida extra">';
      $('h-stock').innerHTML = html;
    }
    $('h-bar').firstElementChild.style.width = Math.min(100, S.dist / c.len * 100) + '%';
    $('h-score').textContent = 'PÚBLICO ' + fmt(S.score);
    $('h-hi').textContent = 'RECORDE ' + fmt(Math.max(S.hi, S.score));
  }
  const ICON = { reel: G.dataURL(G.ITEMS.reel), edital: G.dataURL(G.ITEMS.edital) };

  function showCard() {
    const sc = G.getScene(S.charIdx, S.phase), c = cfg();
    $('card-n').textContent = S.endless ? 'SESSÃO CONTÍNUA · VOLTA ' + (S.loop + 1) : '“' + sc.film + '” · CENA ' + (S.phase + 1) + ' / 5';
    $('card-title').textContent = sc.name;
    $('card-title').style.fontSize = 'calc(var(--u) * ' + (sc.name.length > 22 ? 8.5 : 10.5) + ')';
    $('card-sub').innerHTML = sc.sub;
    let html = '';
    if (!S.endless || S.loop === 0) {
      html = '<span class="lbl">NOVOS<br>PERIGOS</span>';
      c.news.forEach(id => { html += '<div class="nw"><img src="' + G.dataURL(G.OBS[OB[id].spr]) + '" alt=""><span>' + OB[id].label + '</span></div>'; });
    }
    $('card-new').innerHTML = html;
    S.cardT = S.t;
    setMode('card');
    sfx.clap();
  }

  // ------------------------------------------------------------------
  // Fluxo
  // ------------------------------------------------------------------
  function startRun(endless) {
    audio.init();
    S.endless = !!endless; S.loop = 0; S.score = 0; S.reels = 0; S.shields = 0; S.seen = {}; S.fame = false;
    startPhase(0, true);
  }
  function startPhase(i, withCard) {
    S.phase = i; S.dist = 0; S.finishing = false;
    obstacles = []; pickups = []; parts = []; shots = [];
    P.y = 0; P.vy = 0; P.ground = true; P.jumps = 0; P.inv = 0; P.buf = 0; P.air = 0; P.gliding = false;
    if (ch().startShield && S.shields < 1) S.shields = 1;
    S.snap = { score: S.score, reels: S.reels, shields: S.shields };
    S.gap = 230; S.trophyDone = false; S.trophyAt = cfg().len * (0.35 + Math.random() * 0.35);
    hudKey = '';
    if (withCard) showCard(); else setMode('play');
    updateHud();
  }
  function phaseDone() {
    if (!S.endless && S.phase === PHASES.length - 1) return win();
    let next = S.phase + 1;
    if (next >= PHASES.length) { next = 0; S.loop++; }
    startPhase(next, true);
  }
  function saveHi() { if (S.score > S.hi) { S.hi = Math.floor(S.score); store.set('hi', S.hi); } }
  function die(o) {
    saveHi();
    S.shake = 16; sfx.hit();
    $('over-img').src = G.dataURL(G.OBS[o.T.spr]);
    $('over-name').textContent = o.T.name;
    $('over-fact').textContent = o.T.fact;
    $('over-score').textContent = 'PÚBLICO ' + Math.floor(S.score) + ' · RECORDE ' + S.hi + ' · ' + (S.endless ? 'VOLTA ' + (S.loop + 1) : 'FASE ' + (S.phase + 1) + '/5');
    S.lockT = performance.now() + 700;
    for (let i = 0; i < 14; i++) parts.push({ x: PX + 10, y: GROUND - P.y - 14, vx: Math.random() * 4 - 2, vy: -Math.random() * 3, life: 30, c: '#ffffff' });
    setMode('dead');
  }
  function retry() {
    S.score = S.snap.score; S.reels = S.snap.reels; S.shields = S.snap.shields;
    if (ch().retomada && S.shields < 1) S.shields = 1; // a Retomada: volta com fôlego novo
    startPhase(S.phase, false);
  }
  function win() {
    S.score += 2000; saveHi(); store.set('won', true);
    $('win-text').innerHTML = 'Seu filme driblou censura, falta de verba e blockbuster<br>e chegou à tela grande. O público brasileiro agradece, ' + ch().name + '!';
    $('win-score').textContent = 'PÚBLICO FINAL ' + Math.floor(S.score) + ' · RECORDE ' + S.hi;
    S.lockT = performance.now() + 1200;
    setMode('win'); sfx.win();
  }
  function toMenu() { saveHi(); setMode('menu'); selectChar(S.menuIdx); }

  // ------------------------------------------------------------------
  // Jogador
  // ------------------------------------------------------------------
  function jump() {
    const c = ch();
    if (P.ground) { P.vy = c.jumpV; P.ground = false; P.jumps = 1; P.air = 0; sfx.jump(); dust(3); }
    else if (c.doubleJump && P.jumps === 1) {
      P.vy = c.jumpV * 0.86; P.jumps = 2; sfx.jump2();
      for (let i = 0; i < 6; i++) parts.push({ x: PX + 6 + i * 2, y: GROUND - P.y, vx: -0.5, vy: 0.6, life: 14, c: '#ffffff' });
    } else if (c.glide) { P.gliding = true; P.buf = 7; } // segurou de novo no ar: plana
    else P.buf = 7;
  }
  function dust(n) {
    for (let i = 0; i < n; i++) parts.push({ x: PX + 8 + Math.random() * 6, y: GROUND - 1, vx: -0.4 - Math.random(), vy: -Math.random() * 0.8, life: 12 + Math.random() * 8, c: 'rgba(255,255,255,.7)' });
  }

  // ------------------------------------------------------------------
  // Geração de obstáculos e itens
  // ------------------------------------------------------------------
  function spawn() {
    const c = cfg(), pool = c.pool;
    const id = pool[(Math.random() * pool.length) | 0], T = OB[id], spr = G.OBS[T.spr];
    const high = T.kind === 'fly' && Math.random() < 0.45;
    const y = T.kind === 'fly' ? (high ? GROUND - 33 - spr.h : GROUND - 6 - spr.h) : GROUND - spr.h;
    const x0 = W + 6;
    const mkOb = x => ({ id, T, x, y, w: spr.w, h: spr.h, high, seed: Math.random() * 100, label: false });
    const o = mkOb(x0);
    S.seen[id] = (S.seen[id] || 0) + 1;
    o.label = S.seen[id] <= 2;
    obstacles.push(o);
    let width = spr.w;
    if (T.pair && S.phase + S.loop >= 1 && Math.random() < 0.28) { obstacles.push(mkOb(x0 + spr.w + 1)); width = spr.w * 2 + 1; }
    // rolos de filme
    const rnd = Math.random();
    if (high) { if (rnd < 0.5) pickups.push({ kind: 'reel', x: x0 + 2, y: GROUND - 12 }); }
    else if (rnd < 0.42) pickups.push({ kind: 'reel', x: x0 + width / 2 - 4, y: Math.max(GROUND - 66, y - 24) });
    else if (rnd < 0.62) pickups.push({ kind: 'reel', x: x0 + width + S.speed * 26, y: GROUND - 13 });
    const minF = 46, maxF = Math.max(60, 96 - S.phase * 6 - S.loop * 5);
    S.gap = width + S.speed * (minF + Math.random() * (maxF - minF));
    // troféu: um por fase, no vão seguinte
    if (!S.trophyDone && S.dist >= S.trophyAt) {
      S.trophyDone = true;
      pickups.push({ kind: 'trophy', x: x0 + width + S.speed * 30, y: GROUND - 58 });
      S.gap += S.speed * 42;
    }
  }

  function hit(o) {
    if (P.inv > 0) return;
    if (S.shields > 0) {
      S.shields--; P.inv = 80; o.dead = true; sfx.save();
      for (let i = 0; i < 12; i++) parts.push({ x: o.x + o.w / 2, y: o.y + o.h / 2, vx: Math.random() * 4 - 1, vy: -Math.random() * 3, life: 24, c: i % 2 ? '#27ae60' : '#ffffff' });
      toast('EDITAL APROVADO! A produção continua.');
    } else die(o);
  }
  function collect(p) {
    for (let i = 0; i < 6; i++) parts.push({ x: p.x + 4, y: p.y + 4, vx: Math.random() * 2 - 1, vy: -Math.random() * 2, life: 16, c: '#ffd23f' });
    if (p.kind === 'reel') {
      S.score += 50; S.reels++; sfx.reel();
      if (S.reels >= reelsNeeded()) {
        S.reels = 0;
        if (S.shields < 3) { S.shields++; sfx.shield(); toast('EDITAL APROVADO! +1 vida extra'); } else S.score += 200;
      }
    } else { S.score += 500; sfx.trophy(); toast(G.getScene(S.charIdx, S.phase).trophy); }
  }

  // ------------------------------------------------------------------
  // Passo de simulação (60 Hz)
  // ------------------------------------------------------------------
  function step() {
    S.t++;
    if (S.shake > 0) S.shake--;
    if (S.mode === 'menu') { S.scroll += 0.45; return; }
    if (S.mode === 'card') { if (S.t - S.cardT > (S.endless ? 150 : 420)) setMode('play'); return; }
    if (S.mode === 'dead') { stepParts(0); return; }
    if (S.mode !== 'play' || S.paused) return;

    const c = cfg(), hero = ch();
    const speed = S.speed = (c.speed + 0.35 * Math.min(1, S.dist / c.len)) * (hero.slow || 1);
    S.scroll += speed; S.dist += speed; S.score += speed * 0.2;

    // física do pulo
    if (!P.ground) {
      let g = GRAV;
      if (P.vy > 0 && !P.hold && P.y > 26) g = GRAV * 2.4; // soltou cedo: pulo curto
      P.vy -= g;
      if (P.gliding && P.hold && P.vy < -0.85) P.vy = -0.85;
      P.y += P.vy; P.air++;
      if (P.y <= 0) {
        P.y = 0; P.vy = 0; P.ground = true; P.jumps = 0; P.air = 0; P.gliding = false; dust(2);
        if (P.buf > 0) { P.buf = 0; jump(); }
      }
    }
    if (P.buf > 0) P.buf--;
    if (P.inv > 0) P.inv--;

    // geração
    if (!S.finishing) {
      S.gap -= speed;
      if (S.gap <= 0) spawn();
      if (S.dist >= c.len) S.finishing = true;
    } else if (obstacles.length === 0 && pickups.length === 0 && P.ground) { phaseDone(); return; }

    // colisões
    const ins = hero.inset || 0;
    const feet = GROUND - P.y;
    const bx0 = PX + 7 + ins, bx1 = PX + 15 - ins, by0 = feet - 22 + ins, by1 = feet;
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      if (o.x + o.w < -8 || o.dead) { obstacles.splice(i, 1); continue; }
      const oy = o.y + (o.T.kind === 'fly' ? Math.round(Math.sin((S.t + o.seed) * 0.1) * 1.5) : 0);
      if (hero.chinelo && o.T.kind === 'fly' && !o.shot && o.x < PX + 100) {
        o.shot = true; shots.push({ x: PX + 20, y: feet - 20, o: o, life: 0 }); sfx.jump2();
      }
      if (bx1 > o.x + 2 && bx0 < o.x + o.w - 2 && by1 > oy + 2 && by0 < oy + o.h - 1) {
        if (hero.immune && hero.immune.indexOf(o.id) >= 0) { // Carmen atravessa Hollywood
          if (!o.ghost) {
            o.ghost = true; S.score += 100; sfx.reel();
            for (let k = 0; k < 8; k++) parts.push({ x: PX + 10, y: feet - 14, vx: Math.random() * 3 - 1, vy: -Math.random() * 2.5, life: 20, c: k % 2 ? '#ffd23f' : '#ff7eb6' });
            if (!S.fame) { S.fame = true; toast('HOLLYWOOD NÃO SEGURA A CARMEN! +100'); }
          }
          continue;
        }
        hit(o);
        if (S.mode !== 'play') return;
      }
    }
    for (let i = pickups.length - 1; i >= 0; i--) {
      const p = pickups[i];
      p.x -= speed;
      if (hero.magnet) { // os diamantes de Xica puxam os rolos
        const dx = PX + 10 - (p.x + 4), dy = feet - 14 - (p.y + 5);
        if (dx * dx + dy * dy < 54 * 54) { p.x += dx * 0.14; p.y += dy * 0.14; }
      }
      if (p.x < -12) { pickups.splice(i, 1); continue; }
      if (PX + 18 > p.x && PX + 3 < p.x + 9 && feet > p.y && feet - G.CH < p.y + 10) { collect(p); pickups.splice(i, 1); }
    }
    for (let i = shots.length - 1; i >= 0; i--) {
      const sh = shots[i], tx = sh.o.x + sh.o.w / 2, ty = sh.o.y + sh.o.h / 2;
      sh.x += (tx - sh.x) * 0.4; sh.y += (ty - sh.y) * 0.4; sh.life++;
      if (sh.life >= 6 || sh.o.dead) {
        if (!sh.o.dead) {
          sh.o.dead = true; S.score += 30; sfx.save();
          for (let k = 0; k < 10; k++) parts.push({ x: tx, y: ty, vx: Math.random() * 4 - 1, vy: -Math.random() * 3, life: 22, c: k % 2 ? '#2e86de' : '#ffffff' });
        }
        shots.splice(i, 1);
      }
    }
    stepParts(speed);
    updateHud();
  }
  function stepParts(speed) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.x += p.vx - speed * 0.5; p.y += p.vy; p.vy += 0.12;
      if (--p.life <= 0) parts.splice(i, 1);
    }
  }

  // ------------------------------------------------------------------
  // Desenho
  // ------------------------------------------------------------------
  function render() {
    ctx.save();
    if (S.shake > 0) ctx.translate(((Math.random() * 5) | 0) - 2, ((Math.random() * 5) | 0) - 2);
    if (S.mode === 'win') { G.drawWin(ctx, S.t, ch().frames.light.idle); ctx.restore(); return; }
    const sc = G.getScene(S.charIdx, S.mode === 'menu' ? 0 : S.phase);
    G.drawScene(ctx, sc, S.scroll, S.t);
    if (S.mode === 'menu') { ctx.restore(); drawPortraits(); return; }

    // itens
    pickups.forEach((p, i) => {
      const bob = Math.round(Math.sin((S.t + i * 20) * 0.12) * 1.5);
      G.draw(ctx, G.ITEMS[p.kind], p.x, p.y + bob);
      if (p.kind === 'trophy' && Math.floor(S.t / 6) % 2) { ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(p.x) - 2, p.y + bob, 1, 1); ctx.fillRect(Math.round(p.x) + 10, p.y + bob + 5, 1, 1); }
    });
    // obstáculos
    obstacles.forEach(o => {
      let spr = G.OBS[o.T.spr];
      if (o.T.anim && Math.floor(S.t / 7) % 2) spr = G.OBS[o.T.anim];
      const oy = o.y + (o.T.kind === 'fly' ? Math.round(Math.sin((S.t + o.seed) * 0.1) * 1.5) : 0);
      const imm = ch().immune, ghost = imm && imm.indexOf(o.id) >= 0;
      if (ghost) ctx.globalAlpha = 0.45;
      G.draw(ctx, spr, o.x, oy);
      if (ghost) ctx.globalAlpha = 1;
    });
    // herói
    const hero = ch(), set = sc.light ? hero.frames.light : hero.frames.dark;
    let fr = 'idle';
    if (!P.ground) fr = 'jump';
    else if (S.mode === 'play') fr = Math.floor(S.dist / 11) % 2 ? 'run1' : 'run2';
    const py = GROUND - P.y - G.CH;
    if (!(P.inv > 0 && Math.floor(S.t / 3) % 2)) {
      const flip = hero.spin && !P.ground && Math.floor(P.air / 5) % 2 === 1;
      G.draw(ctx, set[fr], PX, py, flip);
    }
    if (S.shields > 0) { // brilho da vida extra
      for (let k = 0; k < 4; k++) {
        const a = S.t * 0.08 + k * Math.PI / 2;
        ctx.fillStyle = k % 2 ? '#3ddc84' : '#ffd23f';
        ctx.fillRect(Math.round(PX + 10 + Math.cos(a) * 13), Math.round(py + 14 + Math.sin(a) * 15), 1, 1);
      }
    }
    // chinelos em voo
    shots.forEach(sh => {
      const sx = Math.round(sh.x), sy = Math.round(sh.y), v = sh.life % 2;
      ctx.fillStyle = '#1a1022'; ctx.fillRect(sx - 1, sy - 1, v ? 4 : 7, v ? 7 : 4);
      ctx.fillStyle = '#2e86de'; ctx.fillRect(sx, sy, v ? 2 : 5, v ? 5 : 2);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(sx + (v ? 0 : 1), sy + (v ? 1 : 0), 1, 1);
    });
    // partículas
    parts.forEach(p => { ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); });
    // nomes dos perigos nas primeiras aparições
    obstacles.forEach(o => {
      if (!o.label) return;
      const tw = G.textWidth(o.T.label);
      const lx = Math.max(2, Math.min(W - tw - 4, Math.round(o.x + o.w / 2 - tw / 2)));
      const ly = o.high ? o.y + o.h + 4 : o.y - 10;
      ctx.fillStyle = '#1a1022'; ctx.fillRect(lx - 2, ly - 2, tw + 4, 9);
      G.text(ctx, o.T.label, lx, ly, '#ffd23f');
    });
    ctx.restore();
  }

  // ------------------------------------------------------------------
  // Entrada
  // ------------------------------------------------------------------
  function action() {
    audio.init();
    const now = performance.now();
    if (S.mode === 'menu') startFromMenu(false);
    else if (S.mode === 'card') { if (S.t - S.cardT > 18) setMode('play'); }
    else if (S.mode === 'play') { if (!S.paused) jump(); }
    else if (S.mode === 'dead') { if (now > S.lockT) retry(); }
    else if (S.mode === 'win') { if (now > S.lockT) startRun(true); }
  }
  function togglePause() {
    if (S.mode !== 'play') return;
    S.paused = !S.paused;
    $('pause').classList.toggle('hidden', !S.paused);
    audio.music(!S.paused);
  }
  window.addEventListener('keydown', e => {
    const k = e.code;
    if (S.mode === 'menu' && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown')) {
      e.preventDefault(); audio.init();
      const i = S.menuIdx;
      selectChar(k === 'ArrowLeft' ? i - 1 : k === 'ArrowRight' ? i + 1 : k === 'ArrowDown' ? (i + 6 <= N ? i + 6 : i) : (i - 6 >= 0 ? i - 6 : i));
      return;
    }
    if (k === 'Space' || k === 'ArrowUp' || k === 'KeyW' || k === 'Enter') {
      e.preventDefault();
      if (e.repeat) return;
      if (k !== 'Enter') P.hold = true;
      action();
    } else if (k === 'Escape') { if (S.mode !== 'menu') toMenu(); }
    else if (k === 'KeyP') togglePause();
    else if (k === 'KeyM') audio.toggle();
  });
  window.addEventListener('keyup', e => { if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') { P.hold = false; P.gliding = false; } });
  stage.addEventListener('pointerdown', e => {
    if (e.target.closest('button, .char, #mute')) return;
    if (S.mode === 'menu') return;
    e.preventDefault(); P.hold = true; action();
  });
  window.addEventListener('pointerup', () => { P.hold = false; P.gliding = false; });
  window.addEventListener('blur', () => { P.hold = false; if (S.mode === 'play' && !S.paused) togglePause(); });

  function btn(id, fn) { $(id).addEventListener('click', e => { e.stopPropagation(); e.currentTarget.blur(); audio.init(); fn(); }); }
  btn('btn-play', () => startFromMenu(false));
  btn('btn-endless', () => startFromMenu(true));
  btn('btn-retry', retry);
  btn('btn-menu', toMenu);
  btn('btn-win-endless', () => startRun(true));
  btn('btn-win-menu', toMenu);
  $('mute').addEventListener('click', () => { audio.init(); audio.toggle(); });

  // ------------------------------------------------------------------
  // Laço principal
  // ------------------------------------------------------------------
  let last = performance.now(), acc = 0;
  function frame(now) {
    acc += Math.min(100, now - last); last = now;
    while (acc >= 1000 / 60) { step(); acc -= 1000 / 60; }
    render();
    requestAnimationFrame(frame);
  }
  selectChar(S.menuIdx);
  setMode('menu');
  requestAnimationFrame(frame);

  // ganchos para testes manuais no console
  G._dbg = { S, P, step, render, startRun, startPhase, win, obstacles: () => obstacles, pickups: () => pickups, OB, PHASES, audio };
})();
