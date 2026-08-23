const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

/* Load site-wide SEO/meta management. */
if (!document.querySelector('script[data-seo-meta]')) {
  const seoScript = document.createElement("script");
  seoScript.src = "seo-meta.js?v=1";
  seoScript.dataset.seoMeta = "true";
  document.head.appendChild(seoScript);
}

/* Install the Amir Geran branded header everywhere this shared script is used. */
const siteBrand = document.querySelector(".brand");
if (siteBrand) {
  siteBrand.classList.add("brand-logo-link");
  siteBrand.setAttribute("aria-label", "Amir Geran home");
  siteBrand.innerHTML = '<img src="amir-geran-header-logo.png?v=2" alt="Amir Geran Real Estate Broker" class="brand-logo">';
}

if (!document.querySelector('link[data-premium-header]')) {
  const premiumHeaderStyles = document.createElement("link");
  premiumHeaderStyles.rel = "stylesheet";
  premiumHeaderStyles.href = "premium-header.css?v=2";
  premiumHeaderStyles.dataset.premiumHeader = "true";
  document.head.appendChild(premiumHeaderStyles);
}

if (navLinks) {
  const contactLink = navLinks.querySelector('a[href="contact.html"]');

  if (!navLinks.querySelector('a[href="webinars.html"]')) {
    const webinarLink = document.createElement("a");
    webinarLink.href = "webinars.html";
    webinarLink.textContent = "Webinars";
    if (contactLink) navLinks.insertBefore(webinarLink, contactLink);
    else navLinks.appendChild(webinarLink);
  }

  if (!navLinks.querySelector('a[href="insights.html"]')) {
    const insightsLink = document.createElement("a");
    insightsLink.href = "insights.html";
    insightsLink.textContent = "Insights";
    const currentContactLink = navLinks.querySelector('a[href="contact.html"]');
    if (currentContactLink) navLinks.insertBefore(insightsLink, currentContactLink);
    else navLinks.appendChild(insightsLink);
  }
}

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

/* Load the Insights manager only on the private admin page. */
if (document.body.classList.contains("admin-body") && !document.querySelector('script[data-admin-insights]')) {
  const insightsAdminScript = document.createElement("script");
  insightsAdminScript.src = "admin-insights.js";
  insightsAdminScript.dataset.adminInsights = "true";
  document.body.appendChild(insightsAdminScript);
}

/* Load the public voice assistant everywhere except the private admin page. */
if (!document.body.classList.contains("admin-body")) {
  if (!document.querySelector('link[data-voice-assistant]')) {
    const voiceStyles = document.createElement("link");
    voiceStyles.rel = "stylesheet";
    voiceStyles.href = "voice-assistant.css";
    voiceStyles.dataset.voiceAssistant = "true";
    document.head.appendChild(voiceStyles);
  }

  if (!document.querySelector('script[data-voice-assistant]')) {
    const voiceScript = document.createElement("script");
    voiceScript.src = "voice-assistant.js";
    voiceScript.defer = true;
    voiceScript.dataset.voiceAssistant = "true";
    document.body.appendChild(voiceScript);
  }
}
