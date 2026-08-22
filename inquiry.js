(() => {
  const RECIPIENT = "amirkgaran@gmail.com";

  const modalMarkup = `
    <dialog id="inquiryModal" class="inquiry-modal" aria-labelledby="inquiryTitle">
      <div class="inquiry-modal-card">
        <button id="inquiryClose" class="inquiry-close" type="button" aria-label="Close request form">×</button>
        <p class="eyebrow">Request details</p>
        <h2 id="inquiryTitle">Tell us how to reach you</h2>
        <p class="inquiry-intro">Share your contact information and a short note. Amir will receive your request by email and can follow up with you directly.</p>

        <form id="inquiryForm" class="inquiry-form" action="https://formsubmit.co/${RECIPIENT}" method="POST">
          <input id="inquirySubject" type="hidden" name="_subject" value="New MyInvest inquiry">
          <input type="hidden" name="_template" value="table">
          <input type="hidden" name="_next" value="https://www.myinvest.ca/thank-you.html">
          <input id="inquiryReplyTo" type="hidden" name="_replyto" value="">
          <input id="inquirySourceUrl" type="hidden" name="_url" value="">
          <input id="inquiryContext" type="hidden" name="Property / inquiry" value="MyInvest inquiry">
          <input id="inquiryListingUrl" type="hidden" name="Listing URL" value="">
          <input class="inquiry-honey" type="text" name="_honey" tabindex="-1" autocomplete="off">

          <label>
            Name
            <input type="text" name="Name" autocomplete="name" required>
          </label>

          <label>
            Contact number
            <input type="tel" name="Contact number" autocomplete="tel" required>
          </label>

          <label>
            Email
            <input id="inquiryEmail" type="email" name="Email" autocomplete="email" required>
          </label>

          <label>
            Brief description
            <textarea name="Brief description" rows="5" placeholder="Tell Amir what you would like to know about this property." required></textarea>
          </label>

          <button class="button inquiry-submit" type="submit">Send request</button>
          <p class="inquiry-note">Your information will be used to respond to this inquiry.</p>
        </form>
      </div>
    </dialog>`;

  document.body.insertAdjacentHTML("beforeend", modalMarkup);

  const dialog = document.getElementById("inquiryModal");
  const form = document.getElementById("inquiryForm");
  const closeButton = document.getElementById("inquiryClose");
  const emailInput = document.getElementById("inquiryEmail");
  const replyTo = document.getElementById("inquiryReplyTo");
  const sourceUrl = document.getElementById("inquirySourceUrl");
  const contextInput = document.getElementById("inquiryContext");
  const listingUrl = document.getElementById("inquiryListingUrl");
  const subjectInput = document.getElementById("inquirySubject");

  if (!dialog || !form) return;

  function inquiryContext(button) {
    if (button?.dataset?.inquiryContext) return button.dataset.inquiryContext;

    const listingTitle = document.getElementById("listingDetailTitle")?.textContent?.trim();
    if (listingTitle) return listingTitle;

    const category = document.body.dataset.category;
    if (category === "Residential") {
      const type = new URLSearchParams(window.location.search).get("type");
      if (type === "sale") return "Residential — For Sale";
      if (type === "lease") return "Residential — For Lease";
    }
    return category || "General MyInvest inquiry";
  }

  function openInquiry(button) {
    const context = inquiryContext(button);
    contextInput.value = context;
    sourceUrl.value = window.location.href;
    listingUrl.value = document.getElementById("listingDetailTitle") ? window.location.href : "";
    subjectInput.value = `New MyInvest inquiry — ${context}`;

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
      dialog.classList.add("fallback-open");
    }

    window.setTimeout(() => form.querySelector('input[name="Name"]')?.focus(), 30);
  }

  function closeInquiry() {
    if (typeof dialog.close === "function") dialog.close();
    else {
      dialog.removeAttribute("open");
      dialog.classList.remove("fallback-open");
    }
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-inquiry-open]");
    if (!button) return;
    event.preventDefault();
    openInquiry(button);
  });

  closeButton?.addEventListener("click", closeInquiry);

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeInquiry();
  });

  form.addEventListener("submit", () => {
    replyTo.value = emailInput.value.trim();
    sourceUrl.value = window.location.href;
  });
})();
