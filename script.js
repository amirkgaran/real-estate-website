const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

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
