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

  // Animação demonstrativa do kanban (só na home) — cursor simulado + arraste com FLIP
  var board = document.querySelector('[data-kanban="demo"]');
  if (board && !reduce) {
    var mock = board.closest('.mock') || board;
    mock.style.position = 'relative';
    var initialClone = board.cloneNode(true); // snapshot dos nós estáticos p/ reset

    // Cursor falso: seta (repouso/hover) + mão fechada (arraste)
    var cursor = document.createElement('div');
    cursor.className = 'kbd-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML =
      '<svg class="kbd-cursor__arrow" width="24" height="24" viewBox="0 0 24 24">' +
        '<path d="M2 2 L2 20 L7 15.5 L10.6 22 L13.6 20.6 L10 14.2 L16.6 14.2 Z" fill="#ffffff" stroke="var(--fg)" stroke-width="1.4" stroke-linejoin="round"/>' +
      '</svg>' +
      '<svg class="kbd-cursor__hand" width="30" height="30" viewBox="0 0 28 28">' +
        '<g fill="#ffffff" stroke="var(--fg)" stroke-width="1.5" stroke-linejoin="round">' +
          '<rect x="7.2" y="8.5" width="3.9" height="7" rx="1.95"/>' +
          '<rect x="10.7" y="7.6" width="3.9" height="7.9" rx="1.95"/>' +
          '<rect x="14.2" y="8.1" width="3.9" height="7.4" rx="1.95"/>' +
          '<rect x="17.5" y="9.6" width="3.7" height="6" rx="1.85"/>' +
          '<rect x="3.8" y="13.4" width="5" height="5" rx="2.5"/>' +
          '<rect x="6.5" y="11.6" width="15" height="10" rx="3.8"/>' +
        '</g>' +
      '</svg>';
    mock.appendChild(cursor);

    var toLocal = function (cx, cy) {
      var r = mock.getBoundingClientRect();
      return { x: cx - r.left, y: cy - r.top };
    };
    var rectCenter = function (r) { return toLocal(r.left + r.width / 2, r.top + r.height / 2); };
    var centerOf = function (el) { return rectCenter(el.getBoundingClientRect()); };

    var placeCursor = function (pt, ms, ease) {
      cursor.style.transition = 'transform ' + (ms || 0) + 'ms ' + (ease || 'cubic-bezier(.4,.2,.2,1)') + ', opacity 320ms ease';
      cursor.style.transform = 'translate(' + pt.x + 'px,' + pt.y + 'px)';
    };
    var grab = function (on) { cursor.classList.toggle('is-grab', on); };

    // Reserva a altura do "pior caso" (coluna Proposta com 3 cartões) para o
    // quadro não redimensionar quando a coluna encher. Mede num clone oculto,
    // à largura atual, para respeitar quebras de linha e responsividade.
    var worstColHeight = function () {
      var probe = initialClone.cloneNode(true);
      probe.style.position = 'absolute';
      probe.style.left = '-9999px';
      probe.style.top = '0';
      probe.style.visibility = 'hidden';
      probe.style.minHeight = '0';
      probe.style.width = board.getBoundingClientRect().width + 'px';
      board.parentNode.appendChild(probe);
      var pcol = probe.querySelector('[data-col="proposta"]');
      pcol.appendChild(probe.querySelector('[data-card="ensaio"]').cloneNode(true));
      pcol.appendChild(probe.querySelector('[data-card="casamento"]').cloneNode(true));
      var h = Math.ceil(pcol.getBoundingClientRect().height);
      board.parentNode.removeChild(probe);
      return h;
    };

    var lockColumns = function () {
      var h = worstColHeight();
      if (!h) { return; }
      Array.prototype.forEach.call(board.querySelectorAll('.kanban__col'), function (col) {
        col.style.minHeight = h + 'px';
      });
    };

    var reset = function () {
      while (board.firstChild) { board.removeChild(board.firstChild); }
      var fresh = initialClone.cloneNode(true);
      while (fresh.firstChild) { board.appendChild(fresh.firstChild); }
      lockColumns();
    };

    var wait = function (ms) {
      return new Promise(function (res) { setTimeout(res, ms); });
    };

    var bump = function (colKey, delta) {
      var el = board.querySelector('[data-col="' + colKey + '"] [data-count]');
      if (el) { el.textContent = String((parseInt(el.textContent, 10) || 0) + delta); }
    };

    var DRAG = 620;
    var EASE = 'cubic-bezier(.22,.61,.36,1)';

    var move = async function (cardSel, fromKey, toKey, won) {
      var card = board.querySelector(cardSel);
      var target = board.querySelector('[data-col="' + toKey + '"]');
      if (!card || !target) { return; }

      // 1. cursor (seta) se aproxima e paira sobre o card
      placeCursor(centerOf(card), 480, 'cubic-bezier(.45,.05,.35,1)');
      await wait(520);

      // 2. "pega": cursor vira mão fechada e o card levanta
      grab(true);
      card.classList.add('kanban__card--drag');
      await wait(190);

      // 3. FLIP do card + cursor acompanhando até o destino
      var cards = Array.prototype.slice.call(board.querySelectorAll('.kanban__card'));
      var firsts = cards.map(function (c) { return c.getBoundingClientRect(); });
      var idx = cards.indexOf(card);

      target.appendChild(card);
      bump(fromKey, -1); bump(toKey, 1);
      if (won) { card.classList.add('kanban__card--won'); }

      var lasts = cards.map(function (c) { return c.getBoundingClientRect(); });
      var dropCenter = rectCenter(lasts[idx]);
      cards.forEach(function (c, i) {
        var dx = firsts[i].left - lasts[i].left;
        var dy = firsts[i].top - lasts[i].top;
        c.style.transition = 'none';
        c.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      });
      void board.offsetWidth; // força reflow
      cards.forEach(function (c) {
        c.style.transition = 'transform ' + DRAG + 'ms ' + EASE;
        c.style.transform = 'translate(0,0)';
      });
      placeCursor(dropCenter, DRAG, EASE); // cursor viaja junto com o card
      await wait(DRAG + 60);

      // 4. "solta": mão volta a ser seta e o card assenta
      cards.forEach(function (c) { c.style.transition = ''; c.style.transform = ''; });
      card.classList.remove('kanban__card--drag');
      grab(false);
      await wait(150);
    };

    var cycle = async function () {
      placeCursor(centerOf(board), 0);
      cursor.classList.add('is-on');
      await wait(650);
      await move('[data-card="ensaio"]', 'qualificacao', 'proposta');
      await wait(430);
      await move('[data-card="casamento"]', 'qualificacao', 'proposta');
      await wait(430);
      await move('[data-card="casamento"]', 'proposta', 'fechado', true);

      // repouso: o cursor se afasta, some e a animação reinicia
      var c = centerOf(board);
      placeCursor({ x: c.x + 46, y: c.y + 72 }, 700, 'cubic-bezier(.45,.05,.35,1)');
      await wait(2400);
      cursor.classList.remove('is-on');
      await wait(340);
      reset();
      cycle();
    };

    lockColumns(); // reserva a altura já no carregamento, antes de entrar em cena

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
