(() => {
  const cfg = window.MYINVEST_CONFIG || {};
  const form = document.getElementById("webinarForm");
  if (!form || !window.supabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return;

  const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  const status = document.getElementById("adminWebinarStatus");
  const container = document.getElementById("adminWebinars");
  const message = document.getElementById("webinarFormMessage");
  const saveButton = document.getElementById("saveWebinarButton");
  const cancelEdit = document.getElementById("cancelWebinarEdit");
  const refreshButton = document.getElementById("refreshWebinarsButton");
  const fields = {
    id: document.getElementById("webinarId"),
    title: document.getElementById("webinarTitle"),
    date: document.getElementById("webinarDate"),
    time: document.getElementById("webinarTime"),
    description: document.getElementById("webinarDescription"),
    meetingUrl: document.getElementById("webinarMeetingUrl"),
    published: document.getElementById("webinarPublished")
  };

  let webinars = [];
  let registrations = [];

  const esc = (value = "") => String(value).replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[ch]));

  function dateLabel(dateValue, timeValue) {
    const d = new Date(`${dateValue}T12:00:00Z`);
    const date = new Intl.DateTimeFormat("en-CA", { weekday:"short", month:"short", day:"numeric", year:"numeric", timeZone:"UTC" }).format(d);
    const [h="0",m="0"] = String(timeValue || "").slice(0,5).split(":");
    const hour=Number(h), suffix=hour>=12?"PM":"AM";
    return `${date} · ${hour%12||12}:${String(m).padStart(2,"0")} ${suffix} ET`;
  }

  function resetForm() {
    form.reset();
    fields.id.value = "";
    fields.published.checked = true;
    saveButton.textContent = "Save webinar";
    cancelEdit.classList.add("hidden");
    message.textContent = "";
  }

  function editWebinar(item) {
    fields.id.value = item.id;
    fields.title.value = item.title || "";
    fields.date.value = item.event_date || "";
    fields.time.value = String(item.event_time || "").slice(0,5);
    fields.description.value = item.description || "";
    fields.meetingUrl.value = item.meeting_url || "";
    fields.published.checked = !!item.published;
    saveButton.textContent = "Save changes";
    cancelEdit.classList.remove("hidden");
    form.scrollIntoView({ behavior:"smooth", block:"start" });
  }

  function registrantsFor(webinarId) {
    return registrations.filter(r => r.webinar_id === webinarId);
  }

  function render() {
    if (!webinars.length) {
      status.textContent = "No webinars have been created yet.";
      container.innerHTML = "";
      return;
    }
    status.textContent = "";
    container.innerHTML = webinars.map(item => {
      const regs = registrantsFor(item.id);
      const people = regs.length ? `
        <details class="admin-webinar-registrants">
          <summary>${regs.length} registrant${regs.length === 1 ? "" : "s"}</summary>
          <div class="registrant-list">
            ${regs.map(r => `
              <div class="registrant-row">
                <div><strong>${esc(r.name)}</strong><div class="registrant-contact">${esc(r.email)} · ${esc(r.phone || "")}</div></div>
                <div>${r.link_sent_at ? "Link sent" : "Waiting for link"}</div>
              </div>`).join("")}
          </div>
        </details>` : `<div class="admin-webinar-registrants small-muted">No registrations yet.</div>`;

      return `
        <article class="admin-webinar-card" data-id="${esc(item.id)}">
          <div class="admin-webinar-top">
            <div>
              <div class="admin-webinar-badges">
                <span class="${item.published ? "published" : "draft"}">${item.published ? "Published" : "Draft"}</span>
                <span>${regs.length} registered</span>
              </div>
              <h4>${esc(item.title)}</h4>
              <div class="admin-webinar-meta">${esc(dateLabel(item.event_date,item.event_time))}</div>
              <div class="admin-webinar-meta ${item.meeting_url ? "link-ready" : "link-missing"}">${item.meeting_url ? "Meeting link ready" : "Meeting link not added yet"}</div>
            </div>
          </div>
          <div class="admin-webinar-actions">
            <button class="text-button edit-webinar" type="button">Edit</button>
            <button class="text-button danger delete-webinar" type="button">Delete</button>
            ${item.meeting_url && regs.length ? `<button class="button send-webinar-link" type="button">Send link to ${regs.length}</button>` : ""}
          </div>
          ${people}
        </article>`;
    }).join("");
  }

  async function verifyAdmin() {
    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData.session) return false;
    const { data, error } = await client.rpc("is_site_admin");
    return !error && data === true;
  }

  async function load() {
    if (!(await verifyAdmin())) return;
    status.textContent = "Loading webinars…";
    const [webinarResult, registrationResult] = await Promise.all([
      client.from("webinars").select("*").order("event_date", { ascending:false }).order("event_time", { ascending:false }),
      client.from("webinar_registrations").select("id,webinar_id,name,email,phone,registered_at,welcome_sent_at,link_sent_at").order("registered_at", { ascending:false })
    ]);

    if (webinarResult.error) {
      console.error(webinarResult.error);
      status.textContent = webinarResult.error.message.includes("webinars")
        ? "Webinar setup is required. Run the supplied webinar SQL migration once."
        : webinarResult.error.message;
      return;
    }
    if (registrationResult.error) console.error(registrationResult.error);
    webinars = webinarResult.data || [];
    registrations = registrationResult.data || [];
    render();
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!(await verifyAdmin())) return;
    saveButton.disabled = true;
    message.textContent = "Saving…";
    const id = fields.id.value || crypto.randomUUID();
    const payload = {
      id,
      title: fields.title.value.trim(),
      event_date: fields.date.value,
      event_time: fields.time.value,
      timezone: "America/Toronto",
      description: fields.description.value.trim(),
      meeting_url: fields.meetingUrl.value.trim() || null,
      published: fields.published.checked,
      updated_at: new Date().toISOString()
    };
    const { error } = await client.from("webinars").upsert(payload, { onConflict:"id" });
    saveButton.disabled = false;
    if (error) {
      console.error(error);
      message.textContent = error.message.includes("webinars") ? "Run the supplied webinar SQL migration first." : error.message;
      return;
    }
    message.textContent = fields.id.value ? "Webinar updated." : "Webinar created.";
    resetForm();
    await load();
  });

  container.addEventListener("click", async event => {
    const card = event.target.closest(".admin-webinar-card");
    if (!card) return;
    const item = webinars.find(w => w.id === card.dataset.id);
    if (!item) return;

    if (event.target.closest(".edit-webinar")) {
      editWebinar(item);
      return;
    }

    if (event.target.closest(".delete-webinar")) {
      if (!confirm(`Delete webinar "${item.title}" and all of its registrations?`)) return;
      const { error } = await client.from("webinars").delete().eq("id", item.id);
      if (error) alert(error.message); else await load();
      return;
    }

    const sendButton = event.target.closest(".send-webinar-link");
    if (sendButton) {
      if (!confirm(`Email the webinar link to all registered attendees for "${item.title}"?`)) return;
      sendButton.disabled = true;
      sendButton.textContent = "Sending…";
      const { data, error } = await client.functions.invoke("webinar-send-link", { body: { webinar_id: item.id } });
      if (error || !data?.ok) {
        alert(data?.message || error?.message || "Unable to send the webinar link.");
        sendButton.disabled = false;
        sendButton.textContent = "Send link";
        return;
      }
      alert(`Webinar link sent to ${data.sent} registrant${data.sent === 1 ? "" : "s"}.`);
      await load();
    }
  });

  cancelEdit.addEventListener("click", resetForm);
  refreshButton.addEventListener("click", load);
  client.auth.onAuthStateChange((_event, session) => { if (session) load(); });
  client.auth.getSession().then(({ data }) => { if (data.session) load(); });
})();
