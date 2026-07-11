const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

function syncHeader() {
  if (!header) return;
  header.classList.toggle("scrolled", window.scrollY > 40);
}
window.addEventListener("scroll", syncHeader, { passive: true });
syncHeader();

if (header && menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const isOpen = header.classList.toggle("menu-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      header.classList.remove("menu-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open menu");
    });
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        if (entry.target.classList.contains("stat")) animateCounter(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

document.querySelectorAll(".reveal, .stat").forEach((element) => observer.observe(element));

function animateCounter(stat) {
  const number = stat.querySelector("[data-count]");
  if (!number || number.dataset.done) return;
  number.dataset.done = "true";
  const target = Number(number.dataset.count || 0);
  const suffix = target >= 100 ? "+" : "+";
  const duration = 1400;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    number.textContent = `${Math.round(target * eased)}${suffix}`;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const team = [
  ["Mohit Jarodhia", "Team Eagle", "Customer guidance with sharp project knowledge and disciplined follow-up."],
  ["Vikas Sharma", "Team Rise", "Growth-focused advisory for families and first-time plot buyers."],
  ["Suraj Gurjar", "Team Diamond", "Premium client service with clarity around location and value."],
  ["Dayal Gurjar", "Team Platinum", "Reliable coordination for site visits, documents and booking support."],
  ["Deepak Sharma", "Team Star", "Warm, detail-led assistance for project comparisons and next steps."],
  ["Mohit Sharma", "Team Panther", "Fast, focused support for active enquiries and investment decisions."],
  ["Sawan Sain", "Team Blaster", "Energetic project communication and responsive customer handling."],
  ["Ramkesh Gurjar", "Team Royal", "Professional relationship management for long-term customer confidence."],
  ["Mahesh Gurjar", "Team Tiger", "Strong field coordination and site-level project understanding."]
];

const teamGrid = document.querySelector("#teamGrid");
if (teamGrid) {
  teamGrid.innerHTML = team.map(([name, group, description]) => {
    const initials = name.split(" ").map((part) => part[0]).join("");
    return `<article class="team-card reveal"><div class="team-portrait">${initials}</div><h3>${name}</h3><span>${group}</span><p>${description}</p></article>`;
  }).join("");
  teamGrid.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
}

const lightbox = document.querySelector(".lightbox");
const lightboxText = lightbox?.querySelector("p");
const lightboxClose = lightbox?.querySelector("button");

document.querySelectorAll(".gallery-item").forEach((item) => {
  item.addEventListener("click", () => {
    if (!lightbox || !lightboxText) return;
    lightboxText.textContent = item.dataset.lightbox || "Sitara Group Buildestate gallery";
    lightbox.classList.add("open");
  });
});

lightboxClose?.addEventListener("click", () => lightbox?.classList.remove("open"));
lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) lightbox.classList.remove("open");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") lightbox?.classList.remove("open");
});

const contactForm = document.querySelector(".contact-form");
const requiredMessages = {
  fullName: "Name is required.",
  phone: "Valid phone number is required.",
  email: "Valid email address is required.",
  companyName: "Select a project interest.",
  serviceRequired: "Select an enquiry type.",
  message: "Message must be at least 10 characters.",
  budget: "Budget range is required.",
  timeline: "Visit timeline is required."
};

let recaptchaSiteKey = "";
let recaptchaReadyPromise = null;

if (contactForm) {
  const submitButton = contactForm.querySelector("button");
  const formStatus = document.createElement("p");
  formStatus.className = "form-status";
  formStatus.setAttribute("role", "status");
  contactForm.appendChild(formStatus);

  loadPublicConfig();

  contactForm.addEventListener("input", (event) => {
    const field = event.target;
    if (field.name) clearFieldError(field);
  });

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFieldErrors(contactForm);
    formStatus.textContent = "";
    formStatus.classList.remove("error", "success");

    const clientErrors = validateContactForm(contactForm);
    if (Object.keys(clientErrors).length > 0) {
      showFieldErrors(contactForm, clientErrors);
      formStatus.textContent = "Please check the highlighted fields.";
      formStatus.classList.add("error");
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

    const formData = new FormData(contactForm);
    const payload = Object.fromEntries(formData.entries());

    try {
      if (recaptchaSiteKey) payload.recaptchaToken = await getRecaptchaToken();

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({ ok: false, error: "Unable to read server response." }));

      if (!response.ok || !result.ok) {
        showFieldErrors(contactForm, result.fields || {});
        throw new Error(result.error || "Something went wrong. Please try again.");
      }

      contactForm.reset();
      formStatus.textContent = result.message || "Thank you. Our team will contact you shortly.";
      formStatus.classList.add("success");
    } catch (error) {
      formStatus.textContent = error.message || "Unable to send right now. Please try again.";
      formStatus.classList.add("error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Submit Enquiry";
    }
  });
}

async function loadPublicConfig() {
  try {
    const response = await fetch("/api/config", { credentials: "same-origin" });
    const result = await response.json();
    recaptchaSiteKey = result?.recaptchaSiteKey || "";
    if (recaptchaSiteKey) recaptchaReadyPromise = loadRecaptcha(recaptchaSiteKey);
  } catch {
    recaptchaSiteKey = "";
  }
}

function loadRecaptcha(siteKey) {
  return new Promise((resolve, reject) => {
    if (window.grecaptcha?.execute) return resolve();
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.onload = () => window.grecaptcha.ready(resolve);
    script.onerror = () => reject(new Error("Unable to load form verification. Please try again."));
    document.head.appendChild(script);
  });
}

async function getRecaptchaToken() {
  if (!recaptchaReadyPromise) recaptchaReadyPromise = loadRecaptcha(recaptchaSiteKey);
  await recaptchaReadyPromise;
  return window.grecaptcha.execute(recaptchaSiteKey, { action: "lead_submit" });
}

function validateContactForm(form) {
  const errors = {};
  Array.from(form.elements).forEach((field) => {
    if (!field.name || field.name === "companyWebsite") return;
    if (!field.checkValidity()) errors[field.name] = requiredMessages[field.name] || field.validationMessage;
  });
  return errors;
}

function clearFieldErrors(form) {
  form.querySelectorAll(".field-error").forEach((element) => element.remove());
  form.querySelectorAll(".has-error").forEach((element) => element.classList.remove("has-error"));
}

function clearFieldError(field) {
  const label = field.closest("label");
  if (!label) return;
  label.classList.remove("has-error");
  label.querySelectorAll(".field-error").forEach((element) => element.remove());
}

function showFieldErrors(form, fields) {
  Object.entries(fields).forEach(([name, message]) => {
    const field = form.elements.namedItem(name);
    if (!field || name === "companyWebsite") return;
    const label = field.closest("label");
    if (!label) return;
    label.classList.add("has-error");
    const error = document.createElement("small");
    error.className = "field-error";
    error.textContent = message;
    label.appendChild(error);
  });
}
