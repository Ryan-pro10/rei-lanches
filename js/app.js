/* Cardápio com pedido no WhatsApp — lógica do app.
   Os dados da loja ficam em config/loja.js (window.LOJA). */
(function () {
'use strict';

/* ================= Utilidades ================= */
var $ = function (s, el) { return (el || document).querySelector(s); };
var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function fmt(n) { return (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function parsePrice(v) {
  if (typeof v === 'number') return v;
  v = String(v || '').trim().replace(/[R$\s]/g, '');
  if (!v) return 0;
  if (v.indexOf(',') > -1) v = v.replace(/\./g, '').replace(',', '.');
  var n = parseFloat(v); return isNaN(n) ? 0 : Math.round(n * 100) / 100;
}
function priceInput(n) { return n ? String(n).replace('.', ',') : ''; }
function uid(p) { return p + Math.random().toString(36).slice(2, 8); }
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function initials(n) { return String(n || '?').trim().split(/\s+/).slice(0, 2).map(function (w) { return w[0] || ''; }).join('').toUpperCase(); }
function slug(s) { return String(s || 'item').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item'; }
var LS = {
  get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
  set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
};
var SS = {
  get: function (k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } },
  set: function (k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
function toast(msg) { var t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove('show'); }, 2600); }

var IC = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',
  star: '<path fill="currentColor" stroke="none" d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m14 6 4 4"/>',
  up: '<path d="m18 15-6-6-6 6"/>', down: '<path d="m6 9 6 6 6-6"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  download: '<path d="M12 3v12m0 0-5-5m5 5 5-5M4 21h16"/>',
  upload: '<path d="M12 16V4m0 0-5 5m5-5 5 5M4 20h16"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>',
  chat: '<path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.6-5.2A8.5 8.5 0 1 1 21 11.5z"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'
};
function icon(n, s, sw) { return '<svg width="' + (s || 20) + '" height="' + (s || 20) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 1.8) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[n] + '</svg>'; }

/* ================= Configuração ================= */
function normalize(c) {
  c = c || {};
  c.id = c.id || 'demo';
  var src = c.loja || {};
  c.loja = Object.assign({ nome: 'Minha Loja', logo: '', whatsapp: '', instagram: '', fechadoManual: false, horarios: {}, endereco: '', entrega: true, retirada: true, taxaEntrega: 0, pedidoMinimo: 0, tempoEntrega: '', tempoRetirada: '', pagamentos: ['Pix', 'Cartão', 'Dinheiro'] }, src);
  // compatibilidade com formatos antigos (aberta / status / cor dentro de loja)
  if (src.status === 'fechada' || src.aberta === false) c.loja.fechadoManual = true;
  var oldCor = src.cor;
  delete c.loja.aberta; delete c.loja.horario; delete c.loja.status; delete c.loja.cor;
  c.loja.horarios = Object.assign({ dom: '', seg: '', ter: '', qua: '', qui: '', sex: '', sab: '' }, c.loja.horarios);
  var b0 = c.banner || {};
  c.visual = Object.assign({ corPrincipal: oldCor || '#E9B226', corSecundaria: '#FF8948', corEscura: '#111111', layout: 'lista', mostrarBanner: b0.ativo !== false && !!(b0.titulo || b0.imagem) }, c.visual || {});
  c.seo = Object.assign({ titulo: '', descricao: '', imagem: '', favicon: '', url: '' }, c.seo || {});
  c.rastreamento = Object.assign({ metaPixel: '', googleAnalytics: '' }, c.rastreamento || {});
  c.cupons = (c.cupons || []).map(function (k) { return Object.assign({ codigo: '', tipo: 'percentual', valor: 0, minimo: 0, validade: '', ativo: true }, k); });
  c.banner = Object.assign({ chamada: '', titulo: '', botao: 'Pedir agora', imagem: '', produto: '' }, b0);
  delete c.banner.ativo;
  c.categorias = (c.categorias || []).map(function (k) { return Object.assign({ id: uid('c'), nome: '', icone: '', oculta: false }, k); });
  /* Grupos de opções reaproveitáveis: o produto lista os ids em "grupos" */
  c.grupos = (c.grupos || []).map(function (g) { return Object.assign({ id: uid('g'), nome: '', tipo: 'multipla', obrigatorio: false, min: 0, max: 0, opcoes: [] }, g); });
  c.produtos = (c.produtos || []).map(function (p) {
    p = Object.assign({ id: uid('p'), tipo: 'produto', nome: '', categoria: '', preco: 0, descricao: '', fotos: [], nota: 0, destaque: false, disponivel: true, pontoCarne: false, remover: [], grupos: [], tamanhos: [], adicionais: [] }, p);
    if (typeof p.fotos === 'string') p.fotos = p.fotos ? [p.fotos] : [];
    if (typeof p.remover === 'string') p.remover = p.remover.split(/[,\n]/).map(function (x) { return x.trim(); }).filter(Boolean);
    if (p.tipo === 'combo') p.itens = (p.itens || []).map(function (x) { return { produto: x.produto, qtd: Math.max(1, parseInt(x.qtd, 10) || 1) }; });
    else delete p.itens;
    p.adicionais = (p.adicionais || []).map(function (g) { return Object.assign({ titulo: 'Adicionais', min: 0, max: 0, opcoes: [] }, g); });
    return p;
  });
  c.admin = Object.assign({ pin: '' }, c.admin || {});
  return c;
}
/* Modo prévia do admin gerador: index.html?preview=1 recebe a config por postMessage */
var PREVIEW = /[?&]preview=1/.test(location.search), SIM = null;
var PUBLISHED = normalize(clone(window.LOJA || {}));
var DRAFT_KEY = 'cardapio_rascunho_' + PUBLISHED.id;
var CFG = PUBLISHED, draft = null, previewMode = false;

function hexToRgb(h) { h = String(h || '').replace('#', ''); if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join(''); var n = parseInt(h, 16); if (isNaN(n) || h.length !== 6) return [233, 178, 38]; return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function lum(c) { var f = function (v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); }
function contrast(a, b) { var A = lum(a), B = lum(b); return (Math.max(A, B) + .05) / (Math.min(A, B) + .05); }
function toHex(c) { return '#' + c.map(function (x) { return Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0'); }).join(''); }
function mix(c, to, k) { return c.map(function (v, i) { return v + (to[i] - v) * k; }); }
function applyTheme(cfg) {
  var v = cfg.visual, p = hexToRgb(v.corPrincipal), white = [255, 255, 255];
  var t = p.slice(), i = 0; while (contrast(t, white) < 4.5 && i < 40) { t = t.map(function (x) { return x * .92; }); i++; }
  var ink = hexToRgb(v.corEscura), st = document.documentElement.style;
  st.setProperty('--brand', toHex(p));
  st.setProperty('--on-brand', lum(p) > .6 ? '#1A1A1A' : '#FFFFFF');
  st.setProperty('--brand-text', toHex(t));
  st.setProperty('--brand-soft', toHex(mix(p, white, .86)));
  st.setProperty('--accent', toHex(hexToRgb(v.corSecundaria)));
  st.setProperty('--ink', toHex(ink));
  st.setProperty('--ink-2', toHex(mix(ink, white, .1)));
  st.setProperty('--ink-line', toHex(mix(ink, white, .2)));
  applyMeta(cfg);
}
/* Título, descrição, favicon e imagem de compartilhamento vindos da config.
   (O script scripts/gerar-meta.js grava os mesmos valores no index.html
   para quem não executa JavaScript, como o robô do WhatsApp/Instagram.) */
function setMeta(attr, key, val) {
  var m = document.head.querySelector('meta[' + attr + '="' + key + '"]');
  if (!m) { m = document.createElement('meta'); m.setAttribute(attr, key); document.head.appendChild(m); }
  m.setAttribute('content', val);
}
function applyMeta(cfg) {
  var s = cfg.seo, nome = cfg.loja.nome;
  var title = s.titulo || (nome ? nome + ' · Cardápio' : 'Cardápio'), desc = s.descricao || ('Faça seu pedido na ' + nome + ' pelo WhatsApp.');
  var abs = function (u) { return u && s.url && !/^(https?:|data:)/.test(u) ? s.url.replace(/\/$/, '') + '/' + u.replace(/^\//, '') : u; };
  document.title = title;
  setMeta('name', 'description', desc);
  setMeta('property', 'og:title', title); setMeta('property', 'og:description', desc);
  setMeta('property', 'og:type', 'website'); setMeta('property', 'og:site_name', nome);
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'theme-color', cfg.visual.corEscura);
  var img = abs(s.imagem || cfg.loja.logo); if (img) setMeta('property', 'og:image', img);
  var ic = s.favicon || cfg.loja.logo, link = document.head.querySelector('link[rel="icon"]');
  if (ic) { if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); } link.href = ic; }
}

/* ================= Pixel e Analytics ================= */
var TRACK = { fb: false, ga: false };
function loadTracking(cfg) {
  var r = cfg.rastreamento;
  if (r.metaPixel) {
    /* Código oficial do Meta Pixel */
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', String(r.metaPixel)); window.fbq('track', 'PageView'); TRACK.fb = true;
  }
  if (r.googleAnalytics) {
    var g = document.createElement('script'); g.async = true; g.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(r.googleAnalytics); document.head.appendChild(g);
    window.dataLayer = window.dataLayer || []; window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date()); window.gtag('config', String(r.googleAnalytics)); TRACK.ga = true;
  }
}
function track(ev, data) {
  if (previewMode) return;
  try {
    if (ev === 'add') {
      if (TRACK.fb) window.fbq('track', 'AddToCart', { content_ids: [data.id], content_name: data.nome, content_type: 'product', value: data.valor, currency: 'BRL' });
      if (TRACK.ga) window.gtag('event', 'add_to_cart', { currency: 'BRL', value: data.valor, items: [{ item_id: data.id, item_name: data.nome, quantity: data.qtd, price: data.unit }] });
    } else if (ev === 'pedido') {
      if (TRACK.fb) window.fbq('track', 'Purchase', { value: data.valor, currency: 'BRL', num_items: data.qtd, content_ids: data.ids, content_type: 'product' });
      if (TRACK.ga) window.gtag('event', 'purchase', { transaction_id: String(data.codigo), currency: 'BRL', value: data.valor, shipping: data.taxa, coupon: data.cupom || undefined, items: data.itens });
    }
  } catch (e) {}
}

/* ================= Horário de atendimento ================= */
var DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
var DIAS_NOME = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
function parseRanges(str) {
  return String(str || '').split(/[,;]|\be\b/).map(function (r) { return r.trim(); }).filter(Boolean).map(function (r) {
    var m = r.match(/(\d{1,2})(?:[:h](\d{2}))?\s*h?\s*(?:-|–|—|às|as|a|até)\s*(\d{1,2})(?:[:h](\d{2}))?/i);
    if (!m) return null;
    var a = (+m[1]) * 60 + (+(m[2] || 0)), b = (+m[3]) * 60 + (+(m[4] || 0));
    if (b <= a) b += 1440; // passa da meia-noite
    return { a: a, b: b };
  }).filter(Boolean);
}
function hm(min) { min = ((min % 1440) + 1440) % 1440; var h = Math.floor(min / 60), m = min % 60; return h + 'h' + (m ? String(m).padStart(2, '0') : ''); }
function dayText(d) { var r = parseRanges(CFG.loja.horarios[DIAS[d]]); return r.length ? r.map(function (x) { return hm(x.a) + ' às ' + hm(x.b); }).join(' e ') : 'Fechado'; }
function hasSchedule() { var h = CFG.loja.horarios; return DIAS.some(function (d) { return parseRanges(h[d]).length; }); }
/* Dia da semana e minutos do dia no horário de Brasília, seja qual for o fuso do celular */
var TZ = 'America/Sao_Paulo';
function brNow(now) {
  now = now || new Date();
  try {
    var parts = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now), o = {};
    parts.forEach(function (x) { o[x.type] = x.value; });
    return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday), mins: (+o.hour % 24) * 60 + (+o.minute) };
  } catch (e) { return { day: now.getDay(), mins: now.getHours() * 60 + now.getMinutes() }; }
}
function brDateTime(now) {
  now = now || new Date();
  try { return { data: now.toLocaleDateString('pt-BR', { timeZone: TZ }), hora: now.toLocaleTimeString('pt-BR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }) }; }
  catch (e) { return { data: now.toLocaleDateString('pt-BR'), hora: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }; }
}
/* Próxima abertura a partir de agora (texto "hoje às 18h", "amanhã às 18h"…) */
function nextOpening(d, mins, skipToday) {
  var r = parseRanges(CFG.loja.horarios[DIAS[d]]), i;
  if (!skipToday) for (i = 0; i < r.length; i++) if (r[i].a > mins) return 'hoje às ' + hm(r[i].a);
  for (var k = 1; k <= 7; k++) {
    var nd = (d + k) % 7, nr = parseRanges(CFG.loja.horarios[DIAS[nd]]);
    if (nr.length) return (k === 1 ? 'amanhã' : DIAS_NOME[nd].toLowerCase()) + ' às ' + hm(nr[0].a);
  }
  return '';
}
/* Retorna { open, title, sub, short } com o texto pronto para a tela */
function storeStatus(now) {
  var t = brNow(now);
  var s = CFG.loja, d = t.day, mins = t.mins;
  if (SIM === 'aberta') return { open: true, title: 'Aberto agora', sub: 'Simulação: loja aberta', short: 'Aberto agora' };
  if (SIM === 'fechada') { var sx = nextOpening(d, mins, false); return { open: false, title: 'Fechado agora', sub: 'Simulação: loja fechada' + (sx ? ' · Abrimos ' + sx : ''), short: 'Fechado agora' }; }
  var today = hasSchedule() ? 'Hoje: ' + dayText(d) : '';
  if (s.fechadoManual) { var nx = nextOpening(d, mins, true); return { open: false, title: 'Fechado agora', sub: 'Fechado temporariamente' + (nx ? ' · Abrimos ' + nx : ''), short: 'Fechado agora' }; }
  if (!hasSchedule()) return { open: true, title: 'Aberto agora', sub: 'Fazendo pedidos', short: 'Aberto agora' };
  var i, r, yest = parseRanges(s.horarios[DIAS[(d + 6) % 7]]);
  for (i = 0; i < yest.length; i++) if (yest[i].b > 1440 && mins < yest[i].b - 1440) return { open: true, title: 'Aberto agora', sub: 'Fecha às ' + hm(yest[i].b) + ' · ' + today, short: 'Aberto até ' + hm(yest[i].b) };
  r = parseRanges(s.horarios[DIAS[d]]);
  for (i = 0; i < r.length; i++) if (mins >= r[i].a && mins < r[i].b) return { open: true, title: 'Aberto agora', sub: 'Fecha às ' + hm(r[i].b) + ' · ' + today, short: 'Aberto até ' + hm(r[i].b) };
  var when = nextOpening(d, mins, false);
  if (when) return { open: false, title: 'Fechado agora', sub: 'Abrimos ' + when, short: 'Abre ' + when };
  return { open: false, title: 'Fechado agora', sub: 'Sem horário definido', short: 'Fechado' };
}
function paintStatus(el, st) {
  el.classList.toggle('closed', !st.open);
  el.querySelector('#status-title, .st-title').textContent = st.title;
  el.querySelector('#status-sub, .st-sub').textContent = st.sub;
}

/* ================= Cupons ================= */
var coupon = '';
function findCoupon(code) { code = String(code || '').trim().toUpperCase(); return CFG.cupons.filter(function (c) { return c.codigo.trim().toUpperCase() === code; })[0]; }
function couponLabel(c) { return c.tipo === 'frete' ? 'Frete grátis' : c.tipo === 'valor' ? fmt(c.valor) + ' de desconto' : String(c.valor).replace('.', ',') + '% de desconto'; }
/* Valida o cupom para o carrinho atual. Retorna { ok, c, desc, frete, msg } */
function evalCoupon(code, sub, mode) {
  var c = findCoupon(code);
  if (!c || !c.ativo) return { ok: false, msg: 'Cupom inválido ou inexistente.' };
  if (c.validade) { var v = new Date(c.validade + 'T23:59:59'); if (!isNaN(v) && new Date() > v) return { ok: false, c: c, msg: 'Este cupom expirou.' }; }
  if (c.minimo && sub < c.minimo) return { ok: false, c: c, msg: 'Válido para pedidos a partir de ' + fmt(c.minimo) + '. Faltam ' + fmt(c.minimo - sub) + '.' };
  if (c.tipo === 'frete') {
    if (mode !== 'entrega') return { ok: false, c: c, msg: 'Cupom de frete grátis vale só para entrega.' };
    return { ok: true, c: c, desc: 0, frete: true };
  }
  var desc = c.tipo === 'valor' ? c.valor : Math.round(sub * c.valor) / 100;
  return { ok: true, c: c, desc: Math.min(desc, sub), frete: false };
}
function totals() {
  var s = CFG.loja, mode = deliveryMode(), sub = cartSubtotal();
  var fee = mode === 'entrega' ? (Number(s.taxaEntrega) || 0) : 0;
  var cp = coupon ? evalCoupon(coupon, sub, mode) : null;
  var desc = cp && cp.ok ? cp.desc : 0, feeFinal = cp && cp.ok && cp.frete ? 0 : fee;
  return { mode: mode, sub: sub, fee: fee, feeFinal: feeFinal, cp: cp, desc: desc, total: Math.max(0, sub - desc) + feeFinal };
}

/* ================= Dados de apoio ================= */
function findProduct(id) { return CFG.produtos.filter(function (p) { return p.id === id; })[0]; }
function findCat(id) { return CFG.categorias.filter(function (c) { return c.id === id; })[0]; }
function findGroup(id) { return CFG.grupos.filter(function (g) { return g.id === id; })[0]; }
/* Produtos de categorias ocultas não aparecem no cardápio */
function visibleProducts() { return CFG.produtos.filter(function (p) { var c = findCat(p.categoria); return !(c && c.oculta); }); }
function photoInner(p) {
  if (p && p.fotos && p.fotos[0]) return '<img src="' + esc(p.fotos[0]) + '" alt="" loading="lazy">';
  var c = p && findCat(p.categoria);
  if (c && c.icone) return '<img class="icon" src="' + esc(c.icone) + '" alt="">';
  return '<span class="display">' + esc(initials(p && p.nome)) + '</span>';
}
function minPrice(p) { return p.tamanhos.length ? Math.min.apply(null, p.tamanhos.map(function (s) { return s.preco; })) : p.preco; }
/* ----- Combos: "tipo": "combo" + lista de itens. Preço cheio = soma dos itens ----- */
function isCombo(p) { return p && p.tipo === 'combo'; }
function comboItems(p) {
  return (p.itens || []).map(function (x) { var q = findProduct(x.produto); return q ? { p: q, qtd: x.qtd } : null; }).filter(Boolean);
}
function comboFull(p) { return comboItems(p).reduce(function (s, x) { return s + minPrice(x.p) * x.qtd; }, 0); }
function comboText(p) { return comboItems(p).map(function (x) { return x.qtd + 'x ' + x.p.nome; }).join(', '); }
function priceHtml(p) {
  var full = isCombo(p) ? comboFull(p) : 0;
  var pre = p.tamanhos.length > 1 ? '<small>a partir de</small>' : full > minPrice(p) ? '<small>de <s>' + fmt(full) + '</s></small>' : '';
  return '<span class="price">' + pre + fmt(minPrice(p)) + '</span>';
}
/* ----- Grupos da tela "Personalize": ponto da carne, adicionais e remoções ----- */
var PONTOS = ['Mal passado', 'Ao ponto', 'Bem passado'];
function groupsOf(p) {
  var g = [];
  if (p.pontoCarne) g.push({ tipo: 'ponto', titulo: 'Ponto da carne', min: 1, max: 1, opcoes: (Array.isArray(p.pontoCarne) ? p.pontoCarne : PONTOS).map(function (n) { return { nome: n, preco: 0 }; }) });
  (p.grupos || []).forEach(function (id) {
    var r = findGroup(id); if (!r || !r.opcoes.length) return;
    var max = r.tipo === 'unica' ? 1 : (parseInt(r.max, 10) || 0), min = r.obrigatorio ? Math.max(1, parseInt(r.min, 10) || 1) : 0;
    if (max && min > max) min = max;
    g.push({ tipo: 'add', titulo: r.nome, min: min, max: max, opcoes: r.opcoes });
  });
  p.adicionais.forEach(function (a) { if (a.opcoes.length) g.push(Object.assign({ tipo: 'add' }, a)); });
  if (p.remover.length) g.push({ tipo: 'rem', titulo: 'Retirar ingredientes', min: 0, max: 0, opcoes: p.remover.map(function (n) { return { nome: n, preco: 0 }; }) });
  return g;
}
function missingGroups(p) {
  return groupsOf(p).map(function (g, gi) { return (sel.addons[gi] || []).length < (g.min || 0) ? gi : -1; }).filter(function (x) { return x > -1; });
}

/* ================= Carrinho ================= */
var cart = [], cartKey = '';
function loadCart() { cartKey = 'carrinho_' + CFG.id + (previewMode || PREVIEW ? '_previa' : ''); cart = LS.get(cartKey) || []; coupon = LS.get('cupom_' + CFG.id) || ''; }
function saveCart() { LS.set(cartKey, cart); }
function cartCount() { return cart.reduce(function (s, i) { return s + i.qty; }, 0); }
function cartSubtotal() { return cart.reduce(function (s, i) { return s + i.unit * i.qty; }, 0); }
var cust = Object.assign({ name: '', street: '', number: '', district: '', ref: '', mode: '', pay: '', change: '', obs: '' }, LS.get('cliente') || {});

/* ================= Navegação ================= */
var depth = 0, homeScroll = 0, lastView = '';
function go(h) { depth++; location.hash = h; }
function back() { if (depth > 0) { depth--; history.back(); } else { history.replaceState(null, '', '#/'); route(); } }
function show(id) {
  ['home', 'detail', 'cart', 'done'].forEach(function (s) { $('#' + s).hidden = s !== id; });
  $('#app').hidden = false; $('#admin').innerHTML = '';
}
function previewBar() {
  var old = $('.pvbar'); if (old) old.remove();
  if (!previewMode) return;
  var b = document.createElement('div'); b.className = 'pvbar';
  b.innerHTML = '<span>Prévia do rascunho — clientes ainda não veem isso</span><a href="#admin">Voltar ao painel</a>';
  $('#app').prepend(b);
}
function route() {
  var h = location.hash || '';
  if (lastView === 'home') homeScroll = window.scrollY;
  closeSheets();
  if (h.indexOf('#admin') === 0) { lastView = 'admin'; $('#app').hidden = true; renderAdmin(); return; }
  CFG = previewMode ? getDraft() : PUBLISHED;
  applyTheme(CFG); loadCart(); previewBar();
  if (h.indexOf('#/p/') === 0) { lastView = 'detail'; show('detail'); renderDetail(decodeURIComponent(h.slice(4))); window.scrollTo(0, 0); return; }
  if (h === '#/carrinho') { lastView = 'cart'; show('cart'); renderCart(); window.scrollTo(0, 0); return; }
  if (h === '#/enviado') { lastView = 'done'; show('done'); renderDone(); window.scrollTo(0, 0); return; }
  var wasOther = lastView !== 'home'; lastView = 'home';
  show('home'); renderHome();
  if (wasOther) window.scrollTo(0, homeScroll);
}
window.addEventListener('hashchange', route);
document.addEventListener('click', function (e) {
  var a = e.target.closest('a[href^="#/"]');
  if (a && !a.target && !e.target.closest('#admin')) { e.preventDefault(); go(a.getAttribute('href')); return; }
  if (e.target.closest('[data-back]')) back();
});

/* ================= Início ================= */
var q = '', curCat = 'all';
function renderHome() {
  depth = 0;
  var s = CFG.loja, n = cartCount();
  $('#logo').innerHTML = s.logo ? '<img src="' + esc(s.logo) + '" alt="' + esc(s.nome) + '">' : esc(initials(s.nome));
  $('#store-name').textContent = s.nome;
  var st = storeStatus();
  $('#status-dot').classList.toggle('off', !st.open);
  $('#status-label').textContent = st.short;
  paintStatus($('#status-card'), st);
  $('#cart-count').hidden = !n; $('#cart-count').textContent = n;
  $('#cartbar').hidden = !n; $('#cartbar-count').textContent = n; $('#cartbar-total').textContent = fmt(cartSubtotal());
  renderRepeat();
  var b = CFG.banner, bp = b.produto && findProduct(b.produto);
  var bimg = b.imagem || (bp && bp.fotos[0]) || '';
  $('#promo').hidden = !(CFG.visual.mostrarBanner && (b.titulo || bimg));
  $('#promo-tag').textContent = b.chamada; $('#promo-tag').hidden = !b.chamada;
  $('#promo-title').textContent = b.titulo;
  $('#promo-btn').textContent = b.botao; $('#promo-btn').hidden = !b.botao;
  $('#promo-img').hidden = !bimg; if (bimg) $('#promo-img').src = bimg;
  $('#promo-img').classList.toggle('round', !b.imagem && !!bimg);
  // arte pronta (imagem própria sem título nem chamada): mostra a imagem inteira, sem texto por cima
  $('#promo').classList.toggle('full', !!b.imagem && !b.titulo && !b.chamada);
  $('#q').value = q;
  renderCats(); renderList();
}
function renderCats() {
  var cats = CFG.categorias.filter(function (c) { return !c.oculta; });
  $('#cats-h').hidden = !cats.length; $('#cats').hidden = !cats.length;
  $('#cats').innerHTML = cats.map(function (c) {
    return '<button type="button" class="cat ' + (curCat === c.id ? 'on' : '') + '" data-cat="' + esc(c.id) + '"><span class="cat-ic">' +
      (c.icone ? '<img src="' + esc(c.icone) + '" alt="">' : '<span class="display">' + esc(initials(c.nome)) + '</span>') + '</span><span>' + esc(c.nome) + '</span></button>';
  }).join('') + '<button type="button" class="cat ' + (curCat === 'all' ? 'on' : '') + '" data-cat="all"><span class="cat-ic"><span class="grid4"><i></i><i></i><i></i><i></i></span></span><span>Todos</span></button>';
}
function cardHtml(p) {
  var c = findCat(p.categoria);
  var badge = p.disponivel ? (isCombo(p) ? '<span class="badge">Combo</span>' : c ? '<span class="badge">' + esc(c.nome) + '</span>' : '<span></span>') : '<span class="badge out">Esgotado</span>';
  return '<div class="card ' + (p.disponivel ? '' : 'off') + '" ' + (p.disponivel ? 'data-open="' + esc(p.id) + '" role="button" tabindex="0"' : '') + '>' +
    '<div class="card-photo">' + photoInner(p) + '</div><div class="card-body"><div class="card-top">' + badge +
    (p.nota ? '<span class="rate">' + icon('star', 13) + String(p.nota).replace('.', ',') + '</span>' : '') + '</div>' +
    '<p class="card-name">' + esc(p.nome) + '</p>' +
    '<div class="card-foot">' + priceHtml(p) + (p.disponivel ? '<span class="plus" aria-hidden="true">' + icon('plus', 16, 1.6) + '</span>' : '') + '</div></div></div>';
}
function renderList() {
  var prods = visibleProducts(), term = q.trim().toLowerCase(), h = '';
  var filtering = term || curCat !== 'all';
  $('#see-all').hidden = !!filtering;
  if (filtering) {
    var list = prods.filter(function (p) {
      return (curCat === 'all' || p.categoria === curCat) && (!term || (p.nome + ' ' + p.descricao).toLowerCase().indexOf(term) > -1);
    });
    $('#list-title').textContent = term ? 'Resultados' : ((findCat(curCat) || {}).nome || '');
    h = list.length ? list.map(cardHtml).join('') : '<div class="empty"><p class="empty-t">Nada encontrado</p><p>Tente outro nome ou categoria.</p></div>';
  } else {
    var feat = prods.filter(function (p) { return p.destaque; });
    $('#list-title').textContent = feat.length ? 'Mais pedidos' : 'Cardápio';
    h = feat.map(cardHtml).join('');
    var shown = {};
    CFG.categorias.forEach(function (c) {
      var l = prods.filter(function (p) { return p.categoria === c.id && !p.destaque; });
      if (!l.length) return;
      h += '<h3 class="cat-title">' + esc(c.nome) + '</h3>' + l.map(cardHtml).join('');
      l.forEach(function (p) { shown[p.id] = 1; });
    });
    var rest = prods.filter(function (p) { return !p.destaque && !shown[p.id]; });
    if (rest.length) h += '<h3 class="cat-title">Outros</h3>' + rest.map(cardHtml).join('');
    if (!prods.length) h = '<div class="empty"><p class="empty-t">Cardápio vazio</p><p>Nenhum produto cadastrado ainda.</p></div>';
  }
  $('#list').classList.toggle('grade', CFG.visual.layout === 'grade');
  $('#list').innerHTML = h;
}
$('#q').addEventListener('input', function (e) { q = e.target.value; renderList(); });
$('#cats').addEventListener('click', function (e) { var b = e.target.closest('[data-cat]'); if (!b) return; curCat = (curCat === b.dataset.cat) ? 'all' : b.dataset.cat; renderCats(); renderList(); });
$('#see-all-cats').addEventListener('click', function () { curCat = 'all'; q = ''; $('#q').value = ''; renderCats(); renderList(); });
$('#see-all').addEventListener('click', function () { var t = $('.cat-title'); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
$('#btn-filter').addEventListener('click', function () { $('#cats-h').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
$('#list').addEventListener('click', function (e) { var c = e.target.closest('[data-open]'); if (c) go('#/p/' + encodeURIComponent(c.dataset.open)); });
$('#list').addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-open]')) { e.preventDefault(); e.target.click(); } });
$('#promo').addEventListener('click', function () {
  var bp = CFG.banner.produto && findProduct(CFG.banner.produto);
  if (bp && bp.disponivel) go('#/p/' + encodeURIComponent(bp.id)); else { var t = $('#list'); t.scrollIntoView({ behavior: 'smooth' }); }
});
$('#status-card').addEventListener('click', function () { renderInfo(); openSheet('#info'); });
setInterval(function () { if (!$('#home').hidden && !$('#app').hidden) { var st = storeStatus(); paintStatus($('#status-card'), st); $('#status-label').textContent = st.short; $('#status-dot').classList.toggle('off', !st.open); } }, 60000);

/* ================= Repetir último pedido ================= */
function lastOrder() { var o = LS.get('ultimo_' + CFG.id); return o && o.itens && o.itens.length ? o : null; }
function renderRepeat() {
  var o = lastOrder(); $('#repeat').hidden = !o; if (!o) return;
  $('#repeat-items').textContent = o.itens.map(function (i) { return i.qty + 'x ' + i.nome; }).join(', ');
  var d = new Date(o.at), n = o.itens.reduce(function (s, i) { return s + i.qty; }, 0);
  $('#repeat-meta').textContent = n + (n === 1 ? ' item' : ' itens') + ' · ' + fmt(o.total) + ' · ' + d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}
/* Recoloca o último pedido na sacola com os preços e a disponibilidade de HOJE */
function repeatOrder() {
  var o = lastOrder(); if (!o) return;
  var added = 0, missing = [];
  o.itens.forEach(function (it) {
    var p = findProduct(it.pid);
    if (!p || !p.disponivel) { missing.push(it.nome); return; }
    var size = null;
    if (p.tamanhos.length) { size = p.tamanhos.filter(function (t) { return t.nome === it.tamanho; })[0]; if (!size) { missing.push(it.nome); return; } }
    var addons = [], groups = groupsOf(p);
    (it.addons || []).forEach(function (nome) {
      p.adicionais.some(function (g) { var op = g.opcoes.filter(function (x) { return x.nome === nome; })[0]; if (op) { addons.push({ nome: op.nome, preco: op.preco }); return true; } });
    });
    var ponto = '', pg = groups.filter(function (g) { return g.tipo === 'ponto'; })[0];
    if (pg) { ponto = pg.opcoes.some(function (o) { return o.nome === it.ponto; }) ? it.ponto : ''; if (!ponto) { missing.push(it.nome); return; } }
    var rem = (it.rem || []).filter(function (n) { return p.remover.indexOf(n) > -1; });
    var unit = (size ? size.preco : p.preco) + addons.reduce(function (s, a) { return s + a.preco; }, 0);
    var item = makeItem(p, size, ponto, addons, rem, it.obs || '', unit, it.qty);
    var ex = cart.filter(function (c) { return c.key === item.key; })[0];
    if (ex) ex.qty += it.qty; else cart.push(item);
    added += it.qty;
  });
  if (o.mode) cust.mode = o.mode; if (o.pay) cust.pay = o.pay;
  saveCart();
  if (!added) { toast('Os itens do último pedido não estão disponíveis hoje.'); return; }
  toast(missing.length ? 'Pedido repetido. Fora do cardápio hoje: ' + missing.join(', ') : 'Pedido repetido! Confira e envie.');
  go('#/carrinho');
}
$('#btn-repeat').addEventListener('click', repeatOrder);

/* ================= Detalhes ================= */
var sel = null;
function curProduct() { return sel && findProduct(sel.pid); }
function unitPrice(p) {
  var base = sel.size >= 0 && p.tamanhos[sel.size] ? p.tamanhos[sel.size].preco : p.preco;
  groupsOf(p).forEach(function (g, gi) { (sel.addons[gi] || []).forEach(function (oi) { if (g.opcoes[oi]) base += g.opcoes[oi].preco || 0; }); });
  return base;
}
/* Item da sacola. A chave junta tudo que torna dois itens diferentes */
function makeItem(p, size, ponto, addons, rem, obs, unit, qty) {
  return {
    key: [p.id, size ? size.nome : '', ponto, addons.map(function (a) { return a.nome; }).join('+'), rem.join('+'), obs].join('|'),
    pid: p.id, nome: p.nome, combo: isCombo(p) ? comboText(p) : '', tamanho: size ? size.nome : '',
    ponto: ponto, addons: addons, rem: rem, obs: obs, unit: unit, qty: qty
  };
}
function renderDetail(id) {
  var p = findProduct(id);
  if (!p || !p.disponivel) { toast('Produto indisponível'); history.replaceState(null, '', '#/'); return route(); }
  if (!sel || sel.pid !== id) {
    var mid = p.tamanhos.length ? Math.floor((p.tamanhos.length - 1) / 2) : -1;
    sel = { pid: id, qty: 1, size: mid, addons: {}, obs: '' };
  }
  $('#d-name').textContent = p.nome;
  $('#qty-val').textContent = sel.qty;
  var fotos = p.fotos.length ? p.fotos : [null];
  $('#carousel').innerHTML = fotos.map(function (f) {
    return '<div class="plate">' + (f ? '<img src="' + esc(f) + '" alt="' + esc(p.nome) + '">' : photoInner(p)) + '</div>';
  }).join('');
  var start = fotos.length >= 3 ? 1 : 0;
  $('#dots').innerHTML = fotos.length > 1 ? fotos.map(function (f, i) { return '<i class="' + (i === start ? 'on' : '') + '"></i>'; }).join('') : '';
  $('#carousel').scrollLeft = start * 268;
  requestAnimationFrame(function () { $('#carousel').scrollLeft = start * 268; });
  $('#d-desc').textContent = p.descricao; $('#d-desc').hidden = !p.descricao;
  var combo = isCombo(p) ? comboText(p) : '', full = combo ? comboFull(p) : 0;
  $('#d-combo').hidden = !combo;
  $('#d-combo').innerHTML = combo ? '<b>Inclui:</b> ' + esc(combo) + (full > p.preco ? '<br>De <s>' + fmt(full) + '</s> por <b>' + fmt(p.preco) + '</b> · economize ' + fmt(full - p.preco) : '') : '';
  $('#d-desc').previousElementSibling.hidden = !p.descricao && !combo;
  $('#size-row').hidden = !p.tamanhos.length;
  renderSizes(p);
  $('#obs').value = sel.obs;
  updateDetailPrice();
}
function renderSizes(p) {
  $('#sizes').innerHTML = p.tamanhos.map(function (s, i) {
    return '<button type="button" class="pill ' + (sel.size === i ? 'on' : '') + '" data-size="' + i + '" aria-pressed="' + (sel.size === i) + '">' + esc(s.nome) + '</button>';
  }).join('');
}
function updateDetailPrice() { var p = curProduct(); if (p) $('#d-price').textContent = fmt(unitPrice(p) * sel.qty); }
$('#carousel').addEventListener('scroll', function () {
  var c = $('#carousel'), i = Math.round(c.scrollLeft / 268);
  $$('#dots i').forEach(function (d, k) { d.classList.toggle('on', k === i); });
});
$('#qty-minus').addEventListener('click', function () { sel.qty = Math.max(1, sel.qty - 1); $('#qty-val').textContent = sel.qty; updateDetailPrice(); });
$('#qty-plus').addEventListener('click', function () { sel.qty = Math.min(99, sel.qty + 1); $('#qty-val').textContent = sel.qty; updateDetailPrice(); });
$('#sizes').addEventListener('click', function (e) { var b = e.target.closest('[data-size]'); if (!b) return; sel.size = Number(b.dataset.size); renderSizes(curProduct()); updateDetailPrice(); });
$('#obs').addEventListener('input', function (e) { sel.obs = e.target.value; });
$('#btn-share').addEventListener('click', function () {
  var p = curProduct(), url = location.href;
  if (navigator.share) { navigator.share({ title: p ? p.nome : document.title, url: url }).catch(function () {}); return; }
  try { navigator.clipboard.writeText(url).then(function () { toast('Link do produto copiado'); }); } catch (e) { toast(url); }
});
$('#btn-add').addEventListener('click', function () {
  var p = curProduct(); if (!p) return;
  if (groupsOf(p).length) { renderCustom(); openSheet('#custom'); $('#detail').classList.add('blurred'); }
  else addToCart();
});

/* ----- Folha "Personalize seu pedido" ----- */
function renderCustom() {
  var p = curProduct(), miss = missingGroups(p);
  $('#c-name').textContent = p.nome;
  var img = p.fotos[0]; $('#c-img').hidden = !img; if (img) $('#c-img').src = img;
  $('#c-groups').innerHTML = groupsOf(p).map(function (g, gi) {
    var chosen = sel.addons[gi] || [], falta = miss.indexOf(gi) > -1;
    var hint = g.min ? '<span class="req' + (falta ? '' : ' ok') + '">' + (falta ? 'Obrigatório' : '✓ Escolhido') + '</span>' : '<span class="hint">' + (g.tipo === 'rem' ? 'Toque para tirar' : g.max ? (g.max === 1 ? 'Escolha 1' : 'Até ' + g.max) : 'Opcional') + '</span>';
    return '<div class="group-h ' + (gi ? 'wide' : '') + '" id="g' + gi + '"><h3 class="h3">' + esc(g.titulo) + '</h3>' + hint + '</div>' +
      (falta ? '<p class="g-warn" role="alert">Escolha ' + (g.min > 1 ? g.min + ' opções' : 'uma opção') + ' para continuar</p>' : '') +
      '<div class="pills ' + (gi === 0 ? 'col' : '') + '">' + g.opcoes.map(function (o, oi) {
        var on = chosen.indexOf(oi) > -1;
        return '<button type="button" class="pill ' + (on ? 'on' : '') + (g.tipo === 'rem' ? ' rm' : '') + '" data-g="' + gi + '" data-o="' + oi + '" aria-pressed="' + on + '">' + (g.tipo === 'rem' ? 'Sem ' + esc(o.nome.toLowerCase()) : esc(o.nome)) + (o.preco ? ' <span class="add">• +' + fmt(o.preco) + '</span>' : '') + '</button>';
      }).join('') + '</div>';
  }).join('');
  $('#c-price').textContent = fmt(unitPrice(p) * sel.qty);
  $('#btn-continue').disabled = miss.length > 0;
  $('#btn-continue').title = miss.length ? 'Escolha as opções obrigatórias' : '';
}
$('#c-groups').addEventListener('click', function (e) {
  var b = e.target.closest('[data-g]'); if (!b) return;
  var p = curProduct(), gi = Number(b.dataset.g), oi = Number(b.dataset.o), g = groupsOf(p)[gi];
  var cur = (sel.addons[gi] || []).slice(), at = cur.indexOf(oi);
  if (at > -1) cur.splice(at, 1);
  else if (g.max === 1) cur = [oi];
  else if (g.max && cur.length >= g.max) { toast('Máximo de ' + g.max + ' opções em "' + g.titulo + '"'); return; }
  else cur.push(oi);
  sel.addons[gi] = cur; renderCustom(); updateDetailPrice();
});
$('#btn-continue').addEventListener('click', addToCart);

function addToCart() {
  var p = curProduct(); if (!p) return;
  var groups = groupsOf(p), miss = missingGroups(p);
  if (miss.length) { renderCustom(); var el = $('#g' + miss[0]); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
  var size = sel.size >= 0 ? p.tamanhos[sel.size] : null, addons = [], rem = [], ponto = '';
  groups.forEach(function (g, gi) {
    (sel.addons[gi] || []).slice().sort(function (a, b) { return a - b; }).forEach(function (oi) {
      var o = g.opcoes[oi]; if (!o) return;
      if (g.tipo === 'ponto') ponto = o.nome; else if (g.tipo === 'rem') rem.push(o.nome); else addons.push({ nome: o.nome, preco: o.preco });
    });
  });
  var unit = unitPrice(p), item = makeItem(p, size, ponto, addons, rem, sel.obs.trim(), unit, sel.qty);
  var ex = cart.filter(function (i) { return i.key === item.key; })[0];
  if (ex) ex.qty += sel.qty; else cart.push(item);
  track('add', { id: p.id, nome: p.nome, unit: unit, qtd: sel.qty, valor: Math.round(unit * sel.qty * 100) / 100 });
  saveCart(); sel = null; closeSheets(); toast('Adicionado ao carrinho'); back();
}

/* ----- Folhas ----- */
function openSheet(sel) { $(sel).hidden = false; document.body.style.overflow = 'hidden'; }
function closeSheets() { $$('.backdrop').forEach(function (b) { b.hidden = true; }); $('#detail').classList.remove('blurred'); document.body.style.overflow = ''; }
$$('.backdrop').forEach(function (b) { b.addEventListener('click', function (e) { if (e.target === b || e.target.closest('[data-close]')) closeSheets(); }); });
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (ed) closeEditor(); else closeSheets(); } });
function renderInfo() {
  var s = CFG.loja, rows = [];
  var st = storeStatus(), today = brNow().day, box = $('#info-status');
  box.innerHTML = '<span class="status-txt"><span class="status-title"><span class="pulse" aria-hidden="true"></span><span class="st-title"></span></span><span class="status-sub st-sub"></span></span>';
  paintStatus(box, st);
  $('#week').innerHTML = hasSchedule() ? [1, 2, 3, 4, 5, 6, 0].map(function (d) {
    var t = dayText(d);
    return '<li class="' + (d === today ? 'today ' : '') + (t === 'Fechado' ? 'off' : '') + '"><span>' + DIAS_NOME[d] + (d === today ? ' (hoje)' : '') + '</span><span>' + esc(t) + '</span></li>';
  }).join('') : '<li><span>' + (st.open ? 'Recebendo pedidos agora' : 'Fechado no momento') + '</span><span></span></li>';
  if (s.endereco) rows.push(['Endereço', s.endereco]);
  if (s.instagram) rows.push(['Instagram', '@' + String(s.instagram).replace(/^@/, '')]);
  if (s.entrega) rows.push(['Entrega', (s.taxaEntrega ? fmt(s.taxaEntrega) : 'Grátis') + (s.tempoEntrega ? ' · ' + s.tempoEntrega : '')]);
  if (s.retirada) rows.push(['Retirada', 'Pode retirar no local' + (s.tempoRetirada ? ' · ' + s.tempoRetirada : '')]);
  if (s.pedidoMinimo) rows.push(['Pedido mínimo', fmt(s.pedidoMinimo)]);
  if (s.pagamentos.length) rows.push(['Pagamento', s.pagamentos.join(', ')]);
  $('#info-list').innerHTML = rows.map(function (r) { return '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>'; }).join('');
}

/* ================= Carrinho ================= */
function deliveryMode() {
  var s = CFG.loja;
  if (s.entrega && s.retirada) return cust.mode === 'retirada' ? 'retirada' : 'entrega';
  return s.retirada && !s.entrega ? 'retirada' : 'entrega';
}
function isCash(p) { return /dinheiro/i.test(p || ''); }
/* Troco: máscara em reais (digita só números, os 2 últimos são centavos) */
function changeValue() { return Number(String(cust.change || '').replace(/\D/g, '')) / 100; }
function maskMoney(v) { var n = String(v || '').replace(/\D/g, '').replace(/^0+/, ''); return n ? fmt(Number(n) / 100) : ''; }
/* Retorna '' se o troco estiver ok, ou a mensagem de erro */
function changeError(total) {
  if (!isCash(cust.pay)) return '';
  var v = changeValue();
  if (v && v < total) return 'O valor para troco (' + fmt(v) + ') é menor que o total do pedido (' + fmt(total) + ').';
  return '';
}
function itemDetails(it) {
  return [it.tamanho, it.ponto, it.addons.map(function (a) { return a.nome; }).join(', '), (it.rem || []).map(function (r) { return 'sem ' + r.toLowerCase(); }).join(', ')].filter(Boolean).join(' · ');
}
function renderCart() {
  var s = CFG.loja, empty = !cart.length;
  $('#cart-empty').hidden = !empty; $('#cart-full').hidden = empty; $('#cart-bottom').hidden = empty; $('#btn-clear').hidden = empty;
  if (empty) return;
  $('#cart-items').innerHTML = cart.map(function (it, idx) {
    var p = findProduct(it.pid) || { nome: it.nome, fotos: [], categoria: '' };
    var det = itemDetails(it);
    return '<div class="citem"><div class="card-photo">' + photoInner(p) + '</div><div class="citem-main"><p class="citem-name">' + esc(it.nome) + '</p>' +
      (det ? '<p class="citem-det">' + esc(det) + '</p>' : '') + (it.obs ? '<p class="citem-det">Obs.: ' + esc(it.obs) + '</p>' : '') +
      '<div class="citem-row"><b>' + fmt(it.unit * it.qty) + '</b><div class="qty light"><button type="button" data-cq="' + idx + '" data-d="-1" aria-label="Menos">' + icon(it.qty > 1 ? 'minus' : 'trash', 16) + '</button><b>' + it.qty + '</b><button type="button" data-cq="' + idx + '" data-d="1" aria-label="Mais">' + icon('plus', 16) + '</button></div></div></div></div>';
  }).join('');
  if (s.pagamentos.indexOf(cust.pay) < 0) cust.pay = s.pagamentos.length === 1 ? s.pagamentos[0] : '';
  $$('#cart [data-c]').forEach(function (el) { el.value = el.dataset.c === 'change' ? maskMoney(cust.change) : (cust[el.dataset.c] || ''); });
  var mode = deliveryMode();
  $('#mode-wrap').hidden = !(s.entrega && s.retirada);
  $$('[data-mode]').forEach(function (b) { b.classList.toggle('on', b.dataset.mode === mode); });
  $('#addr-wrap').hidden = mode !== 'entrega';
  $('#pickup-wrap').hidden = mode !== 'retirada' || !s.endereco; $('#pickup-addr').textContent = s.endereco;
  $('#pay-wrap').hidden = !s.pagamentos.length;
  $('#pays').innerHTML = s.pagamentos.map(function (pm) { return '<button type="button" class="pill ' + (cust.pay === pm ? 'on' : '') + '" data-pay="' + esc(pm) + '">' + esc(pm) + '</button>'; }).join('');
  $('#f-change').hidden = !isCash(cust.pay);
  var T = totals(), sub = T.sub;
  renderCoupon(T);
  $('#s-sub').textContent = fmt(sub); $('#s-fee-row').hidden = mode !== 'entrega';
  $('#s-fee').textContent = T.feeFinal ? fmt(T.feeFinal) : (T.fee && T.cp && T.cp.frete ? 'Grátis (cupom)' : 'Grátis');
  $('#s-coupon-row').hidden = !(T.cp && T.cp.ok && T.desc);
  if (T.cp && T.cp.ok) { $('#s-coupon-lbl').textContent = 'Cupom ' + T.cp.c.codigo.toUpperCase(); $('#s-coupon').textContent = '− ' + fmt(T.desc); }
  $('#s-total').textContent = fmt(T.total); $('#c-total').textContent = fmt(T.total);
  var short = s.pedidoMinimo && sub < s.pedidoMinimo;
  $('#min-alert').hidden = !short; $('#min-alert').className = 'alert warn mt';
  $('#min-alert').textContent = short ? 'Pedido mínimo de ' + fmt(s.pedidoMinimo) + '. Faltam ' + fmt(s.pedidoMinimo - sub) + '.' : '';
  renderChangeMsg(T.total);
  var st = storeStatus();
  $('#closed-alert-2').hidden = st.open;
  $('#closed-alert-2').textContent = 'Estamos fechados agora (' + st.sub.replace(/^Fechado temporariamente · /, '') + '). Você pode enviar mesmo assim: o pedido chega como PEDIDO AGENDADO.';
  $('#btn-send-txt').textContent = st.open ? 'Enviar no WhatsApp' : 'Agendar no WhatsApp';
  $('#btn-send').disabled = !!short;
}
function renderChangeMsg(total) {
  var err = changeError(total), m = $('#change-msg'), v = changeValue();
  m.hidden = !isCash(cust.pay) || (!err && !v);
  m.className = 'coupon-msg' + (err ? '' : ' ok');
  m.textContent = err || (v ? 'Troco: ' + fmt(v - total) : '');
  $('#f-change').classList.toggle('bad', !!err);
}
$('#f-change').addEventListener('input', function (e) {
  var digits = e.target.value.replace(/\D/g, '').slice(0, 9);
  cust.change = digits; e.target.value = maskMoney(digits);
  renderChangeMsg(totals().total);
});
$('#cart-items').addEventListener('click', function (e) {
  var b = e.target.closest('[data-cq]'); if (!b) return;
  var i = Number(b.dataset.cq), it = cart[i]; it.qty += Number(b.dataset.d); if (it.qty <= 0) cart.splice(i, 1);
  saveCart(); renderCart();
});
$('#btn-clear').addEventListener('click', function () { if (confirm('Limpar todo o carrinho?')) { cart = []; saveCart(); renderCart(); } });
$$('[data-mode]').forEach(function (b) { b.addEventListener('click', function () { cust.mode = b.dataset.mode; renderCart(); }); });
$('#pays').addEventListener('click', function (e) { var b = e.target.closest('[data-pay]'); if (b) { cust.pay = b.dataset.pay; renderCart(); } });
$('#cart').addEventListener('input', function (e) { var k = e.target.dataset && e.target.dataset.c; if (k && k !== 'change') cust[k] = e.target.value; });
function renderCoupon(T) {
  var has = CFG.cupons.some(function (c) { return c.ativo; });
  $('#coupon-wrap').hidden = !has && !coupon;
  var applied = !!coupon && T.cp && T.cp.ok;
  $('#coupon-form').hidden = !!coupon; $('#coupon-on').hidden = !coupon;
  if (coupon) {
    $('#coupon-code').textContent = coupon.toUpperCase();
    $('#coupon-desc').textContent = applied ? (T.cp.frete ? 'Frete grátis aplicado' : couponLabel(T.cp.c) + ' · você economiza ' + fmt(T.desc)) : 'Não aplicado';
    $('#coupon-on').classList.toggle('pending', !applied);
  }
  var msg = $('#coupon-msg');
  if (coupon && !applied && T.cp) { msg.hidden = false; msg.className = 'coupon-msg'; msg.textContent = T.cp.msg; }
  else if (!coupon && msg.dataset.err) { msg.hidden = false; msg.className = 'coupon-msg'; msg.textContent = msg.dataset.err; }
  else msg.hidden = true;
}
function applyCoupon() {
  var code = $('#f-coupon').value.trim(), msg = $('#coupon-msg');
  if (!code) { msg.dataset.err = 'Digite o código do cupom.'; renderCart(); return; }
  var r = evalCoupon(code, cartSubtotal(), deliveryMode());
  if (!r.c && !r.ok) { msg.dataset.err = r.msg; renderCart(); $('#f-coupon').focus(); return; }
  msg.dataset.err = ''; coupon = r.c.codigo; LS.set('cupom_' + CFG.id, coupon); $('#f-coupon').value = '';
  renderCart();
  toast(r.ok ? 'Cupom aplicado!' : 'Cupom guardado: ' + r.msg);
}
$('#btn-coupon').addEventListener('click', applyCoupon);
$('#f-coupon').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); } });
$('#f-coupon').addEventListener('input', function () { var m = $('#coupon-msg'); m.dataset.err = ''; m.hidden = true; });
$('#btn-coupon-rm').addEventListener('click', function () { coupon = ''; LS.del('cupom_' + CFG.id); renderCart(); });

function waNumber(n) { n = String(n || '').replace(/\D/g, ''); if (n.length === 10 || n.length === 11) n = '55' + n; return n; }
/* Mensagem do pedido, nesta ordem: cabeçalho, cliente, itens, entrega/retirada,
   pagamento e valores. "now" e "code" podem ser passados para testes. */
function buildMessage(now, code) {
  var s = CFG.loja, T = totals(), mode = T.mode, st = storeStatus(now), dt = brDateTime(now), L = [];
  code = code || Math.floor(1000 + Math.random() * 9000);
  if (!st.open) L.push('*PEDIDO AGENDADO*', 'A loja está fechada agora. ' + st.sub.replace(/^Fechado temporariamente · /, '') + '.', '');
  L.push('*' + s.nome + '* · Pedido #' + code, 'Data: ' + dt.data + ' às ' + dt.hora);
  L.push('', '*Cliente*', cust.name.trim());
  L.push('', '*Itens*');
  cart.forEach(function (i) {
    L.push(i.qty + 'x *' + i.nome + '*' + (i.tamanho ? ' (' + i.tamanho + ')' : '') + ' — ' + fmt(i.unit * i.qty));
    if (i.combo) L.push('   Inclui: ' + i.combo);
    if (i.ponto) L.push('   Ponto da carne: ' + i.ponto);
    i.addons.forEach(function (a) { L.push('   + ' + a.nome + (a.preco ? ' (' + fmt(a.preco) + ')' : '')); });
    (i.rem || []).forEach(function (r) { L.push('   - Sem ' + r.toLowerCase()); });
    if (i.obs) L.push('   Obs.: ' + i.obs);
  });
  if (cust.obs.trim()) L.push('', 'Obs. do pedido: ' + cust.obs.trim());
  if (mode === 'entrega') {
    L.push('', '*Entrega*', cust.street.trim() + ', ' + cust.number.trim() + ' — ' + cust.district.trim());
    if (cust.ref.trim()) L.push('Complemento: ' + cust.ref.trim());
    if (s.tempoEntrega) L.push('Previsão: ' + s.tempoEntrega);
  } else {
    L.push('', '*Retirada no local*');
    if (s.endereco) L.push(s.endereco);
    if (s.tempoRetirada) L.push('Pronto em: ' + s.tempoRetirada);
  }
  if (cust.pay) {
    L.push('', '*Pagamento*', cust.pay);
    if (isCash(cust.pay)) { var v = changeValue(); L.push(v ? 'Troco para ' + fmt(v) + ' (levar ' + fmt(v - T.total) + ' de troco)' : 'Não precisa de troco'); }
  }
  L.push('', '*Valores*', 'Subtotal: ' + fmt(T.sub));
  if (T.cp && T.cp.ok) L.push('Cupom ' + T.cp.c.codigo.toUpperCase() + ': ' + (T.cp.frete ? 'frete grátis' : '− ' + fmt(T.desc)));
  if (mode === 'entrega') L.push('Taxa de entrega: ' + (T.feeFinal ? fmt(T.feeFinal) : 'Grátis'));
  L.push('*Total: ' + fmt(T.total) + '*');
  return { code: code, text: L.join('\n') };
}
window.__montarMensagem = function (now, code) { return buildMessage(now, code).text; }; // usado nos testes
function focusField(k, msg) { toast(msg); var el = $('#cart [data-c="' + k + '"]'); if (el) { el.focus(); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }
$('#btn-send').addEventListener('click', function () {
  var s = CFG.loja, mode = deliveryMode();
  if (!cust.name.trim()) return focusField('name', 'Informe seu nome');
  if (mode === 'entrega') {
    if (!cust.street.trim()) return focusField('street', 'Informe a rua');
    if (!cust.number.trim()) return focusField('number', 'Informe o número');
    if (!cust.district.trim()) return focusField('district', 'Informe o bairro');
  }
  if (s.pagamentos.length && !cust.pay) { toast('Escolha a forma de pagamento'); return; }
  var T = totals(), cerr = changeError(T.total);
  if (cerr) { toast(cerr); var cf = $('#f-change'); cf.focus(); cf.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
  var num = waNumber(s.whatsapp);
  if (num.length < 12) { toast('WhatsApp da loja não configurado'); return; }
  cust.mode = mode;
  LS.set('cliente', { name: cust.name, street: cust.street, number: cust.number, district: cust.district, ref: cust.ref, mode: cust.mode, pay: cust.pay });
  var msg = buildMessage(), url = 'https://wa.me/' + num + '?text=' + encodeURIComponent(msg.text);
  track('pedido', { codigo: msg.code, valor: T.total, taxa: T.feeFinal, cupom: T.cp && T.cp.ok ? T.cp.c.codigo : '', qtd: cartCount(),
    ids: cart.map(function (i) { return i.pid; }), itens: cart.map(function (i) { return { item_id: i.pid, item_name: i.nome, quantity: i.qty, price: i.unit }; }) });
  SS.set('ultimo_pedido', { url: url, code: msg.code });
  LS.set('ultimo_' + CFG.id, { at: Date.now(), total: T.total, mode: cust.mode, pay: cust.pay,
    itens: cart.map(function (i) { return { pid: i.pid, nome: i.nome, tamanho: i.tamanho, ponto: i.ponto, addons: i.addons.map(function (a) { return a.nome; }), rem: i.rem || [], obs: i.obs, qty: i.qty }; }) });
  cart = []; saveCart(); cust.obs = ''; cust.change = ''; coupon = ''; LS.del('cupom_' + CFG.id);
  var w = null; try { w = window.open(url, '_blank'); } catch (e) {}
  if (!w) location.href = url;
  history.replaceState(null, '', '#/enviado'); route();
});
function renderDone() {
  var o = SS.get('ultimo_pedido');
  $('#done-text').innerHTML = 'Seu pedido' + (o ? ' <b>#' + o.code + '</b>' : '') + ' foi montado no WhatsApp. É só tocar em <b>enviar</b> na conversa para a loja receber.';
  $('#done-wa').hidden = !o; if (o) $('#done-wa').href = o.url;
}

/* ================= PAINEL ADMIN (#admin) ================= */
var admTab = 'loja', saveT = null, ed = null, edIndex = -1, prodQ = '', prodCat = '', uploadTarget = null;
function getDraft() { if (!draft) { var d = LS.get(DRAFT_KEY); draft = normalize(d && d.loja ? d : clone(PUBLISHED)); } return draft; }
function isDirty() { return JSON.stringify(getDraft()) !== JSON.stringify(PUBLISHED); }
function saveDraft() {
  clearTimeout(saveT);
  saveT = setTimeout(function () { if (!LS.set(DRAFT_KEY, draft)) toast('O navegador não conseguiu guardar o rascunho (fotos grandes demais?). Baixe o loja.js para não perder.'); }, 200);
  var d = $('#dirty'); if (d) d.classList.toggle('on', isDirty());
}
function setPath(o, path, v) { var ks = path.split('.'); for (var i = 0; i < ks.length - 1; i++) o = o[ks[i]]; o[ks[ks.length - 1]] = v; }
function getPath(o, path) { return path.split('.').reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
function fld(label, inner, help) { return '<div class="fld"><label>' + label + '</label>' + inner + (help ? '<p class="help">' + help + '</p>' : '') + '</div>'; }
function inp(path, ph, extra) { return '<input class="field" data-bind="' + path + '" value="' + esc(getPath(draft, path)) + '" placeholder="' + esc(ph || '') + '" ' + (extra || '') + '>'; }
function num(path, ph) { return '<input class="field" data-bind="' + path + '" data-num="1" value="' + esc(priceInput(getPath(draft, path))) + '" placeholder="' + esc(ph || '0,00') + '" inputmode="decimal">'; }
function chk(path, label) { return '<label class="switch"><input type="checkbox" data-bind="' + path + '" data-rerender="1" ' + (getPath(draft, path) ? 'checked' : '') + '> ' + label + '</label>'; }
function dPhoto(p) {
  if (p.fotos && p.fotos[0]) return '<img src="' + esc(p.fotos[0]) + '" alt="">';
  var c = draft.categorias.filter(function (k) { return k.id === p.categoria; })[0];
  return c && c.icone ? '<img class="icon" src="' + esc(c.icone) + '" alt="">' : '<span class="display">' + esc(initials(p.nome)) + '</span>';
}
var SWATCHES = ['#E9B226', '#F28C28', '#E4572E', '#C8102E', '#D63384', '#7B5EA7', '#2E86AB', '#1B998B', '#3A7D44', '#111111'];

function renderAdmin() {
  var d = getDraft(); applyTheme(d);
  var pinOk = !PUBLISHED.admin.pin || SS.get('adm_ok_' + PUBLISHED.id);
  if (!pinOk) {
    $('#admin').innerHTML = '<div class="adm"><div class="lock"><h2>Painel da loja</h2><p class="help">Digite o PIN para editar o cardápio.</p>' +
      '<label class="sr" for="pin">PIN</label><input class="field" id="pin" type="password" inputmode="numeric" autocomplete="off"><button class="btn dark" type="button" data-a="unlock">Entrar</button>' +
      '<p class="help mt"><a class="lnk" href="#/">Voltar à loja</a></p></div></div>';
    var pi = $('#pin'); pi.focus(); pi.addEventListener('keydown', function (e) { if (e.key === 'Enter') $('[data-a="unlock"]').click(); });
    return;
  }
  var s = d.loja, tabs = [['loja', 'Loja'], ['produtos', 'Produtos'], ['categorias', 'Categorias'], ['cupons', 'Cupons'], ['banner', 'Banner'], ['publicar', 'Publicar']];
  $('#admin').innerHTML = '<div class="adm"><div class="adm-head"><div class="adm-top">' +
    '<div class="logo" id="adm-logo">' + (s.logo ? '<img src="' + esc(s.logo) + '" alt="">' : esc(initials(s.nome))) + '</div>' +
    '<div class="adm-ttl"><b>Painel do cardápio</b><small id="adm-name">' + esc(s.nome) + '</small></div>' +
    '<span class="dirty ' + (isDirty() ? 'on' : '') + '" id="dirty">● Não publicado</span>' +
    '<button class="btn sm" type="button" data-a="preview">' + icon('eye', 16) + ' Prévia</button></div>' +
    '<nav class="adm-tabs">' + tabs.map(function (t) { return '<button type="button" class="tab ' + (admTab === t[0] ? 'on' : '') + '" data-a="tab" data-t="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</nav></div>' +
    '<main class="adm-main" id="adm-body"></main><div id="adm-modal"></div></div>';
  renderAdminBody();
}
function renderAdminBody() {
  var d = draft, s = d.loja, h = '';
  if (admTab === 'loja') {
    h += '<section class="panel"><h2>Identidade</h2><p class="help">Logo, nome e cor que o cliente vê.</p>' +
      '<div class="fld"><span class="l">Logo</span><div class="img-edit"><div class="logo" style="width:92px;height:92px;border-radius:24px">' + (s.logo ? '<img src="' + esc(s.logo) + '" alt="">' : esc(initials(s.nome))) + '</div>' +
      '<div class="btns"><button type="button" class="btn dark" data-a="upload" data-target="logo">' + icon('upload', 16) + ' Enviar logo</button>' + (s.logo ? '<button type="button" class="btn danger" data-a="rmimg" data-target="logo">Remover</button>' : '') + '</div></div>' +
      '<p class="help">PNG ou JPG quadrado. A imagem é reduzida automaticamente.</p></div>' +
      '<div class="grid2">' + fld('Nome da loja', inp('loja.nome', 'Ex.: Burger do Zé')) + fld('Endereço da loja', inp('loja.endereco', 'Rua, número — bairro')) + '</div>' +
      '<div class="fld"><span class="l">Cor principal</span><div class="swatches">' + SWATCHES.map(function (c) { return '<button type="button" class="sw ' + (d.visual.corPrincipal.toLowerCase() === c.toLowerCase() ? 'on' : '') + '" data-a="color" data-c="' + c + '" aria-label="Cor ' + c + '"></button>'; }).join('') +
      '<input type="color" data-bind="visual.corPrincipal" data-rerender="1" value="' + esc(d.visual.corPrincipal) + '" aria-label="Outra cor"></div></div>' +
      '<div class="grid3">' + fld('Cor secundária', '<input type="color" data-bind="visual.corSecundaria" value="' + esc(d.visual.corSecundaria) + '">', 'Detalhes (ex.: bolinha da foto).') +
      fld('Tom escuro', '<input type="color" data-bind="visual.corEscura" value="' + esc(d.visual.corEscura) + '">', 'Topo, barra da sacola e botões escuros.') +
      fld('Layout do cardápio', '<select class="field" data-bind="visual.layout">' + [['lista', 'Lista'], ['grade', 'Grade (2 colunas)']].map(function (o) { return '<option value="' + o[0] + '" ' + (d.visual.layout === o[0] ? 'selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>') + '</div></section>';
    h += '<section class="panel"><h2>Pedidos no WhatsApp</h2>' + fld('WhatsApp da loja', inp('loja.whatsapp', '5544999998888', 'inputmode="tel"'), 'Só números: 55 + DDD + número. Ex.: <code>5544999998888</code>') +
      '<button type="button" class="btn sm" data-a="testwa">' + icon('chat', 16) + ' Testar número</button></section>';
    h += '<section class="panel"><h2>Horário de atendimento</h2><p class="help">Horário de Brasília. Formato <code>18:00-23:00</code>. Dois turnos: <code>11:00-14:00, 18:00-23:00</code>. Passa da meia-noite: <code>18:00-02:00</code>. Vazio = fechado.</p>' +
      chk('loja.fechadoManual', 'Fechar a loja agora (feriado ou imprevisto)') +
      '<div class="hours-grid">' + [1, 2, 3, 4, 5, 6, 0].map(function (d) { return fld(DIAS_NOME[d], inp('loja.horarios.' + DIAS[d], 'Fechado')); }).join('') + '</div>' +
      '<p class="help mt">Com a loja fechada, o cliente ainda pode enviar o pedido. Ele chega marcado como PEDIDO AGENDADO.</p></section>';
    h += '<section class="panel"><h2>Entrega e retirada</h2>' + chk('loja.entrega', 'Faz entrega') +
      (s.entrega ? '<div class="grid2">' + fld('Taxa de entrega (R$)', num('loja.taxaEntrega')) + fld('Tempo de entrega', inp('loja.tempoEntrega', '40–60 min')) + '</div>' : '') +
      chk('loja.retirada', 'Cliente pode retirar no local') +
      (s.retirada ? fld('Tempo para retirada', inp('loja.tempoRetirada', '20–30 min')) : '') +
      fld('Pedido mínimo (R$)', num('loja.pedidoMinimo'), '0 = sem mínimo.') + '</section>';
    h += '<section class="panel"><h2>Formas de pagamento</h2>' + fld('Uma por linha', '<textarea class="field" rows="4" data-bind="loja.pagamentos" data-lines="1">' + esc(s.pagamentos.join('\n')) + '</textarea>', 'Se tiver "Dinheiro", o app pergunta o troco.') + '</section>';
    h += '<section class="panel"><h2>Compartilhamento (SEO)</h2><p class="help">Título, descrição e imagem que aparecem quando o link é compartilhado.</p>' +
      fld('Título da página', inp('seo.titulo', 'Burger do Zé · Cardápio')) + fld('Descrição', inp('seo.descricao', 'Peça pelo WhatsApp…')) +
      '<div class="grid2">' + fld('Imagem de compartilhamento', inp('seo.imagem', 'assets/compartilhar.jpg'), '1200×630 px.') + fld('Favicon', inp('seo.favicon', 'assets/favicon.png')) + '</div>' +
      fld('Endereço do site', inp('seo.url', 'https://burgerdoze.vercel.app'), 'Necessário para a imagem aparecer no WhatsApp/Instagram.') + '</section>';
    h += '<section class="panel"><h2>Pixel e Analytics</h2><p class="help">Deixe vazio para não carregar nada.</p><div class="grid2">' +
      fld('ID do Meta Pixel', inp('rastreamento.metaPixel', '123456789012345', 'inputmode="numeric"')) + fld('ID do Google Analytics', inp('rastreamento.googleAnalytics', 'G-XXXXXXXXXX')) + '</div></section>';
    h += '<section class="panel"><h2>Acesso ao painel</h2>' + fld('PIN do painel (opcional)', inp('admin.pin', 'Ex.: 1234', 'inputmode="numeric"'), 'O painel abre em <code>seulink/#admin</code>. O PIN só afasta curiosos.') + '</section>';
  } else if (admTab === 'produtos') {
    var list = d.produtos.map(function (p, i) { return { p: p, i: i }; }).filter(function (x) {
      return (!prodCat || x.p.categoria === prodCat) && (!prodQ || x.p.nome.toLowerCase().indexOf(prodQ.toLowerCase()) > -1);
    });
    h += '<section class="panel"><div class="btns" style="align-items:center;margin-bottom:12px"><h2 style="flex:1">Produtos (' + d.produtos.length + ')</h2><button type="button" class="btn pri" data-a="newprod">' + icon('plus', 16, 2) + ' Novo produto</button></div>' +
      '<div class="grid2"><div class="fld"><input class="field" id="prodq" placeholder="Buscar produto" value="' + esc(prodQ) + '" aria-label="Buscar produto"></div><div class="fld"><select class="field" id="prodcat" aria-label="Categoria"><option value="">Todas as categorias</option>' +
      d.categorias.map(function (c) { return '<option value="' + esc(c.id) + '" ' + (prodCat === c.id ? 'selected' : '') + '>' + esc(c.nome) + '</option>'; }).join('') + '</select></div></div>' +
      (list.length ? list.map(function (x) {
        var p = x.p, c = d.categorias.filter(function (k) { return k.id === p.categoria; })[0];
        return '<div class="list-row ' + (p.disponivel ? '' : 'off') + '"><div class="card-photo">' + dPhoto(p) + '</div>' +
          '<div class="grow"><b>' + esc(p.nome || '(sem nome)') + (p.destaque ? ' <span class="tag-warn">Mais pedido</span>' : '') + '</b><small>' + esc(c ? c.nome : 'Sem categoria') + ' · ' + fmt(minPrice(p)) + (p.disponivel ? '' : ' · Esgotado') + '</small></div>' +
          '<label class="switch" style="margin:0" title="Disponível"><input type="checkbox" data-a="avail" data-i="' + x.i + '" ' + (p.disponivel ? 'checked' : '') + ' aria-label="Disponível"></label>' +
          '<button type="button" class="btn ic" data-a="pmove" data-i="' + x.i + '" data-d="-1" aria-label="Subir">' + icon('up', 16) + '</button><button type="button" class="btn ic" data-a="pmove" data-i="' + x.i + '" data-d="1" aria-label="Descer">' + icon('down', 16) + '</button>' +
          '<button type="button" class="btn sm" data-a="editprod" data-i="' + x.i + '">' + icon('edit', 15) + ' Editar</button></div>';
      }).join('') : '<div class="empty"><p class="empty-t">Nenhum produto</p><p>Clique em “Novo produto”.</p></div>') +
      '<p class="help mt">A caixinha liga/desliga o produto (esgotado). As setas mudam a ordem.</p></section>';
  } else if (admTab === 'categorias') {
    h += '<section class="panel"><h2>Categorias</h2><p class="help">Toque no quadrado para trocar o ícone. A ordem aqui é a ordem no app.</p>' +
      d.categorias.map(function (c, i) {
        var n = d.produtos.filter(function (p) { return p.categoria === c.id; }).length;
        return '<div class="list-row"><button type="button" class="card-photo" data-a="upload" data-target="cat" data-i="' + i + '" aria-label="Trocar ícone">' + (c.icone ? '<img class="icon" src="' + esc(c.icone) + '" alt="">' : icon('upload', 18)) + '</button>' +
          '<div class="grow"><input class="field" data-cat="' + i + '" value="' + esc(c.nome) + '" placeholder="Nome da categoria" aria-label="Nome da categoria"><small>' + n + ' produto(s)</small></div>' +
          '<button type="button" class="btn ic" data-a="cmove" data-i="' + i + '" data-d="-1" aria-label="Subir">' + icon('up', 16) + '</button><button type="button" class="btn ic" data-a="cmove" data-i="' + i + '" data-d="1" aria-label="Descer">' + icon('down', 16) + '</button>' +
          '<button type="button" class="btn ic danger" data-a="cdel" data-i="' + i + '" aria-label="Excluir">' + icon('trash', 16) + '</button></div>';
      }).join('') + '<div class="mt"><button type="button" class="btn pri" data-a="cadd">' + icon('plus', 16, 2) + ' Adicionar categoria</button></div></section>';
  } else if (admTab === 'cupons') {
    h += '<section class="panel"><h2>Cupons de desconto</h2><p class="help">Tipos: <b>%</b> desconta uma porcentagem do subtotal; <b>R$</b> desconta um valor fixo; <b>Frete grátis</b> zera a taxa de entrega. Mínimo e validade são opcionais.</p>' +
      (d.cupons.length ? '<div class="cup-row cup-head"><span>Código</span><span>Tipo</span><span>Valor</span><span>Mínimo R$</span><span>Validade</span><span></span><span></span></div>' + d.cupons.map(function (c, i) {
        return '<div class="cup-row">' +
          '<input class="field" data-cup="' + i + '" data-f="codigo" value="' + esc(c.codigo) + '" placeholder="CÓDIGO" aria-label="Código">' +
          '<select class="field" data-cup="' + i + '" data-f="tipo" aria-label="Tipo">' + [['percentual', '% desconto'], ['valor', 'R$ desconto'], ['frete', 'Frete grátis']].map(function (o) { return '<option value="' + o[0] + '" ' + (c.tipo === o[0] ? 'selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>' +
          '<input class="field" data-cup="' + i + '" data-f="valor" value="' + esc(priceInput(c.valor)) + '" placeholder="Valor" inputmode="decimal" aria-label="Valor" ' + (c.tipo === 'frete' ? 'disabled' : '') + '>' +
          '<input class="field" data-cup="' + i + '" data-f="minimo" value="' + esc(priceInput(c.minimo)) + '" placeholder="Mín. R$" inputmode="decimal" aria-label="Pedido mínimo">' +
          '<input class="field" type="date" data-cup="' + i + '" data-f="validade" value="' + esc(c.validade) + '" aria-label="Validade">' +
          '<label class="switch" style="margin:0"><input type="checkbox" data-cup="' + i + '" data-f="ativo" ' + (c.ativo ? 'checked' : '') + '> Ativo</label>' +
          '<button type="button" class="btn ic danger" data-a="cupdel" data-i="' + i + '" aria-label="Excluir cupom">' + icon('trash', 16) + '</button></div>';
      }).join('') : '<div class="empty"><p class="empty-t">Nenhum cupom</p><p>Sem cupons, o campo nem aparece no carrinho.</p></div>') +
      '<div class="mt"><button type="button" class="btn pri" data-a="cupadd">' + icon('plus', 16, 2) + ' Novo cupom</button></div></section>';
  } else if (admTab === 'banner') {
    var b = d.banner;
    h += '<section class="panel"><h2>Banner de destaque</h2><p class="help">O cartão colorido no topo do cardápio.</p>' + chk('visual.mostrarBanner', 'Mostrar banner');
    if (d.visual.mostrarBanner) {
      h += '<div class="grid2">' + fld('Chamada pequena', inp('banner.chamada', 'Promoção limitada!')) + fld('Texto do botão', inp('banner.botao', 'Pedir agora')) + '</div>' +
        fld('Título', inp('banner.titulo', 'Combo especial da semana')) +
        fld('Ao tocar, abrir o produto', '<select class="field" data-bind="banner.produto" data-rerender="1"><option value="">— Só rolar até o cardápio —</option>' + d.produtos.map(function (p) { return '<option value="' + esc(p.id) + '" ' + (b.produto === p.id ? 'selected' : '') + '>' + esc(p.nome) + '</option>'; }).join('') + '</select>') +
        '<div class="fld"><span class="l">Imagem do banner</span><div class="img-edit"><div class="card-photo">' + (b.imagem ? '<img src="' + esc(b.imagem) + '" alt="">' : '') + '</div>' +
        '<div class="btns"><button type="button" class="btn dark" data-a="upload" data-target="banner">' + icon('upload', 16) + ' Enviar imagem</button>' + (b.imagem ? '<button type="button" class="btn danger" data-a="rmimg" data-target="banner">Remover</button>' : '') + '</div></div>' +
        '<p class="help">Sem imagem, usa a foto do produto escolhido, em círculo.</p></div>';
    }
    h += '</section>';
  } else if (admTab === 'publicar') {
    var dirty = isDirty();
    h += '<section class="panel"><h2>Publicar alterações</h2><p class="help">' + (dirty ? '<span class="tag-warn">Há alterações não publicadas</span>' : '<span class="tag-ok">Tudo publicado</span>') + '</p>' +
      '<div class="step"><span class="n">1</span><div>Confira em <b>Prévia</b> (botão no topo). Dá pra testar um pedido.</div></div>' +
      '<div class="step"><span class="n">2</span><div>Clique em <b>Baixar loja.js</b>. É o arquivo com logo, fotos enviadas e produtos.</div></div>' +
      '<div class="step"><span class="n">3</span><div>Na pasta do site, substitua <code>config/loja.js</code> pelo novo e suba de novo na hospedagem. O link continua o mesmo.</div></div>' +
      '<div class="btns"><button type="button" class="btn pri" data-a="download">' + icon('download', 16) + ' Baixar loja.js</button><button type="button" class="btn" data-a="preview">' + icon('eye', 16) + ' Ver prévia</button></div></section>';
    h += '<section class="panel"><h2>Outra loja</h2><p class="help">Carregue o loja.js de outro cliente para editar aqui.</p><div class="btns">' +
      '<button type="button" class="btn" data-a="import">' + icon('upload', 16) + ' Importar loja.js</button>' +
      '<button type="button" class="btn danger" data-a="blank">Nova loja em branco</button>' +
      '<button type="button" class="btn danger" data-a="discard" ' + (dirty ? '' : 'disabled') + '>Descartar alterações</button></div></section>';
  }
  $('#adm-body').innerHTML = h;
  var pq = $('#prodq'); if (pq) pq.addEventListener('input', function (e) { prodQ = e.target.value; var pos = e.target.selectionStart; renderAdminBody(); var n = $('#prodq'); n.focus(); n.setSelectionRange(pos, pos); });
  var pc = $('#prodcat'); if (pc) pc.addEventListener('change', function (e) { prodCat = e.target.value; renderAdminBody(); });
}
function refreshAdminHeader() {
  var s = draft.loja, n = $('#adm-name'), l = $('#adm-logo');
  if (n) n.textContent = s.nome;
  if (l) l.innerHTML = s.logo ? '<img src="' + esc(s.logo) + '" alt="">' : esc(initials(s.nome));
}

/* ----- Editor de produto ----- */
function linesFrom(arr) { return (arr || []).map(function (o) { return o.nome + (o.preco ? ' | ' + priceInput(o.preco) : ''); }).join('\n'); }
function parseLines(t) { return String(t || '').split('\n').map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) { var p = l.split('|'); return { nome: p[0].trim(), preco: parsePrice(p[1] || '') }; }).filter(function (o) { return o.nome; }); }
function openEditor(i) {
  edIndex = i;
  ed = i >= 0 ? clone(draft.produtos[i]) : normalize({ produtos: [{ nome: '', categoria: prodCat || (draft.categorias[0] || {}).id || '' }] }).produtos[0];
  ed._tam = linesFrom(ed.tamanhos);
  ed._rem = (ed.remover || []).join('\n');
  ed._combo = ed.tipo === 'combo';
  ed._itens = (ed.itens || []).map(function (x) { return x.produto + ' | ' + x.qtd; }).join('\n');
  ed.adicionais.forEach(function (g) { g._txt = linesFrom(g.opcoes); });
  renderEditor();
}
function edInp(k, ph, extra) { return '<input class="field" data-ed="' + k + '" value="' + esc(ed[k]) + '" placeholder="' + esc(ph || '') + '" ' + (extra || '') + '>'; }
function renderEditor() {
  var h = '<div class="modal" data-a="modalbg"><div class="modal-box" role="dialog" aria-modal="true" aria-label="Editar produto">' +
    '<div class="modal-head"><h2>' + (edIndex >= 0 ? 'Editar produto' : 'Novo produto') + '</h2><button type="button" class="btn ic" data-a="closeed" aria-label="Fechar">' + icon('x', 18) + '</button></div>' +
    '<div class="fld"><span class="l">Fotos (a primeira é a capa)</span><div class="thumbs">' +
    ed.fotos.map(function (f, i) { return '<div class="t"><div class="card-photo"><img src="' + esc(f) + '" alt=""></div><button type="button" data-a="rmfoto" data-i="' + i + '" aria-label="Remover foto">' + icon('x', 12, 2.4) + '</button></div>'; }).join('') +
    '<button type="button" class="btn dark" data-a="upload" data-target="product">' + icon('upload', 16) + ' Enviar foto</button></div>' +
    '<input class="field mt" data-ed="fotoUrl" value="" placeholder="…ou o caminho/link: assets/img/x-bacon.jpg">' +
    '<p class="help">Fotos em círculo (vista de cima, fundo branco) ficam iguais ao layout.</p></div>' +
    fld('Nome', edInp('nome', 'Ex.: X-Bacon')) +
    '<div class="grid2">' + fld('Categoria', '<select class="field" data-ed="categoria"><option value="">Sem categoria</option>' + draft.categorias.map(function (c) { return '<option value="' + esc(c.id) + '" ' + (ed.categoria === c.id ? 'selected' : '') + '>' + esc(c.nome) + '</option>'; }).join('') + '</select>') +
    fld('Preço (R$)', '<input class="field" data-ed="preco" value="' + esc(priceInput(ed.preco)) + '" placeholder="0,00" inputmode="decimal">', 'Com tamanhos, vale o preço de cada tamanho.') + '</div>' +
    fld('Descrição', '<textarea class="field" rows="3" data-ed="descricao" placeholder="Ingredientes, porção…">' + esc(ed.descricao) + '</textarea>') +
    fld('Nota (opcional)', edInp('nota', 'Ex.: 4,8', 'inputmode="decimal"'), 'De 0 a 5. Vazio = não mostra.') +
    '<label class="switch"><input type="checkbox" data-ed="disponivel" ' + (ed.disponivel ? 'checked' : '') + '> Disponível</label>' +
    '<label class="switch"><input type="checkbox" data-ed="destaque" ' + (ed.destaque ? 'checked' : '') + '> Mostrar em “Mais pedidos”</label>' +
    fld('Tamanhos (opcional)', '<textarea class="field" rows="3" data-ed="_tam" placeholder="Pequeno | 29,90&#10;Médio | 39,90&#10;Grande | 49,90">' + esc(ed._tam) + '</textarea>', 'Um por linha: <code>Nome | preço</code>.') +
    '<label class="switch"><input type="checkbox" data-ed="pontoCarne" ' + (ed.pontoCarne ? 'checked' : '') + '> Perguntar o ponto da carne (obrigatório)</label>' +
    fld('Ingredientes que podem ser retirados', '<textarea class="field" rows="3" data-ed="_rem" placeholder="Cebola&#10;Tomate&#10;Picles">' + esc(ed._rem) + '</textarea>', 'Um por linha. Aparece como “Sem cebola”.') +
    '<label class="switch"><input type="checkbox" data-ed="_combo" ' + (ed._combo ? 'checked' : '') + '> É um combo</label>' +
    fld('Itens do combo', '<textarea class="field" rows="3" data-ed="_itens" placeholder="hamburguer | 1&#10;refrigerante | 1">' + esc(ed._itens) + '</textarea>', 'Só para combos. Um por linha: <code>id do produto | quantidade</code>. Ids: ' + draft.produtos.filter(function (x) { return x.tipo !== 'combo'; }).map(function (x) { return '<code>' + esc(x.id) + '</code>'; }).join(' ')) +
    '<div class="fld"><span class="l">Adicionais / opções</span><p class="help">Aparecem na tela “Personalize seu pedido”. Um item por linha: <code>Nome | preço</code>.</p></div>' +
    ed.adicionais.map(function (g, gi) {
      return '<div class="gbox"><div class="grid2">' + fld('Título do grupo', '<input class="field" data-g="' + gi + '" data-gf="titulo" value="' + esc(g.titulo) + '">') +
        fld('Máximo de escolhas', '<input class="field" data-g="' + gi + '" data-gf="max" value="' + (g.max || '') + '" placeholder="Sem limite" inputmode="numeric">', '1 = escolhe só uma.') + '</div>' +
        '<label class="switch"><input type="checkbox" data-g="' + gi + '" data-gf="min" ' + (g.min ? 'checked' : '') + '> Obrigatório escolher</label>' +
        fld('Opções', '<textarea class="field" rows="4" data-g="' + gi + '" data-gf="_txt" placeholder="Bacon | 4,00&#10;Cheddar | 3,00">' + esc(g._txt) + '</textarea>') +
        '<button type="button" class="btn sm danger" data-a="gdel" data-g="' + gi + '">' + icon('trash', 14) + ' Remover grupo</button></div>';
    }).join('') +
    '<button type="button" class="btn" data-a="gadd">' + icon('plus', 16, 2) + ' Adicionar grupo de opções</button>' +
    '<div class="modal-foot">' + (edIndex >= 0 ? '<button type="button" class="btn danger" data-a="pdel">' + icon('trash', 16) + ' Excluir</button><button type="button" class="btn" data-a="pdup">' + icon('copy', 16) + ' Duplicar</button>' : '') +
    '<span class="sp"></span><button type="button" class="btn" data-a="closeed">Cancelar</button><button type="button" class="btn dark" data-a="psave">Salvar</button></div></div></div>';
  $('#adm-modal').innerHTML = h; document.body.style.overflow = 'hidden';
}
function closeEditor() { ed = null; var m = $('#adm-modal'); if (m) m.innerHTML = ''; document.body.style.overflow = ''; }
function finalizeEd() {
  var p = clone(ed);
  p.nome = p.nome.trim(); p.preco = parsePrice(p.preco);
  p.nota = Math.max(0, Math.min(5, parseFloat(String(p.nota || '').replace(',', '.')) || 0));
  p.tamanhos = parseLines(p._tam); delete p._tam; delete p.fotoUrl;
  p.remover = String(p._rem || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
  if (p._combo) {
    p.tipo = 'combo';
    p.itens = String(p._itens || '').split('\n').map(function (l) { var a = l.split('|'); return { produto: a[0].trim(), qtd: Math.max(1, parseInt(a[1], 10) || 1) }; }).filter(function (x) { return x.produto && draft.produtos.some(function (q) { return q.id === x.produto; }); });
  } else { p.tipo = 'produto'; delete p.itens; }
  delete p._rem; delete p._combo; delete p._itens;
  p.adicionais = p.adicionais.map(function (g) { return { titulo: (g.titulo || 'Opções').trim(), min: g.min ? 1 : 0, max: parseInt(g.max, 10) || 0, opcoes: parseLines(g._txt) }; }).filter(function (g) { return g.opcoes.length; });
  if (!p.preco && p.tamanhos.length) p.preco = Math.min.apply(null, p.tamanhos.map(function (s) { return s.preco; }));
  if (edIndex < 0) { var base = slug(p.nome), id = base, k = 2; while (draft.produtos.some(function (x) { return x.id === id; })) id = base + '-' + k++; p.id = id; }
  return p;
}

/* ----- Imagens ----- */
function readImage(file, max, png) {
  return new Promise(function (res, rej) {
    var fr = new FileReader();
    fr.onload = function () {
      var img = new Image();
      img.onload = function () {
        var w = img.naturalWidth || max, hh = img.naturalHeight || max, sc = Math.min(1, max / Math.max(w, hh)), c = document.createElement('canvas');
        c.width = Math.round(w * sc); c.height = Math.round(hh * sc);
        var x = c.getContext('2d'); if (!png) { x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); }
        x.drawImage(img, 0, 0, c.width, c.height);
        res(png ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', .82));
      };
      img.onerror = rej; img.src = fr.result;
    };
    fr.onerror = rej; fr.readAsDataURL(file);
  });
}
$('#filepick').addEventListener('change', function (e) {
  var f = e.target.files[0]; e.target.value = ''; if (!f || !uploadTarget) return;
  if (uploadTarget.t === 'import') return importFile(f);
  var t = uploadTarget.t, png = (t === 'logo' || t === 'cat') && /png|svg|webp/i.test(f.type);
  readImage(f, t === 'logo' || t === 'cat' ? 256 : 720, png).then(function (url) {
    if (t === 'logo') { draft.loja.logo = url; refreshAdminHeader(); }
    else if (t === 'banner') draft.banner.imagem = url;
    else if (t === 'cat') draft.categorias[uploadTarget.i].icone = url;
    else if (t === 'product' && ed) { ed.fotos.push(url); renderEditor(); return; }
    saveDraft(); renderAdminBody();
  }).catch(function () { toast('Não consegui ler essa imagem'); });
});

/* ----- Publicar / importar ----- */
var HEADER = '/* =====================================================================\n   CONFIGURAÇÃO DA LOJA — gerado pelo painel (#admin).\n   Substitua config/loja.js por este arquivo e suba o site de novo.\n   ===================================================================== */\n';
function buildLojaJs(cfg) { return HEADER + 'window.LOJA = ' + JSON.stringify(cfg, null, 2) + ';\n'; }
function download(name, text, type) {
  var blob = new Blob([text], { type: type }), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);
}
function importFile(f) {
  var fr = new FileReader();
  fr.onload = function () {
    try {
      var txt = String(fr.result), i = txt.indexOf('window.LOJA'), data;
      if (i > -1) { var a = txt.indexOf('{', i), b = txt.lastIndexOf('}'); data = JSON.parse(txt.slice(a, b + 1)); }
      else data = JSON.parse(txt);
      if (!data || !data.loja) throw 0;
      if (!confirm('Substituir o rascunho pela loja "' + (data.loja.nome || '') + '"?')) return;
      draft = normalize(data); saveDraft(); renderAdmin(); toast('Loja importada');
    } catch (e) { toast('Arquivo não reconhecido. Use um loja.js gerado por este painel.'); }
  };
  fr.readAsText(f);
}

/* ----- Eventos do painel ----- */
$('#admin').addEventListener('click', function (e) {
  var el = e.target.closest('[data-a]'); if (!el) return;
  var a = el.dataset.a, i = Number(el.dataset.i), arr, j;
  if (a === 'modalbg' && e.target !== el) return;
  if (a === 'unlock') { if ($('#pin').value === String(PUBLISHED.admin.pin)) { SS.set('adm_ok_' + PUBLISHED.id, 1); renderAdmin(); } else toast('PIN incorreto'); }
  else if (a === 'tab') { admTab = el.dataset.t; renderAdmin(); window.scrollTo(0, 0); }
  else if (a === 'preview') { previewMode = true; sel = null; location.hash = '#/'; }
  else if (a === 'color') { draft.visual.corPrincipal = el.dataset.c; applyTheme(draft); saveDraft(); renderAdminBody(); }
  else if (a === 'upload') { uploadTarget = { t: el.dataset.target, i: i }; var fp = $('#filepick'); fp.accept = 'image/*'; fp.click(); }
  else if (a === 'rmimg') { var t = el.dataset.target; if (t === 'logo') { draft.loja.logo = ''; refreshAdminHeader(); } else if (t === 'banner') draft.banner.imagem = ''; saveDraft(); renderAdminBody(); }
  else if (a === 'rmfoto') { ed.fotos.splice(i, 1); renderEditor(); }
  else if (a === 'testwa') { var n = waNumber(draft.loja.whatsapp); if (n.length < 12) { toast('Número incompleto'); return; } window.open('https://wa.me/' + n + '?text=' + encodeURIComponent('Teste do cardápio'), '_blank'); }
  else if (a === 'avail') { draft.produtos[i].disponivel = el.checked; saveDraft(); renderAdminBody(); }
  else if (a === 'pmove' || a === 'cmove') {
    arr = a === 'pmove' ? draft.produtos : draft.categorias; j = i + Number(el.dataset.d);
    if (j < 0 || j >= arr.length) return; var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp; saveDraft(); renderAdminBody();
  }
  else if (a === 'cupadd') { draft.cupons.push({ codigo: 'CUPOM' + (draft.cupons.length + 1), tipo: 'percentual', valor: 10, minimo: 0, validade: '', ativo: true }); saveDraft(); renderAdminBody(); }
  else if (a === 'cupdel') { if (!confirm('Excluir o cupom "' + draft.cupons[i].codigo + '"?')) return; draft.cupons.splice(i, 1); saveDraft(); renderAdminBody(); }
  else if (a === 'cadd') { draft.categorias.push({ id: uid('c'), nome: 'Nova categoria', icone: '' }); saveDraft(); renderAdminBody(); }
  else if (a === 'cdel') {
    var c = draft.categorias[i], n2 = draft.produtos.filter(function (p) { return p.categoria === c.id; }).length;
    if (!confirm('Excluir a categoria "' + c.nome + '"?' + (n2 ? ' Os ' + n2 + ' produto(s) dela vão para "Outros".' : ''))) return;
    draft.categorias.splice(i, 1); draft.produtos.forEach(function (p) { if (p.categoria === c.id) p.categoria = ''; }); saveDraft(); renderAdminBody();
  }
  else if (a === 'newprod') openEditor(-1);
  else if (a === 'editprod') openEditor(i);
  else if (a === 'closeed' || a === 'modalbg') closeEditor();
  else if (a === 'gadd') { ed.adicionais.push({ titulo: 'Adicionais', min: 0, max: 0, opcoes: [], _txt: '' }); renderEditor(); }
  else if (a === 'gdel') { ed.adicionais.splice(Number(el.dataset.g), 1); renderEditor(); }
  else if (a === 'psave') {
    var p = finalizeEd(); if (!p.nome) { toast('Dê um nome ao produto'); return; }
    if (edIndex >= 0) draft.produtos[edIndex] = p; else draft.produtos.push(p);
    saveDraft(); closeEditor(); renderAdminBody(); toast('Produto salvo');
  }
  else if (a === 'pdel') { if (!confirm('Excluir "' + draft.produtos[edIndex].nome + '"?')) return; var pid = draft.produtos[edIndex].id; draft.produtos.splice(edIndex, 1); if (draft.banner.produto === pid) draft.banner.produto = ''; saveDraft(); closeEditor(); renderAdminBody(); }
  else if (a === 'pdup') { var cp = finalizeEd(); cp.id = cp.id + '-copia-' + Math.random().toString(36).slice(2, 5); cp.nome += ' (cópia)'; cp.destaque = false; draft.produtos.splice(edIndex + 1, 0, cp); saveDraft(); closeEditor(); renderAdminBody(); }
  else if (a === 'download') {
    if (!draft.id || draft.id === 'demo') draft.id = 'loja_' + Math.random().toString(36).slice(2, 10);
    if (waNumber(draft.loja.whatsapp).length < 12 && !confirm('O WhatsApp da loja parece incompleto. Baixar mesmo assim?')) return;
    download('loja.js', buildLojaJs(draft), 'text/javascript'); LS.set('cardapio_rascunho_' + draft.id, draft);
    toast('loja.js baixado! Substitua o arquivo em config/ e suba o site.');
  }
  else if (a === 'import') { uploadTarget = { t: 'import' }; var fp2 = $('#filepick'); fp2.accept = '.js,.json,text/javascript,application/json'; fp2.click(); }
  else if (a === 'discard') { if (!confirm('Descartar tudo que não foi publicado?')) return; draft = clone(PUBLISHED); LS.del(DRAFT_KEY); renderAdmin(); toast('Alterações descartadas'); }
  else if (a === 'blank') {
    if (!confirm('Começar uma loja em branco? O rascunho atual será substituído.')) return;
    draft = normalize({ id: 'loja_' + Math.random().toString(36).slice(2, 10), loja: { nome: 'Nova loja' }, categorias: [{ id: 'lanches', nome: 'Lanches', icone: '' }, { id: 'bebidas', nome: 'Bebidas', icone: '' }], produtos: [] });
    saveDraft(); admTab = 'loja'; renderAdmin(); toast('Loja em branco criada');
  }
});
function onAdminInput(e) {
  var t = e.target, ds = t.dataset || {};
  if (ds.bind) {
    var v = t.type === 'checkbox' ? t.checked : t.value;
    if (ds.num) v = parsePrice(v);
    if (ds.lines) v = String(v).split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
    setPath(draft, ds.bind, v); saveDraft();
    if (ds.bind.indexOf('visual.') === 0) applyTheme(draft);
    if (ds.bind === 'loja.nome') refreshAdminHeader();
    if (ds.rerender && e.type === 'change') renderAdminBody();
  } else if (ds.cat != null) { draft.categorias[Number(ds.cat)].nome = t.value; saveDraft(); }
  else if (ds.cup != null) {
    var cp = draft.cupons[Number(ds.cup)], f = ds.f;
    cp[f] = t.type === 'checkbox' ? t.checked : (f === 'valor' || f === 'minimo') ? parsePrice(t.value) : f === 'codigo' ? t.value.trim().toUpperCase() : t.value;
    saveDraft(); if (f === 'tipo' && e.type === 'change') renderAdminBody();
  }
  else if (ds.ed && ed) {
    if (ds.ed === 'fotoUrl') { if (e.type === 'change' && t.value.trim()) { ed.fotos.push(t.value.trim()); renderEditor(); } return; }
    ed[ds.ed] = t.type === 'checkbox' ? t.checked : t.value;
  } else if (ds.g != null && ds.gf && ed) { ed.adicionais[Number(ds.g)][ds.gf] = t.type === 'checkbox' ? t.checked : t.value; }
}
$('#admin').addEventListener('input', onAdminInput);
$('#admin').addEventListener('change', onAdminInput);

if (PREVIEW) {
  window.addEventListener('message', function (e) {
    var d = e.data; if (!d || d.tipo !== 'gerador-preview') return;
    if (d.cfg) PUBLISHED = normalize(clone(d.cfg));
    SIM = d.simular || null;
    route();
  });
  try { window.parent.postMessage({ tipo: 'gerador-pronto' }, '*'); } catch (e) {}
} else loadTracking(PUBLISHED);
route();
})();
