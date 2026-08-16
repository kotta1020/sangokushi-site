/* ═══════════════════════════════════════════
   三国志サイト ── 共通の動き
   ・スクロールでふわっと出す
   ・人物の詳細パネル（図鑑・物語の両方で使う）
   ・図鑑ページの絞り込みと検索
   ═══════════════════════════════════════════ */

(function () {
  "use strict";

  /* story/ の中からは一つ上を見る必要がある */
  var BASE = document.body.getAttribute("data-base") || "";
  var BY_ID = {};
  BUSHOU.forEach(function (b) { BY_ID[b.id] = b; });

  var BY_TERM = {};
  if (typeof TERMS !== "undefined") {
    TERMS.forEach(function (t) { BY_TERM[t.id] = t; });
  }

  /* ───────── スクロールで出す ───────── */
  var rises = document.querySelectorAll(".rise");
  if ("IntersectionObserver" in window && rises.length) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -12% 0px" });
    rises.forEach(function (el) { io.observe(el); });
  } else {
    rises.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ───────── 肖像 ───────── */
  function portraitHTML(b, cls) {
    return '<img src="' + BASE + 'assets/portraits/' + b.file + '.jpg" alt="' + b.id +
           'の肖像" loading="lazy" class="' + (cls || "") +
           '" onerror="this.style.display=\'none\';this.parentNode.classList.add(\'is-wait\');' +
           'if(this.nextElementSibling)this.nextElementSibling.style.display=\'\';">';
  }

  /* この人の関係（kankei.js を読みこんでいるページだけ） */
  function kankeiHTML(name) {
    if (typeof KANKEI === "undefined") { return ""; }
    var map = {}, order = [];
    KANKEI.forEach(function (r) {
      var who = null, lab = null;
      if (r[0] === name) { who = r[2]; lab = KANKEI_TYPE[r[1]].b; }
      else if (r[2] === name) { who = r[0]; lab = KANKEI_TYPE[r[1]].a; }
      if (!who) { return; }
      if (!map[who]) { map[who] = { c:KANKEI_TYPE[r[1]].color, labels:[] }; order.push(who); }
      if (map[who].labels.indexOf(lab) < 0) { map[who].labels.push(lab); }
    });
    var out = order.map(function (who) {
      return '<button class="kchip" data-p="' + who + '" style="--c:' +
        map[who].c + '"><i>' + map[who].labels.join("・") + "</i>" + who + "</button>";
    });
    if (!out.length) { return ""; }
    return '<div class="sheet__kankei"><b>この人の関係</b>' + out.join("") +
      '<p class="stats__note">関係図でたどるなら ' +
      '<a href="' + BASE + "kankei.html#" + encodeURIComponent(name) +
      '">人物関係図</a> へ。</p></div>';
  }

  /* 能力の棒グラフ。50の位置に平均の目盛りを立てる */
  function stat(label, v) {
    return '<div class="stat">' +
      '<span class="stat__label">' + label + "</span>" +
      '<span class="stat__bar"><i style="width:' + v + '%"></i><b></b></span>' +
      '<span class="stat__num">' + v + "</span>" +
    "</div>";
  }

  /* ───────── 人物の詳細パネル ───────── */
  var sheet = document.createElement("div");
  sheet.className = "sheet";
  sheet.setAttribute("role", "dialog");
  sheet.setAttribute("aria-modal", "true");
  sheet.innerHTML = '<div class="sheet__panel"></div>';
  document.body.appendChild(sheet);
  var panel = sheet.querySelector(".sheet__panel");
  var lastFocus = null;

  function openSheet(id) {
    var b = BY_ID[id];
    if (!b) { return; }
    var side = SIDES[b.side];

    var chaps = (b.ch || []).map(function (n) {
      var c = CHAPTERS[n - 1];
      return '<a class="chaplink" href="' + BASE + 'story/' + String(n).padStart(2, "0") +
             '.html">第' + n + '章　' + c.title + "</a>";
    }).join("");

    panel.style.setProperty("--c", side.color);
    panel.innerHTML =
      '<button class="sheet__close" aria-label="閉じる">×</button>' +
      '<div class="sheet__head">' +
        '<div class="sheet__portrait">' + portraitHTML(b) +
          '<span style="display:none">' + b.id + "</span>" +
        "</div>" +
        '<div class="sheet__id">' +
          '<span class="sheet__tag">' + side.label + "</span>" +
          '<h2 class="sheet__name">' + b.id + "</h2>" +
          '<p class="sheet__yomi">' + b.yomi + "</p>" +
          '<p class="sheet__lead">' + b.lead + "</p>" +
        "</div>" +
      "</div>" +
      '<div class="stats">' +
        stat("戦闘力", b.bu) + stat("政治力", b.sei) +
        '<p class="stats__note">100点満点。50点が、この81人の平均です（女性をのぞいて計算）。</p>' +
      "</div>" +
      '<p class="sheet__drama">' + b.drama + "</p>" +
      '<dl class="facts">' +
        "<div><dt>特徴</dt><dd>" + b.toku + "</dd></div>" +
        "<div><dt>おもな功</dt><dd>" + b.kou + "</dd></div>" +
        "<div><dt>最期</dt><dd>" + b.shu + "</dd></div>" +
      "</dl>" +
      '<div class="sheet__chaps"><b>登場する章</b>' + chaps + "</div>" +
      kankeiHTML(b.id) +
      (b.engi
        ? '<p class="engi-note">この人の紹介には、小説『三国志演義』だけの逸話がまじっています。' +
          "実際にあったこととは限りません。</p>"
        : "");

    sheet.classList.add("is-open");
    document.body.style.overflow = "hidden";
    lastFocus = document.activeElement;
    panel.querySelector(".sheet__close").focus();
  }

  function closeSheet() {
    sheet.classList.remove("is-open");
    document.body.style.overflow = "";
    if (lastFocus) { lastFocus.focus(); }
  }

  sheet.addEventListener("click", function (e) {
    if (e.target === sheet || e.target.closest(".sheet__close")) { closeSheet(); }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && sheet.classList.contains("is-open")) { closeSheet(); }
  });

  /* ───────── 用語の説明 ───────── */
  function openTerm(id) {
    var t = BY_TERM[id];
    if (!t) { return; }
    panel.style.setProperty("--c", "#B08D3F");
    panel.innerHTML =
      '<button class="sheet__close" aria-label="閉じる">×</button>' +
      '<p class="sheet__tag">' + t.cat + "</p>" +
      '<h2 class="sheet__name">' + t.id + "</h2>" +
      '<p class="sheet__yomi">' + t.kana + "</p>" +
      '<p class="sheet__drama">' + t.short + "</p>" +
      "<p>" + t.body + "</p>" +
      '<p class="engi-note">用語をまとめて見るなら ' +
        '<a href="' + BASE + 'yougo.html">地図と用語のページ</a> へ。</p>';
    sheet.classList.add("is-open");
    document.body.style.overflow = "hidden";
    lastFocus = document.activeElement;
    panel.querySelector(".sheet__close").focus();
  }

  /* ───────── 本文中の人物リンク・用語リンク ───────── */
  document.addEventListener("click", function (e) {
    var p = e.target.closest("[data-p]");
    if (p) { e.preventDefault(); openSheet(p.getAttribute("data-p")); return; }
    var t = e.target.closest("[data-t]");
    if (t) { e.preventDefault(); openTerm(t.getAttribute("data-t")); }
  });

  /* 名前の書きまちがいを見つけやすくする（表示は変えない） */
  var missing = [];
  document.querySelectorAll("[data-p]").forEach(function (el) {
    if (!BY_ID[el.getAttribute("data-p")]) { missing.push(el.getAttribute("data-p")); }
  });
  if (missing.length) { console.warn("データに無い人物名:", missing); }

  var missingT = [];
  document.querySelectorAll("[data-t]").forEach(function (el) {
    if (!BY_TERM[el.getAttribute("data-t")]) { missingT.push(el.getAttribute("data-t")); }
  });
  if (missingT.length) { console.warn("データに無い用語:", missingT); }

  /* ───────── 対戦カードに顔を入れる ───────── */
  document.querySelectorAll(".duel__side").forEach(function (side) {
    var names = side.querySelectorAll(".duel__name");
    if (!names.length) { return; }
    var right = side.classList.contains("duel__side--r");
    var faces = document.createElement("span");
    faces.className = "duel__faces";
    Array.prototype.forEach.call(names, function (nameEl) {
      var b = BY_ID[nameEl.getAttribute("data-p")];
      if (!b) { return; }
      var img = document.createElement("img");
      img.className = "duel__face";
      img.src = BASE + "assets/portraits/" + b.file + ".jpg";
      img.alt = "";
      img.loading = "lazy";
      img.onerror = function () { img.style.visibility = "hidden"; };
      faces.appendChild(img);
    });
    if (right) { side.appendChild(faces); }
    else { side.insertBefore(faces, side.firstChild); }
  });

  /* ───────── 図鑑ページ ───────── */
  var grid = document.getElementById("cards");
  if (grid) {
    var chips = Array.prototype.slice.call(document.querySelectorAll("[data-side]"));
    var input = document.getElementById("search");
    var count = document.getElementById("count");
    var side = "all";

    function draw() {
      var q = (input.value || "").trim();
      var list = BUSHOU.filter(function (b) {
        if (side !== "all" && b.side !== side) { return false; }
        if (!q) { return true; }
        return (b.id + b.yomi + b.lead + b.file).indexOf(q) >= 0;
      });

      count.textContent = list.length + " 人";
      if (!list.length) {
        grid.outerHTML = '<p class="empty" id="cards">見つかりませんでした</p>';
        grid = document.getElementById("cards");
        return;
      }

      var html = list.map(function (b) {
        var s = SIDES[b.side];
        return '<button class="card" data-p="' + b.id + '" style="--c:' + s.color + '">' +
          '<span class="card__figure">' + portraitHTML(b) +
            '<span class="card__wait" style="display:none"><span>' + b.id +
            "</span><small>肖像 準備中</small></span>" +
            '<span class="card__side">' + s.label + "</span>" +
          "</span>" +
          '<span class="card__body">' +
            '<span class="card__name">' + b.id + "</span>" +
            '<span class="card__yomi">' + b.yomi + "</span>" +
            '<span class="card__lead">' + b.lead + "</span>" +
            '<span class="card__stats"><i>戦</i>' + b.bu + '<i>政</i>' + b.sei + "</span>" +
          "</span>" +
        "</button>";
      }).join("");

      if (grid.tagName === "P") {
        var g = document.createElement("div");
        g.className = "cards"; g.id = "cards";
        grid.replaceWith(g); grid = g;
      }
      grid.innerHTML = html;
    }

    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        side = c.getAttribute("data-side");
        chips.forEach(function (o) { o.setAttribute("aria-pressed", o === c ? "true" : "false"); });
        draw();
      });
    });
    input.addEventListener("input", draw);
    draw();
  }

  /* 図鑑を特定の勢力で開きたいとき  bushou.html#go のように */
  if (grid && location.hash) {
    var want = decodeURIComponent(location.hash.slice(1));
    var target = document.querySelector('[data-side="' + want + '"]');
    if (target) { target.click(); }
    else if (BY_ID[want]) { openSheet(want); }
  }

  /* 物語ページから人物を開く合図（章末のチップなど）を外にも出しておく */
  window.openBushou = openSheet;
})();
