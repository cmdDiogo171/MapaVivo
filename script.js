const GEOJSON_URL = 'https://cdn.jsdelivr.net/gh/giuliano-macedo/geodata-br-states@main/geojson/br_states.json';

const CORES_REGIAO = {
  'Norte':        '#2D9E6B',
  'Nordeste':     '#E8742A',
  'Centro-Oeste': '#D4A017',
  'Sudeste':      '#3A7BD5',
  'Sul':          '#7B5EA7'
};

// ── REGIÕES ──
const REGIOES_ESTADOS = {
  'Norte':        ['AC','AM','AP','PA','RO','RR','TO'],
  'Nordeste':     ['AL','BA','CE','MA','PB','PE','PI','RN','SE'],
  'Centro-Oeste': ['DF','GO','MS','MT'],
  'Sudeste':      ['ES','MG','RJ','SP'],
  'Sul':          ['PR','RS','SC']
};

const NOMES_REGIAO = {
  'Norte':        { bronze: 'Ribeirinho',       prata: 'Seringueiro',       ouro: 'Guardião da Floresta' },
  'Nordeste':     { bronze: 'Vaqueiro',          prata: 'Rei do Cangaço',    ouro: 'Mestre da Caatinga' },
  'Centro-Oeste': { bronze: 'Peão do Cerrado',   prata: 'Tropeiro',          ouro: 'Senhor do Pantanal' },
  'Sudeste':      { bronze: 'Caipira',            prata: 'Barão do Café',     ouro: 'Locomotiva do Brasil' },
  'Sul':          { bronze: 'Gaúcho de Estância', prata: 'Ervateiro',         ouro: 'Grão-Mestre do Pampa' }
};

const NOMES_MODO = {
  bandeiras:    { bronze: 'Recruta',             prata: 'Porta-Estandarte',  ouro: 'Arauto da Nação' },
  capitais:     { bronze: 'Vereador',            prata: 'Governador',        ouro: 'Presidente da República' },
  pratos:       { bronze: 'Aprendiz Folclórico', prata: 'Mestre de Cultura', ouro: 'Patrimônio Vivo' },
  festas:       { bronze: 'Folião Iniciante',    prata: 'Mestre da Folia',   ouro: 'Rei da Festa' },
  geografia:    { bronze: 'Curioso do Sertão',   prata: 'Naturalista',       ouro: 'Explorador IBGE' },
  curiosidades: { bronze: 'Conta-Causos',        prata: 'Guardião da Memória', ouro: 'Cronista do Brasil' },
  relampago:    { bronze: 'Fogueira Acesa',      prata: 'Trovão do Cerrado', ouro: 'Fênix Brasileira' }
};

function thresholdsRegiao(regiao) {
  const total = REGIOES_ESTADOS[regiao].length;
  return { bronze: Math.ceil(total / 3), prata: Math.ceil(2 * total / 3), ouro: total };
}

let estadoAtual   = null;
let estadosData   = {};
let bandeirasData = {};

let jogo = {
  modo: null, pontos: 0, sequencia: 0, maxSequencia: 0,
  acertos: 0, total: 0, timer: null, tempoRestante: 60,
  ativo: false, siglaAtual: null
};

// ══════════════════════════════════════════════
// ── MAPA ──
// ══════════════════════════════════════════════
const map = L.map('map', { center: [-15.5, -53], zoom: 4, zoomControl: true, minZoom: 3 });

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '© OpenStreetMap © CARTO', subdomains: 'abcd', maxZoom: 19
}).addTo(map);

Promise.all([
  fetch('data/estados.json').then(r => r.json()),
  fetch(GEOJSON_URL).then(r => r.json()),
  fetch('https://apis.codante.io/bandeiras-dos-estados').then(r => r.json())
]).then(([dados, geojson, bandeiras]) => {
  estadosData = dados;
  bandeiras.forEach(b => { bandeirasData[b.uf.toUpperCase()] = b.flag_url_rounded; });
  iniciarCamadas(geojson);
}).catch(err => alert('Erro ao carregar dados: ' + err.message));

function getCorEstado(sigla) {
  const d = estadosData[sigla];
  return d ? (CORES_REGIAO[d.regiao] || '#aaa') : '#aaa';
}

