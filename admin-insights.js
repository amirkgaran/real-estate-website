(() => {
  const cfg = window.MYINVEST_CONFIG || {};
  const dashboard = document.getElementById("dashboard");
  if (!dashboard || !window.supabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return;

  if (!document.querySelector('link[href="insights.css"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "insights.css";
    document.head.appendChild(link);
  }

  const panel = document.createElement("section");
  panel.className = "admin-panel insights-admin-panel";
  panel.innerHTML = `
    <div class="panel-heading">
      <div>
        <p class="eyebrow">Website content</p>
        <h2>Insights</h2>
      </div>
      <a class="text-button admin-preview-link" href="insights.html" target="_blank" rel="noopener">Preview Insights</a>
    </div>
    <p class="small-muted website-content-help">
      Add, edit, publish, reorder or remove educational content without changing GitHub files.
    </p>

    <div class="insights-admin-grid">
      <form id="insightAdminForm" class="admin-form insight-admin-form">
        <input id="insightId" type="hidden">

        <label>Section / category
          <input id="insightCategory" type="text" maxlength="80" required placeholder="Example: Buying">
        </label>

        <label>Article title
          <input id="insightTitle" type="text" maxlength="180" required placeholder="Example: Before you buy">
        </label>

        <label>Content / steps
          <textarea id="insightBody" rows="10" maxlength="8000" required placeholder="Write normal paragraphs here.

For numbered steps:
1. First step
2. Second step

For bullet points:
- First point
- Second point"></textarea>
          <span class="field-help">Tip: Start lines with <strong>1.</strong> for numbered steps or <strong>-</strong> for bullet points.</span>
        </label>

        <div class="form-two">
          <label>Display order
            <input id="insightOrder" type="number" min="0" max="9999" step="1" value="100">
            <span class="field-help">Lower numbers appear first.</span>
          </label>

          <label class="checkbox-row insight-publish-row">
            <input id="insightPublished" type="checkbox" checked>
            <span>Publish on website</span>
          </label>
        </div>

        <div class="insight-form-actions">
          <button id="saveInsightButton" class="button" type="submit">Add insight</button>
          <button id="cancelInsightEdit" class="button secondary hidden" type="button">Cancel edit</button>
        </div>
        <p id="insightFormMessage" class="form-message"></p>
      </form>

      <div>
        <div class="panel-heading insight-list-heading">
          <h3>Your insight articles</h3>
          <button id="refreshInsightsButton" class="text-button" type="button">Refresh</button>
        </div>
        <div id="adminInsightStatus" class="status-message">Loading…</div>
        <div id="adminInsights" class="admin-insights-list"></div>
      </div>
    </div>
  `;

  const listingGrid = dashboard.querySelector(".admin-grid");
  if (listingGrid) dashboard.insertBefore(panel, listingGrid);
  else dashboard.appendChild(panel);

  const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  const form = document.getElementById("insightAdminForm");
  const status = document.getElementById("adminInsightStatus");
  const list = document.getElementById("adminInsights");
  const message = document.getElementById("insightFormMessage");
  const saveButton = document.getElementById("saveInsightButton");
  const cancelButton = document.getElementById("cancelInsightEdit");
  const refreshButton = document.getElementById("refreshInsightsButton");
  const fields = {
    id: document.getElementById("insightId"),
    category: document.getElementById("insightCategory"),
    title: document.getElementById("insightTitle"),
    body: document.getElementById("insightBody"),
    order: document.getElementById("insightOrder"),
    published: document.getElementById("insightPublished")
  };

  let insights = [];

  const esc = (value = "") => String(value).replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[ch]));

  function slugify(value = "") {
    const base = String(value)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "insight";
    return `${base}-${crypto.randomUUID().slice(0, 8)}`;
  }

  async function verifyAdmin() {
    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData.session) return false;
    const { data, error } = await client.rpc("is_site_admin");
    return !error && data === true;
  }

  function resetForm() {
    form.reset();
    fields.id.value = "";
    fields.order.value = "100";
    fields.published.checked = true;
    saveButton.textContent = "Add insight";
    cancelButton.classList.add("hidden");
    message.textContent = "";
  }

  function editItem(item) {
    fields.id.value = item.id;
    fields.category.value = item.category || "";
    fields.title.value = item.title || "";
    fields.body.value = item.body || "";
    fields.order.value = item.display_order ?? 100;
    fields.published.checked = !!item.published;
    saveButton.textContent = "Save changes";
    cancelButton.classList.remove("hidden");
    message.textContent = "";
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function render() {
    if (!insights.length) {
      status.textContent = "No insight articles have been added yet.";
      list.innerHTML = "";
      return;
    }

    status.textContent = "";
    list.innerHTML = insights.map(item => `
      <article class="admin-insight-row" data-id="${esc(item.id)}">
        <div class="admin-insight-order">${esc(item.display_order)}</div>
        <div class="admin-insight-copy">
          <div class="admin-insight-badges">
            <span>${esc(item.category)}</span>
            <span class="${item.published ? "published" : "draft"}">${item.published ? "Published" : "Hidden"}</span>
          </div>
          <h4>${esc(item.title)}</h4>
          <p>${esc((item.body || "").replace(/\s+/g, " ").slice(0, 150))}${(item.body || "").length > 150 ? "…" : ""}</p>
        </div>
        <div class="admin-actions">
          <button class="text-button edit-insight" type="button">Edit</button>
          <button class="text-button danger delete-insight" type="button">Delete</button>
        </div>
      </article>
    `).join("");
  }

  async function load() {
    if (!(await verifyAdmin())) return;

    status.textContent = "Loading insights…";
    const { data, error } = await client
      .from("insights")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      status.textContent = error.message.includes("insights")
        ? "Insights setup is required. Run the supplied Insights SQL migration once."
        : error.message;
      return;
    }

    insights = data || [];
    render();
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!(await verifyAdmin())) return;

    const category = fields.category.value.trim();
    const title = fields.title.value.trim();
    const body = fields.body.value.trim();

    if (!category || !title || !body) {
      message.textContent = "Section, title and content are required.";
      return;
    }

    saveButton.disabled = true;
    message.textContent = "Saving…";

    const existing = insights.find(item => item.id === fields.id.value);
    const payload = {
      id: fields.id.value || crypto.randomUUID(),
      slug: existing?.slug || slugify(title),
      category,
      title,
      body,
      display_order: Number.parseInt(fields.order.value || "100", 10),
      published: fields.published.checked,
      updated_at: new Date().toISOString()
    };

    const { error } = await client
      .from("insights")
      .upsert(payload, { onConflict: "id" });

    saveButton.disabled = false;

    if (error) {
      console.error(error);
      message.textContent = error.message.includes("insights")
        ? "Unable to save. Run the supplied Insights SQL migration first."
        : error.message;
      return;
    }

    message.textContent = fields.id.value ? "Insight updated." : "Insight added.";
    resetForm();
    await load();
  });

  list.addEventListener("click", async event => {
    const row = event.target.closest(".admin-insight-row");
    if (!row) return;
    const item = insights.find(x => x.id === row.dataset.id);
    if (!item) return;

    if (event.target.closest(".edit-insight")) {
      editItem(item);
      return;
    }

    if (event.target.closest(".delete-insight")) {
      if (!confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
      const { error } = await client.from("insights").delete().eq("id", item.id);
      if (error) alert(error.message);
      else {
        if (fields.id.value === item.id) resetForm();
        await load();
      }
    }
  });

  cancelButton.addEventListener("click", resetForm);
  refreshButton.addEventListener("click", load);

  client.auth.onAuthStateChange((_event, session) => {
    if (session) load();
  });

  client.auth.getSession().then(({ data }) => {
    if (data.session) load();
  });
})();
