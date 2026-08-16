/* ═══════════════════════════════════════════
   勢力図データ ── 同じ地図を4つの年で塗り分ける
   ═══════════════════════════════════════════ */

/* 州のおおまかな位置（地図と同じ配置） */
const REGIONS = [
  { id:"幽州", x:620, y:40,  w:160, h:72  },
  { id:"并州", x:430, y:52,  w:130, h:86  },
  { id:"冀州", x:565, y:118, w:140, h:76  },
  { id:"青州", x:712, y:126, w:118, h:70  },
  { id:"涼州", x:150, y:52,  w:230, h:96  },
  { id:"司隷", x:418, y:158, w:132, h:80  },
  { id:"兗州", x:562, y:206, w:120, h:60  },
  { id:"徐州", x:694, y:212, w:120, h:72  },
  { id:"豫州", x:452, y:254, w:140, h:66  },
  { id:"益州", x:170, y:250, w:200, h:180 },
  { id:"荊州", x:392, y:332, w:200, h:128 },
  { id:"揚州", x:608, y:300, w:212, h:152 },
  { id:"交州", x:452, y:478, w:200, h:58  }
];

const OWNERS = {
  ensho:  { label:"袁紹",   color:"#B08D3F" },
  soso:   { label:"曹操",   color:"#4E79B2" },
  gi:     { label:"魏",     color:"#4E79B2" },
  ryubi:  { label:"劉備",   color:"#C0392B" },
  shoku:  { label:"蜀",     color:"#C0392B" },
  son:    { label:"孫氏",   color:"#3E8E6E" },
  go:     { label:"呉",     color:"#3E8E6E" },
  ryuhyo: { label:"劉表",   color:"#8E6BB0" },
  ryusho: { label:"劉璋",   color:"#7A8A93" },
  bato:   { label:"馬騰",   color:"#C97B3C" },
  hoka:   { label:"その他", color:"#4a423a" }
};

const MAP_YEARS = [
  {
    year: "200年",
    title: "官渡のころ",
    note: "北は袁紹、真ん中が曹操。南に孫策、西に劉璋。劉備はまだ自分の土地を持っていません。",
    own: { 幽州:"ensho", 并州:"ensho", 冀州:"ensho", 青州:"ensho",
           司隷:"soso", 兗州:"soso", 豫州:"soso", 徐州:"soso",
           涼州:"bato", 益州:"ryusho", 荊州:"ryuhyo", 揚州:"son", 交州:"hoka" }
  },
  {
    year: "208年",
    title: "赤壁の直後",
    note: "袁紹を倒した曹操が北を全部のみこみました。赤壁で止められ、荊州の南に劉備が初めて足場を得ます。",
    own: { 幽州:"soso", 并州:"soso", 冀州:"soso", 青州:"soso",
           司隷:"soso", 兗州:"soso", 豫州:"soso", 徐州:"soso",
           涼州:"bato", 益州:"ryusho", 荊州:"ryubi", 揚州:"son", 交州:"son" }
  },
  {
    year: "220年",
    title: "三国が並ぶ",
    note: "魏・蜀・呉の三つがそろいました。関羽が荊州を失ったので、荊州は呉のものになっています。",
    own: { 幽州:"gi", 并州:"gi", 冀州:"gi", 青州:"gi",
           司隷:"gi", 兗州:"gi", 豫州:"gi", 徐州:"gi", 涼州:"gi",
           益州:"shoku", 荊州:"go", 揚州:"go", 交州:"go" }
  },
  {
    year: "263年",
    title: "蜀がほろびる",
    note: "鄧艾が山をこえて成都を落とし、蜀が消えました。残るは魏（実質は司馬氏）と呉だけです。",
    own: { 幽州:"gi", 并州:"gi", 冀州:"gi", 青州:"gi",
           司隷:"gi", 兗州:"gi", 豫州:"gi", 徐州:"gi", 涼州:"gi",
           益州:"gi", 荊州:"go", 揚州:"go", 交州:"go" }
  }
];

/* 1枚だけ描く（章のページで使う） */
function drawMap(host, year) {
  if (!host) { return; }
  var m = MAP_YEARS.filter(function (x) { return x.year === year; })[0];
  if (!m) { return; }
  host.innerHTML = mapHTML(m);
}

/* 4枚まとめて描く */
function drawMaps(host) {
  if (!host) { return; }
  host.innerHTML = MAP_YEARS.map(mapHTML).join("");
}

function mapHTML(m) {
    var shapes = REGIONS.map(function (r) {
      var o = OWNERS[m.own[r.id]] || OWNERS.hoka;
      return '<rect x="' + r.x + '" y="' + r.y + '" width="' + r.w + '" height="' + r.h +
             '" rx="6" fill="' + o.color + '" fill-opacity=".34" stroke="' + o.color +
             '" stroke-opacity=".75"/>' +
             '<text x="' + (r.x + r.w / 2) + '" y="' + (r.y + r.h / 2 + 7) +
             '" text-anchor="middle" font-family="serif" font-size="19" fill="#EDE7DA">' +
             r.id + "</text>";
    }).join("");

    var used = [];
    REGIONS.forEach(function (r) {
      var k = m.own[r.id];
      if (k && k !== "hoka" && used.indexOf(k) < 0) { used.push(k); }
    });
    var legend = used.map(function (k) {
      return '<span class="legend__item"><i style="background:' + OWNERS[k].color + '"></i>' +
             OWNERS[k].label + "</span>";
    }).join("");

    return '<div class="figbox">' +
      '<svg viewBox="0 0 900 560" role="img" aria-label="' + m.year + "の勢力図" + '">' +
        '<rect width="900" height="560" fill="#1A1713"/>' +
        '<path d="M150,190 C300,140 460,215 600,175 C700,148 780,175 850,165" fill="none" stroke="#4E79B2" stroke-width="7" opacity=".3"/>' +
        '<path d="M200,395 C320,430 430,375 540,400 C660,428 760,360 855,352" fill="none" stroke="#4E79B2" stroke-width="9" opacity=".3"/>' +
        shapes +
        '<text x="40" y="60" font-family="serif" font-size="34" fill="#EDE7DA">' + m.year + "</text>" +
        '<text x="40" y="88" font-family="sans-serif" font-size="15" fill="#B08D3F">' + m.title + "</text>" +
      "</svg>" +
      '<div class="legend">' + legend + "</div>" +
      '<p class="figcap">' + m.note + "</p>" +
    "</div>";
}