function estiloBase(feature) {
  const sigla = feature.properties?.sigla || feature.id;
  return { fillColor: getCorEstado(sigla), fillOpacity: 0.5, color: '#fff', weight: 1.5, opacity: 1 };
}

function estiloHover(feature) {
  const sigla = feature.properties?.sigla || feature.id;
  return { fillColor: getCorEstado(sigla), fillOpacity: 0.8, color: '#fff', weight: 2.5, opacity: 1 };
}

function iniciarCamadas(geojson) {
  L.geoJSON(geojson, {
    style: estiloBase,
    onEachFeature: (feature, layer) => {
      const sigla = feature.properties?.sigla || feature.id || '';
      const nome  = estadosData[sigla]?.nome || sigla;
      layer.on({
        mouseover: (e) => {
          e.target.setStyle(estiloHover(feature));
          e.target.bindTooltip(`<strong>${nome}</strong>`, { sticky: true, className: 'leaflet-tooltip' }).openTooltip();
        },
        mouseout: (e) => { e.target.setStyle(estiloBase(feature)); e.target.closeTooltip(); },
        click:    ()  => abrirPainel(sigla)
      });
    }
  }).addTo(map);
}

// ══════════════════════════════════════════════
// ── PAINEL LATERAL ──
// ══════════════════════════════════════════════
function abrirPainel(sigla) {
  const d = estadosData[sigla];
  if (!d) return;

  estadoAtual = sigla;
  const cor = CORES_REGIAO[d.regiao] || '#3A7BD5';
  document.documentElement.style.setProperty('--regiao-cor', cor);

  const img = document.getElementById('bandeira');
  img.style.display = 'none';
  img.onload  = () => { img.style.display = 'block'; };
  img.onerror = () => { img.onerror = null; img.style.display = 'block'; img.src = `https://placehold.co/110x70/e2e8f0/64748b?text=${sigla}`; };
  img.src = bandeirasData[sigla] || '';

  document.getElementById('estado-nome').textContent               = d.nome;
  document.getElementById('regiao-tag').innerHTML                  = `<span>${d.regiao}</span>`;
  document.getElementById('val-capital').textContent               = d.capital;
  document.getElementById('val-populacao').textContent             = Number(d.populacao).toLocaleString('pt-BR') + ' hab.';
  document.getElementById('val-area').textContent                  = d.area;
  document.getElementById('val-pib').textContent                   = d.pib;
  document.getElementById('val-bioma').textContent                 = d.bioma;
  document.getElementById('val-clima').textContent                 = d.clima;
  document.getElementById('val-relevo').textContent                = d.relevo;
  document.getElementById('val-atividade').textContent             = d.atividade;
  document.getElementById('val-prato').textContent                 = d.prato_tipico;
  document.getElementById('val-festa').textContent                 = d.festa;
  document.getElementById('val-curiosidade').textContent           = d.curiosidade;
  document.getElementById('val-curiosidade-historica').textContent = d.curiosidade_historica;
  document.getElementById('val-voce-sabia').textContent            = d.voce_sabia;

  trocarAba('dados');
  document.getElementById('painel').classList.remove('oculto');
  lucide.createIcons();
}

function trocarAba(tabId) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === `tab-${tabId}`));
}

document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', () => trocarAba(btn.dataset.tab)));
document.getElementById('fechar-painel').addEventListener('click', () => document.getElementById('painel').classList.add('oculto'));

// ══════════════════════════════════════════════
// ── SISTEMA DE CONQUISTAS ──
// ══════════════════════════════════════════════
function carregarProgresso()     { return JSON.parse(localStorage.getItem('mapavivo_prog') || '{}'); }
function salvarProgresso(p)      { localStorage.setItem('mapavivo_prog', JSON.stringify(p)); }
function carregarDesbloqueadas() { return JSON.parse(localStorage.getItem('mapavivo_desbloqueadas') || '[]'); }
function salvarDesbloqueadas(a)  { localStorage.setItem('mapavivo_desbloqueadas', JSON.stringify(a)); }

function registrarAcerto(modo, sigla) {
  const prog = carregarProgresso();
  if (!prog[modo]) prog[modo] = { total: 0, estados: [] };
  prog[modo].total++;
  if (!prog[modo].estados.includes(sigla)) prog[modo].estados.push(sigla);
  salvarProgresso(prog);
  verificarConquistas(modo, prog);
}

