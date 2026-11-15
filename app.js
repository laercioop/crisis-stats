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
  } = {},
) {
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
      svg += `<circle role="img" class="point" cx="${X(x)}" cy="${Y(y)}" r="3.7" fill="${color}" tabindex="0" data-tip="${esc(tip)}" aria-label="${esc(tip)}"><title>${esc(tip)}</title></circle>`;
    });
  });
  svg += "</svg>";
  const years = [...new Set(all.map((x) => x[0]))].sort((a, b) => a - b);
  return `<div class="chart">${legend(series)}${svg}${table(
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
  return `<figure><h3 class="chart-title">${title}</h3><p class="unit">${subtitle}</p>${body}${source(key)}${note ? `<p class="note">${note}</p>` : ""}</figure>`;
}
function section(id, title, intro, body, cls = "") {
  return `<section class="section ${cls}" id="${id}"><div class="section-head"><h2>${title}</h2><p class="intro">${intro}</p></div>${body}</section>`;
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
function render() {
  const world = C.world,
    us = C.us;
  let html = section(
    "brasil",
    "No Brasil, a maioria católica encolheu.",
    "Em 12 anos, a mudança aparece tanto na proporção quanto no número de pessoas.",
    `
 <div class="scrolly"><div class="sticky-plot"><h3 class="chart-title">A cada 100 brasileiros</h3><p class="unit">População de 10 anos ou mais · Brasil</p><div class="dot-readout"><strong id="brazil-value">65,1%</strong><span id="brazil-year">2010</span></div><div class="dotgrid" id="brazil-dots" role="img" aria-label="65,1% católicos em 2010">${Array.from({ length: 100 }, () => '<i class="dot" aria-hidden="true"></i>').join("")}</div><div class="legend" id="brazil-legend"></div><div class="toggle-row" aria-label="Ano do censo"><button data-brazil="0" aria-pressed="true">2010</button><button data-brazil="1" aria-pressed="false">2022</button></div><p class="dot-description">Cada círculo ≈ 1% da população. Os valores exatos estão nas tabelas.</p>${source("ibge")}</div>
 <div class="steps"><article data-step="0" class="active"><div class="step-date">2010</div><h3>65 de cada 100<br>eram católicos.</h3><p>105,4 milhões de pessoas com 10 anos ou mais.</p></article><article data-step="1"><div class="step-date">2022</div><h3>Agora, são 57<br>de cada 100.</h3><p>A proporção caiu de 65,1% para 56,7%: <strong>−8,4 pontos percentuais.</strong></p></article><article data-step="2"><div class="step-date">2010 → 2022</div><h3>Também caiu<br>o total de católicos.</h3><p>De 105,4 para 100,2 milhões: <strong>−5,2 milhões.</strong> Evangélicos e pessoas sem religião ganharam participação.</p></article></div></div>
 ${table(
   ["Grupo", "2010", "2022"],
   D.brazil.groups.map((g) => [
     g.label,
     fmt(g.values[0], 1) + "%",
     fmt(g.values[1], 1) + "%",
   ]),
 )}<p class="note">Resultados preliminares do Censo 2022, divulgados em 2025. Outros / sem declaração é o complemento dos três grupos destacados.</p>`,
  );
  html += section(
    "brasil-geracoes",
    "A proporção muda com a idade e o lugar.",
    "No Censo, a identificação católica é maior entre os mais velhos. A média nacional também esconde diferenças entre estados.",
    `<div class="two-up">${figure("Católicos por idade", "Brasil · 2022 · % de cada faixa etária", horizontal(D.brazil.ages, { unit: "%" }), "ibge", "Dois grupos selecionados. Uma comparação entre idades, não o acompanhamento das mesmas pessoas ao longo da vida.")}${figure("Dos maiores aos menores percentuais", "2022 · estados selecionados · pessoas de 10 anos ou mais", horizontal(D.brazil.states, { unit: "%" }), "ibge", "Piauí: maior proporção. Roraima, Rio de Janeiro e Acre: menores proporções.")}</div>`,
  );
  html += section(
    "america-latina",
    "A queda atravessa a América Latina.",
    "Seis países, a mesma direção. A intensidade da mudança varia.",
    figure(
      "Católicos entre os adultos",
      "% de pessoas com 18 anos ou mais",
      pairs(D.latam.map((r) => [r.country, ...r.catholic])),
      "pewla",
      "Pesquisa de 2024, publicada em 2026. O Brasil desta pesquisa não é diretamente comparável ao Censo: idade, ano e método são diferentes.",
    ),
  );
  html += section(
    "mundo",
    "No mundo, o total cresceu.",
    "O número de batizados mais que dobrou desde 1970. A participação na população mundial ficou perto de 18%.",
    `<div class="two-up">${figure("Católicos registrados", "Mundo · número de batizados", lineChart([{ name: "Católicos", data: [...world["Catholic population"], [2024, 1422000000]], color: colors[1] }], { description: "Crescimento do número de católicos registrados no mundo" }), "cara")}${figure("Participação na população mundial", "Mundo · % da população", lineChart([{ name: "Católicos", data: [...world["Percent of world population"].map(([y, v]) => [y, v * 100]), [2024, 17.8]], color: colors[1] }], { percent: true, max: 100, description: "Participação católica na população mundial" }), "cara")}</div><p class="note">2024: Fides / Vaticano (2026). Anos anteriores: CARA / Anuário Estatístico. Contagem de batizados registrados; não mede frequência à missa.</p>${source("vatican")}`,
  );
  html += section(
    "continentes",
    "O centro de gravidade está mudando.",
    "Em 2024, a África reuniu ligeiramente mais católicos que a Europa. O crescimento do clero também foi desigual.",
    `<div class="two-up">${figure(
      "Onde estão os católicos",
      "2024 · milhões de batizados",
      horizontal(
        D.world2024.continents.map((r) => [r[0], r[1]]),
        { unit: "Milhões", color: colors[1] },
      ),
      "vatican",
    )}${figure(
      "Variação no número de sacerdotes",
      "2023 → 2024 · aumento ou redução",
      horizontal(
        D.world2024.continents.map((r) => [r[0], r[2]]),
        { signed: true, unit: "Sacerdotes" },
      ),
      "vatican",
    )}</div>`,
  );
  html += section(
    "vocacoes",
    "Mais fiéis. Quase o mesmo número de padres.",
    "Desde 1970, a população católica cresceu muito mais que o clero. O contraste fica claro usando a mesma base.",
    `<div class="two-up">${figure("Dois ritmos de crescimento", "Mundo · índice, 1970 = 100", lineChart([lineSeries("world", "Catholic population", "Católicos", colors[1]), lineSeries("world", "Total priests", "Sacerdotes", colors[0])], { index: true, description: "Católicos e sacerdotes, índice com base 1970 igual a 100" }), "cara")}${figure("Católicos por sacerdote", "Mundo · razão calculada a partir dos totais", lineChart([{ name: "Católicos por padre", data: world["Catholic population"].map(([y, n]) => [y, n / world["Total priests"].find((v) => v[0] === y)[1]]) }], { description: "Número médio de católicos por sacerdote no mundo" }), "cara", "Razão aritmética: não informa a distribuição local nem quantos sacerdotes estão ativos.")}</div><div class="two-up" style="margin-top:55px">${figure("Religiosas no mundo", "Número de mulheres em institutos religiosos", lineChart([{ name: "Religiosas", data: [...world["Religious sisters"], [2024, 580131]] }]), "cara", "2024: Fides / Vaticano (2026).")}${figure("Seminaristas maiores", "Mundo · candidatos ao sacerdócio", pairs([["Mundo", 106495, 103604]], ["2023", "2024"], 120000, "", false), "vatican", "−2.891 seminaristas em um ano (−2,7%). A África foi o único continente com aumento.")}</div>`,
  );
  html += section(
    "estados-unidos",
    "Nos EUA, a estrutura ficou menor.",
    "Menos sacerdotes e religiosas. Mais paróquias sem um pároco residente.",
    `<div class="two-up">${figure("Sacerdotes e religiosas", "EUA · índice, 1965 = 100", lineChart([lineSeries("us", "Total priests", "Sacerdotes"), lineSeries("us", "Religious sisters", "Religiosas")], { index: true, max: 110 }), "cara")}${figure("Paróquias sem pároco residente", "EUA · % das paróquias", lineChart([{ name: "Sem pároco residente", data: us["Parishes without a resident priest pastor"].map(([y, n]) => [y, (n / us.Parishes.find((v) => v[0] === y)[1]) * 100]) }], { percent: true, max: 30 }), "cara", "Não significa paróquias sem missas ou sem atendimento sacerdotal.")}</div><div class="two-up" style="margin-top:55px">${figure("Ordenações sacerdotais", "EUA · número por ano", lineChart([lineSeries("us", "Priestly ordinations", "Ordenações")]), "cara")}${figure("Diáconos permanentes", "EUA · número de diáconos", lineChart([lineSeries("us", "Permanent deacons", "Diáconos", colors[1])]), "cara")}</div>`,
  );
  html += section(
    "pratica",
    "Identificar-se é uma coisa.<br>Praticar é outra.",
    "Entre católicos, a frequência às celebrações também mudou. Os métodos de medição diferem entre os países.",
    `<div class="two-up">${figure("Alemanha: participação nas celebrações", "Participantes por 100 católicos registrados", lineChart([{ name: "Participação", data: D.germany }], { percent: true, max: 60 }), "dbk", "Desde 1990, inclui os novos estados alemães. A pandemia afetou 2020–2021.")}${figure("EUA: missa todas as semanas", "% de católicos · estimativas de pesquisas", lineChart([{ name: "Frequência semanal", data: us["Catholics who attend Mass every week (survey-based estimate)"].map(([y, n]) => [y, n * 100]) }], { percent: true, max: 60 }), "cara", "Estimativas reunidas pelo CARA. A série combina pesquisas; a medição difere da contagem alemã.")}</div>`,
    "band",
  );
  html += section(
    "pratica-latina",
    "A prática também varia entre os grupos.",
    "Na pesquisa de 2024, protestantes declararam maior frequência semanal que católicos nos cinco países com estimativas para ambos.",
    figure(
      "Participação semanal em serviços religiosos",
      "% dentro de cada grupo religioso · adultos",
      pairs(
        D.latam
          .filter((r) => r.weeklyProtestant !== null)
          .map((r) => [r.country, r.weeklyCatholic, r.weeklyProtestant]),
        ["Católicos", "Protestantes"],
        100,
        "%",
        false,
      ),
      "pewla",
      "México omitido: amostra protestante insuficiente. As perguntas se referem aos espaços religiosos de cada grupo; frequência autodeclarada.",
    ),
  );
  const sacrament = (area, key, name) => ({
    name,
    data: C[area][key].map(([y, n]) => [area === "us" ? y - 1 : y, n]),
  });
  html += section(
    "sacramentos",
    "Menos batismos infantis e casamentos.",
    "A redução aparece nos totais mundiais e nos EUA. Estes são números de celebrações, não taxas por habitante.",
    `<div class="two-up">${figure("Batismos de crianças até 7 anos", "Mundo · celebrações por ano", lineChart([sacrament("world", "Baptisms of infants to age 7", "Batismos")]), "cara")}${figure("Casamentos entre dois católicos", "Mundo · celebrações por ano", lineChart([sacrament("world", "Marriages between two Catholics", "Casamentos")]), "cara")}</div><div class="two-up" style="margin-top:55px">${figure("Batismos de bebês", "EUA · celebrações por ano", lineChart([sacrament("us", "Baptisms of infants in previous year", "Batismos")]), "cara")}${figure("Casamentos católicos", "EUA · celebrações por ano", lineChart([sacrament("us", "Marriages in previous year", "Casamentos")]), "cara")}</div><p class="note">Nos EUA, os anos foram deslocados para o ano efetivo da celebração: a coluna 2025 da fonte relata sacramentos de 2024. Natalidade, estrutura etária e tamanho da população também influenciam os totais.</p>`,
  );
  html += section(
    "mudancas",
    "Nos EUA, saem mais do que entram.",
    "A comparação é entre a religião da infância e a identidade na vida adulta. Não é uma contagem de saídas por ano.",
    `<div class="ratio"><div><div class="quote-num">8,4 : 1</div><p class="ratio-label">pessoas criadas católicas que deixaram essa identidade para cada pessoa que se tornou católica</p><div class="ratio-track"></div><div class="ratio-track gain"></div>${source("pewus")}</div><div><h3>De cada 100 criados católicos…</h3><div class="waffle-small" role="img" aria-label="57 permanecem católicos; 43 não se identificam mais como católicos">${Array.from({ length: 100 }, (_, i) => `<i class="${i < 57 ? "filled" : ""}"></i>`).join("")}</div>${legend(
      [
        { name: "57 permanecem", color: colors[0] },
        { name: "43 deixaram", color: "#d9ddcf" },
      ],
    )}${table(
      ["Medida", "Resultado"],
      [
        ["Permanecem católicos", "57%"],
        ["Já não se identificam como católicos", "43%"],
        ["Razão entre saídas e entradas", "8,4 para 1"],
      ],
    )}</div></div><p class="note">Adultos nos EUA · pesquisa 2023–2024, publicada em 2025. As mudanças refletem trajetórias de vida, não necessariamente ritos formais.</p>`,
  );
  html += section(
    "crencas",
    "A identidade não resume a crença.",
    "Na América Latina, a crença em Deus continua ampla. Nos EUA, a resposta sobre a Eucaristia muda conforme a prática.",
    `<div class="two-up">${figure(
      "Crença em Deus e importância da religião",
      "% de todos os adultos · 2024",
      pairs(
        D.latam.map((r) => [r.country, r.god, r.important]),
        ["Creem em Deus", "Religião muito importante"],
        100,
        "%",
        false,
      ),
      "pewla",
      "Inclui todas as identidades religiosas, não apenas católicos.",
    )}${figure(
      "Crença na transformação do pão e do vinho",
      "% de católicos nos EUA · 2019",
      horizontal(
        [
          ["Todos", 31],
          ["Missa semanal", 63],
        ],
        { unit: "%", color: colors[0] },
      ),
      "eucharist",
      "No conjunto, 69% escolheram a interpretação simbólica. Uma pesquisa de 2019, não uma medição atual nem uma série temporal. A formulação da pergunta importa.",
    )}</div>`,
  );
  html += section(
    "opinioes",
    "A prática não elimina as divergências.",
    "Nos EUA, o apoio a mudanças é menor entre os católicos que vão à missa semanalmente. Em alguns temas, continua majoritário.",
    figure(
      "A Igreja deveria permitir…",
      "% de católicos nos EUA · 2025",
      pairs(
        D.opinions,
        ["Todos os católicos", "Missa ao menos semanal"],
        100,
        "%",
        false,
      ),
      "moral",
      "Apoio declarado, não comportamento pessoal. A pergunta sobre contracepção não distingue métodos naturais. O celibato é uma disciplina, com exceções, não um dogma.",
    ),
  );
  html += section(
    "franca",
    "Há movimentos na direção contrária.",
    "Na França, a procura pelo batismo de adultos aumentou. Essa série mede um grupo específico, não todos os batismos.",
    `<div class="two-up"><div><h3>Mais de três vezes<br>em dez anos.</h3><div class="statline"><strong>+221%</strong><span>adultos anunciados para o batismo na Páscoa</span></div><p class="note">Inquérito francês do catecumenato. Os números são os anunciados antes da Páscoa, não uma apuração final.</p></div>${figure(
      "Adultos anunciados para o batismo",
      "França · Páscoa de 2016 e de 2026",
      horizontal(
        [
          ["2016", 4124],
          ["2026", 13234],
        ],
        { unit: "Adultos", color: colors[1] },
      ),
      "cef",
    )}</div>`,
  );
  html += section(
    "explorar",
    "Explore as séries.",
    "Escolha um indicador. Compare os valores ou a mudança proporcional desde o primeiro ano disponível.",
    `<div class="explorer-controls"><label>Indicador<select id="indicator"></select></label><label>Escala<select id="scale"><option value="values">Valores absolutos</option><option value="index">Índice · primeiro ano = 100</option></select></label><button id="download-series">Baixar série</button></div><div id="explorer-chart"></div><p class="chart-status" id="explorer-status" aria-live="polite"></p>`,
  );
  html += section(
    "fontes",
    "Fontes e notas.",
    "O ano junto à fonte é o da publicação. Cada gráfico informa o período dos dados.",
    `<div class="sources">${Object.entries(D.sources)
      .map(
        ([k, s]) =>
          `<div id="fonte-${k}"><h3><a href="${s.url}" target="_blank" rel="noopener">${s.label}</a></h3><p>${s.note}</p></div>`,
      )
      .join(
        "",
      )}</div><div class="explain"><strong>Como ler:</strong> de 65,1% para 56,7% são −8,4 pontos percentuais, ou −12,9% em termos relativos. Totais, proporções e frequência religiosa respondem a perguntas diferentes. Séries temporais, por si só, não demonstram causas.</div><div class="download-links"><a href="data/estatisticas.csv" download>Todos os dados · CSV</a><a href="data/editorial.json" download>Recortes e fontes · JSON</a><a href="data/cara.json" download>Séries históricas · JSON</a><a href="data/sources/CARAFrequentlyRequested.xlsx" download>Planilha original · CARA</a></div>`,
  );
  $("#content").innerHTML = html;
  $("#loading").remove();
  initBrazil();
  initExplorer();
  initTooltips();
  initProgress();
}
function initBrazil() {
  let stage = 0;
  function update(which, full = false) {
    stage = which;
    let groups = D.brazil.groups,
      year = D.brazil.years[which],
      cat = groups[0].values[which];
    $("#brazil-value").textContent = fmt(cat, 1) + "%";
    $("#brazil-year").textContent = year;
    $("#brazil-dots").setAttribute(
      "aria-label",
      `${fmt(cat, 1)}% católicos em ${year}`,
    );
    let bounds = [
      Math.round(cat),
      Math.round(cat + groups[1].values[which]),
      Math.round(cat + groups[1].values[which] + groups[2].values[which]),
    ];
    document.querySelectorAll(".dot").forEach((dot, i) => {
      dot.className =
        "dot " +
        (i < bounds[0]
          ? "cat"
          : full
            ? i < bounds[1]
              ? "ev"
              : i < bounds[2]
                ? "none"
                : "other"
            : "");
    });
    $("#brazil-legend").innerHTML = legend(
      full
        ? [
            { name: "Católicos", color: colors[0] },
            { name: "Evangélicos", color: colors[1] },
            { name: "Sem religião", color: colors[2] },
            { name: "Outros", color: "#b8bcaf" },
          ]
        : [
            { name: "Católicos", color: colors[0] },
            { name: "Demais", color: "#d4d5ca" },
          ],
    );
    document
      .querySelectorAll("[data-brazil]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(+b.dataset.brazil === which)),
      );
  }
  document
    .querySelectorAll("[data-brazil]")
    .forEach((b) =>
      b.addEventListener("click", () => update(+b.dataset.brazil, true)),
    );
  update(0);
  let current = -1,
    queued = false;
  const sync = () => {
    const steps = [...document.querySelectorAll("[data-step]")];
    let n = 0;
    steps.forEach((e, i) => {
      if (e.getBoundingClientRect().top < innerHeight * 0.68) n = i;
    });
    if (n !== current) {
      current = n;
      steps.forEach((e, i) => e.classList.toggle("active", i === n));
      update(n === 0 ? 0 : 1, n === 2);
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
      data = C[area][key].map(([y, n]) => [
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
      lineChart([{ name: s.unit, data: s.data }], { index, height: 310 }),
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
