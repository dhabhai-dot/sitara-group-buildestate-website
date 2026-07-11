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
  const duration = 1400;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    number.textContent = `${Math.round(target * eased)}+`;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const team = [
  { name: "Mohit Jarodhia", group: "Team Eagle", image: "assets/team/mohit-jarodhia.jpg", position: "50% 18%", description: "Customer guidance with sharp project knowledge and disciplined follow-up." },
  { name: "Vikas Sharma", group: "Team Rise", image: "assets/team/vikas-sharma.jpg", position: "50% 18%", description: "Growth-focused advisory for families and first-time plot buyers." },
  { name: "Suraj Gurjar", group: "Team Diamond", image: "assets/team/suraj-gurjar.jpg", position: "50% 26%", description: "Premium client service with clarity around location and value." },
  { name: "Dayal Gurjar", group: "Team Platinum", image: "assets/team/dayal-gurjar.jpg", position: "52% 12%", description: "Reliable coordination for site visits, documents and booking support." },
  { name: "Deepak Sharma", group: "Team Star", image: "assets/team/deepak-sharma.jpg", position: "50% 44%", description: "Warm, detail-led assistance for project comparisons and next steps." },
  { name: "Mohit Sharma", group: "Team Panther", image: "assets/team/mohit-sharma.jpg", position: "58% 14%", description: "Fast, focused support for active enquiries and investment decisions." },
  { name: "Sawan Sain", group: "Team Blaster", image: "assets/team/sawan-sain.jpg", position: "50% 20%", description: "Energetic project communication and responsive customer handling." },
  { name: "Ramkesh Gurjar", group: "Team Royal", image: "assets/team/ramkesh-gurjar.jpg", position: "50% 18%", description: "Professional relationship management for long-term customer confidence." },
  { name: "Mahesh Gurjar", group: "Team Tiger", image: "assets/team/mahesh-gurjar.jpg", position: "50% 16%", description: "Strong field coordination and site-level project understanding." }
];
const teamGrid = document.querySelector("#teamGrid");
if (teamGrid) {
  teamGrid.innerHTML = team.map(({ name, group, image, position, description }) => {
    return `<article class="team-card reveal"><div class="team-portrait"><img src="${image}" alt="${name} - ${group}" loading="lazy" style="--face-position: ${position};" /></div><h3>${name}</h3><span>${group}</span><p>${description}</p></article>`;
  }).join("");
  teamGrid.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
}

const lightbox = document.querySelector(".lightbox");
const lightboxImage = lightbox?.querySelector("img");
const lightboxCaption = lightbox?.querySelector("figcaption");
const lightboxClose = lightbox?.querySelector("button");

document.querySelectorAll(".gallery-item").forEach((item) => {
  item.addEventListener("click", () => {
    if (!lightbox || !lightboxImage || !lightboxCaption) return;
    const title = item.dataset.lightbox || "Sitara Group Buildestate gallery";
    lightboxImage.src = item.dataset.image || "";
    lightboxImage.alt = title;
    lightboxCaption.textContent = title;
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden";
  });
});

function closeLightbox() {
  lightbox?.classList.remove("open");
  document.body.style.overflow = "";
}

lightboxClose?.addEventListener("click", closeLightbox);
lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeLightbox();
});

const contactForm = document.querySelector(".contact-form");
const requiredMessages = {
  fullName: "Name is required.",
  phone: "Valid phone number is required.",
  email: "Valid email address is required.",
  projectInterest: "Select a project interest.",
  enquiryType: "Select an enquiry type.",
  message: "Message must be at least 10 characters.",
  budget: "Budget range is required.",
  timeline: "Visit timeline is required."
};

if (contactForm) {
  const submitButton = contactForm.querySelector("button");
  const formStatus = document.createElement("p");
  formStatus.className = "form-status";
  formStatus.setAttribute("role", "status");
  contactForm.appendChild(formStatus);

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

    const formData = new FormData(contactForm);
    if (formData.get("companyWebsite")) return;

    const payload = {
      name: formData.get("fullName"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      project: formData.get("projectInterest"),
      budget: formData.get("budget"),
      message: formData.get("message"),
      enquiry_type: formData.get("enquiryType"),
      timeline: formData.get("timeline"),
      source_page: window.location.href
    };

    const duplicateKey = `sitara-lead-${payload.email}-${payload.phone}`.toLowerCase();
    const lastSubmittedAt = Number(localStorage.getItem(duplicateKey) || 0);
    if (Date.now() - lastSubmittedAt < 5 * 60 * 1000) {
      formStatus.textContent = "This enquiry was already submitted. Our team will contact you shortly.";
      formStatus.classList.add("success");
      return;
    }

    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

    try {
      const response = await fetch("/api/submit-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.ok) {
        if (result.errors) showFieldErrors(contactForm, mapServerErrors(result.errors));
        throw new Error(result.message || "Unable to submit right now. Please try again shortly.");
      }

      localStorage.setItem(duplicateKey, String(Date.now()));
      contactForm.reset();
      formStatus.textContent = "Thank you! Our team will contact you shortly.";
      formStatus.classList.add("success");
    } catch (error) {
      formStatus.textContent = error.message || "Unable to submit right now. Please try again shortly.";
      formStatus.classList.add("error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  });
}

function mapServerErrors(errors) {
  const fieldMap = { name: "fullName", project: "projectInterest" };
  return Object.fromEntries(Object.entries(errors).map(([name, message]) => [fieldMap[name] || name, message]));
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


