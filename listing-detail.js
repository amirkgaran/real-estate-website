(() => {
  const cfg = window.MYINVEST_CONFIG || {};
  const status = document.getElementById("listingDetailStatus");
  const detail = document.getElementById("listingDetail");
  const id = new URLSearchParams(window.location.search).get("id");

  if (!status || !detail) return;
  if (!id) {
    status.textContent = "This listing could not be found.";
    return;
  }

  const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  const esc = (v = "") => String(v).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));

  const categoryPages = {
    "Residential": "residential.html",
    "Multi Residential": "multi-residential.html",
    "Commercial": "commercial.html",
    "Financial Market": "financial-market.html"
  };

  function buildGallery(item) {
    const container = document.getElementById("listingDetailGallery");
    const images = Array.isArray(item.images) ? item.images.filter(Boolean) : [];

    if (!images.length) {
      container.innerHTML = '<div class="detail-gallery-main photo-placeholder">Photo coming soon</div>';
      return;
    }

    container.innerHTML = `
      <div class="detail-gallery-main">
        <img id="detailMainImage" src="${esc(images[0])}" alt="${esc(item.title)}">
      </div>
      ${images.length > 1 ? `
        <div class="detail-gallery-thumbnails">
          ${images.map((src, index) => `
            <button class="detail-gallery-thumb ${index === 0 ? "active" : ""}" type="button" data-full="${esc(src)}" aria-label="View photo ${index + 1}">
              <img src="${esc(src)}" alt="">
            </button>`).join("")}
        </div>` : ""}`;

    const main = document.getElementById("detailMainImage");
    container.querySelectorAll(".detail-gallery-thumb").forEach(button => {
      button.addEventListener("click", () => {
        main.src = button.dataset.full;
        container.querySelectorAll(".detail-gallery-thumb").forEach(x => x.classList.remove("active"));
        button.classList.add("active");
      });
    });
  }

  function render(item) {
    const typeText = item.category === "Residential" && item.listing_type
      ? `${item.category} · For ${item.listing_type}`
      : item.category;

    document.getElementById("listingDetailType").textContent = typeText || "Listing";
    document.getElementById("listingDetailTitle").textContent = item.title || "Property listing";
    document.getElementById("listingDetailLocation").textContent = item.location || "";
    document.getElementById("listingDetailPrice").textContent = item.price || "";
    document.getElementById("listingDetailDescription").textContent = item.description || "";

    const highlightsSection = document.getElementById("listingHighlightsSection");
    if (item.highlights) {
      document.getElementById("listingDetailHighlights").textContent = item.highlights;
      highlightsSection.classList.remove("hidden");
    }

    const back = document.getElementById("listingBackLink");
    let backUrl = categoryPages[item.category] || "index.html";
    if (item.category === "Residential" && item.listing_type) {
      backUrl += `?type=${encodeURIComponent(item.listing_type.toLowerCase())}`;
    }
    back.href = backUrl;
    back.textContent = item.category === "Residential" ? "← Back to residential listings" : "← Back to listings";

    document.title = `${item.title || "Property Listing"} | Amir Geran`;
    buildGallery(item);
    status.textContent = "";
    detail.classList.remove("hidden");
  }

  async function load() {
    const { data, error } = await client
      .from("listings")
      .select("*")
      .eq("id", id)
      .eq("published", true)
      .maybeSingle();

    if (error) {
      console.error(error);
      status.textContent = "This listing could not be loaded right now.";
      return;
    }

    if (!data) {
      status.textContent = "This listing is no longer available.";
      return;
    }

    render(data);
  }

  load();
})();
