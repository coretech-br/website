// Core Technology — interações compartilhadas do site institucional
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Menu mobile
  var nav = document.querySelector('[data-nav]');
  var burger = document.querySelector('[data-burger]');
  if (nav && burger) {
    burger.addEventListener('click', function () {
      var open = nav.getAttribute('data-open') === 'true';
      nav.setAttribute('data-open', String(!open));
      burger.setAttribute('aria-expanded', String(!open));
    });
    nav.querySelectorAll('.nav__links a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.setAttribute('data-open', 'false');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Revelação ao rolar
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && items.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  // Palavra rotativa no título do hero
  var rot = document.querySelector('[data-rotate]');
  if (rot) {
    var words = (rot.getAttribute('data-words') || '').split('|').filter(Boolean);
    if (words.length) {
      rot.textContent = words[0];
      if (!reduce) {
        var i = 0;
        setInterval(function () {
          i = (i + 1) % words.length;
          rot.classList.add('is-out');
          setTimeout(function () {
            rot.textContent = words[i];
            rot.classList.remove('is-out');
          }, 260);
        }, 2600);
      }
    }
  }

  // Ano no rodapé
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
