(() => {
  if (window.__MYINVEST_VOICE_ASSISTANT__) return;
  window.__MYINVEST_VOICE_ASSISTANT__ = true;

  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const synth = window.speechSynthesis || null;
  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  let preferredVoice = null;
  let speechPrimed = false;

  const PAGE_MAP = [
    { phrases: ["multi residential", "multi-residential"], url: "multi-residential.html", label: "Multi Residential" },
    { phrases: ["financial market", "financial markets"], url: "financial-market.html", label: "Financial Market" },
    { phrases: ["residential"], url: "residential.html", label: "Residential" },
    { phrases: ["commercial"], url: "commercial.html", label: "Commercial" },
    { phrases: ["webinar", "webinars"], url: "webinars.html", label: "Webinars" },
    { phrases: ["insight", "insights", "education", "educational", "articles"], url: "insights.html", label: "Insights" },
    { phrases: ["about", "about amir"], url: "about.html", label: "About" },
    { phrases: ["contact", "contact amir"], url: "contact.html", label: "Contact" },
    { phrases: ["home", "home page"], url: "index.html", label: "Home" }
  ];

  let recognition = null;
  let listening = false;
  let sessionActive = false;
  let suspendAutoRestart = false;
  let restartTimer = null;
  let currentFlow = null;
  let readQueue = [];
  let readIndex = 0;
  let reading = false;
  let highlighted = null;
  let bubbleTimer = null;
  let confirmAction = null;

  const root = document.createElement("div");
  root.className = "voice-assistant";
  root.innerHTML = `
    <div id="voiceBubble" class="voice-bubble" hidden aria-live="polite"></div>

    <div id="voiceConfirm" class="voice-confirm" hidden role="dialog" aria-label="Confirm action">
      <p id="voiceConfirmText"></p>
      <div class="voice-confirm-actions">
        <button id="voiceConfirmYes" class="voice-confirm-primary" type="button">Confirm</button>
        <button id="voiceConfirmNo" class="voice-confirm-secondary" type="button">Cancel</button>
      </div>
    </div>

    <div id="voiceFallback" class="voice-fallback" hidden>
      <p id="voiceFallbackMessage">Voice input is unavailable. Type a command instead.</p>
      <form id="voiceFallbackForm" class="voice-fallback-form">
        <input id="voiceFallbackInput" type="text" autocomplete="off" aria-label="Type a command" placeholder="Example: go to Insights">
        <button type="submit">Go</button>
      </form>
    </div>

    <button id="voiceMic" class="voice-mic" type="button" aria-label="Use voice assistant" title="Voice assistant">🎙</button>
  `;
  document.body.appendChild(root);

  const mic = root.querySelector("#voiceMic");
  const bubble = root.querySelector("#voiceBubble");
  const confirmCard = root.querySelector("#voiceConfirm");
  const confirmText = root.querySelector("#voiceConfirmText");
  const confirmYes = root.querySelector("#voiceConfirmYes");
  const confirmNo = root.querySelector("#voiceConfirmNo");
  const fallback = root.querySelector("#voiceFallback");
  const fallbackMessage = root.querySelector("#voiceFallbackMessage");
  const fallbackForm = root.querySelector("#voiceFallbackForm");
  const fallbackInput = root.querySelector("#voiceFallbackInput");

  function normalize(value = "") {
    return String(value)
      .toLowerCase()
      .replace(/[’']/g, "")
      .replace(/[^a-z0-9@.+-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function showBubble(message, { sticky = false, heard = false } = {}) {
    clearTimeout(bubbleTimer);
    bubble.textContent = message;
    bubble.classList.toggle("heard", heard);
    bubble.hidden = false;

    if (!sticky) {
      bubbleTimer = setTimeout(() => {
        if (!listening && !currentFlow && !reading) bubble.hidden = true;
      }, 3300);
    }
  }

  function hideBubble() {
    clearTimeout(bubbleTimer);
    bubble.hidden = true;
  }

  function showFallback(message = "Voice input is unavailable. Type a command instead.") {
    fallbackMessage.textContent = message;
    fallback.hidden = false;
    confirmCard.hidden = true;
    fallbackInput.focus();
  }

  function hideFallback() {
    fallback.hidden = true;
  }

  function showConfirm(message, action, label = "Confirm") {
    confirmText.textContent = message;
    confirmYes.textContent = label;
    confirmAction = action;
    confirmCard.hidden = false;
    hideFallback();
    hideBubble();
  }

  function hideConfirm() {
    confirmCard.hidden = true;
    confirmAction = null;
  }

  function currentPage() {
    const file = window.location.pathname.split("/").pop();
    return file || "index.html";
  }

  function saveSessionState(active) {
    try {
      if (active) sessionStorage.setItem("myinvestVoiceSession", "1");
      else sessionStorage.removeItem("myinvestVoiceSession");
    } catch (_) {}
  }

  function scheduleListening(delay = 300) {
    clearTimeout(restartTimer);
    if (!sessionActive || suspendAutoRestart || reading) return;
    restartTimer = setTimeout(() => {
      if (sessionActive && !suspendAutoRestart && !listening && !reading) {
        startListening();
      }
    }, delay);
  }

  function startVoiceSession() {
    sessionActive = true;
    suspendAutoRestart = false;
    saveSessionState(true);
    mic.setAttribute("title", "Voice assistant is on. Say stop listening to end.");
    startListening();
  }

  function endVoiceSession(message = "Voice assistant stopped.") {
    sessionActive = false;
    suspendAutoRestart = true;
    clearTimeout(restartTimer);
    saveSessionState(false);

    if (recognition && listening) {
      try { recognition.stop(); } catch (_) {}
    }

    if (synth) synth.cancel();
    readQueue = [];
    readIndex = 0;
    reading = false;

    if (highlighted) {
      highlighted.classList.remove("voice-highlight");
      highlighted = null;
    }

    mic.classList.remove("listening");
    mic.setAttribute("aria-label", "Use voice assistant");
    mic.setAttribute("title", "Voice assistant");

    if (message) showBubble(message);
  }

  function stopRecognition() {
    if (!recognition || !listening) return;
    try { recognition.stop(); } catch (_) {}
  }

  function stopReading(update = true) {
    readQueue = [];
    readIndex = 0;
    reading = false;
    if (synth) synth.cancel();

    if (highlighted) {
      highlighted.classList.remove("voice-highlight");
      highlighted = null;
    }

    if (update) showBubble("Reading stopped.");
  }

  function refreshPreferredVoice() {
    if (!synth) return null;

    const voices = synth.getVoices?.() || [];
    preferredVoice =
      voices.find(v => /^en-CA$/i.test(v.lang)) ||
      voices.find(v => /^en-US$/i.test(v.lang)) ||
      voices.find(v => /^en-GB$/i.test(v.lang)) ||
      voices.find(v => /^en/i.test(v.lang)) ||
      voices[0] ||
      null;

    return preferredVoice;
  }

  if (synth) {
    refreshPreferredVoice();
    synth.addEventListener?.("voiceschanged", refreshPreferredVoice);
  }

  function configureUtterance(utterance, rate = 0.96) {
    utterance.lang = preferredVoice?.lang || "en-CA";
    utterance.rate = rate;
    utterance.volume = 1;
    if (preferredVoice) utterance.voice = preferredVoice;
    return utterance;
  }

  function waitForMicRelease(callback) {
    suspendAutoRestart = true;

    let completed = false;
    const finish = () => {
      if (completed) return;
      completed = true;
      const delay = isIOS ? 320 : 40;
      window.setTimeout(callback, delay);
    };

    if (!recognition || !listening) {
      finish();
      return;
    }

    recognition.addEventListener("end", finish, { once: true });

    try {
      recognition.stop();
    } catch (_) {
      finish();
    }

    // iOS occasionally delays the recognition "end" event.
    window.setTimeout(finish, isIOS ? 950 : 500);
  }

  function primeIOSSpeech(done) {
    if (!isIOS || !synth || !window.SpeechSynthesisUtterance || speechPrimed) {
      speechPrimed = true;
      done();
      return;
    }

    refreshPreferredVoice();

    try {
      synth.cancel();
      synth.resume();

      // A tiny, silent utterance is started directly from the user's tap.
      // This helps Safari activate its speech output session before microphone use.
      const unlock = configureUtterance(new SpeechSynthesisUtterance("ready"), 1.0);
      unlock.volume = 0.01;

      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        speechPrimed = true;
        window.setTimeout(done, 90);
      };

      unlock.onend = finish;
      unlock.onerror = finish;
      synth.speak(unlock);
      window.setTimeout(finish, 700);
    } catch (_) {
      speechPrimed = true;
      done();
    }
  }

  function chunkText(text, max = 230) {
    const clean = String(text || "").replace(/\s+/g, " ").trim();
    if (!clean) return [];

    const sentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean];
    const chunks = [];
    let current = "";

    for (const sentenceRaw of sentences) {
      const sentence = sentenceRaw.trim();
      if (!sentence) continue;

      if ((current + " " + sentence).trim().length <= max) {
        current = (current + " " + sentence).trim();
        continue;
      }

      if (current) chunks.push(current);

      if (sentence.length <= max) {
        current = sentence;
        continue;
      }

      const words = sentence.split(/\s+/);
      current = "";

      for (const word of words) {
        if ((current + " " + word).trim().length > max && current) {
          chunks.push(current);
          current = word;
        } else {
          current = (current + " " + word).trim();
        }
      }
    }

    if (current) chunks.push(current);
    return chunks;
  }

  function speakShort(message, { listenAfter = false, sticky = false } = {}) {
    const shouldResume = sessionActive || listenAfter;
    showBubble(message, { sticky: sticky || shouldResume });

    if (!synth || !window.SpeechSynthesisUtterance) {
      if (shouldResume) scheduleListening(250);
      return;
    }

    stopReading(false);

    waitForMicRelease(() => {
      try {
        refreshPreferredVoice();
        synth.cancel();
        synth.resume();

        const utterance = configureUtterance(
          new SpeechSynthesisUtterance(message),
          0.96
        );

        const finish = () => {
          suspendAutoRestart = false;
          if (shouldResume) scheduleListening(isIOS ? 450 : 220);
        };

        utterance.onend = finish;
        utterance.onerror = finish;
        synth.speak(utterance);
      } catch (error) {
        console.warn("Speech synthesis failed:", error);
        suspendAutoRestart = false;
        if (shouldResume) scheduleListening(450);
      }
    });
  }

  function speakLong(text, label = "Reading") {
    if (!synth || !window.SpeechSynthesisUtterance) {
      showBubble("Text-to-speech is not available in this browser.");
      scheduleListening(250);
      return;
    }

    stopReading(false);

    readQueue = chunkText(text);
    readIndex = 0;
    reading = readQueue.length > 0;

    if (!reading) {
      suspendAutoRestart = false;
      showBubble("There is nothing to read here.");
      scheduleListening(250);
      return;
    }

    showBubble(
      `${label}… The assistant will listen again when it finishes. Tap the mic to stop immediately.`,
      { sticky: true }
    );

    waitForMicRelease(() => {
      refreshPreferredVoice();

      try {
        synth.cancel();
        synth.resume();
      } catch (_) {}

      const next = () => {
        if (!reading || readIndex >= readQueue.length) {
          reading = false;
          readQueue = [];

          if (highlighted) {
            highlighted.classList.remove("voice-highlight");
            highlighted = null;
          }

          suspendAutoRestart = false;
          showBubble("Finished reading. Listening again…", { sticky: true });
          scheduleListening(isIOS ? 500 : 250);
          return;
        }

        try {
          // Resume before each chunk because Safari can pause the speech engine
          // after microphone/audio-session transitions.
          synth.resume();

          const utterance = configureUtterance(
            new SpeechSynthesisUtterance(readQueue[readIndex++]),
            0.94
          );

          let movedOn = false;
          const advance = () => {
            if (movedOn) return;
            movedOn = true;
            window.setTimeout(next, isIOS ? 90 : 0);
          };

          utterance.onend = advance;
          utterance.onerror = advance;
          synth.speak(utterance);

          // Watchdog for rare iOS Safari cases where onend is not delivered.
          window.setTimeout(() => {
            if (!movedOn && !synth.speaking && reading) advance();
          }, 12000);
        } catch (error) {
          console.warn("Speech synthesis chunk failed:", error);
          next();
        }
      };

      next();
    });
  }

  function startListening() {
    hideFallback();

    if (!Recognition) {
      sessionActive = false;
      saveSessionState(false);
      showFallback("This browser does not support voice recognition. Type a command instead.");
      return;
    }

    if (!sessionActive || suspendAutoRestart || listening || reading) return;

    try {
      recognition.start();
    } catch (error) {
      console.warn("Voice recognition could not start:", error);
      showBubble("Voice is still on. Trying the microphone again…", { sticky: true });
      scheduleListening(900);
    }
  }

  if (Recognition) {
    recognition = new Recognition();
    recognition.lang = "en-CA";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.addEventListener("start", () => {
      listening = true;
      mic.classList.add("listening");
      mic.setAttribute("aria-label", "Listening. Tap to stop.");
      showBubble("Listening…", { sticky: true });
    });

    recognition.addEventListener("result", event => {
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        if (!event.results[i].isFinal) continue;
        const result = event.results[i]?.[0]?.transcript?.trim() || "";
        if (!result) continue;
        showBubble(`“${result}”`, { heard: true });
        handleCommand(result);
      }
    });

    recognition.addEventListener("error", event => {
      if (event.error === "aborted") return;

      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        sessionActive = false;
        saveSessionState(false);
        showFallback("Microphone access is blocked. Allow microphone access for myinvest.ca, or type a command.");
      } else if (event.error === "no-speech") {
        if (sessionActive) showBubble("Listening…", { sticky: true });
      } else {
        if (sessionActive) showBubble("Voice is still on. Reconnecting to the microphone…", { sticky: true });
      }
    });

    recognition.addEventListener("end", () => {
      listening = false;
      mic.classList.remove("listening");

      if (sessionActive) {
        mic.setAttribute("aria-label", "Voice assistant is on. Tap to stop.");
        scheduleListening(350);
      } else {
        mic.setAttribute("aria-label", "Use voice assistant");
      }
    });
  }

  function waitFor(selector, timeout = 9000) {
    return new Promise(resolve => {
      const existing = document.querySelector(selector);

      if (existing) {
        resolve(existing);
        return;
      }

      const observer = new MutationObserver(() => {
        const found = document.querySelector(selector);
        if (!found) return;

        observer.disconnect();
        clearTimeout(timer);
        resolve(found);
      });

      observer.observe(document.documentElement, { childList: true, subtree: true });

      const timer = setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }

  function navigate(url, label) {
    showBubble(`Opening ${label}…`);
    window.location.href = url;
  }

  function cleanTarget(text, words) {
    let out = normalize(text);

    for (const word of words) {
      out = out.replace(new RegExp(`\\b${word}\\b`, "g"), " ");
    }

    return out.replace(/\s+/g, " ").trim();
  }

  function visibleInsightCard() {
    const cards = [...document.querySelectorAll(".insight-card")];
    if (!cards.length) return null;

    const center = window.innerHeight * 0.42;

    return cards
      .map(card => ({ card, distance: Math.abs(card.getBoundingClientRect().top - center) }))
      .sort((a, b) => a.distance - b.distance)[0]?.card || cards[0];
  }

  function findInsightCard(target = "") {
    const cards = [...document.querySelectorAll(".insight-card")];
    if (!cards.length) return null;

    const wanted = normalize(target);

    if (!wanted || ["this", "current", "article", "insight"].includes(wanted)) {
      return visibleInsightCard();
    }

    return cards.find(card => {
      const hay = normalize([
        card.id,
        card.querySelector(".eyebrow")?.textContent,
        card.querySelector("h2")?.textContent
      ].filter(Boolean).join(" "));

      return hay.includes(wanted) || wanted.includes(hay);
    }) || cards.find(card => normalize(card.textContent).includes(wanted));
  }

  async function openInsight(target, read = false) {
    if (currentPage() !== "insights.html") {
      const params = new URLSearchParams();
      params.set("voiceArticle", target || "this");
      params.set("voiceMode", read ? "read" : "open");
      navigate(`insights.html?${params.toString()}`, "Insights");
      return;
    }

    const found = await waitFor(".insight-card");

    if (!found) {
      speakShort("I could not find any published insight articles.");
      return;
    }

    const card = findInsightCard(target);

    if (!card) {
      speakShort(`I could not find an insight matching ${target}. Say “list insights” to hear the available topics.`);
      return;
    }

    card.scrollIntoView({ behavior: "smooth", block: "center" });

    if (highlighted) highlighted.classList.remove("voice-highlight");
    highlighted = card;
    card.classList.add("voice-highlight");

    const title = card.querySelector("h2")?.textContent?.trim() || "this article";

    if (read) {
      const category = card.querySelector(".eyebrow")?.textContent?.trim() || "";
      const body = card.querySelector(".insight-body")?.textContent?.trim() || card.textContent.trim();
      speakLong(`${category}. ${title}. ${body}`, `Reading ${title}`);
    } else {
      speakShort(`Opened ${title}.`);
    }
  }

  async function listInsights() {
    if (currentPage() !== "insights.html") {
      navigate("insights.html?voiceAction=listInsights", "Insights");
      return;
    }

    const found = await waitFor(".insight-card");

    if (!found) {
      speakShort("I could not find any published insight articles.");
      return;
    }

    const cards = [...document.querySelectorAll(".insight-card")];

    const names = cards.map(card => {
      const category = card.querySelector(".eyebrow")?.textContent?.trim();
      const title = card.querySelector("h2")?.textContent?.trim();
      return category && title ? `${category}: ${title}` : title || category;
    }).filter(Boolean);

    speakLong(`There are ${names.length} insight topics. ${names.join(". ")}.`, "Listing insight topics");
  }

  function webinarTargetFromCommand(raw) {
    let value = normalize(raw)
      .replace(/\b(register|registration|reserve|sign up|signup|me|please|for|the|a|an)\b/g, " ")
      .replace(/\bwebinar(s)?\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!value || value === "next" || value === "upcoming") return "next";
    return value;
  }

  function findWebinarButton(target = "next") {
    const buttons = [...document.querySelectorAll(".webinar-register-button[data-webinar-id]")];
    if (!buttons.length) return null;

    const wanted = normalize(target);

    if (!wanted || wanted === "next" || wanted === "first" || wanted === "upcoming") {
      return buttons[0];
    }

    return buttons.find(button => {
      const card = button.closest(".webinar-card");
      const title = normalize(card?.querySelector("h3")?.textContent || "");
      return title.includes(wanted) || wanted.includes(title);
    }) || null;
  }

  function webinarSummary(button) {
    const card = button?.closest(".webinar-card");
    if (!card) return "the selected webinar";

    const title = card.querySelector("h3")?.textContent?.trim() || "the selected webinar";
    const date = card.querySelector(".webinar-date")?.textContent?.trim() || "";
    const time = card.querySelector(".webinar-time")?.textContent?.trim() || "";

    return [title, date, time].filter(Boolean).join(", ");
  }

  async function beginWebinarRegistration(target = "next") {
    if (currentPage() !== "webinars.html") {
      const params = new URLSearchParams();
      params.set("voiceAction", "register");
      params.set("target", target || "next");
      navigate(`webinars.html?${params.toString()}`, "Webinars");
      return;
    }

    const found = await waitFor(".webinar-register-button[data-webinar-id]");

    if (!found) {
      speakShort("There are no published upcoming webinars available for registration right now.");
      return;
    }

    const button = findWebinarButton(target);

    if (!button) {
      speakShort("I could not match that webinar. Say “what webinars are coming up” to hear the available webinars.");
      return;
    }

    button.click();
    await new Promise(resolve => setTimeout(resolve, 120));

    const form = document.getElementById("webinarRegistrationForm");

    if (!form) {
      speakShort("I could not open the webinar registration form.");
      return;
    }

    currentFlow = { type: "webinar", stage: "name", form };

    speakShort(`Let's register you for ${webinarSummary(button)}. What name should I use?`, { listenAfter: true, sticky: true });
  }

  async function listWebinars() {
    if (currentPage() !== "webinars.html") {
      navigate("webinars.html?voiceAction=listWebinars", "Webinars");
      return;
    }

    const found = await waitFor(".webinar-card");

    if (!found) {
      speakShort("There are no published upcoming webinars right now.");
      return;
    }

    const cards = [...document.querySelectorAll(".webinar-card")];

    const descriptions = cards.slice(0, 6).map((card, index) => {
      const title = card.querySelector("h3")?.textContent?.trim() || `Webinar ${index + 1}`;
      const date = card.querySelector(".webinar-date")?.textContent?.trim() || "";
      const time = card.querySelector(".webinar-time")?.textContent?.trim() || "";
      return `${title}, ${date}, at ${time}`;
    });

    speakLong(`I found ${cards.length} upcoming webinar${cards.length === 1 ? "" : "s"}. ${descriptions.join(". ")}.`, "Reading upcoming webinars");
  }

  function normalizeSpokenEmail(raw) {
    return String(raw || "")
      .toLowerCase()
      .replace(/\bat sign\b/g, "@")
      .replace(/\bat\b/g, "@")
      .replace(/\bdot\b/g, ".")
      .replace(/\bperiod\b/g, ".")
      .replace(/\bunderscore\b/g, "_")
      .replace(/\bhyphen\b/g, "-")
      .replace(/\bdash\b/g, "-")
      .replace(/\s+/g, "")
      .replace(/,+/g, ".");
  }

  function normalizeSpokenPhone(raw) {
    const words = {
      zero: "0", oh: "0", one: "1", two: "2", to: "2", three: "3",
      four: "4", for: "4", five: "5", six: "6", seven: "7",
      eight: "8", ate: "8", nine: "9"
    };

    let value = String(raw || "").toLowerCase();

    value = value.replace(
      /\b(zero|oh|one|two|to|three|four|for|five|six|seven|eight|ate|nine)\b/g,
      match => words[match] || match
    );

    return value.replace(/[^\d+]/g, "");
  }

  function spokenEmail(email) {
    return String(email || "").replace("@", " at ").replace(/\./g, " dot ");
  }

  function flowCancel() {
    if (!currentFlow) return;

    const type = currentFlow.type;

    if (type === "webinar") {
      const dialog = document.getElementById("webinarRegistrationModal");
      if (dialog?.open && typeof dialog.close === "function") dialog.close();
    } else if (type === "inquiry") {
      const dialog = document.getElementById("inquiryModal");
      if (dialog?.open && typeof dialog.close === "function") dialog.close();
    }

    currentFlow = null;
    hideConfirm();
    speakShort("Cancelled. Nothing was submitted.");
  }

  function fieldForWebinar(name) {
    const map = {
      name: document.getElementById("registrationName"),
      email: document.getElementById("registrationEmail"),
      phone: document.getElementById("registrationPhone")
    };

    return map[name];
  }

  function askWebinarStage(stage) {
    if (!currentFlow || currentFlow.type !== "webinar") return;

    hideConfirm();
    currentFlow.stage = stage;

    const prompts = {
      name: "What name should I use?",
      email: "What email address should I use? You can say name at gmail dot com.",
      phone: "What contact number should I use?"
    };

    speakShort(prompts[stage], { listenAfter: true, sticky: true });
  }

  function submitWebinarRegistration() {
    if (!currentFlow || currentFlow.type !== "webinar") return;

    const form = currentFlow.form;

    if (!form.reportValidity()) {
      speakShort("One of the registration fields needs correction. Please review the form on screen.");
      return;
    }

    currentFlow = null;
    hideConfirm();
    watchWebinarResult();
    speakShort("Submitting your webinar registration now.");
    form.requestSubmit();
  }

  function webinarConfirmation() {
    const name = fieldForWebinar("name")?.value?.trim() || "";
    const email = fieldForWebinar("email")?.value?.trim() || "";
    const phone = fieldForWebinar("phone")?.value?.trim() || "";

    currentFlow.stage = "confirm";

    const summary = `Register ${name} for this webinar using ${email} and ${phone}?`;

    showConfirm(summary, submitWebinarRegistration, "Confirm registration");

    speakShort(
      `I have ${name}, email ${spokenEmail(email)}, and phone ${phone}. Say confirm registration, change name, change email, change phone, or cancel.`,
      { sticky: true }
    );
  }

  function watchWebinarResult() {
    const message = document.getElementById("webinarRegistrationMessage");
    if (!message) return;

    let done = false;

    const announce = () => {
      if (done) return;

      const text = message.textContent?.trim() || "";
      if (!text || /registering/i.test(text)) return;

      done = true;
      observer.disconnect();
      speakShort(text);
    };

    const observer = new MutationObserver(announce);
    observer.observe(message, { childList: true, subtree: true, characterData: true });

    setTimeout(() => {
      if (!done) observer.disconnect();
    }, 15000);
  }

  function handleWebinarFlow(raw, command) {
    if (/\b(cancel|never mind|nevermind)\b/.test(command)) {
      flowCancel();
      return true;
    }

    if (/\bchange name\b/.test(command)) {
      askWebinarStage("name");
      return true;
    }

    if (/\bchange email\b/.test(command)) {
      askWebinarStage("email");
      return true;
    }

    if (/\bchange (phone|number|contact)\b/.test(command)) {
      askWebinarStage("phone");
      return true;
    }

    if (currentFlow.stage === "name") {
      const value = String(raw).replace(/^\s*(my\s+)?name\s+(is\s+)?/i, "").trim();

      if (value.length < 2) {
        speakShort("I did not catch the name. Please say the name again.", { listenAfter: true, sticky: true });
        return true;
      }

      fieldForWebinar("name").value = value;
      askWebinarStage("email");
      return true;
    }

    if (currentFlow.stage === "email") {
      const value = normalizeSpokenEmail(
        raw.replace(/^\s*(my\s+)?email(\s+address)?\s+(is\s+)?/i, "")
      );

      const field = fieldForWebinar("email");
      field.value = value;

      if (!field.checkValidity()) {
        speakShort("That does not look like a complete email address. Please say it again.", { listenAfter: true, sticky: true });
        return true;
      }

      askWebinarStage("phone");
      return true;
    }

    if (currentFlow.stage === "phone") {
      const value = normalizeSpokenPhone(
        raw.replace(/^\s*(my\s+)?(phone|contact|number)(\s+number)?\s+(is\s+)?/i, "")
      );

      if (value.replace(/\D/g, "").length < 7) {
        speakShort("I did not catch a complete phone number. Please say the number again.", { listenAfter: true, sticky: true });
        return true;
      }

      fieldForWebinar("phone").value = value;
      webinarConfirmation();
      return true;
    }

    if (currentFlow.stage === "confirm") {
      if (/\b(confirm|submit|yes|register)\b/.test(command)) {
        submitWebinarRegistration();
        return true;
      }

      speakShort("Tap Confirm registration, or say confirm registration, change name, change email, change phone, or cancel.");
      return true;
    }

    return false;
  }

  function visibleInquiryForm() {
    const modal = document.getElementById("inquiryModal");

    if (modal?.open) return modal.querySelector("#inquiryForm");

    return document.getElementById("inquiryForm");
  }

  async function beginInquiry() {
    if (currentPage() === "contact.html") {
      const form = await waitFor("#inquiryForm");

      if (!form) {
        speakShort("I could not find the contact form.");
        return;
      }

      form.scrollIntoView({ behavior: "smooth", block: "center" });
      currentFlow = { type: "inquiry", stage: "name", form };
      speakShort("I can help prepare your inquiry. What name should I use?", { listenAfter: true, sticky: true });
      return;
    }

    const modal = await waitFor("#inquiryModal");

    if (modal) {
      const opener = document.querySelector("[data-inquiry-open]");
      if (opener) opener.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      const form = visibleInquiryForm();

      if (form) {
        currentFlow = { type: "inquiry", stage: "name", form };
        speakShort("I can help prepare your request. What name should I use?", { listenAfter: true, sticky: true });
        return;
      }
    }

    navigate("contact.html?voiceAction=inquiry", "Contact");
  }

  function inquiryField(name) {
    const form = currentFlow?.form;
    if (!form) return null;

    const selectors = {
      name: 'input[name="Name"]',
      phone: 'input[name="Contact number"]',
      email: 'input[name="Email"]',
      description: 'textarea[name="Brief description"]'
    };

    return form.querySelector(selectors[name]);
  }

  function askInquiryStage(stage) {
    if (!currentFlow || currentFlow.type !== "inquiry") return;

    hideConfirm();
    currentFlow.stage = stage;

    const prompts = {
      name: "What name should I use?",
      phone: "What contact number should I use?",
      email: "What email address should I use?",
      description: "Briefly, what would you like Amir to help you with?"
    };

    speakShort(prompts[stage], { listenAfter: true, sticky: true });
  }

  function submitInquiry() {
    if (!currentFlow || currentFlow.type !== "inquiry") return;

    const form = currentFlow.form;

    if (!form.reportValidity()) {
      speakShort("One of the inquiry fields needs correction. Please review the form on screen.");
      return;
    }

    currentFlow = null;
    hideConfirm();
    speakShort("Sending your inquiry now.");
    form.requestSubmit();
  }

  function inquiryConfirmation() {
    const name = inquiryField("name")?.value?.trim() || "";
    const email = inquiryField("email")?.value?.trim() || "";
    const description = inquiryField("description")?.value?.trim() || "";

    currentFlow.stage = "confirm";

    showConfirm(
      `Send this inquiry for ${name}? “${description.slice(0, 105)}${description.length > 105 ? "…" : ""}”`,
      submitInquiry,
      "Send inquiry"
    );

    speakShort(
      `Your inquiry is prepared for ${name}, email ${spokenEmail(email)}. Say confirm inquiry, change name, change phone, change email, change message, or cancel.`,
      { sticky: true }
    );
  }

  function handleInquiryFlow(raw, command) {
    if (/\b(cancel|never mind|nevermind)\b/.test(command)) {
      flowCancel();
      return true;
    }

    const changes = [
      ["name", /\bchange name\b/],
      ["phone", /\bchange (phone|number|contact)\b/],
      ["email", /\bchange email\b/],
      ["description", /\bchange (message|description|inquiry)\b/]
    ];

    for (const [stage, pattern] of changes) {
      if (pattern.test(command)) {
        askInquiryStage(stage);
        return true;
      }
    }

    if (currentFlow.stage === "name") {
      const value = String(raw).replace(/^\s*(my\s+)?name\s+(is\s+)?/i, "").trim();

      if (value.length < 2) {
        speakShort("I did not catch the name. Please say it again.", { listenAfter: true, sticky: true });
        return true;
      }

      inquiryField("name").value = value;
      askInquiryStage("phone");
      return true;
    }

    if (currentFlow.stage === "phone") {
      const value = normalizeSpokenPhone(raw);

      if (value.replace(/\D/g, "").length < 7) {
        speakShort("I did not catch a complete phone number. Please say it again.", { listenAfter: true, sticky: true });
        return true;
      }

      inquiryField("phone").value = value;
      askInquiryStage("email");
      return true;
    }

    if (currentFlow.stage === "email") {
      const value = normalizeSpokenEmail(raw);
      const field = inquiryField("email");
      field.value = value;

      if (!field.checkValidity()) {
        speakShort("That email address does not look complete. Please say it again.", { listenAfter: true, sticky: true });
        return true;
      }

      askInquiryStage("description");
      return true;
    }

    if (currentFlow.stage === "description") {
      const value = String(raw)
        .replace(/^\s*(my\s+)?(message|description|inquiry)\s+(is\s+)?/i, "")
        .trim();

      if (value.length < 4) {
        speakShort("Please give me a little more detail about what you need.", { listenAfter: true, sticky: true });
        return true;
      }

      inquiryField("description").value = value;
      inquiryConfirmation();
      return true;
    }

    if (currentFlow.stage === "confirm") {
      if (/\b(confirm|submit|send|yes)\b/.test(command)) {
        submitInquiry();
        return true;
      }

      speakShort("Tap Send inquiry, or say confirm inquiry, change name, change phone, change email, change message, or cancel.");
      return true;
    }

    return false;
  }

  function listingCards() {
    return [...document.querySelectorAll(".listing-list-card, .public-listing-card")];
  }

  async function readListings() {
    const found = await waitFor(".listing-list-card, .public-listing-card", 7000);

    if (!found) {
      speakShort("I could not find active listings on this page.");
      return;
    }

    const cards = listingCards();

    const descriptions = cards.slice(0, 6).map((card, index) => {
      const title = card.querySelector("h3")?.textContent?.trim() || `Listing ${index + 1}`;
      const price = card.querySelector(".listing-list-price, .listing-price")?.textContent?.trim() || "";
      const location = card.querySelector(".listing-list-location, .listing-location")?.textContent?.trim() || "";
      return [title, price, location].filter(Boolean).join(", ");
    });

    speakLong(`I found ${cards.length} active listing${cards.length === 1 ? "" : "s"}. ${descriptions.join(". ")}.`, "Reading listings");
  }

  async function openListing(raw) {
    const found = await waitFor(".listing-list-card, .public-listing-card", 7000);

    if (!found) {
      speakShort("I could not find active listings on this page.");
      return;
    }

    const cards = listingCards();
    const command = normalize(raw);

    const target = command
      .replace(/\b(open|view|show|listing|property|the|first|next)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    let card = null;

    if (!target || /\bfirst\b/.test(command)) {
      card = cards[0];
    } else {
      card = cards.find(item => normalize(item.textContent).includes(target));
    }

    if (!card) {
      speakShort("I could not match that property. Say “read listings” to hear the available listings.");
      return;
    }

    if (card.matches("a[href]")) {
      window.location.href = card.href;
      return;
    }

    card.scrollIntoView({ behavior: "smooth", block: "center" });

    if (highlighted) highlighted.classList.remove("voice-highlight");
    highlighted = card;
    card.classList.add("voice-highlight");

    speakShort(`Showing ${card.querySelector("h3")?.textContent?.trim() || "the listing"}.`);
  }

  function showResidentialType(type) {
    if (currentPage() !== "residential.html") {
      navigate(
        `residential.html?type=${type.toLowerCase()}`,
        `homes for ${type === "Sale" ? "sale" : "lease"}`
      );
      return;
    }

    const button = document.querySelector(`[data-listing-type="${type}"]`);

    if (!button) {
      speakShort("I could not find that residential option.");
      return;
    }

    button.click();
    speakShort(`Showing homes for ${type === "Sale" ? "sale" : "lease"}.`);
  }

  function readPage() {
    const main = document.querySelector("main");

    if (!main) {
      speakShort("There is no main page content to read.");
      return;
    }

    const clone = main.cloneNode(true);
    clone.querySelectorAll("form, button, dialog, script, style, .status-message").forEach(node => node.remove());

    speakLong(clone.textContent, "Reading this page");
  }

  function showHelp() {
    speakLong(
      "You can say: go to Insights. Read the Buying article. Go to Residential, then say for sale or for lease. What webinars are coming up. Register for the next webinar. Read listings. Request details. On About, say read it. Pause reading. Resume reading. Or stop listening.",
      "Voice help"
    );
  }

  function handleCommand(raw) {
    const command = normalize(raw);

    if (!command) {
      showBubble("Tap the microphone and try again.");
      return;
    }

    if (/\b(stop listening|stop voice|turn off voice|turn off microphone|end voice|goodbye|bye)\b/.test(command) || command === "stop") {
      endVoiceSession("Voice assistant stopped.");
      return;
    }

    if (currentFlow?.type === "webinar" && handleWebinarFlow(raw, command)) return;
    if (currentFlow?.type === "inquiry" && handleInquiryFlow(raw, command)) return;

    if (/\b(stop|cancel) reading\b/.test(command)) {
      stopReading();
      scheduleListening(250);
      return;
    }

    if (/\bpause( reading)?\b/.test(command)) {
      if (synth?.speaking) {
        synth.pause();
        showBubble("Reading paused. Say “resume” after the current speech stops, or tap the mic.", { sticky: true });
      } else {
        showBubble("Nothing is being read right now.");
      }
      return;
    }

    if (/\bresume( reading)?\b/.test(command)) {
      if (synth?.paused) {
        synth.resume();
        showBubble("Reading resumed.", { sticky: true });
      } else {
        showBubble("There is no paused reading to resume.");
      }
      return;
    }

    if (/\b(help|what can i say|voice commands|commands)\b/.test(command)) {
      showHelp();
      return;
    }

    if (/\b(go back|back)\b/.test(command)) {
      history.back();
      return;
    }

    if (/\b(scroll down|page down)\b/.test(command)) {
      window.scrollBy({ top: Math.round(window.innerHeight * .75), behavior: "smooth" });
      showBubble("Scrolling down.");
      return;
    }

    if (/\b(scroll up|page up)\b/.test(command)) {
      window.scrollBy({ top: -Math.round(window.innerHeight * .75), behavior: "smooth" });
      showBubble("Scrolling up.");
      return;
    }

    if (/\b(go to top|scroll to top|top of page)\b/.test(command)) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      showBubble("Going to the top.");
      return;
    }

    if (/\b(go to bottom|scroll to bottom|bottom of page)\b/.test(command)) {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
      showBubble("Going to the bottom.");
      return;
    }

    if (/\b(what|which|list|read).*(webinar|webinars)\b/.test(command) || /\bupcoming webinars\b/.test(command)) {
      listWebinars();
      return;
    }

    if (/\b(register|sign up|reserve).*(webinar|place|spot)\b/.test(command) || /\bregister me\b/.test(command)) {
      beginWebinarRegistration(webinarTargetFromCommand(raw));
      return;
    }

    if (/\b(list|what|which).*(insight|insights|article|articles|topics)\b/.test(command)) {
      listInsights();
      return;
    }

    if (/\b(read).*(article|insight|buying|selling|financing|commercial|residential|strategy|market)\b/.test(command)) {
      const target = cleanTarget(raw, ["read", "the", "article", "insight", "about", "please"]);
      openInsight(target || "this", true);
      return;
    }

    if (/\b(open|show|go to).*(article|insight)\b/.test(command)) {
      const target = cleanTarget(raw, ["open", "show", "go", "to", "the", "article", "insight"]);
      openInsight(target || "this", false);
      return;
    }

    if (/\b(read this article|read current article)\b/.test(command)) {
      openInsight("this", true);
      return;
    }

    if (
      /\b(read this page|read page|read the page|read it|read this|read about amir|read about)\b/.test(command) ||
      (currentPage() === "about.html" && /^(read|read it|read this|read about amir)$/.test(command))
    ) {
      readPage();
      return;
    }

    if (
      /\b(homes?|properties?|residential).*(for sale|sale|buy|purchase)\b/.test(command) ||
      /\b(show )?for sale\b/.test(command) ||
      command === "sale" ||
      command === "buy"
    ) {
      showResidentialType("Sale");
      return;
    }

    if (
      /\b(homes?|properties?|residential).*(for lease|lease|rent|rental)\b/.test(command) ||
      /\b(show )?for lease\b/.test(command) ||
      command === "lease" ||
      command === "rent" ||
      command === "rental"
    ) {
      showResidentialType("Lease");
      return;
    }

    if (/\b(read|list).*(listings|properties|homes)\b/.test(command)) {
      readListings();
      return;
    }

    if (/\b(open|view).*(listing|property)\b/.test(command)) {
      openListing(raw);
      return;
    }

    if (/\b(request details|ask about|send inquiry|make inquiry|contact request)\b/.test(command)) {
      beginInquiry();
      return;
    }

    if (/\b(what is|whats|tell me).*(phone|number|email|contact)\b/.test(command)) {
      speakShort("Amir Geran can be reached at 416 616 4634, or by email at amirkgaran at gmail dot com.");
      return;
    }

    for (const page of PAGE_MAP) {
      const matched = page.phrases.some(phrase =>
        command === phrase ||
        command.includes(`go to ${phrase}`) ||
        command.includes(`open ${phrase}`) ||
        command.includes(`${phrase} page`)
      );

      if (matched) {
        navigate(page.url, page.label);
        return;
      }
    }

    speakShort("I didn't understand that. Tap the microphone and say “help” for examples.");
  }

  async function processUrlActions() {
    const url = new URL(window.location.href);
    const action = url.searchParams.get("voiceAction");
    const article = url.searchParams.get("voiceArticle");
    const mode = url.searchParams.get("voiceMode");
    const target = url.searchParams.get("target");

    if (!action && !article) return;

    url.searchParams.delete("voiceAction");
    url.searchParams.delete("voiceArticle");
    url.searchParams.delete("voiceMode");
    url.searchParams.delete("target");

    history.replaceState(null, "", url.pathname + (url.search ? url.search : "") + url.hash);

    if (article) {
      await openInsight(article, mode === "read");
      return;
    }

    if (action === "register") {
      await beginWebinarRegistration(target || "next");
      return;
    }

    if (action === "listWebinars") {
      await listWebinars();
      return;
    }

    if (action === "listInsights") {
      await listInsights();
      return;
    }

    if (action === "inquiry") {
      await beginInquiry();
    }
  }

  mic.addEventListener("click", () => {
    if (sessionActive) {
      endVoiceSession("Voice assistant stopped.");
      return;
    }

    primeIOSSpeech(startVoiceSession);
  });

  confirmYes.addEventListener("click", () => {
    const action = confirmAction;
    if (typeof action === "function") action();
  });

  confirmNo.addEventListener("click", flowCancel);

  fallbackForm.addEventListener("submit", event => {
    event.preventDefault();

    const value = fallbackInput.value.trim();
    if (!value) return;

    fallbackInput.value = "";
    hideFallback();
    showBubble(`“${value}”`, { heard: true });
    handleCommand(value);
  });

  try {
    sessionActive = sessionStorage.getItem("myinvestVoiceSession") === "1";
  } catch (_) {
    sessionActive = false;
  }

  processUrlActions().finally(() => {
    if (sessionActive && !reading) {
      mic.setAttribute("title", "Voice assistant is on. Say stop listening to end.");
      scheduleListening(550);
    }
  });
})();
