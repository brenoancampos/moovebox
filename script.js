/* =========================================================
   LED Floors — script.js (HTML/CSS/JS puro, sem libs)
   ========================================================= */

/* ---------- INTRO / ABERTURA (abre o site só ao clicar em "Entrar") ---------- */
(function () {
  const intro = document.getElementById('intro');
  if (!intro) return;
  const enter = document.getElementById('introEnter');

  document.body.classList.add('intro-lock');
  let done = false;
  function close() {
    if (done) return;
    done = true;
    intro.classList.add('hide');
    document.body.classList.remove('intro-lock');
    setTimeout(() => intro.remove(), 1000);
  }
  if (enter) enter.addEventListener('click', close);
  // acessibilidade: Enter/Espaço no teclado também abrem
  document.addEventListener('keydown', (e) => {
    if (!done && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); close(); }
  });
})();

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- NAV: fundo ao rolar + menu mobile ---------- */
  const nav = document.querySelector('.nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const menu = document.getElementById('menu');
  const toggle = document.getElementById('menuToggle');
  toggle.addEventListener('click', () => menu.classList.toggle('open'));
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => menu.classList.remove('open')));

  /* ---------- SCROLL REVEAL ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* ---------- UTIL: animação crescente de número ---------- */
  function animateValue(el, start, end, duration, formatter) {
    const startTime = performance.now();
    function frame(now) {
      const p = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      const val = start + (end - start) * eased;
      el.textContent = formatter ? formatter(val) : Math.round(val).toLocaleString('pt-BR');
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = formatter ? formatter(end) : Math.round(end).toLocaleString('pt-BR');
    }
    requestAnimationFrame(frame);
  }

  const moneyFmt = (v) => 'R$ ' + Math.round(v).toLocaleString('pt-BR');

  /* ---------- HERO: contadores ---------- */
  const heroStats = document.querySelectorAll('[data-count]');
  const heroIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const target = +e.target.dataset.count;
        animateValue(e.target, 0, target, 1400);
        heroIO.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  heroStats.forEach(el => heroIO.observe(el));

  /* ---------- CALCULADORA ---------- */
  const elAluguel = document.getElementById('aluguel');
  const elEventos = document.getElementById('eventos');
  const elMeses = document.getElementById('meses');
  const elMesesLabel = document.getElementById('mesesLabel');
  const picks = document.querySelectorAll('input[name="pista"]');

  const out = {
    mensal: document.getElementById('rMensal'),
    anual: document.getElementById('rAnual'),
    total: document.getElementById('rTotal'),
    payback: document.getElementById('rPayback'),
    lucro: document.getElementById('rLucro'),
    cinco: document.getElementById('r5anos'),
  };

  // guarda valores anteriores para animar a partir deles
  const prev = { mensal: 0, anual: 0, total: 0, lucro: 0, cinco: 0 };

  function getInvestimento() {
    const checked = document.querySelector('input[name="pista"]:checked');
    return +checked.value;
  }

  function calcular() {
    const aluguel = Math.max(0, +elAluguel.value || 0);
    const eventos = Math.max(0, +elEventos.value || 0);
    const meses = Math.max(1, +elMeses.value || 1);
    const investimento = getInvestimento();

    const mensal = aluguel * eventos;
    const anual = mensal * 12;
    const total = mensal * meses;
    const cinco = mensal * 60;
    const lucro = total - investimento;

    elMesesLabel.textContent = meses;

    // Payback: em eventos e em meses
    let paybackTxt;
    if (mensal <= 0 || aluguel <= 0) {
      paybackTxt = '—';
    } else {
      const eventosParaPagar = Math.ceil(investimento / aluguel);
      const mesesParaPagar = Math.ceil(investimento / mensal);
      paybackTxt = eventosParaPagar + ' eventos (~' + mesesParaPagar + ' ' + (mesesParaPagar === 1 ? 'mês' : 'meses') + ')';
    }

    // anima os valores monetários
    animateValue(out.mensal, prev.mensal, mensal, 700, moneyFmt);
    animateValue(out.anual, prev.anual, anual, 700, moneyFmt);
    animateValue(out.total, prev.total, total, 700, moneyFmt);
    animateValue(out.lucro, prev.lucro, lucro, 700, moneyFmt);
    animateValue(out.cinco, prev.cinco, cinco, 700, moneyFmt);
    out.payback.textContent = paybackTxt;

    prev.mensal = mensal; prev.anual = anual; prev.total = total; prev.lucro = lucro; prev.cinco = cinco;

    // atualiza gráficos
    drawCharts({ mensal, meses, investimento });
  }

  // Sincroniza destaque visual dos cards de pista
  picks.forEach(p => p.addEventListener('change', () => {
    document.querySelectorAll('.pick').forEach(l => l.classList.remove('active'));
    p.closest('.pick').classList.add('active');
    calcular();
  }));

  [elAluguel, elEventos].forEach(el => el.addEventListener('input', calcular));
  elMeses.addEventListener('input', calcular);

  /* ---------- GRÁFICOS (canvas, sem libs) ---------- */
  const charts = {
    fat: document.getElementById('chartFaturamento'),
    ret: document.getElementById('chartRetorno'),
    luc: document.getElementById('chartLucro'),
  };

  // ajusta resolução para telas retina
  function fitCanvas(canvas) {
    const ratio = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.height; // altura fixa via atributo
    canvas.width = w * ratio;
    canvas.style.height = h + 'px';
    canvas.height = h * ratio;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { ctx, w, h };
  }

  function seriesAcumulada(mensal, meses) {
    const arr = [];
    for (let m = 1; m <= meses; m++) arr.push(mensal * m);
    return arr;
  }

  // desenha gráfico de área/linha genérico
  function drawLineChart(canvas, data, opts) {
    const { ctx, w, h } = fitCanvas(canvas);
    ctx.clearRect(0, 0, w, h);
    const pad = { l: 12, r: 12, t: 14, b: 18 };
    const plotW = w - pad.l - pad.r;
    const plotH = h - pad.t - pad.b;

    const maxV = Math.max(opts.refLine || 0, ...data, 1);
    const minV = Math.min(0, ...data);
    const range = maxV - minV || 1;
    const x = (i) => pad.l + (data.length <= 1 ? 0 : (i / (data.length - 1)) * plotW);
    const y = (v) => pad.t + plotH - ((v - minV) / range) * plotH;

    // grade horizontal
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let g = 0; g <= 3; g++) {
      const gy = pad.t + (plotH / 3) * g;
      ctx.beginPath(); ctx.moveTo(pad.l, gy); ctx.lineTo(w - pad.r, gy); ctx.stroke();
    }

    // linha de referência (investimento)
    if (opts.refLine) {
      const ry = y(opts.refLine);
      ctx.save();
      ctx.strokeStyle = 'rgba(229,9,20,0.85)';
      ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(pad.l, ry); ctx.lineTo(w - pad.r, ry); ctx.stroke();
      ctx.restore();
    }

    if (data.length === 0) return;

    // área preenchida
    const grad = ctx.createLinearGradient(0, pad.t, 0, h);
    grad.addColorStop(0, opts.fill0);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.moveTo(x(0), y(data[0]));
    data.forEach((v, i) => ctx.lineTo(x(i), y(v)));
    ctx.lineTo(x(data.length - 1), pad.t + plotH);
    ctx.lineTo(x(0), pad.t + plotH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // linha
    ctx.beginPath();
    ctx.moveTo(x(0), y(data[0]));
    data.forEach((v, i) => ctx.lineTo(x(i), y(v)));
    ctx.strokeStyle = opts.stroke;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.shadowColor = opts.stroke;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // ponto final
    const lastX = x(data.length - 1), lastY = y(data[data.length - 1]);
    ctx.beginPath(); ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#fff'; ctx.fill();
  }

  // desenha gráfico de barras (lucro acumulado pode ser negativo)
  function drawBarChart(canvas, data) {
    const { ctx, w, h } = fitCanvas(canvas);
    ctx.clearRect(0, 0, w, h);
    const pad = { l: 12, r: 12, t: 14, b: 18 };
    const plotW = w - pad.l - pad.r;
    const plotH = h - pad.t - pad.b;
    const maxV = Math.max(1, ...data);
    const minV = Math.min(0, ...data);
    const range = maxV - minV || 1;
    const zeroY = pad.t + plotH - ((0 - minV) / range) * plotH;

    // máximo de barras visíveis para não poluir
    const step = Math.ceil(data.length / 24) || 1;
    const bars = data.filter((_, i) => i % step === 0);
    const bw = plotW / bars.length;

    bars.forEach((v, i) => {
      const bx = pad.l + i * bw + bw * 0.15;
      const bWidth = bw * 0.7;
      const vy = pad.t + plotH - ((v - minV) / range) * plotH;
      const top = Math.min(vy, zeroY);
      const height = Math.abs(zeroY - vy);
      const grad = ctx.createLinearGradient(0, top, 0, top + height);
      if (v >= 0) { grad.addColorStop(0, 'rgba(255,90,90,0.95)'); grad.addColorStop(1, 'rgba(229,9,20,0.4)'); }
      else { grad.addColorStop(0, 'rgba(255,255,255,0.4)'); grad.addColorStop(1, 'rgba(255,255,255,0.1)'); }
      ctx.fillStyle = grad;
      ctx.beginPath();
      const r = Math.min(4, bWidth / 2);
      roundRect(ctx, bx, top, bWidth, Math.max(height, 1), r);
      ctx.fill();
    });

    // linha do zero
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.moveTo(pad.l, zeroY); ctx.lineTo(w - pad.r, zeroY); ctx.stroke();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawCharts({ mensal, meses, investimento }) {
    const faturamento = seriesAcumulada(mensal, meses);
    const lucro = faturamento.map(v => v - investimento);

    drawLineChart(charts.fat, faturamento, {
      stroke: '#ff2d2d', fill0: 'rgba(229,9,20,0.3)',
    });
    drawLineChart(charts.ret, faturamento, {
      stroke: '#ffffff', fill0: 'rgba(255,255,255,0.14)', refLine: investimento,
    });
    drawBarChart(charts.luc, lucro);
  }

  // recalcula gráficos ao redimensionar
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(calcular, 150);
  });

  // primeira renderização
  calcular();

  /* ---------- CARROSSEL ---------- */
  const track = document.getElementById('carTrack');
  const slides = track ? track.children.length : 0;
  let idx = 0;
  function goTo(n) {
    idx = (n + slides) % slides;
    track.style.transform = `translateX(-${idx * 100}%)`;
  }
  const prevBtn = document.getElementById('carPrev');
  const nextBtn = document.getElementById('carNext');
  if (prevBtn && nextBtn && slides) {
    prevBtn.addEventListener('click', () => goTo(idx - 1));
    nextBtn.addEventListener('click', () => goTo(idx + 1));
    // autoplay suave
    setInterval(() => goTo(idx + 1), 5000);
  }

});
