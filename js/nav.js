/* ============================================================
   «Старый Амбар» — бургер-меню (общий для index.html и menu.html)
   ============================================================ */
(function(){
  'use strict';

  var burger = document.getElementById('navBurger');
  var menu   = document.getElementById('mobileMenu');
  if (!burger || !menu) return;

  function setOpen(open){
    burger.classList.toggle('is-open', open);
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('mm-lock', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    menu.setAttribute('aria-hidden', String(!open));
  }

  burger.addEventListener('click', function(){
    setOpen(!menu.classList.contains('is-open'));
  });

  // по клику на пункт закрываем — якоря ведут на этой же странице
  menu.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){ setOpen(false); });
  });

  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') setOpen(false);
  });
})();
