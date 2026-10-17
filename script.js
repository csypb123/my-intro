/* =========================================================
   杨鹏博 · 个人主页  |  交互与滚动动画
   纯原生 JS，无任何依赖
   ========================================================= */
(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ---------------------------------------------------------
     0. 准备：给需要延迟的元素写入 --rv-delay
     --------------------------------------------------------- */
  $$('[data-delay]').forEach(function (el) {
    el.style.setProperty('--rv-delay', el.getAttribute('data-delay') + 'ms');
  });

  /* ---------------------------------------------------------
     1. 开场加载 → 入场
     加载层的显示/隐藏由 index.html 里的内联脚本负责（这样 script.js
     没加载成功也不会卡住）。这里只负责接住「加载完成」的信号，
     然后给 <html> 加上 is-ready，触发首屏的入场动画。
     --------------------------------------------------------- */
  var preloaderEl = $('#preloader');
  var entranceDone = false;

  function startEntrance() {
    if (entranceDone) return;
    entranceDone = true;
    // 入场动画全部限定在 html.is-ready 下，所以到点移除这个 class 即可
    // 干净地退回常态（不写任何内联样式，避免和视差/滚动显现抢 opacity）
    document.documentElement.classList.add('is-ready');
    window.setTimeout(function () {
      document.documentElement.classList.remove('is-ready');
    }, 1400);
  }

  window.addEventListener('ypb:loaded', startEntrance);
  // 加载层可能已经让开了（脚本晚到）或干脆不存在，兜底也要入场
  window.setTimeout(startEntrance, 2800);
  if (!preloaderEl) startEntrance();

  /* ---------------------------------------------------------
     2. 标题逐字上浮
     --------------------------------------------------------- */
  $$('[data-split]').forEach(function (el) {
    var text = el.textContent.trim();
    el.textContent = '';
    var frag = document.createDocumentFragment();
    var n = text.length || 1;
    Array.prototype.forEach.call(text, function (ch, i) {
      var span = document.createElement('span');
      span.className = 'char';
      span.style.setProperty('--i', i);
      span.style.setProperty('--n', n);   // 供渐变按字序错位使用
      span.textContent = ch;
      frag.appendChild(span);
    });
    el.appendChild(frag);
  });

  /* ---------------------------------------------------------
     3. 打字机
     --------------------------------------------------------- */
  (function typewriter() {
    var el = $('#typed');
    if (!el) return;
    var lines = [
      '计算机科学与技术 · 大一在读',
      '正在认真打基础，不断尝试',
      '喜欢番剧、游戏，还有安静写代码的夜晚',
      '最近在做：一个限时计数小游戏',
      '正在学习，正在探索，持续更新中'
    ];

    if (reduceMotion) { el.textContent = lines[0]; return; }

    var li = 0, ci = 0, deleting = false;
    (function tick() {
      var full = lines[li];
      if (!deleting) {
        ci++;
        el.textContent = full.slice(0, ci);
        if (ci === full.length) {
          deleting = true;
          return window.setTimeout(tick, 1900);
        }
        return window.setTimeout(tick, 95 + Math.random() * 70);
      }
      ci--;
      el.textContent = full.slice(0, ci);
      if (ci === 0) {
        deleting = false;
        li = (li + 1) % lines.length;
        return window.setTimeout(tick, 420);
      }
      window.setTimeout(tick, 42);
    })();
  })();

  /* ---------------------------------------------------------
     4b. 技能条进度
     --------------------------------------------------------- */
  var skills = $$('.skill');
  if (skills.length) {
    if (hasIO && !reduceMotion) {
      var sIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('is-in'); sIO.unobserve(e.target); }
        });
      }, { threshold: 0.4 });
      skills.forEach(function (el) { sIO.observe(el); });
    } else {
      skills.forEach(function (el) { el.classList.add('is-in'); });
    }
  }

  /* ---------------------------------------------------------
     4c. 背景音乐：播放控制 + 波形可视化
     （入口门已移除，音乐改由导航栏的 BGM 按钮与近况区的播放卡控制）
     --------------------------------------------------------- */
  (function bgm() {
    var audio   = $('#bgm');
    var toggle  = $('#bgmToggle');
    var playBtn = $('#bgmPlay');
    var muteBtn = $('#bgmMute');
    var restart = $('#bgmRestart');
    var vol     = $('#bgmVol');
    var volText = $('#bgmVolText');
    var card    = $('#bgmCard');
    var canvas  = $('#bgmWave');
    var bgmTip  = $('#bgmTip');
    if (!audio) return;

    /* ---------------------------------------------------------
       AudioContext 音频图：必须「懒创建」
       一旦调用 createMediaElementSource()，音频输出就只走这条链；
       而没有用户手势时创建的 AudioContext 处于 suspended 状态，
       结果就是「进度在前走、却完全没有声音」。
       所以等第一次真实手势（点击/按键/触摸）再建图，并反复尝试 resume。
       --------------------------------------------------------- */
    var ac = null, analyser = null, freq = null, graphTried = false;

    function resumeGraph() {
      if (!ac) return;
      if (ac.state === 'suspended') { try { ac.resume(); } catch (e) {} }
    }

    function ensureGraph() {
      if (graphTried) { resumeGraph(); return; }
      graphTried = true;
      if (!canvas) return;
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ac = new AC();
        var node = ac.createMediaElementSource(audio);
        analyser = ac.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.82;
        node.connect(analyser);
        analyser.connect(ac.destination);
        freq = new Uint8Array(analyser.frequencyBinCount);
      } catch (e) { analyser = null; }
      resumeGraph();
    }

    ['pointerdown', 'keydown', 'touchstart'].forEach(function (evName) {
      document.addEventListener(evName, function () { ensureGraph(); resumeGraph(); }, { passive: true });
    });


    var STORE = 'ypb-bgm';
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch (e) { saved = {}; }

    /* muted 只代表「用户明确关掉了声音」。
       自动播放被拒时浏览器会让元素进入临时静音，那不算用户选择，
       绝不能写进 localStorage —— 否则下次打开会永久没声音。 */
    var userMuted = !!saved.muted;

    /* 音量兜底：曾经把滑块拖到 0 也会造成「没声音」，这里恢复默认值 */
    var DEFAULT_VOL = 0.45;
    var initialVol = (typeof saved.vol === 'number' && saved.vol > 0.02)
      ? Math.min(saved.vol, 1) : DEFAULT_VOL;

    function save() {
      try {
        localStorage.setItem(STORE, JSON.stringify({ muted: !!userMuted, vol: audio.volume }));
      } catch (e) {}
    }

    /* ---------------------------------------------------------
       边看边预载：把 mp3 提前整段取下来，点播放时立刻出声
       （原来 preload="none"，点了才开始下载，慢网络要等十几秒）
       --------------------------------------------------------- */
    var audioReady = false;
    function setHint(text) { if (bgmTip) bgmTip.textContent = text; }

    function preloadAudio() {
      if (audioReady) return;
      var src = audio.getAttribute('src');
      if (!src || !window.fetch || !window.URL || !URL.createObjectURL) return;
      fetch(src, { cache: 'no-store' }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.blob();
      }).then(function (blob) {
        if (!blob || blob.size < 1024) throw new Error('文件异常');
        audioReady = true;
        audio.dataset.ready = '1';
        setHint('背景音乐已就绪（' + Math.round(blob.size / 1024) + ' KB），点右上角 BGM 按钮即可播放。');
        // 正在播放就别打断（慢网络重新载入反而更卡），下次打开直接用缓存
        if (!audio.paused && !audio.ended) return;
        var url = URL.createObjectURL(blob);
        var at = audio.currentTime;
        audio.src = url;
        audio.load();
        if (at > 0.3) { try { audio.currentTime = at; } catch (e) {} }
        syncUI();
      }).catch(function (err) {
        setHint('背景音乐预载失败（' + (err && err.message ? err.message : '网络') + '），点播放时会现场下载，可能要等几秒。');
      });
    }

    audio.volume = initialVol;
    audio.muted  = userMuted;
    if (vol) vol.value = Math.round(audio.volume * 100);
    if (volText) volText.textContent = Math.round(audio.volume * 100) + '%';

    function syncUI() {
      var playing = !audio.paused && !audio.ended;
      if (toggle) {
        toggle.classList.toggle('is-playing', playing);
        // 自动播放受阻时会先静音播放，这里给出可见提示：点一下就能出声
        toggle.classList.toggle('is-muted-auto', playing && audio.muted);
        toggle.setAttribute('aria-pressed', String(playing));
        toggle.setAttribute('aria-label', playing && audio.muted ? '背景音乐已静音播放，点击开启声音' : '背景音乐开关');
      }
      if (card) card.classList.toggle('is-playing', playing);
      if (playBtn) playBtn.textContent = playing ? '⏸ 暂停' : '▶ 播放';
      if (muteBtn) muteBtn.textContent = audio.muted ? '🔊 取消静音' : '🔇 静音';
    }

    function play() {
      // play() 在个别浏览器/权限策略下会同步抛错，不能让它把整个流程带崩
      try {
        var p = audio.play();
        if (p && p.catch) p.catch(function () {});
      } catch (e) {}
      syncUI();
    }
    function pause() { try { audio.pause(); } catch (e) {} syncUI(); }

    /* 点播放按钮时，如果处于静音状态就顺手放开声音：
       按钮上写着「点击开启声音」，点了却没声，那是骗人的。 */
    function flip() {
      if (audio.muted) { audio.muted = false; userMuted = false; save(); }
      if (audio.paused) play(); else pause();
    }

    /* ---------------------------------------------------------
       自动播放背景音乐
       浏览器策略：没有用户交互时「有声播放」会被拒绝（NotAllowedError）。
       所以按下面的顺序尽量自动放，放不了就退一步：
         1) 直接有声自动播放 —— 浏览器允许时（常来的访客）立刻就响
         2) 被拒 → 静音自动播放（这条通常允许），画面里有声音提示
         3) 用户第一次点击/按键时自动取消静音，从 0 开始放
       --------------------------------------------------------- */
    function unmuteNow() {
      audio.muted = false;
      try { audio.currentTime = 0; } catch (e) {}
      play();
      save();
    }
    window.__bgmUnmute = unmuteNow;

    /* 只读调试口：排查「在播但没声音」时很有用（AudioContext 挂起是常见元凶） */
    window.__bgmDebug = function () {
      return {
        acState: ac ? ac.state : 'none',
        hasGraph: graphTried,
        hasAnalyser: !!analyser,
        paused: audio.paused,
        muted: audio.muted,
        userMuted: userMuted,
        volume: audio.volume,
        readyState: audio.readyState,
        currentTime: Math.round(audio.currentTime * 100) / 100,
        usingBlob: (audio.currentSrc || '').indexOf('blob:') === 0
      };
    };

    /* ---------------------------------------------------------
       首次交互 → 开始/恢复播放
       实测：Chrome 只认「点击 / 按键」这类用户激活，滚动与触摸滑动不算。
       所以滚动会尝试一次（部分浏览器认），点击/按键作为可靠兜底。
       --------------------------------------------------------- */
    var gestureDone = false;
    var scrollGestureBound = false;

    function activateBgm(why) {
      if (gestureDone) return;
      if (userMuted) { gestureDone = true; return; }   // 用户明确关过声音，别自作主张
      gestureDone = true;
      audio.muted = false;
      ensureGraph();                                   // 借这次手势把音频图跑起来
      var wasPaused = audio.paused;
      play();
      if (wasPaused) {
        // 从头开始，观感更自然
        try { audio.currentTime = 0; } catch (e) {}
      }
      save();
      if (window.console && console.debug) console.debug('[bgm] 由「' + why + '」触发播放');
    }

    function armFirstGestures() {
      if (gestureDone) return;
      var onClick = function () { activateBgm('点击'); cleanup(); };
      var onKey = function () { activateBgm('按键'); cleanup(); };
      var onScroll = function () {
        // 只有真的往下滚了一段才尝试，避免页面初始化时的微小滚动
        if (window.pageYOffset < 90) return;
        var before = audio.paused;
        audio.muted = false;
        play();
        if (before && !audio.paused) {
          // 这个浏览器认滚动，播放成功
          gestureDone = true;
          save();
          cleanup();
        } else {
          // 被策略拒绝：保留监听，等点击/按键
          cleanupScroll();
        }
      };
      function cleanup() {
        document.removeEventListener('click', onClick);
        document.removeEventListener('keydown', onKey);
        cleanupScroll();
      }
      function cleanupScroll() {
        if (scrollGestureBound) {
          window.removeEventListener('scroll', onScroll);
          scrollGestureBound = false;
        }
      }
      document.addEventListener('click', onClick);
      document.addEventListener('keydown', onKey);
      if (!scrollGestureBound) {
        scrollGestureBound = true;
        window.addEventListener('scroll', onScroll, { passive: true });
      }
    }

    function autoStart() {
      if (userMuted) return;          // 用户明确关过声音，别自作主张
      var p;
      try { p = audio.play(); } catch (e) { p = null; }
      if (!p || !p.then) { armFirstGestures(); return; }
      p.then(function () {
        syncUI();                       // 有声自动播放成功
      }).catch(function () {
        // 有声被拒：先静音放起来，等第一次交互再出声
        audio.muted = true;   // 仅临时静音，不落库（userMuted 仍为 false）
        syncUI();
        var p2;
        try { p2 = audio.play(); } catch (e) { p2 = null; }
        if (p2 && p2.then) {
          p2.then(function () { syncUI(); if (!gestureDone) armFirstGestures(); })
            .catch(function () { audio.muted = userMuted; syncUI(); if (!gestureDone) armFirstGestures(); });
        } else {
          audio.muted = userMuted;
          syncUI();
          if (!gestureDone) armFirstGestures();
        }
      });
    }
    if (saved.vol === undefined) {
      // 首次访问音量给一个轻一点的默认值
      audio.volume = 0.4;
    }

    /* 没有入口门：直接尝试自动播放（浏览器允许就直接响），
       被拒时静音播放并提示，之后滚动/点击/按键都会把它放出来。 */
    autoStart();

    /* 页面稍稳定后就开始预载，让点播放时是瞬时响应 */
    function schedulePreload() {
      window.setTimeout(function () {
        if (window.requestIdleCallback) window.requestIdleCallback(function () { preloadAudio(); }, { timeout: 1500 });
        else preloadAudio();
      }, 900);
    }
    if (document.readyState === 'complete') schedulePreload();
    else window.addEventListener('load', schedulePreload);

    /* 播放时如果还没预载好，给出可见提示，避免"点了没反应"的错觉 */
    audio.addEventListener('waiting', function () {
      if (!audioReady && toggle) toggle.classList.add('is-loading');
      if (!audioReady) setHint('正在下载背景音乐……下载完成后会自动开始播放。');
    });
    audio.addEventListener('playing', function () {
      if (toggle) toggle.classList.remove('is-loading');
      if (!audioReady) setHint('背景音乐正在播放。');
    });
    audio.addEventListener('error', function () {
      setHint('背景音乐加载失败，可能是网络问题，稍后再试。');
    });

    /* 播放 / 暂停 / 静音 / 音量 */
    if (toggle)  toggle.addEventListener('click', flip);
    if (playBtn) playBtn.addEventListener('click', flip);
    if (muteBtn) muteBtn.addEventListener('click', function () {
      audio.muted = !audio.muted;
      userMuted = audio.muted;
      syncUI(); save();
    });
    if (restart) restart.addEventListener('click', function () { try { audio.currentTime = 0; } catch (e) {} play(); });
    if (vol) vol.addEventListener('input', function () {
      audio.volume = Math.min(Math.max(parseInt(vol.value, 10) / 100 || 0, 0), 1);
      if (volText) volText.textContent = Math.round(audio.volume * 100) + '%';
      if (audio.volume > 0 && audio.muted) { audio.muted = false; userMuted = false; }
      syncUI(); save();
    });
    if (volText && vol) volText.textContent = Math.round(audio.volume * 100) + '%';

    audio.addEventListener('play', syncUI);
    audio.addEventListener('pause', syncUI);
    audio.addEventListener('volumechange', syncUI);
    // 连播偶发失败时继续放
    audio.addEventListener('ended', function () { play(); });
    syncUI();

    /* 波形可视化：直接用上面懒创建好的 analyser。
       没有音频图（浏览器不支持 / 还没建）时，退化为一条呼吸的静态波形。 */
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    var W = 0, H = 0;
    function fit() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var r = canvas.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    fit();
    window.addEventListener('resize', fit, { passive: true });

    var phase = 0;
    (function draw() {
      requestAnimationFrame(draw);
      if (!W || document.hidden) return;
      phase += 0.02;
      var active = !audio.paused && !audio.ended && !audio.muted && audio.volume > 0;
      ctx.clearRect(0, 0, W, H);

      var bars = 56, gap = 3;
      var bw = (W - gap * (bars - 1)) / bars;
      if (bw < 1) { bars = Math.max(8, Math.floor(W / 4)); bw = (W - gap * (bars - 1)) / bars; }
      if (analyser && active) { analyser.getByteFrequencyData(freq); }

      for (var i = 0; i < bars; i++) {
        var v;
        if (analyser && active) {
          var idx = Math.floor(Math.pow(i / bars, 1.35) * (freq.length - 1));
          v = freq[idx] / 255;
        } else {
          var t = i / bars;
          v = 0.10 + 0.07 * Math.abs(Math.sin(t * 5.4 + phase)) + 0.05 * Math.abs(Math.sin(t * 11 + phase * 0.7));
        }
        var bh = Math.max(2, v * (H - 16));
        var x = i * (bw + gap);
        var y = H / 2 - bh / 2;
        var g = ctx.createLinearGradient(0, y, 0, y + bh);
        g.addColorStop(0, 'rgba(255,216,148,.92)');
        g.addColorStop(1, 'rgba(255,122,61,.75)');
        ctx.fillStyle = g;
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, bw, bh, bw / 2); ctx.fill(); }
        else ctx.fillRect(x, y, bw, bh);
      }
    })();
  })();

  /* ---------------------------------------------------------
     4. 滚动入场（IntersectionObserver）
     --------------------------------------------------------- */
  var revealTargets = $$('.reveal, [data-split]');
  if (hasIO && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add('is-in');
        if (el.classList.contains('timeline__item')) el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* 进度条：近况的能力条 */
  if (hasIO) {
    var barIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); barIO.unobserve(e.target); }
      });
    }, { threshold: 0.35 });
    $$('.bar').forEach(function (el) { barIO.observe(el); });
  } else {
    $$('.bar').forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------------------------------------------------------
     5. 数字滚动
     --------------------------------------------------------- */
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion) { el.textContent = target + suffix; return; }
    var dur = 1500, start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);            // easeOutCubic
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = $$('.count');
  if (hasIO && counters.length) {
    var cIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { countUp(e.target); cIO.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cIO.observe(el); });
  } else {
    counters.forEach(countUp);
  }

  /* ---------------------------------------------------------
     6. 导航：吸顶 / 高亮 / 滑块 / 移动端菜单
     --------------------------------------------------------- */
  var nav        = $('#nav');
  var navLinks   = $('#navLinks');
  var navPill    = $('#navPill');
  var navToggle  = $('#navToggle');
  var toTop      = $('#toTop');
  var progress   = $('#scrollProgress');
  var sections   = $$('main section[id]');
  var links      = $$('#navLinks a');
  var activeLink = null;

  function setActive(link) {
    if (!link || link === activeLink) return;
    activeLink = link;
    links.forEach(function (a) { a.classList.toggle('is-active', a === link); });

    if (!navPill || !link) return;
    if (window.innerWidth <= 760) { navPill.classList.remove('is-on'); return; }
    var lr = link.getBoundingClientRect();
    var pr = navLinks.getBoundingClientRect();
    navPill.style.width = lr.width + 'px';
    navPill.style.transform = 'translate(' + (lr.left - pr.left) + 'px, -50%)';
    navPill.classList.add('is-on');
  }

  /* 移动端菜单 */
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var open = navLinks.classList.toggle('is-open');
      navToggle.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('is-locked', open);
    });
    links.forEach(function (a) {
      a.addEventListener('click', function () {
        navLinks.classList.remove('is-open');
        navToggle.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('is-locked');
      });
    });
  }

  /* 平滑滚动（兼容不支持 scroll-behavior 的浏览器） */
  var supportsSmooth = 'scrollBehavior' in document.documentElement.style;
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (ev) {
      var id = a.getAttribute('href');
      if (!id || id === '#') return;
      var target = document.getElementById(id.slice(1));
      if (!target) return;
      ev.preventDefault();
      var navH = nav ? nav.offsetHeight : 0;
      var top = target.getBoundingClientRect().top + window.pageYOffset - navH - 14;
      window.scrollTo({ top: Math.max(top, 0), behavior: (reduceMotion || !supportsSmooth) ? 'auto' : 'smooth' });
      history.replaceState(null, '', id);
    });
  });

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* 当前区块高亮 */
  function updateActiveByViewport() {
    var navH = nav ? nav.offsetHeight : 68;
    var probe = window.pageYOffset + navH + window.innerHeight * 0.28;
    var current = sections[0];
    sections.forEach(function (s) {
      if (s.offsetTop <= probe) current = s;
    });
    var link = links.filter(function (a) { return a.getAttribute('href') === '#' + current.id; })[0];
    setActive(link || links[0]);
  }

  /* ---------------------------------------------------------
     7. 统一滚动循环（rAF 节流，保证丝滑）
     --------------------------------------------------------- */
  var heroText  = $('.hero__text');
  var heroCard  = $('.hero__card');
  var heroSec   = $('.hero');
  var timelineFill = $('#timelineFill');
  var timelineWrap = $('.timeline');
  var ticking = false;
  var lastY = window.pageYOffset;

  function onFrame() {
    ticking = false;
    var y = window.pageYOffset;
    var vh = window.innerHeight;
    var doc = document.documentElement;
    var max = doc.scrollHeight - vh;
    var p = max > 0 ? Math.min(Math.max(y / max, 0), 1) : 0;

    /* 顶部进度条 */
    if (progress) progress.style.transform = 'scaleX(' + p + ')';

    /* 导航吸顶 + 回到顶部按钮 */
    if (nav) nav.classList.toggle('is-stuck', y > 18);
    if (toTop) toTop.classList.toggle('is-on', y > vh * 0.7);

    /* 首屏视差淡出
       关键：用「首屏自身被推出视口的比例」来算，而不是滚动距离。
       否则从下面滚回来时，首屏明明还有大半在视野里，却已经淡到几乎看不见
       （表现为「第一张卡片发白发虚」）。
       阶段划分：前 45% 完全不透明；之后才逐渐淡出，且不模糊文字。 */
    if (!reduceMotion && heroSec) {
      var hr = heroSec.getBoundingClientRect();
      var heroH = hr.height || vh;
      var gone = Math.min(Math.max(-hr.top / Math.max(heroH, 1), 0), 1);
      var fadeAmt = gone <= 0.45 ? 0 : (gone - 0.45) / 0.55;
      var heroOpacity = (1 - fadeAmt * 0.92).toFixed(3);

      if (heroText) {
        heroText.style.transform = 'translate3d(0,' + (-gone * heroH * 0.1).toFixed(1) + 'px,0) scale(' + (1 - gone * 0.04).toFixed(3) + ')';
        heroText.style.opacity = heroOpacity;
        heroText.style.filter = '';
      }
      if (heroCard) {
        heroCard.style.transform = 'translate3d(0,' + (-gone * heroH * 0.04).toFixed(1) + 'px,0)';
        heroCard.style.opacity = heroOpacity;
      }
      /* 背景光斑轻微反向移动 */
      var b1 = $('.backdrop__blob--1'), b2 = $('.backdrop__blob--2');
      if (b1) b1.style.marginTop = (-y * 0.08) + 'px';
      if (b2) b2.style.marginTop = (y * 0.06) + 'px';
    }

    /* 时间线进度 */
    if (timelineFill && timelineWrap) {
      var r = timelineWrap.getBoundingClientRect();
      var seen = (vh * 0.75 - r.top) / Math.max(r.height, 1);
      timelineFill.style.transform = 'scaleY(' + Math.min(Math.max(seen, 0), 1) + ')';
    }

    /* 滚动方向（供后续扩展），并更新导航高亮 */
    if (Math.abs(y - lastY) > 2) {
      updateActiveByViewport();
      lastY = y;
    }
  }

  function requestFrame() {
    if (!ticking) { ticking = true; requestAnimationFrame(onFrame); }
  }

  window.addEventListener('scroll', requestFrame, { passive: true });
  window.addEventListener('resize', function () {
    requestFrame();
    if (activeLink) { var a = activeLink; activeLink = null; setActive(a); }
  }, { passive: true });

  /* 初始状态 */
  onFrame();
  window.addEventListener('load', function () { onFrame(); updateActiveByViewport(); });
  updateActiveByViewport();

  /* ---------------------------------------------------------
     8. 卡片 3D 倾斜（鼠标跟随）
     --------------------------------------------------------- */
  if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('[data-tilt]').forEach(function (card) {
      var raf = null, tx = 0, ty = 0, curX = 0, curY = 0;

      function loop() {
        curX += (tx - curX) * 0.12;
        curY += (ty - curY) * 0.12;
        card.style.transform = 'perspective(900px) rotateY(' + curX.toFixed(3) + 'deg) rotateX(' + curY.toFixed(3) + 'deg) translateY(-6px)';
        if (Math.abs(tx - curX) > 0.01 || Math.abs(ty - curY) > 0.01) {
          raf = requestAnimationFrame(loop);
        } else {
          raf = null;
        }
      }

      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * 11;
        ty = -((e.clientY - r.top) / r.height - 0.5) * 11;
        if (!raf) raf = requestAnimationFrame(loop);
      });

      card.addEventListener('mouseleave', function () {
        tx = 0; ty = 0; curX = 0; curY = 0;
        card.style.transform = '';
      });
    });
  }

  /* ---------------------------------------------------------
     9. 联系方式：一键复制
     优先用 Clipboard API（需要 HTTPS + 用户手势），
     失败时退回到 textarea + execCommand 这套老办法。
     --------------------------------------------------------- */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '-1000px';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, text.length);
        var ok = document.execCommand('copy');
        document.body.removeChild(ta);
        ok ? resolve() : reject(new Error('execCommand failed'));
      } catch (e) { reject(e); }
    });
  }

  $$('[data-copy]').forEach(function (target) {
    var isButton = target.tagName === 'BUTTON';
    if (!isButton) return;                       // 只给「复制」按钮绑定

    var timer = null;
    target.addEventListener('click', function () {
      var text = target.getAttribute('data-copy');
      if (!text) return;
      if (timer) window.clearTimeout(timer);
      target.classList.remove('is-copied', 'is-failed');

      copyText(text).then(function () {
        target.textContent = '已复制';
        target.classList.add('is-copied');
      }).catch(function () {
        target.textContent = '复制失败';
        target.classList.add('is-failed');
      }).then(function () {
        timer = window.setTimeout(function () {
          target.textContent = '复制';
          target.classList.remove('is-copied', 'is-failed');
        }, 1600);
      });
    });
  });

  /* ---------------------------------------------------------
     10. 页脚年份
     --------------------------------------------------------- */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
