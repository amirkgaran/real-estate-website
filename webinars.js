(() => {
  const cfg = window.MYINVEST_CONFIG || {};
  const list = document.getElementById("webinarList");
  const status = document.getElementById("webinarStatus");
  const dialog = document.getElementById("webinarRegistrationModal");
  const form = document.getElementById("webinarRegistrationForm");
  if (!list || !status || !dialog || !form || !window.supabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return;

  const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  let webinars = [];

  const esc = (value = "") => String(value).replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[ch]));

  function torontoToday() {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(new Date());
    const get = type => parts.find(p => p.type === type)?.value || "";
    return `${get("year")}-${get("month")}-${get("day")}`;
  }

  function dateParts(dateValue) {
    const d = new Date(`${dateValue}T12:00:00Z`);
    return {
      weekday: new Intl.DateTimeFormat("en-CA", { weekday: "long", timeZone: "UTC" }).format(d),
      date: new Intl.DateTimeFormat("en-CA", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(d)
    };
  }

  function timeLabel(timeValue) {
    const [h = "0", m = "0"] = String(timeValue || "").slice(0,5).split(":");
    const hour = Number(h);
    const suffix = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${String(m).padStart(2,"0")} ${suffix} ET`;
  }

  function webinarCard(item) {
    const d = dateParts(item.event_date);
    return `
      <article class="webinar-card">
        <div class="webinar-date-block">
          <span class="webinar-day">${esc(d.weekday)}</span>
          <span class="webinar-date">${esc(d.date)}</span>
          <span class="webinar-time">${esc(timeLabel(item.event_time))}</span>
        </div>
        <div class="webinar-copy">
          <h3>${esc(item.title)}</h3>
          <p>${esc(item.description || "")}</p>
        </div>
        <button class="button webinar-register-button" type="button" data-webinar-id="${esc(item.id)}">Register</button>
      </article>`;
  }

  async function loadWebinars() {
    status.textContent = "Loading upcoming webinars…";
    list.innerHTML = "";
    const { data, error } = await client
      .from("webinars")
      .select("id,title,description,event_date,event_time,timezone,published")
      .eq("published", true)
      .gte("event_date", torontoToday())
      .order("event_date", { ascending: true })
      .order("event_time", { ascending: true });

    if (error) {
      console.error(error);
      status.textContent = error.message.includes("webinars")
        ? "Webinars are being prepared. Please check back soon."
        : "Upcoming webinars could not be loaded right now.";
      return;
    }

    webinars = data || [];
    if (!webinars.length) {
      status.textContent = "There are no published upcoming webinars right now. Please check back soon.";
      return;
    }

    status.textContent = "";
    list.innerHTML = webinars.map(webinarCard).join("");
  }

  function openRegistration(webinarId) {
    const item = webinars.find(w => w.id === webinarId);
    if (!item) return;
    const d = dateParts(item.event_date);
    document.getElementById("registrationWebinarId").value = item.id;
    document.getElementById("selectedWebinarSummary").textContent = `${item.title} — ${d.weekday}, ${d.date} at ${timeLabel(item.event_time)}.`;
    document.getElementById("webinarRegistrationMessage").textContent = "";
    document.getElementById("registerWebinarButton").disabled = false;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    setTimeout(() => document.getElementById("registrationName")?.focus(), 30);
  }

  list.addEventListener("click", event => {
    const button = event.target.closest("[data-webinar-id]");
    if (!button) return;
    openRegistration(button.dataset.webinarId);
  });

  document.getElementById("closeWebinarRegistration")?.addEventListener("click", () => dialog.close?.());
  dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close?.(); });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const button = document.getElementById("registerWebinarButton");
    const message = document.getElementById("webinarRegistrationMessage");
    button.disabled = true;
    message.textContent = "Registering…";

    const payload = {
      webinar_id: document.getElementById("registrationWebinarId").value,
      name: document.getElementById("registrationName").value.trim(),
      email: document.getElementById("registrationEmail").value.trim(),
      phone: document.getElementById("registrationPhone").value.trim(),
      website: document.getElementById("registrationWebsite").value.trim()
    };

    const { data, error } = await client.functions.invoke("webinar-register", { body: payload });

    if (error || !data?.ok) {
      console.error(error || data);
      message.textContent = data?.message || "Registration could not be completed right now. Please try again.";
      button.disabled = false;
      return;
    }

    form.querySelectorAll("input:not([type=hidden])").forEach(input => { input.value = ""; });
    message.className = "webinar-registration-success";
    message.textContent = data.email_sent === false
      ? "Your place is reserved. The confirmation email is delayed, but your registration has been saved."
      : "You're registered. A welcome email has been sent to you. If the webinar link is not ready yet, it will be emailed to you when available.";
    button.textContent = "Registered";
  });

  loadWebinars();
})();