function verificarConquistas(modo, prog) {
  const desbloqueadas = carregarDesbloqueadas();
  const novas         = [];
  const modoData      = prog[modo] || { total: 0, estados: [] };
  const thModo        = { bronze: 5, prata: 15, ouro: 27 };

  // Conquistas gerais por modo
  ['bronze','prata','ouro'].forEach(nivel => {
    const id = `${modo}_geral_${nivel}`;
    if (!desbloqueadas.includes(id) && modoData.total >= thModo[nivel]) {
      desbloqueadas.push(id);
      novas.push({ id, nivel, nome: NOMES_MODO[modo]?.[nivel] || id });
    }
  });

  // Conquistas por região (não no relâmpago)
  if (modo !== 'relampago') {
    Object.entries(REGIOES_ESTADOS).forEach(([regiao, estadosDaRegiao]) => {
      const regiaoKey    = regiao.toLowerCase().replace('-','').replace(' ','');
      const acertosRegiao = modoData.estados.filter(s => estadosDaRegiao.includes(s)).length;
      const thresh        = thresholdsRegiao(regiao);
      ['bronze','prata','ouro'].forEach(nivel => {
        const id = `${modo}_${regiaoKey}_${nivel}`;
        if (!desbloqueadas.includes(id) && acertosRegiao >= thresh[nivel]) {
          desbloqueadas.push(id);
          novas.push({ id, nivel, nome: NOMES_REGIAO[regiao]?.[nivel] || id });
        }
      });
    });
  }

  if (novas.length > 0) {
    salvarDesbloqueadas(desbloqueadas);
    novas.forEach((c, i) => setTimeout(() => mostrarNotificacao(c), i * 3000));
  }
}

function mostrarNotificacao(conquista) {
  const icons = { bronze: '🥉', prata: '🥈', ouro: '🥇' };
  document.getElementById('notif-icon').textContent = icons[conquista.nivel] || '🏅';
  document.getElementById('notif-nome').textContent = conquista.nome;

  const el = document.getElementById('notificacao');
  el.classList.remove('oculto');
  requestAnimationFrame(() => el.classList.add('visivel'));

  setTimeout(() => {
    el.classList.remove('visivel');
    setTimeout(() => el.classList.add('oculto'), 400);
  }, 3000);
}

