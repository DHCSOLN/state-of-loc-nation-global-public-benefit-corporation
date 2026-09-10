const state = { instruments: [], query: "", recordClass: "all", status: "all" };

const els = {
  list: document.querySelector("#registry-list"),
  search: document.querySelector("#registry-search"),
  classFilter: document.querySelector("#class-filter"),
  statusFilter: document.querySelector("#status-filter"),
  resultCount: document.querySelector("#result-count"),
  empty: document.querySelector("#empty-state"),
  dialog: document.querySelector("#instrument-dialog"),
  dialogContent: document.querySelector("#dialog-content")
};

const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
})[character]);

function optionLabel(value) {
  return value.replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

function fillFilter(select, values) {
  [...new Set(values)].sort().forEach(value => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = optionLabel(value);
    select.append(option);
  });
}

function filteredInstruments() {
  const query = state.query.trim().toLowerCase();
  return state.instruments.filter(item => {
    const text = [item.id, item.title, item.record_class, item.issuing_body, item.summary, ...(item.subjects || [])].join(" ").toLowerCase();
    return (!query || text.includes(query)) &&
      (state.recordClass === "all" || item.record_class === state.recordClass) &&
      (state.status === "all" || item.status === state.status);
  });
}

function renderRegistry() {
  const records = filteredInstruments();
  els.resultCount.textContent = `${records.length} ${records.length === 1 ? "instrument" : "instruments"}`;
  els.empty.hidden = records.length !== 0;
  els.list.replaceChildren(...records.map(item => {
    const article = document.createElement("article");
    article.className = "instrument";
    article.innerHTML = `
      <div><p class="instrument-code">${escapeHtml(item.id)}</p><span class="badge ${escapeHtml(item.status)}">${escapeHtml(optionLabel(item.status))}</span></div>
      <div><h3>${escapeHtml(item.title)}</h3><p class="instrument-meta">${escapeHtml(optionLabel(item.record_class))} · ${escapeHtml(item.issuing_body)} · ${escapeHtml(item.date_published || "Date not recorded")}</p></div>
      <button type="button">View record</button>`;
    article.querySelector("button").addEventListener("click", () => openDetails(item));
    return article;
  }));
}

function openDetails(item) {
  const source = item.public_source
    ? `<a class="source-link" href="${encodeURI(item.public_source)}">Open source document</a>`
    : `<p><strong>Source access:</strong> No public file is linked. Review the access classification before release.</p>`;
  els.dialogContent.innerHTML = `
    <p class="instrument-code">${escapeHtml(item.id)}</p>
    <h2>${escapeHtml(item.title)}</h2>
    <span class="badge ${escapeHtml(item.status)}">${escapeHtml(optionLabel(item.status))}</span>
    <p>${escapeHtml(item.summary)}</p>
    <dl class="detail-grid">
      <div><dt>Record class</dt><dd>${escapeHtml(optionLabel(item.record_class))}</dd></div>
      <div><dt>Issuing body</dt><dd>${escapeHtml(item.issuing_body)}</dd></div>
      <div><dt>Published</dt><dd>${escapeHtml(item.date_published || "Not recorded")}</dd></div>
      <div><dt>Effective</dt><dd>${escapeHtml(item.effective_date || "Not recorded")}</dd></div>
      <div><dt>Authority status</dt><dd>${escapeHtml(item.authority_status)}</dd></div>
      <div><dt>Access</dt><dd>${escapeHtml(optionLabel(item.access))}</dd></div>
    </dl>
    ${item.notes ? `<p><strong>Registry note:</strong> ${escapeHtml(item.notes)}</p>` : ""}
    ${source}`;
  els.dialog.showModal();
}

async function loadRegistry() {
  try {
    const response = await fetch("registry.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Registry request failed: ${response.status}`);
    const registry = await response.json();
    state.instruments = registry.instruments;
    fillFilter(els.classFilter, state.instruments.map(item => item.record_class));
    fillFilter(els.statusFilter, state.instruments.map(item => item.status));
    document.querySelector("#instrument-count").textContent = state.instruments.length;
    document.querySelector("#class-count").textContent = new Set(state.instruments.map(item => item.record_class)).size;
    document.querySelector("#latest-update").textContent = registry.last_updated;
    document.querySelector("#registry-version").textContent = registry.registry_version;
    renderRegistry();
  } catch (error) {
    els.resultCount.textContent = "The registry could not be loaded.";
    els.empty.hidden = false;
    els.empty.textContent = "Please review registry.json or the GitHub publication status.";
    console.error(error);
  }
}

els.search.addEventListener("input", event => { state.query = event.target.value; renderRegistry(); });
els.classFilter.addEventListener("change", event => { state.recordClass = event.target.value; renderRegistry(); });
els.statusFilter.addEventListener("change", event => { state.status = event.target.value; renderRegistry(); });
document.querySelector(".dialog-close").addEventListener("click", () => els.dialog.close());
els.dialog.addEventListener("click", event => { if (event.target === els.dialog) els.dialog.close(); });
document.querySelector(".menu-button").addEventListener("click", event => {
  const nav = document.querySelector("#primary-nav");
  const open = nav.classList.toggle("open");
  event.currentTarget.setAttribute("aria-expanded", String(open));
});
document.querySelectorAll("#primary-nav a").forEach(link => link.addEventListener("click", () => {
  document.querySelector("#primary-nav").classList.remove("open");
  document.querySelector(".menu-button").setAttribute("aria-expanded", "false");
}));

loadRegistry();
