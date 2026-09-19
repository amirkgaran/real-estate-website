(() => {
  const cfg = window.MYINVEST_CONFIG || {};
  const form = document.getElementById("mlsImportForm");
  if (!form || !window.supabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return;

  const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  const input = document.getElementById("mlsNumber");
  const button = document.getElementById("mlsImportButton");
  const message = document.getElementById("mlsImportMessage");
  const preview = document.getElementById("mlsImportPreview");

  const listingFields = {
    category: document.getElementById("category"),
    listingType: document.getElementById("listingType"),
    title: document.getElementById("title"),
    price: document.getElementById("price"),
    location: document.getElementById("location"),
    description: document.getElementById("description"),
    highlights: document.getElementById("highlights"),
    published: document.getElementById("published")
  };

  let importedImages = [];

  const esc = (value = "") => String(value).replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[ch]));

  function money(value) {
    if (value === null || value === undefined || value === "") return "";
    const n = Number(value);
    if (!Number.isFinite(n)) return String(value);
    return new Intl.NumberFormat("en-CA", {
      style: "currency", currency: "CAD", maximumFractionDigits: 0
    }).format(n);
  }

  function generateDescription(p) {
    const bits = [];
    const beds = Number(p.bedrooms || 0);
    const baths = Number(p.bathrooms || 0);

    if (p.property_type) bits.push(String(p.property_type).toLowerCase());
    if (beds) bits.push(`${beds}-bedroom`);
    if (baths) bits.push(`${baths}-bathroom`);

    const introSubject = bits.length
      ? `This ${bits.join(", ")} property`
      : "This property";

    const sentences = [];
    sentences.push(`${introSubject}${p.location ? ` in ${p.location}` : ""} offers a practical opportunity for buyers looking to evaluate location, layout and long-term value.`);

    const features = [];
    if (p.living_area) features.push(`${p.living_area} of living space`);
    if (p.parking_total) features.push(`${p.parking_total} parking space${Number(p.parking_total) === 1 ? "" : "s"}`);
    if (p.structure_type) features.push(Array.isArray(p.structure_type) ? p.structure_type.join(", ") : p.structure_type);

    if (features.length) sentences.push(`Notable property details include ${features.join(", ")}.`);

    if (p.public_remarks) {
      // Preserve factual remarks from the authorized feed, but keep the generated copy concise.
      const cleaned = String(p.public_remarks).replace(/\s+/g, " ").trim();
      if (cleaned) sentences.push(cleaned);
    }

    return sentences.join(" ");
  }

  function generateHighlights(p) {
    const lines = [];
    if (p.mls_number) lines.push(`MLS® ${p.mls_number}`);
    if (p.property_type) lines.push(p.property_type);
    if (p.bedrooms) lines.push(`${p.bedrooms} bedroom${Number(p.bedrooms) === 1 ? "" : "s"}`);
    if (p.bathrooms) lines.push(`${p.bathrooms} bathroom${Number(p.bathrooms) === 1 ? "" : "s"}`);
    if (p.living_area) lines.push(`${p.living_area} living area`);
    if (p.parking_total) lines.push(`${p.parking_total} parking space${Number(p.parking_total) === 1 ? "" : "s"}`);
    if (p.list_price) lines.push(`Listed at ${money(p.list_price)}`);
    return lines.join("\n");
  }

  function fillListingForm(p) {
    const lease = !!p.is_lease;

    listingFields.category.value = "Residential";
    listingFields.category.dispatchEvent(new Event("change", { bubbles: true }));
    listingFields.listingType.value = lease ? "Lease" : "Sale";

    listingFields.title.value =
      p.generated_title ||
      [p.street_address, p.city].filter(Boolean).join(" — ") ||
      `MLS® ${p.mls_number}`;

    listingFields.price.value = money(p.lease_amount || p.list_price);
    listingFields.location.value = p.location || [p.city, p.state_or_province].filter(Boolean).join(", ");
    listingFields.description.value = generateDescription(p);
    listingFields.highlights.value = generateHighlights(p);
    listingFields.published.checked = false;

    importedImages = Array.isArray(p.images) ? p.images.filter(Boolean) : [];

    // admin.js normally persists file uploads. Imported DDF image URLs are already hosted and can be
    // stored directly. Expose them so admin.js can include them during save.
    window.MYINVEST_IMPORTED_MLS_IMAGES = importedImages;

    const formTitle = document.getElementById("formTitle");
    const saveButton = document.getElementById("saveButton");
    if (formTitle) formTitle.textContent = "Review imported listing";
    if (saveButton) saveButton.textContent = "Publish listing";

    document.getElementById("listingForm")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderPreview(p) {
    const photos = (p.images || []).slice(0, 6);
    preview.classList.remove("hidden");
    preview.innerHTML = `
      <div class="notice" style="margin-top:16px">
        <strong>Imported MLS® ${esc(p.mls_number || "")}</strong>
        <div class="small-muted" style="margin-top:6px">
          ${esc(p.location || "")}${p.list_price ? ` · ${esc(money(p.list_price))}` : ""}
          ${p.images?.length ? ` · ${p.images.length} photo${p.images.length === 1 ? "" : "s"}` : ""}
        </div>
        ${photos.length ? `
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-top:12px">
            ${photos.map(url => `<img src="${esc(url)}" alt="" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:8px">`).join("")}
          </div>` : ""}
        <div class="small-muted" style="margin-top:10px">
          Review all imported facts and generated wording before publishing.
        </div>
      </div>`;
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const mlsNumber = input.value.trim();
    if (!mlsNumber) return;

    button.disabled = true;
    message.textContent = "Importing from CREA DDF®…";
    preview.classList.add("hidden");

    try {
      const { data, error } = await client.functions.invoke("mls-import", {
        body: { mls_number: mlsNumber }
      });

      if (error) throw error;
      if (!data?.ok || !data?.property) {
        throw new Error(data?.message || "Listing was not found in your authorized DDF® feed.");
      }

      fillListingForm(data.property);
      renderPreview(data.property);
      message.textContent = "Imported. Review the listing below before publishing.";
    } catch (err) {
      console.error(err);
      message.textContent = err?.message || "Unable to import this listing.";
    } finally {
      button.disabled = false;
    }
  });
})();
