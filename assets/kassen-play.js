/* ═══════════════════════════════════════════
   動く戦場図 ── 再生エンジン
   assets/data/kassen.js のデータを読んで、
   場面（step）を1コマずつ動かす。
   ═══════════════════════════════════════════ */

(function () {
  "use strict";

  var SVGNS = "http://www.w3.org/2000/svg";

  /* 時間帯ごとの空の色。上→下 */
  var SKY = {
    asa:    { a:"#2A2E42", b:"#7A5A44", label:"明け方", body:"#F2C48B" },
    hiru:   { a:"#243244", b:"#3E4A46", label:"昼",     body:"#F4EBD6" },
    yugata: { a:"#3A2836", b:"#7E452C", label:"夕方",   body:"#F0A263" },
    yoru:   { a:"#0D1019", b:"#1B2233", label:"夜",     body:"#D8DEEB" }
  };
  var SEASON = {
    haru: { label:"春", color:"#E8A0BC" },
    natsu:{ label:"夏", color:"#4A9C79" },
    aki:  { label:"秋", color:"#C09A48" },
    fuyu: { label:"冬", color:"#9FC0D8" }
  };

  function el(name, attrs) {
    var n = document.createElementNS(SVGNS, name);
    for (var k in attrs) { n.setAttribute(k, attrs[k]); }
    /* 文字が図と重なっても読めるように、暗い縁取りをつける */
    if (name === "text") {
      n.setAttribute("stroke", "#12141C");
      n.setAttribute("stroke-width", "4.5");
      n.setAttribute("stroke-linejoin", "round");
      n.setAttribute("paint-order", "stroke fill");
    }
    return n;
  }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  /* ───────── 地形を描く（一度だけ） ───────── */
  function drawTerrain(g, t) {
    (t.rivers || []).forEach(function (r) {
      g.appendChild(el("path", { d:r.d, fill:"none", stroke:"#3E6C9B",
        "stroke-width":r.w, "stroke-opacity":".55", "stroke-linecap":"round" }));
      g.appendChild(el("path", { d:r.d, fill:"none", stroke:"#7FB3DF",
        "stroke-width":Math.max(2, r.w / 6), "stroke-opacity":".35" }));
      if (r.label) {
        var tx = el("text", { x:r.lx, y:r.ly, fill:"#8FB8DC", "font-size":"17",
          "font-family":"serif", "fill-opacity":".9" });
        tx.textContent = r.label;
        g.appendChild(tx);
      }
    });

    (t.mountains || []).forEach(function (m) {
      var x = m[0], y = m[1], w = m[2];
      g.appendChild(el("path", {
        d:"M" + (x - w) + "," + (y + w * 0.62) + " L" + x + "," + (y - w * 0.55) +
          " L" + (x + w) + "," + (y + w * 0.62) + " Z",
        fill:"#2E2A24", stroke:"#4B4237", "stroke-width":"1.5" }));
      g.appendChild(el("path", {
        d:"M" + (x - w * 0.32) + "," + (y - w * 0.02) + " L" + x + "," + (y - w * 0.55) +
          " L" + (x + w * 0.32) + "," + (y - w * 0.02) + " Z",
        fill:"#4A4237", "fill-opacity":".8" }));
    });

    (t.forests || []).forEach(function (f) {
      var x = f[0], y = f[1], w = f[2];
      for (var i = 0; i < 5; i++) {
        g.appendChild(el("circle", {
          cx:x + (i - 2) * w * 0.28, cy:y + (i % 2 ? 6 : 0), r:w * 0.3,
          fill:"#25301F", stroke:"#3B4A32", "stroke-width":"1" }));
      }
    });

    (t.cities || []).forEach(function (c) {
      g.appendChild(el("rect", { x:c.x - 16, y:c.y - 16, width:32, height:32, rx:3,
        fill:"#2B2620", stroke:"#B08D3F", "stroke-width":"2" }));
      g.appendChild(el("rect", { x:c.x - 7, y:c.y - 7, width:14, height:14,
        fill:"#B08D3F", "fill-opacity":".55" }));
      var tx = el("text", { x:c.x, y:c.y + 36, fill:"#D9CFBB", "font-size":"16",
        "font-family":"serif", "text-anchor":"middle" });
      tx.textContent = c.name;
      g.appendChild(tx);
    });
  }

  /* ───────── 部隊 ───────── */
  function drawUnit(u) {
    var c = (ARMY[u.side] || ARMY.other).color;
    var g = el("g", { class:"kunit", "data-id":u.id, transform:"translate(" + u.x + "," + u.y + ")" });
    g.appendChild(el("circle", { r:"26", fill:c, "fill-opacity":".18", stroke:c, "stroke-width":"2" }));
    g.appendChild(el("circle", { r:"9", fill:c }));
    var t1 = el("text", { y:"-36", "text-anchor":"middle", "font-size":"18",
      "font-family":"serif", fill:"#F0EADC" });
    t1.textContent = u.label;
    g.appendChild(t1);
    if (u.n && u.n !== "—") {
      var t2 = el("text", { y:"46", "text-anchor":"middle", "font-size":"14",
        "font-family":"sans-serif", fill:c });
      t2.textContent = u.n;
      g.appendChild(t2);
    }
    return g;
  }

  /* ───────── ひとつの合戦を再生する装置 ───────── */
  function build(host, b) {
    var i = 0, timer = null, playing = false;

    host.innerHTML =
      '<div class="ks">' +
        '<div class="ks__stage">' +
          '<svg class="ks__svg" viewBox="0 0 1000 560" role="img" aria-label="' + b.name + 'の戦場図"></svg>' +
          '<div class="ks__badge"><span class="ks__season"></span><span class="ks__time"></span></div>' +
        '</div>' +
        '<div class="ks__panel">' +
          '<p class="ks__step"></p>' +
          '<h3 class="ks__title"></h3>' +
          '<p class="ks__text"></p>' +
        '</div>' +
        '<div class="ks__bar">' +
          '<button class="ks__btn" data-a="prev">◀ もどる</button>' +
          '<button class="ks__btn ks__btn--play" data-a="play">▶ 再生</button>' +
          '<button class="ks__btn" data-a="next">すすむ ▶</button>' +
          '<span class="ks__dots"></span>' +
        "</div>" +
      "</div>";

    var svg   = host.querySelector(".ks__svg");
    var badgeS= host.querySelector(".ks__season");
    var badgeT= host.querySelector(".ks__time");
    var elStep= host.querySelector(".ks__step");
    var elTtl = host.querySelector(".ks__title");
    var elTxt = host.querySelector(".ks__text");
    var dots  = host.querySelector(".ks__dots");
    var btnPl = host.querySelector('[data-a="play"]');

    /* 空 */
    var defs = el("defs", {});
    var grad = el("linearGradient", { id:"sky-" + b.id, x1:"0", y1:"0", x2:"0", y2:"1" });
    var s1 = el("stop", { offset:"0", "stop-color":SKY.hiru.a });
    var s2 = el("stop", { offset:"1", "stop-color":SKY.hiru.b });
    grad.appendChild(s1); grad.appendChild(s2); defs.appendChild(grad);
    svg.appendChild(defs);

    var sky = el("rect", { width:"1000", height:"560", fill:"url(#sky-" + b.id + ")" });
    svg.appendChild(sky);

    var gSun = el("g", {}); svg.appendChild(gSun);
    var gTer = el("g", {}); svg.appendChild(gTer);
    var gFx  = el("g", {}); svg.appendChild(gFx);
    var gUni = el("g", {}); svg.appendChild(gUni);
    var gWx  = el("g", { class:"ks__wx" }); svg.appendChild(gWx);

    drawTerrain(gTer, b.terrain);

    var nodes = {};
    b.units.forEach(function (u) {
      var g = drawUnit(u);
      nodes[u.id] = g;
      gUni.appendChild(g);
    });

    b.steps.forEach(function (s, n) {
      var d = document.createElement("button");
      d.className = "ks__dot";
      d.setAttribute("aria-label", (n + 1) + "場面目");
      d.addEventListener("click", function () { stop(); go(n); });
      dots.appendChild(d);
    });

    function weather(kind, season) {
      gWx.innerHTML = "";
      var n, k;
      if (kind === "ame") {
        for (n = 0; n < 60; n++) {
          k = el("line", { x1:rnd(0,1000), y1:rnd(-40,560), x2:0, y2:0,
            stroke:"#9FC0D8", "stroke-opacity":".35", "stroke-width":"1.5" });
          k.setAttribute("x2", +k.getAttribute("x1") - 9);
          k.setAttribute("y2", +k.getAttribute("y1") + 26);
          k.setAttribute("class", "wx-rain");
          k.style.animationDelay = (Math.random() * -1.2) + "s";
          gWx.appendChild(k);
        }
        return;
      }
      if (kind === "yuki" || season === "fuyu") {
        var many = kind === "yuki" ? 70 : 26;
        for (n = 0; n < many; n++) {
          k = el("circle", { cx:rnd(0,1000), cy:rnd(-40,560), r:rnd(1.5,3.4),
            fill:"#EAF2FA", "fill-opacity":rnd(.3,.75), class:"wx-snow" });
          k.style.animationDuration = rnd(6, 13) + "s";
          k.style.animationDelay = (Math.random() * -12) + "s";
          gWx.appendChild(k);
        }
        return;
      }
      if (season === "haru" || season === "aki") {
        var col = season === "haru" ? "#E8A0BC" : "#C08A3E";
        for (n = 0; n < 24; n++) {
          k = el("ellipse", { cx:rnd(0,1000), cy:rnd(-40,560), rx:rnd(3,6), ry:rnd(1.6,3),
            fill:col, "fill-opacity":rnd(.25,.6), class:"wx-leaf" });
          k.style.animationDuration = rnd(7, 15) + "s";
          k.style.animationDelay = (Math.random() * -14) + "s";
          gWx.appendChild(k);
        }
      }
    }

    function go(n) {
      i = Math.max(0, Math.min(b.steps.length - 1, n));
      var s = b.steps[i];
      var time = s.time || b.time, season = s.season || b.season, skyk = s.sky || b.sky;

      /* 空と時間帯 */
      s1.setAttribute("stop-color", SKY[time].a);
      s2.setAttribute("stop-color", SKY[time].b);
      badgeS.textContent = SEASON[season].label;
      badgeS.style.color = SEASON[season].color;
      badgeT.textContent = SKY[time].label;
      badgeT.style.color = SKY[time].body;

      /* 太陽か月 */
      gSun.innerHTML = "";
      if (time === "yoru") {
        gSun.appendChild(el("circle", { cx:"862", cy:"84", r:"26", fill:"#E8EDF7", "fill-opacity":".75" }));
        gSun.appendChild(el("circle", { cx:"850", cy:"76", r:"24", fill:SKY.yoru.a }));
      } else {
        var y = time === "hiru" ? 70 : 110;
        gSun.appendChild(el("circle", { cx:"862", cy:y, r:"34", fill:SKY[time].body, "fill-opacity":".22" }));
        gSun.appendChild(el("circle", { cx:"862", cy:y, r:"20", fill:SKY[time].body, "fill-opacity":".85" }));
      }

      weather(skyk, season);

      /* 部隊を動かす */
      b.units.forEach(function (u) {
        var g = nodes[u.id];
        var visible = !u.hidden || (s.show && s.show.indexOf(u.id) >= 0);
        g.style.opacity = visible ? 1 : 0;
        var pos = (s.move && s.move[u.id]) || null;
        if (pos) { g.setAttribute("transform", "translate(" + pos[0] + "," + pos[1] + ")"); }
        else if (i === 0) { g.setAttribute("transform", "translate(" + u.x + "," + u.y + ")"); }
      });

      /* 効果（矢印・火など）は毎回描きなおす */
      gFx.innerHTML = "";
      (s.chains || []).forEach(function (c, k, arr) {
        if (k === 0) { return; }
        gFx.appendChild(el("line", { x1:arr[k-1][0], y1:arr[k-1][1], x2:c[0], y2:c[1],
          stroke:"#C9C2B4", "stroke-width":"3", "stroke-dasharray":"7 5", "stroke-opacity":".8" }));
      });
      (s.camps || []).forEach(function (c) {
        gFx.appendChild(el("rect", { x:c[0]-13, y:c[1]-11, width:26, height:22, rx:2,
          fill:"#3A2A22", stroke:"#CB4A3C", "stroke-width":"1.6", "stroke-opacity":".9" }));
      });
      (s.flood || []).forEach(function (f) {
        var w = el("rect", { x:f[0], y:f[1]-34, width:"180", height:"70", rx:34,
          fill:"#3E6C9B", "fill-opacity":".38", class:"fx-flood" });
        gFx.appendChild(w);
      });
      (s.arrows || []).forEach(function (a, k) {
        var mx = (a.from[0] + a.to[0]) / 2, my = (a.from[1] + a.to[1]) / 2 - 60;
        var d = "M" + a.from[0] + "," + a.from[1] + " Q" + mx + "," + my + " " + a.to[0] + "," + a.to[1];
        var col = (ARMY[a.side] || ARMY.other).color;
        var p = el("path", { d:d, fill:"none", stroke:col, "stroke-width":"5",
          "stroke-linecap":"round", class:"fx-arrow" });
        if (a.dashed) { p.setAttribute("stroke-dasharray", "10 9"); p.setAttribute("stroke-opacity", ".85"); }
        p.style.animationDelay = (k * 0.25) + "s";
        gFx.appendChild(p);
        var ang = Math.atan2(a.to[1] - my, a.to[0] - mx) * 180 / Math.PI;
        var head = el("path", { d:"M0,0 L-18,-8 L-18,8 Z", fill:col, class:"fx-head",
          transform:"translate(" + a.to[0] + "," + a.to[1] + ") rotate(" + ang + ")" });
        head.style.animationDelay = (0.7 + k * 0.25) + "s";
        gFx.appendChild(head);
      });
      if (s.wind) {
        for (var w2 = 0; w2 < 5; w2++) {
          var off = (w2 - 2) * 26;
          var wp = el("path", {
            d:"M" + s.wind.from[0] + "," + (s.wind.from[1] + off) +
              " Q" + ((s.wind.from[0] + s.wind.to[0]) / 2) + "," + ((s.wind.from[1] + s.wind.to[1]) / 2 + off - 40) +
              " " + s.wind.to[0] + "," + (s.wind.to[1] + off),
            fill:"none", stroke:"#BFE0F5", "stroke-width":"2.5", "stroke-opacity":".5", class:"fx-wind" });
          wp.style.animationDelay = (w2 * 0.18) + "s";
          gFx.appendChild(wp);
        }
      }
      (s.fires || []).forEach(function (f, k) {
        var g2 = el("g", { class:"fx-fire", transform:"translate(" + f[0] + "," + f[1] + ")" });
        g2.style.animationDelay = (k * 0.14) + "s";
        g2.appendChild(el("circle", { r:f[2], fill:"#E4581F", "fill-opacity":".28" }));
        g2.appendChild(el("circle", { r:f[2] * 0.62, fill:"#F0862C", "fill-opacity":".5" }));
        g2.appendChild(el("circle", { r:f[2] * 0.3, fill:"#FFD08A", "fill-opacity":".85" }));
        gFx.appendChild(g2);
      });

      /* 文章 */
      elStep.textContent = "第" + (i + 1) + "場面　／　全" + b.steps.length + "場面";
      elTtl.textContent = s.title;
      elTxt.textContent = s.text;
      Array.prototype.forEach.call(dots.children, function (d, n) {
        d.classList.toggle("is-on", n === i);
      });
    }

    function next() {
      if (i >= b.steps.length - 1) { stop(); return; }
      go(i + 1);
    }
    function play() {
      if (i >= b.steps.length - 1) { go(0); }
      playing = true;
      btnPl.textContent = "⏸ 止める";
      btnPl.classList.add("is-playing");
      timer = setInterval(next, 6500);
    }
    function stop() {
      playing = false;
      btnPl.textContent = "▶ 再生";
      btnPl.classList.remove("is-playing");
      clearInterval(timer);
    }

    host.querySelector(".ks__bar").addEventListener("click", function (e) {
      var a = e.target.getAttribute("data-a");
      if (a === "prev") { stop(); go(i - 1); }
      if (a === "next") { stop(); next(); }
      if (a === "play") { playing ? stop() : play(); }
    });

    go(0);
    return { stop:stop };
  }

  window.buildKassen = build;
})();
