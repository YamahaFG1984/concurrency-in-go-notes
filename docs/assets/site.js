/* ================================================================
   Go 并发编程 · 图解学习笔记 · 共享脚本：侧边栏、目录、代码高亮、主题
   ================================================================ */
// 保持经典 <script> 而不是 type="module"：模块脚本在 file:// 下会被浏览器拦截，
// 而这些页面经常是直接双击打开的。
(() => {
  'use strict';

  const CHAPTERS = [
    { n: 1, t: '并发编程导论',        d: '摩尔定律之后的世界，以及并发为什么这么难：竞态、原子性、死锁、活锁、饥饿', part: '第一部分 · 思想' },
    { n: 2, t: '用 CSP 为代码建模',    d: '并发不等于并行；CSP 是什么；Go 的并发哲学与「用锁还是用通道」决策树' },
    { n: 3, t: 'Go 的并发构件',        d: 'goroutine、sync 包（WaitGroup / Mutex / Cond / Once / Pool）、channel、select', part: '第二部分 · 构件与模式' },
    { n: 4, t: 'Go 并发模式',          d: '约束、for-select、防泄漏、or-channel、错误处理、管道、扇入扇出、队列、context' },
    { n: 5, t: '大规模并发',           d: '错误传播、超时与取消、心跳、复制请求、限流、自愈的 goroutine', part: '第三部分 · 系统与运行时' },
    { n: 6, t: 'goroutine 与 Go 运行时', d: '工作窃取、延续窃取、G-M-P 调度模型与抢占' },
    { n: 7, t: '附录 A · 工具箱',       d: 'panic 栈的读法、竞态检测器、pprof、trace、泄漏检测与 synctest', part: '附录' },
    { n: 8, t: '附录 B · 从 Go 1.8 到今天', d: '书出版后的并发相关新特性速查，以及老代码现代化清单' }
  ];

  const pad = (n) => String(n).padStart(2, '0');
  const href = (n) => `ch${pad(n)}.html`;

  const cur = Number.parseInt(document.body.dataset.chapter || '0', 10);

  /* ---------- 侧边栏 ---------- */
  const side = document.getElementById('sidebar');
  if (side) {
    const brand = '<a class="brand" href="index.html"><span class="flame">Go</span>' +
      '<span>Go 并发编程<small>《Concurrency in Go》图解笔记</small></span></a>';
    const links = CHAPTERS.map(({ n, t, part }) =>
      (part ? `<div class="part">${part}</div>` : '') +
      `<a class="ch${n === cur ? ' active' : ''}" href="${href(n)}"><span class="n">${n <= 6 ? n : n === 7 ? 'A' : 'B'}</span><span>${t}</span></a>`
    );
    side.innerHTML = brand + links.join('');
    const active = side.querySelector('a.ch.active');
    if (active) setTimeout(() => active.scrollIntoView({ block: 'center' }), 0);
  }

  /* ---------- 移动端菜单 ---------- */
  const btn = Object.assign(document.createElement('button'), {
    id: 'menu-btn',
    type: 'button',
    innerHTML: '&#9776;',
    onclick: () => document.body.classList.toggle('nav-open')
  });
  btn.setAttribute('aria-label', '目录');
  document.body.appendChild(btn);
  document.addEventListener('click', (e) => {
    if (document.body.classList.contains('nav-open') &&
        side && !side.contains(e.target) && e.target !== btn) {
      document.body.classList.remove('nav-open');
    }
  });

  /* ---------- 主题切换 ---------- */
  const THEME_KEY = 'go-concurrency-notes-theme';
  const tbtn = Object.assign(document.createElement('button'), {
    id: 'theme-btn',
    type: 'button',
    innerHTML: '&#9789;',
    onclick: () => {
      const root = document.documentElement;
      const now = root.getAttribute('data-theme');
      const dark = now ? now === 'dark'
        : window.matchMedia('(prefers-color-scheme: dark)').matches;
      const next = dark ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem(THEME_KEY, next); } catch {}
    }
  });
  tbtn.setAttribute('aria-label', '切换深浅色');
  document.body.appendChild(tbtn);
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) document.documentElement.setAttribute('data-theme', saved);
  } catch {}

  /* ---------- 箭头 marker（全局一次） ---------- */
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  defs.setAttribute('width', '0');
  defs.setAttribute('height', '0');
  defs.setAttribute('style', 'position:absolute');
  // SVG marker 的内容不会从引用它的元素继承 color，所以直接用 CSS 变量填色。
  const marker = (id, fill) =>
    `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">` +
    `<path d="M0,0 L10,5 L0,10 z" fill="${fill}"/></marker>`;
  defs.innerHTML = '<defs>' +
    marker('ar', 'var(--fg-faint)') +
    marker('ar-a', 'var(--accent)') +
    marker('ar-b', 'var(--blue)') +
    marker('ar-g', 'var(--green)') +
    marker('ar-r', 'var(--red)') +
    marker('ar-p', 'var(--purple)') +
    marker('ar-c', 'var(--cyan)') +
    '</defs>';
  document.body.appendChild(defs);

  /* ---------- 章节内目录 ---------- */
  const main = document.querySelector('main');
  const slot = document.getElementById('chapter-toc');
  if (slot && main) {
    const hs = [...main.querySelectorAll('h2')];
    if (hs.length > 2) {
      const items = hs.map((h, i) => {
        if (!h.id) h.id = `sec-${i + 1}`;
        // 目录里不要版本徽章
        const text = [...h.childNodes]
          .filter((n) => !(n.nodeType === 1 && n.classList.contains('ver')))
          .map((n) => n.textContent).join('').trim();
        return `<li><a href="#${h.id}">${text}</a></li>`;
      });
      slot.className = 'toc';
      slot.innerHTML = `<div class="h">本章目录</div><ol>${items.join('')}</ol>`;
    }
  }

  /* ---------- 代码块：语言标签 + 复制 + 高亮 ---------- */
  const KW = ('break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go|goto|if|' +
    'import|interface|map|package|range|return|select|struct|switch|type|var').split('|');
  const BUILTIN = ('true|false|nil|iota|make|close|len|cap|append|new|panic|recover|delete|copy|' +
    'min|max|clear|print|println').split('|');
  const TYPES = ('int|int8|int16|int32|int64|uint|uint8|uint16|uint32|uint64|uintptr|float32|float64|' +
    'complex64|complex128|string|bool|byte|rune|error|any|comparable').split('|');

  // 每一段用正则字面量写，取 .source 拼起来，省掉字符串里的双重转义
  const RE_GO = new RegExp([
    /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)/.source,                                         // 1 注释
    /(`[^`]*`|'(?:\\[\s\S]|[^\\'\n])*'|"(?:\\[\s\S]|[^\\"\n])*")/.source,             // 2 字符串 / rune
    /(<-)/.source,                                                                  // 3 通道操作符
    String.raw`\b(${KW.join('|')})\b`,                                              // 4 关键字
    String.raw`\b(${BUILTIN.join('|')})\b`,                                         // 5 内建
    String.raw`\b(${TYPES.join('|')})\b`,                                           // 6 内建类型
    /\b([a-zA-Z_][\w]*)(?=\()/.source,                                              // 7 函数调用
    /\b([A-Z][A-Za-z0-9_]*)\b/.source,                                              // 8 导出的类型/标识符
    /\b(\d+(?:\.\d+)?(?:e\d+)?)\b/.source                                           // 9 数字
  ].join('|'), 'g');
  const GO_CLASSES = ['tk-cm', 'tk-st', 'tk-op', 'tk-kw', 'tk-bi', 'tk-tp', 'tk-fn', 'tk-tp', 'tk-nm'];

  const RE_SH = /(#[^\n]*)|('(?:\\[\s\S]|[^\\'])*'|"(?:\\[\s\S]|[^\\"])*")|(^\$ |\b(?:go|git|cd|mkdir|curl|export|grep|wc|taskset|perf|GOTRACEBACK|GOMAXPROCS|GODEBUG|GOEXPERIMENT)\b)/gm;
  const SH_CLASSES = ['tk-cm', 'tk-st', 'tk-kw'];
  // 这些语言没有专门的规则，借用 shell 的注释 / 字符串规则就够了
  const SH_LIKE = new Set(['bash', 'sh', 'shell', 'console']);

  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  function paint(src, re, classes) {
    let out = '';
    let last = 0;
    // 所有分支都至少匹配一个字符，matchAll 不会卡在零宽匹配上
    for (const m of src.matchAll(re)) {
      out += esc(src.slice(last, m.index));
      const g = m.findIndex((v, i) => i > 0 && v !== undefined);
      out += `<span class="${classes[g - 1]}">${esc(m[g])}</span>`;
      last = m.index + m[0].length;
    }
    return out + esc(src.slice(last));
  }

  document.querySelectorAll('.code').forEach((box) => {
    const pre = box.querySelector('pre');
    if (!pre) return;
    const { lang = '', file = '' } = box.dataset;

    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.innerHTML = `<span class="tag">${esc(file || lang || 'code')}</span>`;
    const cp = Object.assign(document.createElement('button'), {
      className: 'copy',
      type: 'button',
      textContent: '复制'
    });
    cp.onclick = () => {
      navigator.clipboard?.writeText(pre.textContent);
      cp.textContent = '已复制';
      setTimeout(() => { cp.textContent = '复制'; }, 1400);
    };
    bar.appendChild(cp);
    box.insertBefore(bar, pre);

    const code = pre.textContent.replace(/^\n/, '').replace(/\s+$/, '');
    if (lang === 'go') pre.innerHTML = paint(code, RE_GO, GO_CLASSES);
    else if (SH_LIKE.has(lang)) pre.innerHTML = paint(code, RE_SH, SH_CLASSES);
    else pre.textContent = code;   // text / output：原样显示
  });

  /* ---------- 上一章 / 下一章 ---------- */
  const label = (c) => c.n <= 6 ? `第 ${c.n} 章 · ${c.t}` : c.t;
  const pager = document.getElementById('pager');
  if (pager && cur) {
    const prev = CHAPTERS.find((c) => c.n === cur - 1);
    const next = CHAPTERS.find((c) => c.n === cur + 1);
    const prevLink = prev
      ? `<a class="prev" href="${href(prev.n)}"><span>&larr; 上一章</span>${label(prev)}</a>`
      : '<a class="prev" href="index.html"><span>&larr; 返回</span>课程首页</a>';
    const nextLink = next
      ? `<a class="next" href="${href(next.n)}"><span>下一章 &rarr;</span>${label(next)}</a>`
      : '<a class="next" href="index.html"><span>完结 &rarr;</span>回到首页</a>';
    pager.className = 'pager';
    pager.innerHTML = prevLink + nextLink;
  }

  /* ---------- 首页目录 ---------- */
  const grid = document.getElementById('toc-grid');
  if (grid) {
    grid.className = 'toc-grid';
    grid.innerHTML = CHAPTERS.map((c) =>
      `<a class="toc-card" href="${href(c.n)}">` +
      `<div class="n">${c.n <= 6 ? `第 ${c.n} 章` : c.n === 7 ? '附录 A' : '附录 B'}</div>` +
      `<div class="t">${c.n <= 6 ? c.t : c.t.replace(/^附录 [AB] · /, '')}</div>` +
      `<div class="d">${c.d}</div></a>`
    ).join('');
  }
})();