function renderizarConquistas() {
  const desbloqueadas = carregarDesbloqueadas();
  const prog          = carregarProgresso();
  const secoes        = document.getElementById('conquistas-secoes');
  secoes.innerHTML    = '';

  let totalPossivel    = 0;
  let totalDesbloqueado = 0;

  const modos = ['bandeiras','capitais','pratos','festas','geografia','curiosidades','relampago'];
  const nomesModos = {
    bandeiras:'🏳️ Bandeiras', capitais:'🏙️ Capitais', pratos:'🍽️ Pratos Típicos',
    festas:'🎪 Festas', geografia:'🌿 Geografia', curiosidades:'📖 Curiosidades', relampago:'⚡ Relâmpago'
  };
  const nivelIcons = { bronze: '🥉', prata: '🥈', ouro: '🥇' };
  const nivelLabel = { bronze: 'Bronze', prata: 'Prata', ouro: 'Ouro' };
  const thModo     = { bronze: 5, prata: 15, ouro: 27 };

  modos.forEach(modo => {
    const secao = document.createElement('div');
    secao.className = 'conquista-secao';
    secao.innerHTML = `<div class="conquista-secao-titulo">${nomesModos[modo]}</div>`;
    const grid = document.createElement('div');
    grid.className = 'conquista-grid';

    const modoData = prog[modo] || { total: 0, estados: [] };

    // Conquistas gerais
    ['bronze','prata','ouro'].forEach(nivel => {
      const id           = `${modo}_geral_${nivel}`;
      const desbloqueado = desbloqueadas.includes(id);
      const nome         = NOMES_MODO[modo]?.[nivel] || '???';
      const atual        = modoData.total;

      totalPossivel++;
      if (desbloqueado) totalDesbloqueado++;

      grid.innerHTML += `
        <div class="conquista-item ${desbloqueado ? 'desbloqueada' : ''}">
          <span class="conquista-medalha">${nivelIcons[nivel]}</span>
          <div class="conquista-info">
            <span class="conquista-nome">${nome}</span>
            <span class="conquista-desc">${desbloqueado ? '✅ Desbloqueada' : `${atual}/${thModo[nivel]} acertos — ${nomesModos[modo]}`}</span>
          </div>
          <span class="conquista-nivel nivel-${nivel}">${nivelLabel[nivel]}</span>
        </div>`;
    });

    // Conquistas por região
    if (modo !== 'relampago') {
      Object.entries(REGIOES_ESTADOS).forEach(([regiao, estadosDaRegiao]) => {
        const regiaoKey     = regiao.toLowerCase().replace('-','').replace(' ','');
        const acertosRegiao = modoData.estados.filter(s => estadosDaRegiao.includes(s)).length;
        const thresh        = thresholdsRegiao(regiao);

        ['bronze','prata','ouro'].forEach(nivel => {
          const id           = `${modo}_${regiaoKey}_${nivel}`;
          const desbloqueado = desbloqueadas.includes(id);
          const nome         = NOMES_REGIAO[regiao]?.[nivel] || '???';

          totalPossivel++;
          if (desbloqueado) totalDesbloqueado++;

          grid.innerHTML += `
            <div class="conquista-item ${desbloqueado ? 'desbloqueada' : ''}">
              <span class="conquista-medalha">${nivelIcons[nivel]}</span>
              <div class="conquista-info">
                <span class="conquista-nome">${nome}</span>
                <span class="conquista-desc">${desbloqueado ? '✅ Desbloqueada' : `${acertosRegiao}/${thresh[nivel]} estados do ${regiao} — ${nomesModos[modo]}`}</span>
              </div>
              <span class="conquista-nivel nivel-${nivel}">${nivelLabel[nivel]}</span>
            </div>`;
        });
      });
    }

    secao.appendChild(grid);
    secoes.appendChild(secao);
  });

  document.getElementById('conquistas-sub').textContent = `${totalDesbloqueado} de ${totalPossivel} desbloqueadas`;

  // Barra de progresso
  let barraEl = document.querySelector('.conquistas-progresso');
  if (!barraEl) {
    barraEl = document.createElement('div');
    barraEl.className = 'conquistas-progresso';
    barraEl.innerHTML = '<div class="conquistas-progresso-fill"></div>';
    document.querySelector('.conquistas-header').appendChild(barraEl);
  }
  const pct = totalPossivel > 0 ? (totalDesbloqueado / totalPossivel) * 100 : 0;
  barraEl.querySelector('.conquistas-progresso-fill').style.width = pct + '%';
}

// Botão conquistas
document.getElementById('btn-conquistas').addEventListener('click', () => {
  renderizarConquistas();
  document.getElementById('game-conquistas').classList.remove('oculto');
  lucide.createIcons();
});

document.getElementById('fechar-conquistas').addEventListener('click', () => {
  document.getElementById('game-conquistas').classList.add('oculto');
});

// ══════════════════════════════════════════════
// ── FILA SEM REPETIÇÃO ──
// ══════════════════════════════════════════════
function getFilaModo(modo) {
  const key  = `mapavivo_fila_${modo}`;
  let fila   = JSON.parse(localStorage.getItem(key) || '[]');
  if (fila.length < 1) {
    fila = embaralhar(Object.keys(estadosData));
    localStorage.setItem(key, JSON.stringify(fila));
  }
  return fila;
}

function consumirFilaModo(modo) {
  const key   = `mapavivo_fila_${modo}`;
  const fila  = getFilaModo(modo);
  const sigla = fila.shift();
  localStorage.setItem(key, JSON.stringify(fila));
  return sigla;
}

