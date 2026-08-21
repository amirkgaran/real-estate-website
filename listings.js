(() => {
  const category = document.body.dataset.category;
  const grid = document.getElementById("listingGrid");
  const status = document.getElementById("listingStatus");
  const cfg = window.MYINVEST_CONFIG || {};

  if (!category || !grid || !status) return;

  const configured =
    cfg.supabaseUrl &&
    cfg.supabaseAnonKey &&
    !cfg.supabaseUrl.includes("PASTE_") &&
    !cfg.supabaseAnonKey.includes("PASTE_");

  if (!configured) {
    status.textContent = "Listings will appear here after the website database is connected.";
    return;
  }

  const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);

  const escapeHtml = (value = "") =>
    String(value).replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[ch]));

  function listingCard(item) {
    const firstImage = Array.isArray(item.images) && item.images.length ? item.images[0] : "";
    const photo = firstImage
      ? `<img src="${escapeHtml(firstImage)}" alt="${escapeHtml(item.title)}">`
      : `<div class="photo-placeholder">Photo coming soon</div>`;

    const price = item.price ? `<div class="listing-price">${escapeHtml(item.price)}</div>` : "";
    const location = item.location ? `<div class="listing-location">${escapeHtml(item.location)}</div>` : "";
    const highlights = item.highlights
      ? `<div class="listing-highlights"><strong>Investment highlights</strong><p>${escapeHtml(item.highlights)}</p></div>`
      : "";

    return `
      <article class="public-listing-card">
        <div class="public-listing-image">${photo}</div>
        <div class="public-listing-content">
          <p class="type">${escapeHtml(item.category)}</p>
          <h3>${escapeHtml(item.title)}</h3>
          <div class="listing-meta">${price}${location}</div>
          <p>${escapeHtml(item.description)}</p>
          ${highlights}
          <a href="contact.html">Ask about this opportunity →</a>
        </div>
      </article>`;
  }

  async function loadListings() {
    status.textContent = "Loading listings…";
    const { data, error } = await client
      .from("listings")
      .select("*")
      .eq("category", category)
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      status.textContent = "Listings could not be loaded right now.";
      return;
    }

    if (!data || data.length === 0) {
      status.textContent = "No active listings in this category right now. Please contact Amir for current opportunities.";
      grid.innerHTML = "";
      return;
    }

    status.textContent = "";
    grid.innerHTML = data.map(listingCard).join("");
  }

  loadListings();
})();
