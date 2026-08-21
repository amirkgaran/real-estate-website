(() => {
  const category = document.body.dataset.category;
  const grid = document.getElementById("listingGrid");
  const status = document.getElementById("listingStatus");
  const cfg = window.MYINVEST_CONFIG || {};
  if (!category || !grid || !status) return;

  const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);

  const esc = (v = "") => String(v).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));

  function gallery(item) {
    const images = Array.isArray(item.images) ? item.images.filter(Boolean) : [];
    if (!images.length) return '<div class="listing-gallery"><div class="gallery-main photo-placeholder">Photo coming soon</div></div>';

    const thumbs = images.length > 1 ? `
      <div class="gallery-thumbnails">
        ${images.map((src,i)=>`
          <button class="gallery-thumb ${i===0?"active":""}" type="button" data-full="${esc(src)}">
            <img src="${esc(src)}" alt="">
          </button>`).join("")}
      </div>` : "";

    return `
      <div class="listing-gallery">
        <div class="gallery-main">
          <img class="gallery-main-image" src="${esc(images[0])}" alt="${esc(item.title)}">
        </div>
        ${thumbs}
      </div>`;
  }

  function card(item) {
    return `
      <article class="public-listing-card">
        ${gallery(item)}
        <div class="public-listing-content">
          <p class="type">${esc(item.category)}</p>
          <h3>${esc(item.title)}</h3>
          <div class="listing-meta">
            ${item.price ? `<div class="listing-price">${esc(item.price)}</div>` : ""}
            ${item.location ? `<div class="listing-location">${esc(item.location)}</div>` : ""}
          </div>
          <p>${esc(item.description)}</p>
          ${item.highlights ? `<div class="listing-highlights"><strong>Investment highlights</strong><p>${esc(item.highlights)}</p></div>` : ""}
          <a href="contact.html">Ask about this opportunity →</a>
        </div>
      </article>`;
  }

  function wireGalleries() {
    grid.querySelectorAll(".listing-gallery").forEach(g => {
      const main = g.querySelector(".gallery-main-image");
      if (!main) return;
      g.querySelectorAll(".gallery-thumb").forEach(btn => {
        btn.addEventListener("click", () => {
          main.src = btn.dataset.full;
          g.querySelectorAll(".gallery-thumb").forEach(x=>x.classList.remove("active"));
          btn.classList.add("active");
        });
      });
    });
  }

  async function loadListings() {
    status.textContent = "Loading listings…";
    const { data, error } = await client.from("listings").select("*")
      .eq("category", category).eq("published", true)
      .order("created_at", { ascending:false });

    if (error) { status.textContent = "Listings could not be loaded right now."; return; }
    if (!data || !data.length) {
      status.textContent = "No active listings in this category right now. Please contact Amir for current opportunities.";
      grid.innerHTML = "";
      return;
    }
    status.textContent = "";
    grid.innerHTML = data.map(card).join("");
    wireGalleries();
  }

  loadListings();
})();