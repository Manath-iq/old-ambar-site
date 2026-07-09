/* ============================================================
   «Старый Амбар» — скрипты лендинга
   ============================================================ */
(function(){
  'use strict';

  /* ============ HERO: scroll-scrub видео ============ */
  // all-intra версии (каждый кадр — keyframe) для мгновенной перемотки
  var isSmall   = Math.min(window.innerWidth, window.screen.width) < 768;
  var VIDEO_SRC = isSmall ? 'video/hero-scrub-mobile.mp4' : 'video/hero-scrub-desktop.mp4';

  var video   = document.getElementById('heroVideo');
  var curtain = document.getElementById('curtain');
  var nav     = document.getElementById('nav');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function attachVideo(src){ video.src = src; video.load(); }
  // качаем целиком как blob — скраббинг без сетевых пауз;
  // если fetch не удался, подключаем файл напрямую
  fetch(VIDEO_SRC)
    .then(function(r){ if(!r.ok) throw 0; return r.blob(); })
    .then(function(b){ attachVideo(URL.createObjectURL(b)); })
    .catch(function(){ attachVideo(VIDEO_SRC); });

  window.addEventListener('load', function(){
    setTimeout(function(){ curtain.classList.add('is-done'); }, 700);
  });
  setTimeout(function(){ curtain.classList.add('is-done'); }, 2600); // страховка

  window.addEventListener('scroll', function(){
    nav.classList.toggle('is-scrolled', window.scrollY > 40);
  }, { passive: true });

  /* live-статус «открыто до…» (пт/сб — до 02:00) */
  (function(){
    var day  = new Date().getDay(); // 5 = пт, 6 = сб
    var till = (day === 5 || day === 6) ? '02:00' : '01:00';
    var hero = document.getElementById('openStatus');
    var top  = document.getElementById('navOpen');
    var mm   = document.getElementById('mmOpen');
    if (hero) hero.textContent = 'Сегодня открыто до ' + till;
    if (top)  top.textContent  = 'Открыто до ' + till;
    if (mm)   mm.textContent   = 'Открыто до ' + till;
  })();

  if (!reduced){
    gsap.registerPlugin(ScrollTrigger);

    /* вход первой главы */
    gsap.set('#ch1 .h1-line > span', { yPercent: 110 });
    gsap.set(['#ch1 .eyebrow', '#ch1 .h1-script', '#ch1 .hero-sub-row'], { autoAlpha: 0, y: 26 });
    gsap.timeline({ delay: .9 })
      .to('#ch1 .h1-line > span', { yPercent: 0, duration: 1.25, ease: 'power4.out', stagger: .12 })
      .to('#ch1 .h1-script',  { autoAlpha: 1, y: 0, duration: .8, ease: 'power3.out' }, '-=.95')
      .to('#ch1 .eyebrow',    { autoAlpha: 1, y: 0, duration: .7, ease: 'power3.out' }, '-=.7')
      .to('#ch1 .hero-sub-row', { autoAlpha: 1, y: 0, duration: .8, ease: 'power3.out' }, '-=.55');

    /* скраб видео по прогрессу скролла */
    var targetTime = 0, currentTime = 0, videoReady = false;
    video.addEventListener('loadedmetadata', function(){ videoReady = true; });

    ScrollTrigger.create({
      trigger: '#heroTrack',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: function(self){
        if (videoReady) targetTime = self.progress * Math.max(video.duration - .05, 0);
      }
    });

    gsap.ticker.add(function(){
      if (!videoReady) return;
      currentTime += (targetTime - currentTime) * 0.16;   // мягкая инерция
      if (Math.abs(video.currentTime - currentTime) > 0.002)
        video.currentTime = currentTime;                  // all-intra: seek за ~1 кадр
    });

    /* главы: появление/уход по прогрессу трека */
    var chapters = [
      { el: '#ch1', hold: [0.00, 0.26] },
      { el: '#ch2', hold: [0.40, 0.62] },
      { el: '#ch3', hold: [0.78, 1.01] }
    ];
    var FADE = 0.09;

    gsap.set('#ch2, #ch3', { autoAlpha: 0 });
    gsap.set('#ch2 .q-inner, #ch3 .q-inner', { y: 40 });

    var railNums = document.querySelectorAll('.rail-num');
    var railFill = document.getElementById('railFill');
    function clamp01(v){ return Math.max(0, Math.min(1, v)); }

    ScrollTrigger.create({
      trigger: '#heroTrack',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: function(self){
        var p = self.progress;
        var active = 0;
        chapters.forEach(function(ch, i){
          var el = document.querySelector(ch.el);
          var inP  = i === 0 ? 1 : clamp01((p - ch.hold[0]) / FADE);
          var outP = i === chapters.length - 1 ? 0 : clamp01((p - ch.hold[1]) / FADE);
          var vis = inP * (1 - outP);
          gsap.set(el, { autoAlpha: vis });
          el.dataset.hidden = vis < .5;
          var inner = el.querySelector('.q-inner');
          if (inner) gsap.set(inner, { y: 40 * (1 - inP) - 20 * outP });
          if (i === 0) gsap.set(el, { y: -60 * outP });
          if (p >= ch.hold[0] - FADE) active = i;
        });
        railNums.forEach(function(n){
          n.classList.toggle('is-active', +n.dataset.rail === active);
        });
        railFill.style.transform = 'scaleY(' + p + ')';
        gsap.set('.util-scroll', { autoAlpha: p < .04 ? 1 : 0 });
      }
    });
  } else {
    // reduced motion: тихий цикл без пина и скраба
    video.loop = true; video.autoplay = true;
    video.addEventListener('loadeddata', function(){ video.play().catch(function(){}); });
  }

  /* ============ scroll reveals ============ */
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (e.isIntersecting){ e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.rv').forEach(function(el){ io.observe(el); });

  /* ============ сценарии: раскрывающиеся панели ============ */
  var panels = document.querySelectorAll('[data-scen]');
  function openPanel(p){
    panels.forEach(function(x){ x.classList.toggle('is-open', x === p); });
  }
  panels.forEach(function(p){
    p.addEventListener('mouseenter', function(){
      if (window.matchMedia('(hover: hover)').matches) openPanel(p);
    });
    p.addEventListener('click', function(e){
      if (!p.classList.contains('is-open')){ e.preventDefault(); openPanel(p); }
    });
  });

  /* ============ меню: плавающее превью за курсором ============ */
  (function(){
    if (!window.matchMedia('(hover: hover) and (min-width: 1024px)').matches) return;
    var wrap  = document.getElementById('dishList');
    var float = document.getElementById('dishFloat');
    if (!wrap || !float) return;
    var imgs = {};
    wrap.querySelectorAll('.dish').forEach(function(d){
      var src = d.dataset.img;
      var im = document.createElement('img');
      im.src = src; im.alt = '';
      float.appendChild(im);
      imgs[src] = im;
    });
    var fx = gsap.quickTo(float, 'x', { duration: .45, ease: 'power3.out' });
    var fy = gsap.quickTo(float, 'y', { duration: .45, ease: 'power3.out' });
    var current = null;
    wrap.addEventListener('mousemove', function(e){
      fx(e.clientX + 28);
      fy(e.clientY - 85);
      var row = e.target.closest('.dish');
      if (row && row.dataset.img !== current){
        current = row.dataset.img;
        Object.keys(imgs).forEach(function(k){ imgs[k].classList.toggle('is-on', k === current); });
      }
      float.classList.toggle('is-on', !!row);
    });
    wrap.addEventListener('mouseleave', function(){
      float.classList.remove('is-on');
      current = null;
    });
  })();

  /* ============ бизнес-ланч: live-индикатор ============ */
  (function(){
    var box = document.getElementById('lunchLive');
    var txt = document.getElementById('lunchLiveText');
    if (!box) return;
    var now = new Date();
    var d = now.getDay(), h = now.getHours();
    var live = d >= 1 && d <= 5 && h >= 11 && h < 16;
    box.dataset.live = live ? 'on' : 'off';
    txt.textContent = live ? 'Ланч подают прямо сейчас' : 'Ланч по будням с 11:00 до 16:00';
  })();

  /* ============ банкетный калькулятор ============ */
  (function(){
    var form = document.getElementById('banqForm');
    if (!form) return;
    var range = document.getElementById('banqGuests');
    var out   = document.getElementById('guestsVal');
    var total = document.getElementById('banqTotal');

    function fmt(n){ return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽'; }
    function recalc(){
      var g = +range.value;
      var t = +form.querySelector('input[name="tier"]:checked').value;
      out.textContent = g;
      total.textContent = fmt(g * t);
      var pct = (g - range.min) / (range.max - range.min) * 100;
      range.style.setProperty('--fill', pct + '%');
    }
    range.addEventListener('input', recalc);
    form.querySelectorAll('input[name="tier"]').forEach(function(r){ r.addEventListener('change', recalc); });
    recalc();

    // в прошлое банкет не заказать
    var banqDate = document.getElementById('banqDate');
    if (banqDate) banqDate.min = new Date().toISOString().split('T')[0];

    form.addEventListener('submit', function(e){
      e.preventDefault();
      var phone = document.getElementById('banqPhone');
      var field = document.getElementById('banqPhoneField');
      var ok = /\d{6,}/.test(phone.value.replace(/\D/g,''));
      field.classList.toggle('has-err', !ok);
      if (!ok){ phone.focus(); return; }
      form.querySelector('.btn').style.display = 'none';
      document.getElementById('banqOk').classList.add('is-on');
    });
  })();

  /* ============ FAQ ============ */
  document.querySelectorAll('.faq-item').forEach(function(item){
    var q = item.querySelector('.faq-q');
    var a = item.querySelector('.faq-a');
    q.addEventListener('click', function(){
      var open = item.classList.contains('is-open');
      document.querySelectorAll('.faq-item.is-open').forEach(function(x){
        x.classList.remove('is-open');
        x.querySelector('.faq-a').style.maxHeight = '';
        x.querySelector('.faq-q').setAttribute('aria-expanded','false');
      });
      if (!open){
        item.classList.add('is-open');
        a.style.maxHeight = a.scrollHeight + 'px';
        q.setAttribute('aria-expanded','true');
      }
    });
  });

  /* ============ бронь: форма ============ */
  (function(){
    var form = document.getElementById('bookForm');
    if (!form) return;
    var today = new Date().toISOString().split('T')[0];
    var d = document.getElementById('bkDate');
    d.value = today; d.min = today;
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var phone = document.getElementById('bkPhone');
      var field = document.getElementById('bkPhoneField');
      var ok = /\d{6,}/.test(phone.value.replace(/\D/g,''));
      field.classList.toggle('has-err', !ok);
      if (!ok){ phone.focus(); return; }
      form.style.display = 'none';
      document.querySelector('.final-micro').style.display = 'none';
      document.getElementById('bookOk').classList.add('is-on');
    });
  })();
})();
