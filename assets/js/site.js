(function () {
  // 手機選單
  var burger = document.querySelector('.burger');
  var body = document.body;
  if (burger) {
    burger.addEventListener('click', function () {
      var open = body.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? '關閉選單' : '開啟選單');
    });
    document.querySelectorAll('.menu a').forEach(function (a) {
      a.addEventListener('click', function () { body.classList.remove('is-open'); });
    });
  }

  // 手記列表頁的標籤篩選
  var tagbar = document.querySelector('.tagbar');
  if (tagbar) {
    var btns = tagbar.querySelectorAll('.tag');
    var cards = document.querySelectorAll('.cards--list .card');

    var applyTag = function (tag) {
      btns.forEach(function (b) {
        var on = b.getAttribute('data-tag') === tag;
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      cards.forEach(function (c) {
        if (!tag) { c.classList.remove('is-hide'); return; }
        var tags = ' ' + (c.getAttribute('data-tags') || '') + ' ';
        c.classList.toggle('is-hide', tags.indexOf(' ' + tag + ' ') === -1);
      });
    };

    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var tag = b.getAttribute('data-tag') || '';
        applyTag(tag);
        try {
          if (tag) history.replaceState(null, '', '#tag=' + encodeURIComponent(tag));
          else history.replaceState(null, '', location.pathname + location.search);
        } catch (e) { /* 沒有 history API 就算了 */ }
      });
    });

    try {
      var hash = location.hash.replace(/^#tag=/, '');
      if (hash) {
        var tag = decodeURIComponent(hash);
        var match = tagbar.querySelector('.tag[data-tag="' + tag + '"]');
        if (match) applyTag(tag);
      }
    } catch (e) { /* hash 格式不對就當沒選 */ }
  }

  // 「新」徽章：手記有沒有出過新文章
  var dots = document.querySelectorAll('.newdot');
  if (dots.length) {
    var latest = dots[0].getAttribute('data-latest') || '';
    var onWritings = location.pathname === '/writings/' || location.pathname === '/writings/index.html';
    var tooOld = !latest || (Date.now() - new Date(latest + 'T00:00:00+08:00').getTime() > 60 * 86400000);
    var seen = null;
    try { seen = localStorage.getItem('ec-seen-latest'); } catch (e) { /* 存取失敗就當沒看過 */ }

    if (onWritings) {
      try { localStorage.setItem('ec-seen-latest', latest); } catch (e) { /* 寫不進去就算了 */ }
    } else if (!tooOld && (!seen || seen < latest)) {
      dots.forEach(function (d) { d.hidden = false; });
      var burgerDot = document.querySelector('.burger__dot');
      if (burgerDot) burgerDot.hidden = false;
    }
  }

  // 首頁透明導覽列，捲動後變實心
  var nav = document.querySelector('.nav--over');
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle('is-stuck', window.scrollY > 40);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // 捲入淡出
  var targets = document.querySelectorAll('.sec .wrap > *, .band__in > *, .cta__in > *');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
  );
  targets.forEach(function (el, i) {
    el.classList.add('reveal');
    el.style.transitionDelay = Math.min(i % 4, 3) * 70 + 'ms';
    io.observe(el);
  });
})();
