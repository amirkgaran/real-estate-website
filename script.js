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
