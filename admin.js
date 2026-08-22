(() => {
  const cfg = window.MYINVEST_CONFIG || {};
  const configured =
    cfg.supabaseUrl &&
    cfg.supabaseAnonKey &&
    !cfg.supabaseUrl.includes("PASTE_") &&
    !cfg.supabaseAnonKey.includes("PASTE_");

  const setupWarning = document.getElementById("setupWarning");
  const loginPanel = document.getElementById("loginPanel");
  const dashboard = document.getElementById("dashboard");
  const loginForm = document.getElementById("loginForm");
  const loginMessage = document.getElementById("loginMessage");
  const signedInAs = document.getElementById("signedInAs");
  const logoutButton = document.getElementById("logoutButton");
  const listingForm = document.getElementById("listingForm");
  const formMessage = document.getElementById("formMessage");
  const adminListings = document.getElementById("adminListings");
  const adminListingStatus = document.getElementById("adminListingStatus");
  const refreshButton = document.getElementById("refreshButton");
  const cancelEditButton = document.getElementById("cancelEditButton");
  const formTitle = document.getElementById("formTitle");
  const saveButton = document.getElementById("saveButton");

  if (!configured) {
    setupWarning.classList.remove("hidden");
    loginPanel.classList.add("hidden");
    return;
  }

  const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);

  const els = {
    id: document.getElementById("listingId"),
    category: document.getElementById("category"),
    listingType: document.getElementById("listingType"),
    listingTypeField: document.getElementById("listingTypeField"),
    title: document.getElementById("title"),
    price: document.getElementById("price"),
    location: document.getElementById("location"),
    description: document.getElementById("description"),
    highlights: document.getElementById("highlights"),
    images: document.getElementById("images"),
    published: document.getElementById("published")
  };

  let currentListings = [];

  function syncListingTypeField() {
    const residential = els.category.value === "Residential";
    els.listingTypeField.classList.toggle("hidden", !residential);
    els.listingType.required = residential;
    if (!residential) els.listingType.value = "Sale";
  }

  const escapeHtml = (value = "") =>
    String(value).replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[ch]));

  function resetForm() {
    listingForm.reset();
    els.id.value = "";
    els.category.value = "Residential";
    els.listingType.value = "Sale";
    syncListingTypeField();
    els.published.checked = true;
    formTitle.textContent = "Add listing";
    saveButton.textContent = "Publish listing";
    cancelEditButton.classList.add("hidden");
    formMessage.textContent = "";
  }

  function setEditing(item) {
    els.id.value = item.id;
    els.category.value = item.category;
    els.listingType.value = item.listing_type || "Sale";
    syncListingTypeField();
    els.title.value = item.title || "";
    els.price.value = item.price || "";
    els.location.value = item.location || "";
    els.description.value = item.description || "";
    els.highlights.value = item.highlights || "";
    els.published.checked = !!item.published;
    formTitle.textContent = "Edit listing";
    saveButton.textContent = "Save changes";
    cancelEditButton.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function uploadImages(listingId, files) {
    const urls = [];
    for (const file of files) {
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${listingId}/${Date.now()}-${crypto.randomUUID()}-${cleanName}`;

      const { error: uploadError } = await client.storage
        .from("listing-images")
        .upload(path, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data } = client.storage.from("listing-images").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  }

  async function ensureAdmin() {
    const { data, error } = await client.rpc("is_site_admin");
    if (error) throw error;
    return data === true;
  }

  async function showSession(session) {
    if (!session) {
      loginPanel.classList.remove("hidden");
      dashboard.classList.add("hidden");
      return;
    }

    try {
      const admin = await ensureAdmin();
      if (!admin) {
        await client.auth.signOut();
        loginMessage.textContent = "This account is not authorized as a site administrator.";
        loginPanel.classList.remove("hidden");
        dashboard.classList.add("hidden");
        return;
      }
    } catch (err) {
      console.error(err);
      loginMessage.textContent = "Unable to verify administrator access.";
      return;
    }

    signedInAs.textContent = session.user.email || "Administrator";
    loginPanel.classList.add("hidden");
    dashboard.classList.remove("hidden");
    await loadAdminListings();
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginMessage.textContent = "Signing in…";

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    const { data, error } = await client.auth.signInWithPassword({ email, password });

    if (error) {
      loginMessage.textContent = error.message;
      return;
    }

    loginMessage.textContent = "";
    await showSession(data.session);
  });

  logoutButton.addEventListener("click", async () => {
    await client.auth.signOut();
    resetForm();
  });

  client.auth.onAuthStateChange((_event, session) => {
    showSession(session);
  });

  async function loadAdminListings() {
    adminListingStatus.textContent = "Loading listings…";
    const { data, error } = await client
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      adminListingStatus.textContent = error.message;
      return;
    }

    currentListings = data || [];
    if (!currentListings.length) {
      adminListingStatus.textContent = "No listings have been added yet.";
      adminListings.innerHTML = "";
      return;
    }

    adminListingStatus.textContent = "";
    adminListings.innerHTML = currentListings.map((item) => {
      const image = Array.isArray(item.images) && item.images.length
        ? `<img src="${escapeHtml(item.images[0])}" alt="">`
        : `<div class="mini-placeholder">No photo</div>`;

      return `
        <article class="admin-listing-row" data-id="${item.id}">
          <div class="admin-thumb">${image}</div>
          <div class="admin-listing-copy">
            <div class="admin-badges">
              <span>${escapeHtml(item.category)}</span>
              ${item.category === "Residential" && item.listing_type ? `<span>For ${escapeHtml(item.listing_type)}</span>` : ""}
              <span class="${item.published ? "published" : "draft"}">${item.published ? "Published" : "Draft"}</span>
            </div>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.location || "")}${item.price ? ` · ${escapeHtml(item.price)}` : ""}</p>
          </div>
          <div class="admin-actions">
            <button class="text-button edit-button" type="button">Edit</button>
            <button class="text-button danger delete-button" type="button">Delete</button>
          </div>
        </article>`;
    }).join("");

    adminListings.querySelectorAll(".edit-button").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.closest(".admin-listing-row").dataset.id;
        const item = currentListings.find((x) => x.id === id);
        if (item) setEditing(item);
      });
    });

    adminListings.querySelectorAll(".delete-button").forEach((button) => {
      button.addEventListener("click", async () => {
        const id = button.closest(".admin-listing-row").dataset.id;
        const item = currentListings.find((x) => x.id === id);
        if (!item) return;
        if (!confirm(`Delete "${item.title}"? This cannot be undone.`)) return;

        button.disabled = true;
        const { error } = await client.from("listings").delete().eq("id", id);
        if (error) {
          alert(error.message);
          button.disabled = false;
          return;
        }

        const { data: objects } = await client.storage.from("listing-images").list(id);
        if (objects && objects.length) {
          await client.storage.from("listing-images").remove(objects.map((x) => `${id}/${x.name}`));
        }

        if (els.id.value === id) resetForm();
        await loadAdminListings();
      });
    });
  }

  listingForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    formMessage.textContent = "Saving…";
    saveButton.disabled = true;

    try {
      let id = els.id.value;
      let existingImages = [];

      if (id) {
        const existing = currentListings.find((x) => x.id === id);
        existingImages = Array.isArray(existing?.images) ? existing.images : [];
      } else {
        id = crypto.randomUUID();
      }

      const newImages = els.images.files.length
        ? await uploadImages(id, [...els.images.files])
        : [];

      const payload = {
        id,
        category: els.category.value,
        listing_type: els.category.value === "Residential" ? els.listingType.value : null,
        title: els.title.value.trim(),
        price: els.price.value.trim(),
        location: els.location.value.trim(),
        description: els.description.value.trim(),
        highlights: els.highlights.value.trim(),
        images: [...existingImages, ...newImages],
        published: els.published.checked
      };

      const { error } = await client
        .from("listings")
        .upsert(payload, { onConflict: "id" });

      if (error) throw error;

      formMessage.textContent = els.id.value ? "Changes saved." : "Listing published.";
      resetForm();
      await loadAdminListings();
    } catch (err) {
      console.error(err);
      formMessage.textContent = err.message || "Unable to save listing.";
    } finally {
      saveButton.disabled = false;
    }
  });

  els.category.addEventListener("change", syncListingTypeField);
  syncListingTypeField();

  refreshButton.addEventListener("click", loadAdminListings);
  cancelEditButton.addEventListener("click", resetForm);

  client.auth.getSession().then(({ data }) => showSession(data.session));
})();