// ══════════════════════════════════════════════
// ── BANCO DE PERGUNTAS ──
// ══════════════════════════════════════════════
function gerarPergunta(modo) {
  const siglas   = Object.keys(estadosData);
  const modoFila = modo === 'relampago' ? 'relampago' : modo;
  const sigla    = consumirFilaModo(modoFila);
  const d        = estadosData[sigla];

  function dist(campo, correta) {
    return embaralhar(siglas.filter(s => s !== sigla))
      .map(s => estadosData[s][campo])
      .filter((v, i, arr) => v && v !== correta && arr.indexOf(v) === i)
      .slice(0, 3);
  }

  function montar(pergunta, imagem, correta, opcoes) {
    return { pergunta, imagem, correta, opcoes, sigla };
  }

  switch (modo) {
    case 'bandeiras':
      return montar('Esta bandeira pertence a qual estado?', bandeirasData[sigla] || null, d.nome, embaralhar([d.nome, ...dist('nome', d.nome)]));
    case 'capitais':
      return montar(`Qual é a capital de ${d.nome}?`, bandeirasData[sigla] || null, d.capital, embaralhar([d.capital, ...dist('capital', d.capital)]));
    case 'pratos':
      return montar(`"${d.prato_tipico}" é um prato típico de qual estado?`, null, d.nome, embaralhar([d.nome, ...dist('nome', d.nome)]));
    case 'festas':
      return montar(`"${d.festa}" acontece em qual estado?`, null, d.nome, embaralhar([d.nome, ...dist('nome', d.nome)]));
    case 'geografia': {
      const tops = [
        { campo: 'bioma',     q: `Qual o bioma predominante em ${d.nome}?` },
        { campo: 'clima',     q: `Qual o clima predominante em ${d.nome}?` },
        { campo: 'relevo',    q: `Qual o tipo de relevo de ${d.nome}?` },
        { campo: 'atividade', q: `Qual a principal atividade econômica de ${d.nome}?` },
        { campo: 'regiao',    q: `${d.nome} pertence a qual região do Brasil?` }
      ];
      const t = tops[Math.floor(Math.random() * tops.length)];
      return montar(t.q, null, d[t.campo], embaralhar([d[t.campo], ...dist(t.campo, d[t.campo])]));
    }
    case 'curiosidades': {
      const tips = [
        `Esta curiosidade é sobre qual estado?\n"${d.curiosidade.substring(0,90)}..."`,
        `Este fato histórico é sobre qual estado?\n"${d.curiosidade_historica.substring(0,90)}..."`,
        `De qual estado estamos falando?\n"${d.voce_sabia.substring(0,90)}..."`
      ];
      return montar(tips[Math.floor(Math.random() * tips.length)], null, d.nome, embaralhar([d.nome, ...dist('nome', d.nome)]));
    }
    case 'relampago': {
      const modosSorteio = ['bandeiras','capitais','pratos','festas','geografia','curiosidades'];
      const modoS = modosSorteio[Math.floor(Math.random() * modosSorteio.length)];

      function dist2(campo, correta) {
        return embaralhar(siglas.filter(s => s !== sigla))
          .map(s => estadosData[s][campo])
          .filter((v, i, arr) => v && v !== correta && arr.indexOf(v) === i)
          .slice(0, 3);
      }

      switch (modoS) {
        case 'bandeiras':   return montar('Esta bandeira pertence a qual estado?', bandeirasData[sigla] || null, d.nome, embaralhar([d.nome, ...dist2('nome', d.nome)]));
        case 'capitais':    return montar(`Qual é a capital de ${d.nome}?`, bandeirasData[sigla] || null, d.capital, embaralhar([d.capital, ...dist2('capital', d.capital)]));
        case 'pratos':      return montar(`"${d.prato_tipico}" é prato típico de qual estado?`, null, d.nome, embaralhar([d.nome, ...dist2('nome', d.nome)]));
        case 'festas':      return montar(`"${d.festa}" acontece em qual estado?`, null, d.nome, embaralhar([d.nome, ...dist2('nome', d.nome)]));
        case 'geografia': {
          const tops2 = [
            { campo: 'bioma',     q: `Qual o bioma predominante em ${d.nome}?` },
            { campo: 'clima',     q: `Qual o clima predominante em ${d.nome}?` },
            { campo: 'relevo',    q: `Qual o tipo de relevo de ${d.nome}?` },
            { campo: 'atividade', q: `Qual a principal atividade econômica de ${d.nome}?` },
            { campo: 'regiao',    q: `${d.nome} pertence a qual região do Brasil?` }
          ];
          const t2 = tops2[Math.floor(Math.random() * tops2.length)];
          return montar(t2.q, null, d[t2.campo], embaralhar([d[t2.campo], ...dist2(t2.campo, d[t2.campo])]));
        }
        default: {
          const tips2 = [
            `Esta curiosidade é sobre qual estado?\n"${d.curiosidade.substring(0,90)}..."`,
            `Este fato histórico é sobre qual estado?\n"${d.curiosidade_historica.substring(0,90)}..."`,
            `De qual estado estamos falando?\n"${d.voce_sabia.substring(0,90)}..."`
          ];
          return montar(tips2[Math.floor(Math.random() * tips2.length)], null, d.nome, embaralhar([d.nome, ...dist2('nome', d.nome)]));
        }
      }
    }
    default: return gerarPergunta('capitais');
  }
}

