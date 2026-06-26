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

  // Efeito de digitação na frase
  const tag = intro.querySelector('.intro-tag');
  if (tag) {
    const full = tag.textContent.trim();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      tag.textContent = full;
    } else {
      tag.textContent = '';
      let i = 0;
      (function type() {
        tag.textContent = full.slice(0, i);
        if (i++ <= full.length) setTimeout(type, 60);
      })();
    }
  }
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
  }

  // Sincroniza destaque visual dos cards de pista
  picks.forEach(p => p.addEventListener('change', () => {
    document.querySelectorAll('.pick').forEach(l => l.classList.remove('active'));
    p.closest('.pick').classList.add('active');
    calcular();
  }));

  [elAluguel, elEventos].forEach(el => el.addEventListener('input', calcular));
  elMeses.addEventListener('input', calcular);

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
