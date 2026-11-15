"use strict";
const $ = (s) => document.querySelector(s),
  fmt = (n, d = 0) =>
    new Intl.NumberFormat("pt-BR", { maximumFractionDigits: d }).format(n);
const colors = ["#883e48", "#37675c", "#925d20", "#4f667d", "#75796c"];
let D,
  C,
  chartCount = 0;
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const source = (k) =>
  `<p class="source">Fonte: <a href="${D.sources[k].url}" target="_blank" rel="noopener">${D.sources[k].label}</a></p>`;
const legend = (items) =>
  `<div class="legend">${items.map((x, i) => `<span><i class="swatch" style="--c:${x.color || colors[i]}"></i>${esc(x.name || x)}</span>`).join("")}</div>`;
function table(headers, rows) {
  return `<details><summary>Ver dados em tabela</summary><div class="table-wrap"><table><thead><tr>${headers.map((x) => `<th scope="col">${esc(x)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c, i) => (i ? `<td>${esc(c)}</td>` : `<th scope="row">${esc(c)}</th>`)).join("")}</tr>`).join("")}</tbody></table></div></details>`;
}
const lineSeries = (area, key, name, color) => ({
  name,
  color,
  data: C[area][key],
});
function lineChart(
  series,
  {
    unit = "",
    percent = false,
    index = false,
    max,
    description = "",
    height = 300,
    annotations = [],
    showLegend = true,
  } = {},
) {
  const usedColors = new Set();
  series = series.map((s, i) => {
    let color = s.color || colors[i];
    if (usedColors.has(color)) color = colors.find((c) => !usedColors.has(c));
    usedColors.add(color);
    return { ...s, color };
  });
  const id = "chart-" + ++chartCount,
    w = 600,
    h = height,
    p = { l: 53, r: 25, t: 25, b: 40 };
  const all = series.flatMap((s) => s.data),
    xmin = Math.min(...all.map((x) => x[0])),
    xmax = Math.max(...all.map((x) => x[0]));
  const vals = series.flatMap((s) =>
    s.data.map((v) => (index ? (v[1] / s.data[0][1]) * 100 : v[1])),
  );
  const rawmax = Math.max(...vals) * 1.1,
    mag = 10 ** Math.floor(Math.log10(rawmax / 4)),
    step = [1, 2, 2.5, 5, 10].find((v) => v * mag >= rawmax / 4) * mag;
  let ymax = max || step * 4;
  if (percent && !max) ymax = 100;
  const X = (x) => p.l + ((x - xmin) / (xmax - xmin || 1)) * (w - p.l - p.r),
    Y = (y) => h - p.b - (y / ymax) * (h - p.t - p.b);
  const label = (n) =>
    percent
      ? fmt(n, 1) + "%"
      : n >= 1e9
        ? fmt(n / 1e9, 2) + " bi"
        : n >= 1e6
          ? fmt(n / 1e6, 1) + " mi"
          : n >= 1000
            ? fmt(n / 1000, 1) + " mil"
            : fmt(n, 1);
  let svg = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="${id}-title ${id}-desc"><title id="${id}-title">${esc(description || series.map((s) => s.name).join(", "))}</title><desc id="${id}-desc">${esc(unit)}. De ${xmin} a ${xmax}. Valores completos na tabela abaixo.</desc>`;
  if (xmin <= 1965 && xmax >= 1962) {
    const from = Math.max(xmin, 1962),
      to = Math.min(xmax, 1965),
      marker = X(from);
    svg += `<rect class="council-band" x="${marker}" y="${p.t}" width="${Math.max(2, X(to) - marker)}" height="${h - p.t - p.b}"/><line class="council-boundary" x1="${X(to)}" x2="${X(to)}" y1="${p.t}" y2="${h - p.b}"/><text class="council-label" x="${marker + 5}" y="14">${xmin < 1962 ? "Vaticano II · 1962–1965" : "1965 · fim do Concílio"}</text>`;
  }
  for (let i = 0; i <= 4; i++) {
    let n = (ymax * i) / 4;
    svg += `<line class="grid" x1="${p.l}" y1="${Y(n)}" x2="${w - p.r}" y2="${Y(n)}"/><text x="${p.l - 10}" y="${Y(n) + 4}" text-anchor="end">${index ? fmt(n) : label(n)}</text>`;
  }
  const ticks = [
    xmin,
    ...(xmax - xmin > 20
      ? [
          Math.round((xmin + (xmax - xmin) / 3) / 5) * 5,
          Math.round((xmin + ((xmax - xmin) * 2) / 3) / 5) * 5,
        ]
      : []),
    xmax,
  ];
  for (const x of [...new Set(ticks)])
    svg += `<text x="${X(x)}" y="${h - 12}" text-anchor="middle">${x}</text>`;
  series.forEach((s, i) => {
    const color = s.color || colors[i],
      v = s.data.map(([x, y]) => [x, index ? (y / s.data[0][1]) * 100 : y]);
    svg += `<path d="${v.map(([x, y], j) => `${j ? "L" : "M"}${X(x).toFixed(2)},${Y(y).toFixed(2)}`).join(" ")}" fill="none" stroke="${color}" stroke-width="2.6" stroke-linejoin="round"/>`;
    v.forEach(([x, y], j) => {
      let tip = `${s.name} · ${x}: ${index ? fmt(y, 1) + " (índice)" : label(s.data[j][1])}`;
      if (annotations.includes(x)) {
        const anchor = x === xmin ? "start" : x === xmax ? "end" : "middle";
        const labelY = Y(y) + (x === 1960 ? 30 : -36);
        svg += `<text class="point-label" x="${X(x)}" y="${labelY}" text-anchor="${anchor}"><tspan class="point-year">${x}</tspan><tspan class="value" x="${X(x)}" dy="19">${label(y)}</tspan></text>`;
      }
      svg += `<circle role="img" class="point" cx="${X(x)}" cy="${Y(y)}" r="3.7" fill="${color}" tabindex="0" data-tip="${esc(tip)}" aria-label="${esc(tip)}"><title>${esc(tip)}</title></circle>`;
    });
  });
  svg += "</svg>";
  const years = [...new Set(all.map((x) => x[0]))].sort((a, b) => a - b);
  return `<div class="chart line-chart">${showLegend ? legend(series) : ""}${svg}${table(
    ["Ano", ...series.map((s) => s.name)],
    years.map((y) => [
      y,
      ...series.map((s) => {
        let v = s.data.find((a) => a[0] === y);
        return v
          ? (index
              ? fmt((v[1] / s.data[0][1]) * 100, 1)
              : fmt(v[1], percent ? 1 : 0)) + (percent ? "%" : "")
          : "—";
      }),
    ]),
  )}</div>`;
}
function figure(title, subtitle, body, key, note = "") {
  return `<figure><h3 class="chart-title">${title}</h3><p class="unit">${subtitle}</p>${body}${source(key)}</figure>`;
}
function section(id, title, intro, body, cls = "") {
  return `<section class="section ${cls}" id="${id}">${title ? `<div class="section-head"><h2>${title}</h2>${intro ? `<p class="intro">${intro}</p>` : ""}</div>` : ""}${body}</section>`;
}
function pairs(
  rows,
  names = ["2013–2014", "2024"],
  max = 100,
  suffix = "%",
  changes = true,
) {
  return `${legend(names.map((name, i) => ({ name, color: i ? colors[0] : "#d8bebf" })))}<p class="unit">Escala comum: 0 a ${fmt(max)}${suffix}</p>${rows.map((r) => `<div class="pair-row"><span class="pair-name">${r[0]}</span><div class="pair-bars">${[r[1], r[2]].map((v, i) => `<div class="bar-line"><i class="bar-fill ${i ? "" : "before"}" style="--v:${(v / max) * 80}"></i><span>${fmt(v, 1)}${suffix}</span></div>`).join("")}</div><span class="pair-change">${changes ? fmt(r[2] - r[1], 1) + " p.p." : ""}</span></div>`).join("")}${table(
    ["Local", ...names, ...(changes ? ["Variação (p.p.)"] : [])],
    rows.map((r) => [
      r[0],
      fmt(r[1], 1) + suffix,
      fmt(r[2], 1) + suffix,
      ...(changes ? [fmt(r[2] - r[1], 1)] : []),
    ]),
  )}`;
}
function horizontal(
  rows,
  { signed = false, unit = "", color = colors[0] } = {},
) {
  const w = 600,
    rowh = 43,
    h = rows.length * rowh + 38,
    left = 105,
    right = 60,
    top = 16,
    max =
      unit === "%" ? 100 : Math.max(...rows.map((r) => Math.abs(r[1]))) * 1.08,
    base = signed ? left + (w - left - right) / 2 : left,
    scale = (w - left - right) / (max * (signed ? 2 : 1));
  return `<div class="chart"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(rows.map((r) => r[0] + ": " + fmt(r[1], 2) + " " + unit).join("; "))}"><line class="grid" x1="${base}" x2="${base}" y1="0" y2="${h - 22}"/>${rows
    .map(([name, n], i) => {
      const y = i * rowh + top,
        width = Math.abs(n) * scale,
        x = n < 0 ? base - width : base,
        tip = `${name}: ${n > 0 && signed ? "+" : ""}${fmt(n, 2)} ${unit}`;
      return `<text x="${left - 12}" y="${y + 15}" text-anchor="end">${name}</text><rect role="img" x="${x}" y="${y}" width="${width}" height="22" fill="${signed && n > 0 ? colors[1] : color}" tabindex="0" data-tip="${esc(tip)}" aria-label="${esc(tip)}"/><text class="value" x="${n < 0 ? (width > 65 ? base - 8 : base - 10) : x + width + 7}" y="${y + 15}" text-anchor="${n < 0 ? "end" : "start"}" ${n < 0 && width > 65 ? 'style="fill:#f5f3ed"' : ""}>${signed && n > 0 ? "+" : ""}${fmt(n, 2)}</text>`;
    })
    .join(
      "",
    )}<text x="${base}" y="${h - 4}" text-anchor="middle">0</text></svg>${table(
    ["Local", unit || "Valor"],
    rows.map((r) => [r[0], fmt(r[1], 2)]),
  )}</div>`;
}
function historicalSummary() {
  const rows = [
    [
      "Alemanha · participação nas celebrações",
      "1960 · antes",
      46.1,
      "2024",
      6.6,
      "%",
      "dbk",
    ],
    [
      "França · missa aos domingos",
      "1952 · antes",
      27,
      "2006",
      4.5,
      "%",
      "ifop",
    ],
    [
      "EUA · sacerdotes",
      "1965 · final do Concílio",
      59426,
      "2025",
      33462,
      "",
      "cara",
    ],
    [
      "EUA · religiosas",
      "1965 · final do Concílio",
      178740,
      "2025",
      33135,
      "",
      "cara",
    ],
    [
      "EUA · batismos de bebês",
      "1964 · durante",
      1237000,
      "2024",
      471717,
      "",
      "cara",
    ],
    [
      "EUA · casamentos católicos",
      "1964 · durante",
      347179,
      "2024",
      107271,
      "",
      "cara",
    ],
  ];
  return `<div class="comparison-plots">${rows.map(([label, year, a, end, b, u, key]) => `<figure class="comparison-plot"><div class="comparison-top"><h3>${label}</h3><strong class="comparison-drop">${fmt((b / a - 1) * 100, 1)}%</strong></div><div class="comparison-bars" role="img" aria-label="${esc(label)}: ${year}, ${fmt(a, u ? 1 : 0)}${u}; ${end}, ${fmt(b, u ? 1 : 0)}${u}"><div class="comparison-bar-row"><span class="comparison-year">${year.split(" · ")[0]}</span><div class="comparison-track"><i class="comparison-before" style="width:100%"></i></div><span class="comparison-number">${fmt(a, u ? 1 : 0)}${u}</span></div><div class="comparison-bar-row"><span class="comparison-year">${end}</span><div class="comparison-track"><i class="comparison-after" style="width:${(b / a) * 100}%"></i></div><span class="comparison-number">${fmt(b, u ? 1 : 0)}${u}</span></div></div>${source(key)}</figure>`).join("")}</div>`;
}
function render() {
  const world = C.world,
    us = C.us;
  const usSacrament = (key, name) => ({
    name,
    data: us[key].map(([y, v]) => [y - 1, v]),
  });
  let html = section(
    "brasil",
    "No Brasil, a mudança atravessa gerações.",
    "Filiação católica desde 1940.",
    `<div class="two-up">${figure("Católicos na população brasileira", "1940–2022 · % de católicos · até 2010: todas as idades; 2022: 10 anos ou mais", lineChart([
      { name: "Católicos", data: [...D.historical.brazilCatholic, [2022, D.brazil.groups[0].values.at(-1)]] },
    ], { percent: true, max: 100, showLegend: false, annotations: [1940, 1960, 2022] }) + source("ibge2010") + source("ibge"), "fgv")}<div class="historical-reading"><div class="historical-pair"><span>1960 · antes do Concílio</span><strong>93,1%</strong>${source("fgv")}</div><div class="historical-pair census-highlight"><span>Censo 2022 · pessoas de 10 anos ou mais</span><strong>${fmt(D.brazil.groups[0].values.at(-1), 1)}%</strong>${source("ibge")}</div></div></div>`,
  );
  html += section(
    "brasil-recente",
    "O Brasil católico sofre.",
    "",
    `${figure(
      "Filiação religiosa nos censos",
      "1872–2022 · % da população · até 2010: todas as idades; 2022: 10 anos ou mais",
      lineChart(D.brazil.religionHistory, {
        percent: true,
        max: 100,
        height: 300,
        unit: "% da população; até 2010: todas as idades; 2022: 10 anos ou mais",
        description: "Proporção de católicos, evangélicos e pessoas sem religião nos censos brasileiros",
      }),
      "ibgeHistory",
    )}<div class="two-up">${figure("Católicos por idade", "2022 · % em cada faixa etária selecionada", horizontal(D.brazil.ages, { unit: "%" }), "ibge")}${figure("Católicos por estado", "2022 · % das pessoas de 10 anos ou mais · estados selecionados", horizontal(D.brazil.states, { unit: "%" }), "ibge")}</div>`,
  );
  html += section(
    "america-latina",
    "A mudança também aparece na América Latina.",
    "2013–2014 e 2024 · adultos de 18 anos ou mais",
    figure(
      "Identificação católica em seis países",
      "% dos adultos pesquisados em cada país",
      pairs(D.latam.map((r) => [r.country, ...r.catholic])),
      "pewla",
    ),
  );
  html += section(
    "panorama",
    "",
    "",
    `
  <div class="scrolly"><div class="sticky-plot"><h3 class="chart-title">França · missa aos domingos</h3><p class="unit" id="history-unit">% dos franceses pesquisados</p><div class="dot-readout"><strong id="history-value">27%</strong><span id="history-year">1952</span></div><div class="dotgrid" id="history-dots" role="img" aria-label="27% em 1952">${Array.from({ length: 100 }, () => '<i class="dot" aria-hidden="true"></i>').join("")}</div><div id="history-legend">${legend(
    [
      { name: "Missa aos domingos", color: colors[0] },
      { name: "Demais respostas", color: "#d4d5ca" },
    ],
  )}</div><div class="toggle-row" aria-label="Ano da pesquisa">${[1952, 1966, 2006, D.franceRecent.year].map((y, i) => `<button data-history="${i}" aria-pressed="${i === 0}">${y}</button>`).join("")}</div><p class="dot-description">Cada círculo ≈ 1 ponto percentual.</p><div id="history-source">${source("ifop")}</div></div><div class="steps">
  <article data-step="0" class="active"><div class="step-date">1952 · antes do Concílio</div><h3>27 de cada 100.</h3><p>Franceses que declaravam ir à missa todos os domingos.</p></article>
  <article data-step="1"><div class="step-date">1966 · após o Concílio</div><h3>20 de cada 100.</h3><p>20% declaravam ir à missa todos os domingos.</p></article>
  <article data-step="2"><div class="step-date">2006 · quatro décadas depois</div><h3>4,5 de cada 100.</h3><p>Queda de 22,5 pontos percentuais desde 1952.</p></article>
  <article data-step="3"><div class="step-date">${D.franceRecent.year} · pesquisa recente</div><h3>${fmt(D.franceRecent.value, 1)} de cada 100.</h3><p>Adultos que declaram ir à missa todos os domingos ou mais.</p><p class="history-note">18 anos ou mais · categoria e método distintos da série histórica.</p>${source(D.franceRecent.source)}</article></div></div>
  ${table(
    ["Ano", "%", "Frequência", "População", "Fonte"],
    [...D.historical.franceWeekly.map(([y, v]) => [y, fmt(v, 1) + "%", "Todos os domingos", "Franceses pesquisados", D.sources.ifop.label]),
      [D.franceRecent.year, fmt(D.franceRecent.value, 1) + "%", D.franceRecent.frequency, "Franceses de 18 anos ou mais", D.sources[D.franceRecent.source].label]],
  )}`,
  );
  html += section(
    "comparacao",
    "A dimensão da mudança.",
    "",
    historicalSummary(),
  );
  html += section(
    "pratica",
    "A prática religiosa ao longo das décadas.",
    "Séries com observações anteriores a 1962.",
    `<div class="two-up">${figure("Alemanha · participação nas celebrações", "1950–2024 · participantes por 100 católicos registrados", lineChart([{ name: "Participação", data: D.germany }], { percent: true, max: 60 }), "dbk")}${figure("França · missa todos os domingos", "1952–2006 · % dos franceses pesquisados", lineChart([{ name: "Missa dominical", data: D.historical.franceWeekly }], { percent: true, max: 40 }), "ifop")}</div>`,
    "band",
  );
  html += section(
    "vocacoes",
    "O clero desde o final do Concílio.",
    "EUA · 1965–2025",
    `<div class="two-up">${figure("Sacerdotes", "Número de sacerdotes", lineChart([lineSeries("us", "Total priests", "Sacerdotes")]), "cara")}${figure("Religiosas", "Mulheres em institutos religiosos", lineChart([lineSeries("us", "Religious sisters", "Religiosas")]), "cara")}</div><div class="two-up" style="margin-top:32px">${figure("Duas trajetórias, a mesma base", "Índice · 1965 = 100", lineChart([lineSeries("us", "Total priests", "Sacerdotes"), lineSeries("us", "Religious sisters", "Religiosas")], { index: true, max: 120 }), "cara")}${figure("Paróquias sem pároco residente", "% das paróquias", lineChart([{ name: "Sem pároco residente", data: us["Parishes without a resident priest pastor"].map(([y, n]) => [y, (n / us.Parishes.find((v) => v[0] === y)[1]) * 100]) }], { percent: true, max: 30 }), "cara")}</div>`,
  );
  html += section(
    "sacramentos",
    "Sacramentos desde os anos 1960.",
    "EUA · celebrações anuais · 1964–2024",
    `<div class="two-up">${figure("Batismos de bebês", "Celebrações por ano", lineChart([usSacrament("Baptisms of infants in previous year", "Batismos")]), "cara")}${figure("Casamentos católicos", "Celebrações por ano", lineChart([usSacrament("Marriages in previous year", "Casamentos")]), "cara")}</div><div class="two-up" style="margin-top:32px">${figure("Batismos de adultos", "Celebrações por ano", lineChart([usSacrament("Baptisms of adults in previous year", "Batismos de adultos")]), "cara")}${figure("Batismos e casamentos na mesma escala", "Índice · 1964 = 100", lineChart([usSacrament("Baptisms of infants in previous year", "Batismos de bebês"), usSacrament("Marriages in previous year", "Casamentos")], { index: true, max: 160 }), "cara")}</div>`,
  );
  html += section(
    "franca",
    "Na França, filiação e prática recuaram.",
    "1952–2006 · % dos franceses pesquisados",
    figure(
      "Identificação católica e missa dominical",
      "Duas medidas na mesma população",
      lineChart(
        [
          {
            name: "Católicos",
            data: D.historical.franceCatholic,
            color: colors[1],
          },
          { name: "Missa dominical", data: D.historical.franceWeekly },
        ],
        { percent: true, max: 100 },
      ),
      "ifop",
    ),
  );
  html += section(
    "mundo",
    "A trajetória mundial desde 1970.",
    "Católicos registrados, sacerdotes e vida religiosa.",
    `<div class="two-up">${figure("Católicos e sacerdotes", "Índice · 1970 = 100", lineChart([lineSeries("world", "Catholic population", "Católicos", colors[1]), lineSeries("world", "Total priests", "Sacerdotes")], { index: true }), "cara")}${figure("Religiosas no mundo", "1970–2024 · número de religiosas", lineChart([{ name: "Religiosas", data: [...world["Religious sisters"], [2024, 580131]] }]), "cara")}${figure("Batismos de crianças até 7 anos", "1970–2023 · celebrações anuais", lineChart([lineSeries("world", "Baptisms of infants to age 7", "Batismos")]), "cara")}${figure("Casamentos entre dois católicos", "1970–2023 · celebrações anuais", lineChart([lineSeries("world", "Marriages between two Catholics", "Casamentos")]), "cara")}</div>${source("vatican")}`,
  );
  html += section(
    "explorar",
    "Explore as séries.",
    "Décadas de dados em valores absolutos ou em índice.",
    `<div class="explorer-controls"><label>Indicador<select id="indicator"></select></label><label>Escala<select id="scale"><option value="values">Valores absolutos</option><option value="index">Índice · primeiro ano = 100</option></select></label><button id="download-series">Baixar série</button></div><div id="explorer-chart"></div><p class="chart-status" id="explorer-status" aria-live="polite"></p>`,
  );
  html += section(
    "fontes",
    "Fontes.",
    "",
    `<div class="sources">${Object.entries(D.sources)
      .map(
        ([k, s]) =>
          `<div id="fonte-${k}"><h3><a href="${s.url}" target="_blank" rel="noopener">${s.label}</a></h3></div>`,
      )
      .join(
        "",
      )}</div><div class="download-links"><a href="data/estatisticas.csv" download>Todos os dados · CSV</a><a href="data/editorial.json" download>Recortes e fontes · JSON</a><a href="data/cara.json" download>Séries históricas · JSON</a><a href="data/sources/CARAFrequentlyRequested.xlsx" download>Planilha original · CARA</a></div>`,
  );
  $("#content").innerHTML = html;
  $("#loading").remove();
  initHistory();
  initExplorer();
  initTooltips();
  initProgress();
}
function initHistory() {
  const years = [1952, 1966, 2006, D.franceRecent.year],
    values = [27, 20, 4.5, D.franceRecent.value];
  const update = (n) => {
    const v = values[n];
    const recent = n === 3;
    document.querySelectorAll("[data-step]").forEach((e, i) => e.classList.toggle("active", i === n));
    $("#history-unit").textContent = recent ? D.franceRecent.unit : "% dos franceses pesquisados";
    $("#history-source").innerHTML = source(recent ? D.franceRecent.source : "ifop");
    $("#history-legend").innerHTML = legend([{ name: recent ? "Todos os domingos ou mais" : "Missa aos domingos", color: colors[0] }, { name: "Demais respostas", color: "#d4d5ca" }]);
    $("#history-value").textContent = fmt(v, 1) + "%";
    $("#history-year").textContent = years[n];
    $("#history-dots").setAttribute(
      "aria-label",
      `${fmt(v, 1)}% em ${years[n]} · ${recent ? D.franceRecent.unit : "franceses pesquisados"} · ${recent ? D.franceRecent.frequency : "todos os domingos"}`,
    );
    document.querySelectorAll("#history-dots .dot").forEach((e, i) => {
      e.className = "dot" + (i < Math.floor(v) ? " cat" : "");
      e.style.background =
        i === Math.floor(v) && v % 1
          ? `linear-gradient(90deg, ${colors[0]} ${(v % 1) * 100}%, #d4d5ca ${(v % 1) * 100}%)`
          : "";
    });
    document
      .querySelectorAll("[data-history]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(+b.dataset.history === n)),
      );
  };
  document
    .querySelectorAll("[data-history]")
    .forEach((b) =>
      b.addEventListener("click", () => update(+b.dataset.history)),
    );
  let current = -1,
    queued = false;
  const sync = () => {
    let n = 0;
    const steps = [...document.querySelectorAll("[data-step]")];
    steps.forEach((e, i) => {
      if (e.getBoundingClientRect().top < innerHeight * 0.68) n = i;
    });
    if (current !== n) {
      current = n;
      update(n);
    }
    queued = false;
  };
  addEventListener(
    "scroll",
    () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(sync);
      }
    },
    { passive: true },
  );
  sync();
}

