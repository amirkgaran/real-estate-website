(() => {
  const heading = document.getElementById("aboutHeading");
  const description = document.getElementById("aboutDescription");
  if (!heading || !description) return;

  const cfg = window.MYINVEST_CONFIG || {};
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.supabase) return;

  const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);

  async function loadAboutContent() {
    const { data, error } = await client
      .from("site_content")
      .select("key,value")
      .in("key", ["about_heading", "about_description"]);

    // Keep the built-in fallback text if site_content has not been set up yet.
    if (error || !data) {
      if (error) console.warn("Unable to load editable About content:", error.message);
      return;
    }

    const content = Object.fromEntries(data.map(row => [row.key, row.value]));
    if (content.about_heading?.trim()) heading.textContent = content.about_heading.trim();
    if (content.about_description?.trim()) description.textContent = content.about_description.trim();
  }

  loadAboutContent();
})();