// ══════════════════════════════════════════════
// ── CONTROLE DO JOGO ──
// ══════════════════════════════════════════════
document.getElementById('btn-jogar').addEventListener('click', () => {
  document.getElementById('game-menu').classList.remove('oculto');
  lucide.createIcons();
});

document.getElementById('fechar-menu').addEventListener('click', () => {
  document.getElementById('game-menu').classList.add('oculto');
});

document.querySelectorAll('.modo-card').forEach(card => {
  card.addEventListener('click', () => {
    document.getElementById('game-menu').classList.add('oculto');
    iniciarJogo(card.dataset.modo);
  });
});

function iniciarJogo(modo) {
  jogo.modo = modo; jogo.pontos = 0; jogo.sequencia = 0;
  jogo.maxSequencia = 0; jogo.acertos = 0; jogo.total = 0;
  jogo.ativo = true; jogo.tempoRestante = 60; jogo.siglaAtual = null;

  const nomes = {
    bandeiras:'🏳️ Bandeiras', capitais:'🏙️ Capitais', pratos:'🍽️ Pratos Típicos',
    festas:'🎪 Festas', geografia:'🌿 Geografia', curiosidades:'📖 Curiosidades', relampago:'⚡ Relâmpago'
  };

  document.getElementById('game-modo-label').textContent = nomes[modo] || modo;
  document.getElementById('game-play').classList.remove('oculto');

  const timerEl = document.getElementById('game-timer');
  if (modo === 'relampago') { timerEl.classList.remove('oculto'); iniciarTimer(); }
  else                       { timerEl.classList.add('oculto'); }

  atualizarStats();
  proximaPergunta();
  lucide.createIcons();
}

function iniciarTimer() {
  clearInterval(jogo.timer);
  jogo.tempoRestante = 60;
  atualizarTimer();
  jogo.timer = setInterval(() => {
    jogo.tempoRestante--;
    atualizarTimer();
    if (jogo.tempoRestante <= 0) { clearInterval(jogo.timer); encerrarJogo(); }
  }, 1000);
}

function atualizarTimer() {
  document.getElementById('game-timer').textContent = `⏱️ ${jogo.tempoRestante}`;
}

function proximaPergunta() {
  const pergunta = gerarPergunta(jogo.modo);
  jogo.total++;
  jogo.siglaAtual = pergunta.sigla;

  const progresso = jogo.modo === 'relampago'
    ? ((60 - jogo.tempoRestante) / 60) * 100
    : Math.min((jogo.total / 10) * 100, 100);
  document.getElementById('game-progresso-fill').style.width = progresso + '%';

  const imgContainer = document.getElementById('game-imagem-container');
  const imgEl        = document.getElementById('game-imagem');
  if (pergunta.imagem) { imgContainer.classList.remove('oculto'); imgEl.src = pergunta.imagem; }
  else                  { imgContainer.classList.add('oculto'); imgEl.src = ''; }

  document.getElementById('game-pergunta-texto').textContent = pergunta.pergunta;

  const opcoesEl = document.getElementById('game-opcoes');
  opcoesEl.innerHTML = '';
  pergunta.opcoes.forEach(op => {
    const btn = document.createElement('button');
    btn.className   = 'game-opcao';
    btn.textContent = op;
    btn.addEventListener('click', () => responder(btn, op, pergunta.correta));
    opcoesEl.appendChild(btn);
  });

  document.getElementById('game-feedback').classList.add('oculto');
  document.getElementById('btn-proxima').classList.add('oculto');
}

