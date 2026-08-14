// tranca? — descobre o que você pode cursar a partir do que já fez
// dados vêm de /data/index.json + /data/courses/<id>.json

const state = {
  curriculoId: null,
  disciplinas: [],       // array bruto do JSON
  byCode: new Map(),     // codigo -> disciplina
  feitas: new Set(),     // codigos marcados como concluídos
};

const STORAGE_PREFIX = "tranca-ufrj:feitas:";

async function init() {
  const manifest = await fetch("data/index.json").then(r => r.json());
  const select = document.getElementById("curriculo-select");
  manifest.curriculos.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.arquivo;
    opt.textContent = c.nome;
    select.appendChild(opt);
  });
  select.addEventListener("change", () => loadCurriculo(select.value));

  document.getElementById("detail-close").addEventListener("click", closeDetail);
  document.getElementById("detail-backdrop").addEventListener("click", closeDetail);

  await loadCurriculo(manifest.curriculos[0].arquivo);
}

async function loadCurriculo(path) {
  const data = await fetch("data/" + path).then(r => r.json());
  state.curriculoId = data.id;
  state.disciplinas = data.disciplinas;
  state.byCode = new Map(data.disciplinas.map(d => [d.codigo, d]));
  state.feitas = loadFeitas(data.id);
  render();
}

function loadFeitas(id) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + id);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

function saveFeitas() {
  localStorage.setItem(
    STORAGE_PREFIX + state.curriculoId,
    JSON.stringify([...state.feitas])
  );
}

// ---------- lógica de requisitos ----------

// Uma disciplina tem 0+ requisitos. Cada requisito tem um "alvo" (código,
// às vezes virtual/de outro currículo) e uma lista de "opcoes" — grupos
// alternativos (OR) de códigos que precisam TODOS (AND) ter sido feitos.
// O próprio alvo conta como uma opção válida quando ele é uma disciplina
// real deste currículo.
function requisitoSatisfeito(req) {
  const grupos = [...req.opcoes];
  if (state.byCode.has(req.alvo)) grupos.push([req.alvo]);
  if (grupos.length === 0) return { ok: null, motivo: "sem-dado" }; // não dá pra checar
  const ok = grupos.some(g => g.every(cod => state.feitas.has(cod)));
  return { ok, grupos };
}

function statusDisciplina(cod) {
  if (state.feitas.has(cod)) return "done";
  const d = state.byCode.get(cod);
  if (!d) return "ok";
  const reqs = d.requisitos.filter(r => r.tipo === "P"); // co-requisitos não trancam
  if (reqs.length === 0) return "ok";
  const todasOk = reqs.every(r => requisitoSatisfeito(r).ok !== false);
  return todasOk ? "ok" : "locked";
}

function quemDestrava(cod) {
  return state.disciplinas.filter(d =>
    d.requisitos.some(r => r.alvo === cod || r.opcoes.some(g => g.includes(cod)))
  );
}

// ---------- render ----------

function render() {
  renderSummary();
  renderPeriods();
}

function renderSummary() {
  const total = state.disciplinas.length;
  const feitas = state.disciplinas.filter(d => state.feitas.has(d.codigo)).length;
  const disponiveis = state.disciplinas.filter(d => statusDisciplina(d.codigo) === "ok").length;
  const trancadas = state.disciplinas.filter(d => statusDisciplina(d.codigo) === "locked").length;
  const creditos = state.disciplinas
    .filter(d => state.feitas.has(d.codigo))
    .reduce((s, d) => s + d.creditos, 0);

  document.getElementById("summary").innerHTML = `
    <div class="ledger-cell done"><div class="n">${feitas}</div><div class="l">concluídas</div></div>
    <div class="ledger-cell ok"><div class="n">${disponiveis}</div><div class="l">liberadas</div></div>
    <div class="ledger-cell locked"><div class="n">${trancadas}</div><div class="l">trancadas</div></div>
    <div class="ledger-cell"><div class="n">${creditos.toFixed(0)}</div><div class="l">créditos cursados</div></div>
    <div class="ledger-cell"><div class="n">${total}</div><div class="l">disciplinas no currículo</div></div>
  `;
}

function renderPeriods() {
  const periods = [...new Set(state.disciplinas.map(d => d.periodo))]
    .sort((a, b) => {
      if (a === "optativa") return 1;
      if (b === "optativa") return -1;
      return a - b;
    });

  const main = document.getElementById("periods");
  main.innerHTML = "";

  periods.forEach(p => {
    const disciplinas = state.disciplinas.filter(d => d.periodo === p);
    const col = document.createElement("div");
    col.className = "period-col";
    const label = p === "optativa" ? "optativas" : `${p}º período`;
    const totalCred = disciplinas.reduce((s, d) => s + d.creditos, 0);
    col.innerHTML = `
      <div class="period-head">
        <h2>${label}</h2>
        <span class="credits">${totalCred.toFixed(0)} cr.</span>
      </div>
      <ul class="course-list"></ul>
    `;
    const list = col.querySelector(".course-list");
    disciplinas.forEach(d => list.appendChild(courseCard(d)));
    main.appendChild(col);
  });
}

