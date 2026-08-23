(() => {
  const cfg = window.MYINVEST_CONFIG || {};
  const grid = document.getElementById("insightsGrid");
  const jump = document.getElementById("insightsJump");
  const status = document.getElementById("insightsStatus");

  if (!grid || !jump || !status) return;

  if (!window.supabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey) {
    status.textContent = "Insights are temporarily unavailable.";
    return;
  }

  const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);

  const esc = (value = "") => String(value).replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[ch]));

  function renderBody(body = "") {
    const lines = String(body).replace(/\r/g, "").split("\n");
    const blocks = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i].trim();
      if (!line) {
        i += 1;
        continue;
      }

      if (/^\d+\.\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
          items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
          i += 1;
        }
        blocks.push(`<ol>${items.map(item => `<li>${esc(item)}</li>`).join("")}</ol>`);
        continue;
      }

      if (/^[-•]\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^[-•]\s+/.test(lines[i].trim())) {
          items.push(lines[i].trim().replace(/^[-•]\s+/, ""));
          i += 1;
        }
        blocks.push(`<ul>${items.map(item => `<li>${esc(item)}</li>`).join("")}</ul>`);
        continue;
      }

      const paragraph = [line];
      i += 1;
      while (
        i < lines.length &&
        lines[i].trim() &&
        !/^\d+\.\s+/.test(lines[i].trim()) &&
        !/^[-•]\s+/.test(lines[i].trim())
      ) {
        paragraph.push(lines[i].trim());
        i += 1;
      }
      blocks.push(`<p>${esc(paragraph.join(" "))}</p>`);
    }

    return blocks.join("");
  }

  async function loadInsights() {
    const { data, error } = await client
      .from("insights")
      .select("id,slug,category,title,body,display_order")
      .eq("published", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      status.textContent = "Insights could not be loaded right now.";
      return;
    }

    const items = data || [];
    if (!items.length) {
      status.textContent = "New insights are coming soon.";
      return;
    }

    jump.innerHTML = items.map(item =>
      `<a href="#${esc(item.slug)}">${esc(item.category)}</a>`
    ).join("");

    grid.innerHTML = items.map((item, index) => `
      <article id="${esc(item.slug)}" class="insight-card ${items.length % 2 === 1 && index === items.length - 1 ? "insight-card-wide" : ""}">
        <p class="eyebrow">${esc(item.category)}</p>
        <h2>${esc(item.title)}</h2>
        <div class="insight-body">${renderBody(item.body)}</div>
      </article>
    `).join("");

    status.textContent = "";
  }

  loadInsights();
})();
