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

  // Animação demonstrativa do kanban (só na home) — arraste de cartões com FLIP
  var board = document.querySelector('[data-kanban="demo"]');
  if (board && !reduce) {
    var initialClone = board.cloneNode(true); // snapshot dos nós estáticos p/ reset

    var reset = function () {
      while (board.firstChild) { board.removeChild(board.firstChild); }
      var fresh = initialClone.cloneNode(true);
      while (fresh.firstChild) { board.appendChild(fresh.firstChild); }
    };

    var wait = function (ms) {
      return new Promise(function (res) { setTimeout(res, ms); });
    };

    var bump = function (colKey, delta) {
      var el = board.querySelector('[data-col="' + colKey + '"] [data-count]');
      if (el) { el.textContent = String((parseInt(el.textContent, 10) || 0) + delta); }
    };

    var move = function (cardSel, fromKey, toKey, won) {
      var card = board.querySelector(cardSel);
      var target = board.querySelector('[data-col="' + toKey + '"]');
      if (!card || !target) { return Promise.resolve(); }
      var cards = Array.prototype.slice.call(board.querySelectorAll('.kanban__card'));
      var firsts = cards.map(function (c) { return c.getBoundingClientRect(); });

      // muta o DOM: reparenta o cartão, atualiza contadores e marca sucesso
      card.classList.add('kanban__card--drag');
      target.appendChild(card);
      bump(fromKey, -1); bump(toKey, 1);
      if (won) { card.classList.add('kanban__card--won'); }

      // FLIP: inverte para a posição antiga e depois anima até a nova
      var lasts = cards.map(function (c) { return c.getBoundingClientRect(); });
      cards.forEach(function (c, i) {
        var dx = firsts[i].left - lasts[i].left;
        var dy = firsts[i].top - lasts[i].top;
        c.style.transition = 'none';
        c.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      });
      void board.offsetWidth; // força reflow
      cards.forEach(function (c) {
        c.style.transition = 'transform 520ms cubic-bezier(.22,.61,.36,1)';
        c.style.transform = 'translate(0,0)';
      });
      return wait(560).then(function () {
        cards.forEach(function (c) { c.style.transition = ''; c.style.transform = ''; });
        card.classList.remove('kanban__card--drag');
      });
    };

    var cycle = function () {
      wait(900)
        .then(function () { return move('[data-card="ensaio"]', 'qualificacao', 'proposta'); })
        .then(function () { return wait(650); })
        .then(function () { return move('[data-card="casamento"]', 'qualificacao', 'proposta'); })
        .then(function () { return wait(650); })
        .then(function () { return move('[data-card="casamento"]', 'proposta', 'fechado', true); })
        .then(function () { return wait(3000); })
        .then(function () { reset(); cycle(); });
    };

    var started = false;
    if ('IntersectionObserver' in window) {
      var kio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && !started) { started = true; cycle(); }
        });
      }, { threshold: 0.35 });
      kio.observe(board);
    } else {
      cycle();
    }
  }

  // Ano no rodapé
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
