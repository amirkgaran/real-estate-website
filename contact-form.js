(() => {
  const form = document.getElementById("inquiryForm");
  const email = document.getElementById("contactEmail");
  const replyTo = document.getElementById("contactReplyTo");
  if (!form || !email || !replyTo) return;

  form.addEventListener("submit", () => {
    replyTo.value = email.value.trim();
  });
})();