const indicators = [
  [
    "historical",
    "franceWeekly",
    "França · missa dominical desde 1952",
    "% dos franceses pesquisados",
    "ifop",
  ],
  [
    "historical",
    "franceCatholic",
    "França · católicos desde 1952",
    "% dos franceses pesquisados",
    "ifop",
  ],
  [
    "historical",
    "germany",
    "Alemanha · participação desde 1950",
    "Participantes por 100 católicos",
    "dbk",
  ],
  [
    "historical",
    "brazilCatholic",
    "Brasil · católicos desde 1940",
    "% da população, todas as idades",
    "fgv",
  ],
  [
    "world",
    "Catholic population",
    "Mundo · católicos registrados",
    "Batizados registrados",
    "cara",
  ],
  ["world", "Total priests", "Mundo · sacerdotes", "Sacerdotes", "cara"],
  ["world", "Religious sisters", "Mundo · religiosas", "Religiosas", "cara"],
  [
    "world",
    "Religious brothers",
    "Mundo · irmãos religiosos",
    "Irmãos religiosos",
    "cara",
  ],
  [
    "world",
    "Diocesan priestly ordinations",
    "Mundo · ordenações diocesanas",
    "Ordenações por ano",
    "cara",
  ],
  [
    "world",
    "Permanent deacons",
    "Mundo · diáconos permanentes",
    "Diáconos",
    "cara",
  ],
  ["world", "Parishes", "Mundo · paróquias", "Paróquias", "cara"],
  [
    "world",
    "Baptisms of infants to age 7",
    "Mundo · batismos até 7 anos",
    "Celebrações por ano",
    "cara",
  ],
  [
    "world",
    "Baptisms of those ages 8 and older",
    "Mundo · batismos a partir de 8 anos",
    "Celebrações por ano",
    "cara",
  ],
  [
    "world",
    "Marriages between two Catholics",
    "Mundo · casamentos entre católicos",
    "Celebrações por ano",
    "cara",
  ],
  [
    "world",
    "Marriages between a Catholic and a non-Catholic",
    "Mundo · casamentos mistos",
    "Celebrações por ano",
    "cara",
  ],
  ["world", "Confirmations", "Mundo · crismas", "Celebrações por ano", "cara"],
  [
    "world",
    "First Communions",
    "Mundo · primeiras comunhões",
    "Celebrações por ano",
    "cara",
  ],
  [
    "world",
    "Catholic elementary schools",
    "Mundo · escolas primárias católicas",
    "Escolas",
    "cara",
  ],
  [
    "world",
    "Students in Catholic elementary schools",
    "Mundo · alunos nas escolas primárias católicas",
    "Alunos",
    "cara",
  ],
  [
    "world",
    "Catholic secondary schools",
    "Mundo · escolas secundárias católicas",
    "Escolas",
    "cara",
  ],
  [
    "world",
    "Catholic hospitals",
    "Mundo · hospitais católicos",
    "Hospitais",
    "cara",
  ],
  ["us", "Total priests", "EUA · sacerdotes", "Sacerdotes", "cara"],
  ["us", "Religious sisters", "EUA · religiosas", "Religiosas", "cara"],
  [
    "us",
    "Religious brothers",
    "EUA · irmãos religiosos",
    "Irmãos religiosos",
    "cara",
  ],
  [
    "us",
    "Priestly ordinations",
    "EUA · ordenações sacerdotais",
    "Ordenações por ano",
    "cara",
  ],
  ["us", "Permanent deacons", "EUA · diáconos permanentes", "Diáconos", "cara"],
  ["us", "Parishes", "EUA · paróquias", "Paróquias", "cara"],
  [
    "us",
    "Parishes without a resident priest pastor",
    "EUA · paróquias sem pároco residente",
    "Paróquias",
    "cara",
  ],
  [
    "us",
    "Baptisms of infants in previous year",
    "EUA · batismos de bebês",
    "Celebrações por ano",
    "cara",
  ],
  [
    "us",
    "Baptisms of adults in previous year",
    "EUA · batismos de adultos",
    "Celebrações por ano",
    "cara",
  ],
  [
    "us",
    "Marriages in previous year",
    "EUA · casamentos católicos",
    "Celebrações por ano",
    "cara",
  ],
  [
    "us",
    "First Communions in previous year",
    "EUA · primeiras comunhões",
    "Celebrações por ano",
    "cara",
  ],
  [
    "us",
    "Confirmations in previous year",
    "EUA · crismas",
    "Celebrações por ano",
    "cara",
  ],
  [
    "us",
    "Catholic hospitals",
    "EUA · hospitais católicos",
    "Hospitais",
    "cara",
  ],
];
function initExplorer() {
  $("#indicator").innerHTML = indicators
    .map((r, i) => `<option value="${i}">${r[2]}</option>`)
    .join("");
  function selected() {
    let [area, key, name, unit, sourceKey] = indicators[+$("#indicator").value],
      data = (
        area === "historical"
          ? key === "germany"
            ? D.germany
            : D.historical[key]
          : C[area][key]
      ).map(([y, n]) => [
        area === "us" && key.includes("previous year") ? y - 1 : y,
        n,
      ]);
    return { name, unit, sourceKey, data };
  }
  function update() {
    const s = selected(),
      index = $("#scale").value === "index";
    $("#explorer-chart").innerHTML = figure(
      s.name,
      index ? "Índice · primeiro ano = 100" : s.unit,
      lineChart([{ name: s.unit, data: s.data }], {
        index,
        percent: s.unit.startsWith("%") && !index,
        height: 250,
      }),
      s.sourceKey,
    );
    const first = s.data[0],
      last = s.data.at(-1),
      delta = (last[1] / first[1] - 1) * 100;
    $("#explorer-status").textContent =
      `${first[0]} → ${last[0]}: ${delta > 0 ? "+" : ""}${fmt(delta, 1)}% em relação ao primeiro ano.`;
    initTooltips($("#explorer-chart"));
  }
  $("#indicator").addEventListener("change", update);
  $("#scale").addEventListener("change", update);
  $("#download-series").addEventListener("click", () => {
    const s = selected();
    const csv =
      "\ufeffIndicador;Ano;Valor\r\n" +
      s.data
        .map(([y, n]) => `${s.name};${y};${String(n).replace(".", ",")}`)
        .join("\r\n");
    const a = document.createElement("a"),
      url = URL.createObjectURL(
        new Blob([csv], { type: "text/csv;charset=utf-8" }),
      );
    a.href = url;
    a.download = "serie-estatistica.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  update();
}
function initTooltips(root = document) {
  root.querySelectorAll("[data-tip]").forEach((e) => {
    if (e.dataset.bound) return;
    e.dataset.bound = "true";
    const show = (event) => {
      const t = $("#tooltip");
      t.textContent = e.dataset.tip;
      t.hidden = false;
      const r = e.getBoundingClientRect(),
        x = event.clientX || r.x + r.width / 2,
        y = event.clientY || r.y;
      t.style.left =
        Math.max(8, Math.min(innerWidth - t.offsetWidth - 10, x + 12)) + "px";
      t.style.top =
        Math.max(8, Math.min(innerHeight - t.offsetHeight - 10, y - 45)) + "px";
    };
    e.addEventListener("pointerenter", show);
    e.addEventListener("pointermove", show);
    e.addEventListener("focus", show);
    e.addEventListener("pointerleave", () => ($("#tooltip").hidden = true));
    e.addEventListener("blur", () => ($("#tooltip").hidden = true));
  });
}
function initProgress() {
  let scheduled = false;
  addEventListener(
    "scroll",
    () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        const den = document.documentElement.scrollHeight - innerHeight;
        $(".read-progress").style.width =
          (den > 0 ? (scrollY / den) * 100 : 0) + "%";
        $("#tooltip").hidden = true;
        scheduled = false;
      });
    },
    { passive: true },
  );
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          document.querySelectorAll("nav a").forEach((a) => {
            if (a.hash === "#" + e.target.id)
              a.setAttribute("aria-current", "location");
            else a.removeAttribute("aria-current");
          });
        }
      });
    },
    { rootMargin: "-15% 0px -65% 0px" },
  );
  document.querySelectorAll("section[id]").forEach((s) => obs.observe(s));
}
Promise.all([
  fetch("data/editorial.json").then((r) => {
    if (!r.ok) throw Error();
    return r.json();
  }),
  fetch("data/cara.json").then((r) => {
    if (!r.ok) throw Error();
    return r.json();
  }),
])
  .then(([d, c]) => {
    D = d;
    C = c;
    render();
  })
  .catch((error) => {
    console.error(error);
    $("#loading").innerHTML =
      'Não foi possível carregar os gráficos. <button onclick="location.reload()">Tentar novamente</button> ou <a href="data/estatisticas.csv">baixar os dados</a>.';
  });