function responder(btnClicado, resposta, correta) {
  document.querySelectorAll('.game-opcao').forEach(b => { b.disabled = true; });

  const acertou  = resposta === correta;
  const feedback = document.getElementById('game-feedback');

  if (acertou) {
    btnClicado.classList.add('correta');
    jogo.acertos++;
    jogo.sequencia++;
    jogo.maxSequencia = Math.max(jogo.maxSequencia, jogo.sequencia);
    const bonus = jogo.sequencia >= 3 ? 2 : 1;
    jogo.pontos += 10 * bonus;
    feedback.className   = 'game-feedback acerto';
    feedback.textContent = jogo.sequencia >= 3
      ? `✅ Correto! +${10 * bonus} pts 🔥 Sequência x${jogo.sequencia}!`
      : `✅ Correto! +${10 * bonus} pts`;

    // ✅ Registra conquista
    registrarAcerto(jogo.modo, jogo.siglaAtual);
  } else {
    btnClicado.classList.add('errada');
    jogo.sequencia = 0;
    document.querySelectorAll('.game-opcao').forEach(b => {
      if (b.textContent === correta) b.classList.add('correta');
    });
    feedback.className   = 'game-feedback erro';
    feedback.textContent = `❌ Errou! A resposta era: ${correta}`;
  }

  feedback.classList.remove('oculto');
  atualizarStats();

  if (jogo.modo === 'relampago') {
    setTimeout(() => { if (jogo.ativo) proximaPergunta(); }, 1200);
  } else {
    document.getElementById('btn-proxima').classList.remove('oculto');
    lucide.createIcons();
  }
}

function atualizarStats() {
  document.getElementById('game-pontos').textContent    = `🏆 ${jogo.pontos}`;
  document.getElementById('game-sequencia').textContent = `🔥 ${jogo.sequencia}`;
}

document.getElementById('btn-proxima').addEventListener('click', () => {
  if (jogo.modo !== 'relampago' && jogo.total >= 10) encerrarJogo();
  else proximaPergunta();
});

function encerrarJogo() {
  jogo.ativo = false;
  clearInterval(jogo.timer);
  document.getElementById('game-play').classList.add('oculto');
  document.getElementById('game-over').classList.remove('oculto');

  const pct = jogo.total > 0 ? Math.round((jogo.acertos / jogo.total) * 100) : 0;
  let emoji = '😅', msg = 'Continue praticando!';
  if      (pct >= 90) { emoji = '🏆'; msg = 'Você é incrível! Conhece bem o Brasil!'; }
  else if (pct >= 70) { emoji = '🎉'; msg = 'Muito bem! Quase um especialista!'; }
  else if (pct >= 50) { emoji = '👍'; msg = 'Bom resultado! Pode melhorar!'; }

  document.getElementById('game-over-emoji').textContent = emoji;
  document.getElementById('game-over-sub').textContent   = msg;
  document.getElementById('go-pontos').textContent       = jogo.pontos;
  document.getElementById('go-acertos').textContent      = `${jogo.acertos}/${jogo.total}`;
  document.getElementById('go-sequencia').textContent    = jogo.maxSequencia;
  lucide.createIcons();
}

document.getElementById('btn-jogar-novamente').addEventListener('click', () => {
  document.getElementById('game-over').classList.add('oculto');
  iniciarJogo(jogo.modo);
});

document.getElementById('btn-trocar-modo').addEventListener('click', () => {
  document.getElementById('game-over').classList.add('oculto');
  document.getElementById('game-menu').classList.remove('oculto');
  lucide.createIcons();
});

document.getElementById('fechar-game-over').addEventListener('click', () => {
  document.getElementById('game-over').classList.add('oculto');
  lucide.createIcons();
});

document.getElementById('fechar-jogo').addEventListener('click', () => {
  clearInterval(jogo.timer);
  jogo.ativo = false;
  document.getElementById('game-play').classList.add('oculto');
  lucide.createIcons();
});

// ── UTILITÁRIOS ──
function embaralhar(arr) { return [...arr].sort(() => Math.random() - 0.5); }

lucide.createIcons();