function courseCard(d) {
  const status = statusDisciplina(d.codigo);
  const li = document.createElement("li");
  li.className = `course-card status-${status}`;
  li.innerHTML = `
    <span class="stamp ${status}">${stampLabel(status)}</span>
    <div class="course-row">
      <button class="course-check" aria-label="marcar concluída"></button>
      <div class="course-main">
        <div class="course-code">${d.codigo} · ${d.creditos.toFixed(0)} cr.</div>
        <div class="course-name">${d.nome}</div>
      </div>
    </div>
  `;
  li.querySelector(".course-check").addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFeita(d.codigo);
  });
  li.addEventListener("click", () => openDetail(d.codigo));
  return li;
}

function stampLabel(status) {
  if (status === "done") return "concluída";
  if (status === "ok") return "livre";
  return "trancada";
}

function toggleFeita(cod) {
  if (state.feitas.has(cod)) state.feitas.delete(cod);
  else state.feitas.add(cod);
  saveFeitas();
  render();
  if (!document.getElementById("detail-panel").classList.contains("hidden")) {
    openDetail(cod); // refresh detail panel if open on this course
  }
}

// ---------- painel de detalhe ----------

function openDetail(cod) {
  const d = state.byCode.get(cod);
  if (!d) return;
  const status = statusDisciplina(cod);

  const reqsHtml = d.requisitos.length === 0
    ? `<p class="empty-note">sem pré-requisitos.</p>`
    : d.requisitos.map(r => {
        const res = requisitoSatisfeito(r);
        const tipoLabel = r.tipo === "P" ? "pré-requisito" : "co-requisito";
        let optsHtml;
        if (res.ok === null) {
          optsHtml = `<span class="empty-note">equivalência externa (${r.alvo}) — não catalogada neste currículo</span>`;
        } else {
          optsHtml = res.grupos.map(g => {
            const feita = g.every(c => state.feitas.has(c));
            return `<div class="req-option">${g.map(c => {
              const has = state.feitas.has(c);
              const nome = state.byCode.get(c)?.nome;
              return `<span class="pill ${has ? "have" : "missing"}">${c}${nome ? " · " + nome : ""}</span>`;
            }).join(" + ")}</div>`;
          }).join(`<div style="color:var(--text-faint); font-size:.68rem; margin:.15rem 0;">ou</div>`);
        }
        return `<div class="req-group"><div class="req-type">${tipoLabel} · ${r.alvo}</div>${optsHtml}</div>`;
      }).join("");

  const destrava = quemDestrava(cod);
  const destravaHtml = destrava.length === 0
    ? `<p class="empty-note">nenhuma outra disciplina deste currículo depende dela.</p>`
    : `<div class="unlocks-list">${destrava.map(x =>
        `<div class="unlocks-item"><span class="code">${x.codigo}</span> — ${x.nome}</div>`
      ).join("")}</div>`;

  document.getElementById("detail-content").innerHTML = `
    <span class="stamp ${status}" style="position:static; display:inline-block; margin-bottom:.6rem;">${stampLabel(status)}</span>
    <h3>${d.nome}</h3>
    <div class="detail-code">${d.codigo} · ${d.creditos.toFixed(0)} créditos · ${d.periodo === "optativa" ? "optativa" : d.periodo + "º período"}</div>
    <label style="display:flex; align-items:center; gap:.5rem; cursor:pointer; font-size:.85rem;">
      <input type="checkbox" id="detail-check" ${state.feitas.has(cod) ? "checked" : ""}/>
      já cursei / passei nessa
    </label>
    <div class="detail-section">
      <h4>pré-requisitos</h4>
      ${reqsHtml}
    </div>
    <div class="detail-section">
      <h4>o que essa disciplina destrava</h4>
      ${destravaHtml}
    </div>
  `;
  document.getElementById("detail-check").addEventListener("change", () => toggleFeita(cod));

  document.getElementById("detail-panel").classList.remove("hidden");
  document.getElementById("detail-backdrop").classList.remove("hidden");
}

function closeDetail() {
  document.getElementById("detail-panel").classList.add("hidden");
  document.getElementById("detail-backdrop").classList.add("hidden");
}

init();
