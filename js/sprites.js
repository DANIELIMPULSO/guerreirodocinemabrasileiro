/* Pixel art: fonte, personagens, obstáculos e itens.
   Cada sprite é uma lista de linhas; cada letra aponta para uma cor da paleta. */
(function () {
  'use strict';
  const G = (window.G = window.G || {});

  const OUT_DARK = '#1a1022';
  const OUT_LIGHT = '#d9d0ff';

  // ---------- mini fonte 3x5 (texto dentro do canvas) ----------
  const FONT = {
    A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110',
    E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101',
    I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111',
    M: '101111111101101', N: '110101101101101', O: '111101101101111', P: '110101110100100',
    Q: '010101101111011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
    U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101',
    Y: '101101010010010', Z: '111001010100111',
    0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110',
    4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010',
    8: '111101111101111', 9: '111101111001110',
    '-': '000000111000000', '!': '010010010000010', '.': '000000000000010', '+': '000010111010000',
    ':': '000010000010000', '/': '001001010100100', '$': '011110010011110'
  };
  G.textWidth = function (s, sc) { sc = sc || 1; return s.length * 4 * sc - sc; };
  G.text = function (ctx, str, x, y, color, sc) {
    sc = sc || 1;
    ctx.fillStyle = color;
    for (let i = 0; i < str.length; i++) {
      const g = FONT[str[i]];
      if (g) {
        for (let k = 0; k < 15; k++) {
          if (g[k] === '1') ctx.fillRect(x + (i * 4 + (k % 3)) * sc, y + ((k / 3) | 0) * sc, sc, sc);
        }
      }
    }
  };

  // ---------- grade -> canvas ----------
  function gridFromRows(rows, pal, minW) {
    const w = Math.max(minW || 0, ...rows.map(r => r.length));
    return rows.map(r => {
      const row = [];
      for (let x = 0; x < w; x++) {
        const c = r[x];
        row.push(c && c !== '.' && c !== ' ' ? (pal[c] || '#ff00ff') : null);
      }
      return row;
    });
  }
  // devolve {c, w, h}; o canvas tem 1px de margem para o contorno
  function bake(grid, outline, decorate) {
    const h = grid.length, w = grid[0].length;
    const c = document.createElement('canvas');
    c.width = w + 2; c.height = h + 2;
    const x = c.getContext('2d');
    const at = (px, py) => (py >= 0 && py < h && px >= 0 && px < w ? grid[py][px] : null);
    if (outline) {
      x.fillStyle = outline;
      for (let py = -1; py <= h; py++) for (let px = -1; px <= w; px++) {
        if (!at(px, py) && (at(px + 1, py) || at(px - 1, py) || at(px, py + 1) || at(px, py - 1))) x.fillRect(px + 1, py + 1, 1, 1);
      }
    }
    for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
      if (grid[py][px]) { x.fillStyle = grid[py][px]; x.fillRect(px + 1, py + 1, 1, 1); }
    }
    if (decorate) decorate(x);
    return { c: c, w: w, h: h };
  }
  // desenha um sprite "assado" com o canto superior esquerdo em (x, y)
  G.draw = function (ctx, spr, x, y, flip) {
    x = Math.round(x); y = Math.round(y);
    if (flip) {
      ctx.save(); ctx.translate(x + spr.w, y); ctx.scale(-1, 1);
      ctx.drawImage(spr.c, -1, -1); ctx.restore();
    } else ctx.drawImage(spr.c, x - 1, y - 1);
  };
  G.dataURL = function (spr) { return spr.c.toDataURL(); };

  // =====================================================================
  //  PERSONAGENS  (24 x 28; as pernas são desenhadas por código)
  // =====================================================================
  const CW = 24, CH = 28;

  const CHARS = [
    {
      id: 'macunaima', name: 'MACUNAÍMA',
      film: '“Macunaíma” (1969) · dir. Joaquim Pedro de Andrade · Grande Otelo',
      quote: '“Ai, que preguiça!”',
      abName: 'PREGUIÇA', abDesc: 'no ar, aperte de novo e segure para planar',
      jumpV: 6.2, glide: true,
      pal: { H: '#16100e', S: '#6b4226', s: '#52301b', W: '#ffffff', K: '#0d0d0d', Y: '#f6d743', O: '#c9a227', G: '#2ecc71', g: '#1c8a4c', R: '#b8323a' },
      rows: [
        '........................',
        '........................',
        '........................',
        '......HHHHHHHH..........',
        '.....HHHHHHHHHH.........',
        '.....HHSSSSSSSS.........',
        '.....HSSSSSSSSS.........',
        '.....HSSWKSSSWK.........',
        '.....SSSWKSSSWK.........',
        '....sSSSSSSSsSS.........',
        '.....SSSSSSSSSS.........',
        '.....SSKWWWWWKS.........',
        '......SSRRRRSS..........',
        '........SSSS............',
        '.....YYYYSSYYYY.........',
        '....YYYYYggYYYYY........',
        '...YYYYYYGGYYYYYY.......',
        '...YYOYYYYYYYYOYY.......',
        '...YYOYYYYYYYYOYY.......',
        '...SSOYYYYYYYYOSS.......',
        '.....YYYYYYYYYY.........',
        '.....YYYYYYYYYY.........',
        '....YYYYYYYYYYYY........',
        '....YOOOOOOOOOOY........'
      ],
      legs: { top: 24, x1: 7, x2: 11, color: '#6b4226', shoe: '#52301b' }
    },
    {
      id: 'corisco', name: 'CORISCO',
      film: '“Deus e o Diabo na Terra do Sol” (1964) · dir. Glauber Rocha · Othon Bastos',
      quote: '“Mais fortes são os poderes do povo!”',
      abName: 'RODOPIO', abDesc: 'gira no ar e pula mais alto',
      jumpV: 6.95, spin: true,
      pal: { B: '#9a6532', b: '#6e4320', G: '#f5c518', H: '#2a180c', S: '#c98f5e', K: '#0d0d0d', R: '#c0392b', T: '#5f7890', t: '#48607a', L: '#4a2f17', V: '#e6ecef', v: '#9aa7ad', P: '#9b8a5e' },
      rows: [
        '.......BBBBBB...........',
        '.....BBBBBBBBBB.........',
        '...BBBGBBGGBBGBBB.......',
        '..BBBBBBBBBBBBBBBB......',
        '..BbGbbGbbbbGbbGbB......',
        '....HHSSSSSSSSHH........',
        '....HHSSSSSSSSHH........',
        '....HHSSKSSSSKSH........',
        '....HHSSSSSSSSSH........',
        '....HHSHHHHHHSSH........',
        '....HHSSSSSSSSHH.....V..',
        '.....HHSSSSSSHH.....VV..',
        '......RRRRRRRR......Vv..',
        '....TTLRRRRRLTT....VV...',
        '...TTTTLTRRTLTTT...Vv...',
        '...TTTTTLGGLTTTT..VV....',
        '...TTTTTGLLGTTTTSSV.....',
        '...TTtTLTTTTLTTTSSb.....',
        '...SStLTTTTTTLT.........',
        '.....bbbbGGbbbb.........',
        '.....TTTTTTTTTT.........',
        '.....PPPPPPPPPP.........'
      ],
      legs: { top: 22, x1: 7, x2: 11, color: '#9b8a5e', shoe: '#6e4320' }
    },
    {
      id: 'zepequeno', name: 'ZÉ PEQUENO',
      film: '“Cidade de Deus” (2002) · dir. Fernando Meirelles · Leandro Firmino',
      quote: '“Dadinho o c...! Meu nome agora é Zé Pequeno!”',
      abName: 'PEQUENO', abDesc: 'área de colisão menor: escapa por um triz',
      jumpV: 6.2, inset: 2,
      pal: { H: '#0d0d0d', S: '#5e3822', s: '#452714', W: '#ffffff', K: '#0d0d0d', G: '#f5c518', C: '#3fb3a8', c: '#f4e9c8', J: '#3b5878', j: '#2b4360', M: '#4d4d57', m: '#26262c' },
      rows: [
        '........................',
        '........................',
        '........................',
        '......HHHHHHHH..........',
        '.....HHHHHHHHHH.........',
        '.....HSSSSSSSSS.........',
        '.....SSSSSSSSSS.........',
        '.....SKKKSSSKKK.........',
        '.....SSWKSSSWKS.........',
        '....sSSSSSSSsSS.........',
        '.....SSHHHHHHSS.........',
        '.....SSSWWWWSSS.........',
        '......SSSSSSSS..........',
        '........SSSS............',
        '....CCCSGSSGSCCC........',
        '...CcCCSSGGSSCCCSSSMMMMM',
        '...CCCcSSSSSSCcCSSSMm...',
        '...CCcCSSSSSSCCC...m....',
        '...SSCCSSSSSSCcC........',
        '...SS.CcSSSSCCC.........',
        '.....JJJJJJJJJJ.........',
        '.....JJJJJJJJJJ.........',
        '.....JJJJjjJJJJ.........',
        '.....JJJJ..JJJJ.........'
      ],
      legs: { top: 24, x1: 6, x2: 12, color: '#5e3822', shoe: '#e8e3d0' }
    },
    {
      id: 'zedocaixao', name: 'ZÉ DO CAIXÃO',
      film: '“À Meia-Noite Levarei Sua Alma” (1964) · dir. e ator: José Mojica Marins',
      quote: '“À meia-noite levarei sua alma!”',
      abName: 'VOLTA DO TÚMULO', abDesc: 'começa cada fase com 1 vida extra',
      jumpV: 6.2, startShield: true,
      pal: { K: '#17141f', k: '#463c5e', S: '#e6d2b0', s: '#bfa888', W: '#ffffff', E: '#000000', R: '#a31f1f', G: '#f5c518', N: '#fff8d6' },
      rows: [
        '......KKKKKKKK..........',
        '......KkKKKKKK..........',
        '......KkKKKKKK..........',
        '......kkkkkkkk..........',
        '....KKKKKKKKKKKK........',
        '.....KSSSSSSSSK.........',
        '.....KKKKSSKKKK.........',
        '.....SSWESSSWES.........',
        '.....KSSSSSSsSK.........',
        '.....KKSSSSSSKK.........',
        '.....KKKRRRRKKK.........',
        '......KKKKKKKK..........',
        '.......KKKKKK...........',
        '...RRkKKWWWWKKkRR.......',
        '..RkKKKKKWGWKKKKkR......',
        '..kKKKKKKKGKKKKKKSSNNN..',
        '..kKKkKKKKKKKKKKKSSNN...',
        '..kKKkKKKKKKKKKK....N...',
        '..kKKkKKKKKKKKKK........',
        '..kKKkKKKKKKKKKK........',
        '.kKKKkKKKKKKKKKK........',
        'kKKKkKKKKKKKKKKK........'
      ],
      legs: { top: 22, x1: 7, x2: 11, color: '#17141f', shoe: '#463c5e' }
    },
    {
      id: 'joaogrilo', name: 'JOÃO GRILO',
      film: '“O Auto da Compadecida” (2000) · dir. Guel Arraes · Matheus Nachtergaele',
      quote: '“Valha-me Nossa Senhora, Mãe de Deus de Nazaré!”',
      abName: 'ESPERTEZA', abDesc: 'pulo duplo: aperte de novo no ar',
      jumpV: 6.2, doubleJump: true,
      pal: { Y: '#edd27a', O: '#b8943c', H: '#2a180c', S: '#bd8050', s: '#9c6539', W: '#ffffff', K: '#0d0d0d', E: '#efe8d4', e: '#cfc5a8', P: '#5b84b1', Q: '#c0392b', N: '#8d6e4a', n: '#6f5436' },
      rows: [
        '........................',
        '.......YYYYYY...........',
        '......YYYYYYYY..........',
        '......OOOOOOOO..........',
        '...YYYYYYYYYYYYYY.......',
        '....Y.HSSSSSSSH.Y.......',
        '.....SSSSSSSSSS.........',
        '.....SSWKSSSWKS.........',
        '.....SSWKSSSWKS.........',
        '....sSSSSSSSsSS.........',
        '.....SKWWWWWWKS.........',
        '......SSSSSSSS..........',
        '........SSSS............',
        '......EEESSEEE..........',
        '.....EEEEESEEEE.........',
        '....EEEEEEEPPEEE........',
        '....SSEEEEEPPESS........',
        '....SSEeEEEEEESS........',
        '....SSEQQEEEEESS........',
        '......EQQEEEEE..........',
        '......NNNNNNNN..........',
        '......NNNNNPPN..........',
        '......NNNn.NNN..........'
      ],
      legs: { top: 23, x1: 7, x2: 11, color: '#bd8050', shoe: '#6e4320' }
    },
    {
      id: 'dora', name: 'DORA',
      film: '“Central do Brasil” (1998) · dir. Walter Salles · Fernanda Montenegro',
      quote: '“Tenho saudade de tudo...”',
      abName: 'CARTAS', abDesc: 'ganha vida extra a cada 3 rolos (em vez de 5)',
      jumpV: 6.2, reelsPerShield: 3,
      pal: { H: '#9a8f88', h: '#6f655f', S: '#e8bb94', s: '#c99a74', W: '#ffffff', K: '#0d0d0d', R: '#b03a48', B: '#3f7396', b: '#2d5672', L: '#6b4226', l: '#3f2816', V: '#7d6b5c', v: '#62534a', E: '#fffdf0', e: '#b5b09a', r: '#c0392b' },
      rows: [
        '........................',
        '........................',
        '......HHHHHHHH..........',
        '.....HHHHHHHHHH.........',
        '....HHHHHHHHHHHH........',
        '....HHhSSSSSSSSH........',
        '....HHSSSSSSSSSS........',
        '....HHSWKSSSWKSS........',
        '....HHSSSSSSSsSS........',
        '....HHSSSSSSSSSS........',
        '.....HSSSSRRRSS.........',
        '......SSSSSSSS..........',
        '........SSSS............',
        '.....BBBBSSBBBB...eEEEe.',
        '....lBBBBBBBBBBB..EeEeE.',
        '...BlBBBBBBBBBBBSSEEeEE.',
        '...BlBBBBBBBBBBBSSEEEEr.',
        '..LLLLBBBBBBBBB.........',
        '..LlLLbbbbbbbbb.........',
        '..LLLLVVVVVVVVV.........',
        '..LLLLVVVVVVVVVV........',
        '....VVVVVVVVVVVV........',
        '....VVVvVVVVvVVV........',
        '....VVVvVVVVvVVV........'
      ],
      legs: { top: 24, x1: 7, x2: 11, color: '#e8bb94', shoe: '#3f2816' }
    },
    {
      id: 'xica', name: 'XICA DA SILVA',
      film: '“Xica da Silva” (1976) · dir. Cacá Diegues · Zezé Motta',
      quote: 'De escrava a rainha do Arraial do Tijuco',
      abName: 'DIAMANTES', abDesc: 'atrai os rolos de filme que passam por perto',
      jumpV: 6.2, magnet: true,
      pal: { W: '#f4f0e6', w: '#cfc8b8', S: '#6b4226', s: '#52301b', E: '#ffffff', K: '#0d0d0d', R: '#c0392b', r: '#8e2a20', G: '#f5c518', L: '#fbf4e2', F: '#3fb3a8', f: '#2a7f79', M: '#b8323a' },
      rows: [
        '......WWWWWWWW..........',
        '.....WWwWWWWwWW.........',
        '....WWWWWGGWWWWW........',
        '....WwWWWWWWWWwW........',
        '....WWWWWWWWWWWW........',
        '....WWSSSSSSSSWW........',
        '....WwSSSSSSSSwW........',
        '.....WSEKSSSEKW.........',
        '.....GSSSSSSsSG.........',
        '......SSSSSSSS..........',
        '......SSMMMMSS..........',
        '......SSSSSSSS..........',
        '........SSSS............',
        '......SGGGGGGS.....F....',
        '.....SSLRRRRLSS...FFF...',
        '....SS.RRGGRR.SS.FFfFF..',
        '....S..RRRRRR..SSFfFfF..',
        '....S.RRRRRRRR..SSGFF...',
        '....SRRRrRRrRRR.........',
        '....RRRRrRRrRRRR........',
        '...RRRRRrRRrRRRRR.......',
        '..RRRRRRrRRrRRRRRR......',
        '..RRRRRrRRRRrRRRRR......',
        '.RRRRRRrRRRRrRRRRRR.....',
        '.RGRGRGRGRGRGRGRGRG.....',
        '.LLLLLLLLLLLLLLLLLL.....'
      ],
      legs: { top: 26, x1: 7, x2: 11, color: '#6b4226', shoe: '#f5c518' }
    },
    {
      id: 'herminia', name: 'DONA HERMÍNIA',
      film: '“Minha Mãe é uma Peça” (2013) · dir. André Pellenz · Paulo Gustavo',
      quote: 'Mãe é tudo igual: só muda o endereço',
      abName: 'CHINELADA', abDesc: 'derruba no chinelo tudo que vem voando',
      jumpV: 6.2, chinelo: true,
      pal: { H: '#6b4a2b', B: '#ff7eb6', b: '#d9488c', Y: '#ffd23f', C: '#6fc8f0', S: '#f0c9a0', s: '#d4a67c', W: '#ffffff', K: '#0d0d0d', R: '#d63031', T: '#2bb5a8', P: '#ff7eb6', J: '#2e86de', j: '#ffffff' },
      rows: [
        '........................',
        '......BB.YY.BB..........',
        '.....bBBbYYbBBb.........',
        '....CCHBBHYYHBBCC.......',
        '....CCHHHHHHHHHCC.......',
        '.....HSSSSSSSSH.........',
        '.....SSSSSSSSSS.........',
        '.....SKKSSSSKKS.........',
        '.....SSWKSSSWKS.........',
        '....sSSSSSSSsSS.........',
        '.....SSRRRRRRSS.....JJJ.',
        '......SSRWWRSS.....JJjJ.',
        '........SSSS.......JjJJ.',
        '.....TTTTSSTTTT...SJJJ..',
        '....TTPTTTTTTPTT.SS.....',
        '...TTTTTTPTTTTTTSS......',
        '...TTPTTTTTTTPTT........',
        '...SSTTTTPTTTTT.........',
        '...SSTTPTTTTPTT.........',
        '.....TTTTTTTTTT.........',
        '.....TPTTTPTTTT.........',
        '....TTTTTTTTTPTT........',
        '....TTPTTTTTTTTT........',
        '....TTTTTPTTTTTT........'
      ],
      legs: { top: 24, x1: 7, x2: 11, color: '#f0c9a0', shoe: '#ff7eb6' }
    },
    {
      id: 'val', name: 'VAL',
      film: '“Que Horas Ela Volta?” (2015) · dir. Anna Muylaert · Regina Casé',
      quote: 'Da porta da cozinha para dentro, quem cuida de tudo é ela',
      abName: 'NO TEMPO DELA', abDesc: 'a fase corre mais devagar para ela',
      jumpV: 6.2, slow: 0.86,
      pal: { H: '#2a1a12', S: '#b97a4a', s: '#9c6539', W: '#ffffff', K: '#0d0d0d', U: '#8fc0e0', u: '#6a9cc0', A: '#fbf4e2', a: '#d8d0bc', M: '#c8ccd0', k: '#17141f' },
      rows: [
        '........................',
        '........................',
        '......HHHHHHHH..........',
        '...HHHHHHHHHHHH.........',
        '...HHHHHHHHHHHH.........',
        '....HHSSSSSSSSS.........',
        '.....HSSSSSSSSS.........',
        '.....HSWKSSSWKS.........',
        '.....SSSSSSSsSS.........',
        '.....SSSSSSSSSS.........',
        '.....SSKWWWWKSS.........',
        '......SSSSSSSS..........',
        '........SSSS............',
        '.....UUWWSSWWUU.....k...',
        '....UUUUAAAAUUUU...kkk.W',
        '...UUUUAAAAAAUUUSS.kWk.W',
        '...UuUAAAAAAAAUUSSMMMMMM',
        '...SSUAAAaAAAAU.........',
        '...SSUAAAaAAAAU.........',
        '.....UAAAAAAAAU.........',
        '.....UAAAAAAAAU.........',
        '.....UUAAAAAAUU.........',
        '.....UUUUUUUUUU.........',
        '.....UUUuUUuUUU.........'
      ],
      legs: { top: 24, x1: 7, x2: 11, color: '#b97a4a', shoe: '#f0f0f0' }
    },
    {
      id: 'carmen', name: 'CARMEN MIRANDA',
      film: '“Alô, Alô, Carnaval” (1936) e “Banana da Terra” (1939) · Carmen Miranda',
      quote: 'A Pequena Notável: do rádio carioca para o mundo',
      abName: 'PEQUENA NOTÁVEL', abDesc: 'já conquistou Hollywood: letreiro e blockbuster não a param',
      jumpV: 6.2, immune: ['blockbuster', 'hollywood'],
      pal: { Y: '#ffd23f', O: '#ff8c1a', R: '#d63031', G: '#27ae60', T: '#fbf4e2', t: '#f5c518', S: '#f0c9a0', s: '#d4a67c', W: '#ffffff', K: '#0d0d0d', D: '#f5c518', F: '#ffffff', B: '#27ae60', Q: '#d63031', P: '#ffd23f' },
      rows: [
        '......YY..GG.YY.........',
        '.....YYOOGGRRYY.........',
        '.....YORRGGRROYY........',
        '....TTTTTTTTTTTT........',
        '....TtTTTTTTTTtT........',
        '.....TSSSSSSSST.........',
        '.....SSSSSSSSSS.........',
        '.....SSWKSSSWKS.........',
        '....DSSSSSSSsSSD........',
        '....DSSSSSSSSSSD........',
        '.....SSRWWWWRSS.........',
        '......SSRRRRSS..........',
        '........SSSS............',
        '..SS.DDDDDDDDDD.SS......',
        '..SSFFFDDDDDDFFFSS......',
        '...SFFFFBBBBFFFFS.......',
        '....FFFBBBBBBFFF........',
        '......SSSSSSSS..........',
        '......QQQQQQQQ..........',
        '.....QQPQQPQQPQ.........',
        '.....QPQQPQQPQQ.........',
        '....QQQPQQPQQPQQ........',
        '....QPQQPQQPQQPQ........',
        '...QQQQPQQPQQPQQQ.......',
        '...FFFFFFFFFFFFFF.......'
      ],
      legs: { top: 25, x1: 7, x2: 11, color: '#f0c9a0', shoe: '#f5c518' }
    },
    {
      id: 'carlota', name: 'CARLOTA JOAQUINA',
      film: '“Carlota Joaquina, Princesa do Brazil” (1995) · dir. Carla Camurati · Marieta Severo',
      quote: '“Desta terra não quero nem o pó!”',
      abName: 'RETOMADA', abDesc: 'ao refazer uma cena, volta com 1 vida extra',
      jumpV: 6.2, retomada: true,
      pal: { G: '#f5c518', R: '#d63031', H: '#1a1210', S: '#f0c9a0', s: '#d4a67c', W: '#ffffff', K: '#0d0d0d', k: '#5a3a2a', M: '#b8323a', L: '#fbf4e2', P: '#6a2c8a', p: '#4a1c66', Z: '#d63031', z: '#f5c518' },
      rows: [
        '........GGG.............',
        '.......GGRGG............',
        '......HHHHHHHH..........',
        '.....HHHHHHHHHH.........',
        '....HHHHHHHHHHHH........',
        '....HHSSSSSSSSHH........',
        '....HSSSSSSSSSSH........',
        '.....SKKSSSSKKS.........',
        '.....SSWKSSSWKS.........',
        '....HSSSSSSSsSSH........',
        '.....SSSkkkkSSS.........',
        '......SSMMMMSS..........',
        '........SSSS............',
        '.....LLLLSSLLLL....ZZ...',
        '....PPPLLLLLLPPP..ZZZZz.',
        '...PPPPPGGGGPPPPSSZZ.Z..',
        '...PPpPPPGGPPPpPSS......',
        '...SSpPPPPPPPPp.........',
        '...SSPPPPPPPPPP.........',
        '....PPPPpPPpPPPP........',
        '...PPPPPpPPpPPPPP.......',
        '..PPPPPPpPPpPPPPPP......',
        '..PPPPPpPPPPpPPPPP......',
        '.PPPPPPpPPPPpPPPPPP.....',
        '.GPGPGPGPGPGPGPGPGP.....',
        '.GGGGGGGGGGGGGGGGGG.....'
      ],
      legs: { top: 26, x1: 7, x2: 11, color: '#f0c9a0', shoe: '#d63031' }
    }
  ];

  function charGrid(ch, frame) {
    const g = gridFromRows(ch.rows, ch.pal, CW);
    const w = g[0].length;
    while (g.length < CH) g.push(new Array(w).fill(null));
    const L = ch.legs;
    function leg(x, lift, dx) {
      const bottom = CH - 1 - lift;
      for (let y = L.top; y < bottom; y++) { g[y][x] = L.color; g[y][x + 1] = L.color; }
      for (let i = 0; i < 3; i++) g[bottom][x + dx + i] = L.shoe;
    }
    if (frame === 'run1') { leg(L.x1, 0, 0); leg(L.x2, 2, 1); }
    else if (frame === 'run2') { leg(L.x1, 2, -1); leg(L.x2, 0, 0); }
    else if (frame === 'jump') { leg(L.x1, 2, -1); leg(L.x2, 1, 1); }
    else { leg(L.x1, 0, 0); leg(L.x2, 0, 0); }
    return g;
  }
  CHARS.forEach(ch => {
    ch.frames = { dark: {}, light: {} };
    ['idle', 'run1', 'run2', 'jump'].forEach(f => {
      const g = charGrid(ch, f);
      ch.frames.dark[f] = bake(g, OUT_DARK);
      ch.frames.light[f] = bake(g, OUT_LIGHT);
    });
  });
  G.CHARS = CHARS;
  G.CW = CW; G.CH = CH;

  // =====================================================================
  //  OBSTÁCULOS
  // =====================================================================
  const OBS = {};
  function ob(name, rows, pal, decorate) { OBS[name] = bake(gridFromRows(rows, pal), OUT_DARK, decorate); }

  // Tesoura da censura
  ob('tesoura', [
    'V............V',
    'VV..........VV',
    '.VV........VV.',
    '.VVV......VVV.',
    '..VVV....VVV..',
    '..vVVV..VVVv..',
    '...vVVVVVVv...',
    '....vVVVVv....',
    '.....VKKV.....',
    '....vVVVVv....',
    '...RRRvvRRR...',
    '..RR.RRRR.RR..',
    '..R...RR...R..',
    '..R...RR...R..',
    '..RR.RRRR.RR..',
    '...RRR..RRR...'
  ], { V: '#e6ecef', v: '#8e9aa0', K: '#1a1022', R: '#d63031' });

  // Pilha de burocracia
  ob('burocracia', [
    '..WWWWWWWWWWWW..',
    '..WggggggWRRRW..',
    '..WWWWWWWWRRRW..',
    '.WWWWWWWWWWWWW..',
    '.WgggggggggggW..',
    '.eeeeeeeeeeeee..',
    'WWWWWWWWWWWWWWW.',
    'WgggggggggggWWW.',
    'eeeeeeeeeeeeeee.',
    '.WWWWWWWWWWWWWWW',
    '.WgggggggggggggW',
    '.WWWWWWWWWWWWWWW',
    '.eeeeeeeeeeeeeee'
  ], { W: '#fbfaf2', g: '#9aa3ad', e: '#c9c5b4', R: '#d63031' });

  // Cofre vazio (sem verba)
  ob('cofre', [
    '.MMMMMMMMMMMMM..',
    'MMmmmmmmmmmmMM..',
    'MmKKKKKKKKKKmMDD',
    'MmwKKwKKKKKKmMDd',
    'MmKwKwKKKKKKmMDd',
    'MmwwwKKKKKKKmMDd',
    'MmKKKKKKKKKKmMGd',
    'MmKKKKKKKKKKmMGd',
    'MmKKKKKKKffKmMDd',
    'MmKKKKKKKKKKmMDd',
    'MmKKKKKKKKKKmMDd',
    'MmKKKKKKKKKKmMDD',
    'MMmmmmmmmmmmMM..',
    '.MMMMMMMMMMMMM..',
    '.MM.........MM..'
  ], { M: '#7f8c9a', m: '#5a6673', K: '#15131c', w: '#c9d1d9', D: '#95a3b3', d: '#6d7a88', G: '#f5c518', f: '#3a3a44' },
  x => { G.text(x, 'R$0', 3, 9, '#d63031'); });

  // Vira-lata caramelo (complexo de vira-lata)
  ob('viralata', [
    '..C.C.............',
    '.CCCCC............',
    '.CKCCC.........C..',
    'NCCCCCC.......CC..',
    '.CWCcCCCCCCCCCCC..',
    '..CCCCCCCCCCCCCC..',
    '...CCCCCCCCCCCCC..',
    '...CCcCCCCCCCCcC..',
    '...CC.CC...CC.CC..',
    '...CC.CC...CC.CC..',
    '...Cc.Cc...Cc.Cc..'
  ], { C: '#dd9a3c', c: '#a86a1e', K: '#0d0d0d', N: '#0d0d0d', W: '#fff3d6' });

  // Disco pirata
  ob('pirataria', [
    '....VVVVV....',
    '..VVvvvvvVV..',
    '.VvvWWWWWvvV.',
    '.VvWWWWWWWvV.',
    'VvvWKKWKKWvvV',
    'VvvWKKWKKWvvV',
    'VvvWWWKWWWvvV',
    'VvvvWWWWWvvvV',
    '.VvvWKWKWvvV.',
    '.VvvvvvvvvvV.',
    '..VVvvvvvVV..',
    '....VVVVV....'
  ], { V: '#cfd8dc', v: '#2b2b3a', W: '#ffffff', K: '#0d0d0d' });

  // Sala de cinema fechada
  ob('sala', [
    'TTTTTTTTTTTTTTTTTT',
    'TWWWWWWWWWWWWWWWWT',
    'TWWWWWWWWWWWWWWWWT',
    'TWWWWWWWWWWWWWWWWT',
    'TWWWWWWWWWWWWWWWWT',
    'TWWWWWWWWWWWWWWWWT',
    'TWWWWWWWWWWWWWWWWT',
    'TTTTTTTTTTTTTTTTTT',
    '.DDDDDDDDDDDDDDDD.',
    '.DKKKKKKKKKKKKKKD.',
    '.DPPKKKKKKKKKKPPD.',
    '.DKPPPKKKKKKPPPKD.',
    '.DKKKPPPKKPPPKKKD.',
    '.DKKKKKPPPPKKKKKD.',
    '.DKKKKKPPPPKKKKKD.',
    '.DKKKPPPKKPPPKKKD.',
    '.DKPPPKKKKKKPPPKD.',
    '.DPPKKKKKKKKKKPPD.',
    '.DKKKKKKKKKKKKKKD.',
    '.DPPPPPPPPPPPPPPD.',
    '.DPpPPPPPPPPPPpPD.',
    '.DKKKKKKKKKKKKKKD.',
    '.DKKKKKKKKKKKKKKD.',
    '.DDDDDDDDDDDDDDDD.'
  ], { T: '#b23a3a', W: '#f3ead2', D: '#8d8478', K: '#17141f', P: '#b07a44', p: '#5a3a1c' },
  x => { G.text(x, 'CINE', 3, 3, '#7a1f1f'); });

  // Herói de franquia (blockbuster)
  ob('heroi', [
    '......HHHHHH........',
    '.....HHHHHHHH.......',
    '.....SSSSSSHH.......',
    '.....KWKKWKKH.......',
    '.....SSSSSSS........',
    '......WWWWS.........',
    '.......SSS..........',
    '...BBBBBBBBBBBRR....',
    '..BBBBBYYYBBBBBRRR..',
    '..BBBBYYBYYBBBBRRRR.',
    '..BBBBBYYYBBBBBRRRR.',
    '..BBbBBBYBBBbBBRRRR.',
    '..SSbBBBBBBBbSSRRRRR',
    '.....YYYYYYY..RRRRRR',
    '.....BBBBBBB..RRRRR.',
    '.....BBB.BBB..RRRR..',
    '.....BBB.BBB..RRR...',
    '.....BBB.BBB..RR....',
    '.....BBB.BBB........',
    '.....RRR.RRR........',
    '....RRRR.RRRR.......'
  ], { H: '#3b2a1a', S: '#f0c9a0', K: '#1a1022', W: '#ffffff', B: '#2456c4', b: '#173a8a', Y: '#ffd23f', R: '#d63031' });

  // Tela de streaming
  ob('streaming', [
    '.KKKKKKKKKKKKKK.',
    'KkkkkkkkkkkkkkkK',
    'KkkkkkRkkkkkkkkK',
    'KkkkkkRRRkkkkkkK',
    'KkkkkkRRRRRkkkkK',
    'KkkkkkRRRkkkkkkK',
    'KkkkkkRkkkkkkkkK',
    'KkkkkkkkkkkkkkkK',
    '.KKKKKKKKKKKKKK.',
    '......KKKK......',
    '....KKKKKKKK....'
  ], { K: '#3a3a4a', k: '#14121c', R: '#ff3b3b' });

  // Latas de filme em chamas (Cinemateca)
  const fogoRows = [
    '......O.......',
    '.....OO..O....',
    '....OOO.OO....',
    '...OOYOOOO....',
    '...OYYYOOOO...',
    '..OOYYYYOYO...',
    '..OYYWYYYYOO..',
    '..OYYWWYYYYO..',
    '..OOYWWWYYOO..',
    '...OYYWWYYO...',
    '.MMMMMMMMMMMM.',
    '.MmmmmmmmmmmM.',
    '.MMMMMMMMMMMM.',
    'MMMMMMMMMMMMMM',
    'MmmmmmmmmmmmmM',
    'MMMMMMMMMMMMMM'
  ];
  const fogoPal = { O: '#ff7a1a', Y: '#ffd23f', W: '#fff7d6', M: '#9aa3ad', m: '#5a6673' };
  ob('fogo', fogoRows, fogoPal);
  ob('fogo2', fogoRows.map((r, i) => (i < 10 ? r.split('').reverse().join('') : r)), fogoPal);

  // Letreiro de Hollywood (montado por código)
  (function () {
    const word = 'HOLLYWOOD', w = word.length * 4 + 3, h = 14;
    const g = [];
    for (let y = 0; y < h; y++) g.push(new Array(w).fill(null));
    for (let i = 0; i < word.length; i++) {
      const f = FONT[word[i]];
      for (let k = 0; k < 15; k++) if (f[k] === '1') g[1 + ((k / 3) | 0)][2 + i * 4 + (k % 3)] = '#ffffff';
      g[6][2 + i * 4] = '#b0b0b0'; g[6][4 + i * 4] = '#b0b0b0';
      g[7][2 + i * 4] = '#8a8a8a'; g[7][4 + i * 4] = '#8a8a8a';
    }
    for (let y = 8; y < h; y++) {
      const inset = Math.max(0, 10 - y);
      for (let x = inset; x < w - inset; x++) g[y][x] = (y === 8 || (x * 7 + y * 3) % 11 === 0) ? '#6f8a4a' : '#5a7340';
    }
    OBS.hollywood = bake(g, OUT_DARK);
  })();

  G.OBS = OBS;

  // =====================================================================
  //  ITENS
  // =====================================================================
  const ITEMS = {};
  ITEMS.reel = bake(gridFromRows([
    '..KKKKK..',
    '.KMMMMMK.',
    'KMMhMhMMK',
    'KMhMMMhMK',
    'KMMMhMMMK',
    'KMhMMMhMK',
    'KMMhMhMMK',
    '.KMMMMMK.',
    '..KKKKK..'
  ], { K: '#566573', M: '#dfe6e9', h: '#2d3436' }), OUT_DARK);
  ITEMS.trophy = bake(gridFromRows([
    '.GGGGGGG.',
    'GGYYWYYGG',
    'G.GYWYG.G',
    'G.GYYYG.G',
    '.GGYYYGG.',
    '..GYYYG..',
    '...GYG...',
    '....G....',
    '....G....',
    '..GGGGG..',
    '.GGGGGGG.'
  ], { G: '#d4a017', Y: '#ffe066', W: '#fffbe0' }), OUT_DARK);
  // "edital aprovado" = vida extra
  ITEMS.edital = bake(gridFromRows([
    'WWWWWWW..',
    'WggggWWW.',
    'WWWWWWWW.',
    'WgggggWW.',
    'WWWWWWWW.',
    'WggGGGGW.',
    'WWGGGGcG.',
    'WWGcGcGG.',
    'WWGGcGGG.',
    '...GGGG..'
  ], { W: '#fbfaf2', g: '#9aa3ad', G: '#27ae60', c: '#ffffff' }), OUT_DARK);
  G.ITEMS = ITEMS;
})();
