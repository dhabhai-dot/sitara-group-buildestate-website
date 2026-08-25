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

const galleryDefaults = [
  ["photo-01", "DS Enclave - Garden Walkway", "assets/projects/project-01.jpg", "tall"],
  ["photo-02", "DS Enclave - Temple", "assets/projects/project-02.jpg", ""],
  ["photo-03", "DS Enclave - Garden Lawn", "assets/projects/project-03.jpg", "wide"],
  ["photo-04", "DS Enclave - Plot Layout", "assets/projects/project-04.jpg", ""],
  ["photo-05", "DS Enclave - Landscape Park", "assets/projects/project-05.jpg", "tall"],
  ["photo-06", "DS Enclave - Outdoor Gym", "assets/projects/project-06.jpg", ""],
  ["photo-07", "DS Enclave - Water Tank View", "assets/projects/project-07.jpg", "wide"],
  ["photo-08", "DS Enclave - Main Entrance", "assets/projects/project-08.jpg", ""],
  ["photo-09", "DS Enclave - Entry Gate", "assets/projects/project-09.jpg", "tall"],
  ["photo-10", "DS Enclave - Shopping Market", "assets/projects/project-10.jpg", ""],
  ["photo-11", "DS Enclave - Lotus Fountain", "assets/projects/project-11.jpg", "wide"],
  ["photo-12", "Sitara Group - Brand Collateral", "assets/gallery/brand-collateral.jpg", ""],
  ["video-01", "Sitara Group - Site Progress", "assets/gallery/IMG_7598.MOV", "wide", "video"]
].map(([id, caption, src, size, type = "photo"]) => ({ id, type, caption, src, size, builtIn: true }));

const galleryStoreKey = "sitara-gallery-settings-v1";
const galleryDbName = "sitara-gallery-media";
const galleryAdminKey = "sitara-gallery-admin-v1";
let gallerySettings = readGallerySettings();
let galleryItems = [...galleryDefaults];
let galleryObjectUrls = [];
const galleryAdmin = document.querySelector(".gallery-admin");
const galleryAdminForm = document.querySelector(".gallery-admin-form");
const galleryAdminStatus = document.querySelector(".gallery-admin-status");
const galleryAdminList = document.querySelector(".gallery-admin-list");
const galleryLiveStatus = document.querySelector(".gallery-live-status");
const lightbox = document.querySelector(".lightbox");
const lightboxImage = lightbox?.querySelector("img");
const lightboxVideo = lightbox?.querySelector("video");
const lightboxCaption = lightbox?.querySelector("figcaption");
const lightboxClose = lightbox?.querySelector("button");

function readGallerySettings() {
  try { return JSON.parse(localStorage.getItem(galleryStoreKey)) || { hidden: [], captions: {} }; } catch { return { hidden: [], captions: {} }; }
}
function saveGallerySettings() { localStorage.setItem(galleryStoreKey, JSON.stringify(gallerySettings)); }
function openGalleryDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(galleryDbName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("items", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function getUploadedGalleryItems() {
  const db = await openGalleryDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction("items", "readonly").objectStore("items").getAll();
    request.onsuccess = () => { db.close(); resolve(request.result || []); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}
async function putUploadedGalleryItem(item) {
  const db = await openGalleryDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction("items", "readwrite").objectStore("items").put(item);
    request.onsuccess = () => { db.close(); resolve(); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}
async function deleteUploadedGalleryItem(id) {
  const db = await openGalleryDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction("items", "readwrite").objectStore("items").delete(id);
    request.onsuccess = () => { db.close(); resolve(); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}
function effectiveGalleryItem(item) {
  return { ...item, caption: gallerySettings.captions[item.id] || item.caption };
}
async function initialiseGallery() {
  try {
    const uploads = await getUploadedGalleryItems();
    galleryItems = [...galleryDefaults, ...uploads];
  } catch {
    galleryLiveStatus.textContent = "Gallery uploads are not available in this browser.";
  }
  renderGallery();
}
function renderGallery() {
  galleryObjectUrls.forEach((url) => URL.revokeObjectURL(url));
  galleryObjectUrls = [];
  const visibleItems = galleryItems.filter((item) => !gallerySettings.hidden.includes(item.id)).map(effectiveGalleryItem);
  ["photo", "video"].forEach((type) => {
    const grid = document.querySelector(`[data-gallery-grid="${type}"]`);
    const empty = document.querySelector(`[data-gallery-empty="${type}"]`);
    if (!grid || !empty) return;
    grid.replaceChildren();
    const items = visibleItems.filter((item) => item.type === type);
    empty.hidden = items.length > 0;
    items.forEach((item, index) => grid.appendChild(createGalleryCard(item, index)));
  });
  renderGalleryAdminList();
}
function gallerySource(item) {
  if (item.blob) {
    const url = URL.createObjectURL(item.blob);
    galleryObjectUrls.push(url);
    return url;
  }
  return item.src;
}
function createGalleryCard(item, index) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = `gallery-card ${item.size || (index % 5 === 0 ? "tall" : "")}`;
  card.setAttribute("aria-label", `Open gallery item: ${item.caption}`);
  const src = gallerySource(item);
  if (item.type === "video") {
    const video = document.createElement("video");
    video.src = src; video.preload = "metadata"; video.muted = true; video.playsInline = true;
    const marker = document.createElement("span"); marker.className = "video-marker"; marker.textContent = "▶"; card.append(video, marker);
  } else {
    const image = document.createElement("img"); image.src = src; image.alt = item.caption; image.loading = "lazy"; card.appendChild(image);
  }
  const caption = document.createElement("figcaption"); caption.textContent = item.caption; card.appendChild(caption);
  card.addEventListener("click", () => openLightbox(item));
  return card;
}
function openLightbox(item) {
  if (!lightbox || !lightboxImage || !lightboxVideo || !lightboxCaption) return;
  const source = item.blob ? URL.createObjectURL(item.blob) : item.src;
  if (item.blob) galleryObjectUrls.push(source);
  const title = effectiveGalleryItem(item).caption;
  lightbox.classList.toggle("show-video", item.type === "video");
  if (item.type === "video") { lightboxVideo.src = source; lightboxVideo.play().catch(() => {}); }
  else { lightboxImage.src = source; lightboxImage.alt = title; }
  lightboxCaption.textContent = title;
  lightbox.classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeLightbox() {
  lightbox?.classList.remove("open", "show-video");
  if (lightboxVideo) { lightboxVideo.pause(); lightboxVideo.removeAttribute("src"); lightboxVideo.load(); }
  document.body.style.overflow = "";
}
lightboxClose?.addEventListener("click", closeLightbox);
lightbox?.addEventListener("click", (event) => { if (event.target === lightbox) closeLightbox(); });
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") { closeLightbox(); if (galleryAdmin?.open) galleryAdmin.close(); }
  if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "g") {
    event.preventDefault();
    openProtectedGalleryAdmin();
  }
});

document.querySelectorAll("[data-gallery-tab]").forEach((tab) => tab.addEventListener("click", () => {
  const type = tab.dataset.galleryTab;
  document.querySelectorAll("[data-gallery-tab]").forEach((button) => { const active = button === tab; button.classList.toggle("active", active); button.setAttribute("aria-selected", String(active)); });
  document.querySelectorAll("[data-gallery-panel]").forEach((panel) => { const active = panel.dataset.galleryPanel === type; panel.hidden = !active; panel.classList.toggle("active", active); });
}));
document.querySelectorAll("[data-admin-close]").forEach((button) => button.addEventListener("click", () => galleryAdmin?.close()));
galleryAdmin?.addEventListener("click", (event) => { if (event.target === galleryAdmin) galleryAdmin.close(); });

function encodeGalleryAdminValue(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}
async function hashGalleryPasscode(passcode, salt) {
  const data = new TextEncoder().encode(passcode);
  const key = await crypto.subtle.importKey("raw", data, "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 150000, hash: "SHA-256" }, key, 256);
  return encodeGalleryAdminValue(bits);
}
async function openProtectedGalleryAdmin() {
  if (!galleryAdmin || !window.crypto?.subtle) return;
  const saved = JSON.parse(localStorage.getItem(galleryAdminKey) || "null");
  if (!saved) {
    const passcode = window.prompt("Create a private Gallery Admin passcode.");
    if (!passcode || passcode.length < 8) { window.alert("Use a passcode with at least 8 characters."); return; }
    const confirmPasscode = window.prompt("Confirm the Gallery Admin passcode.");
    if (passcode !== confirmPasscode) { window.alert("Passcodes did not match."); return; }
    const salt = crypto.getRandomValues(new Uint8Array(16));
    localStorage.setItem(galleryAdminKey, JSON.stringify({ salt: encodeGalleryAdminValue(salt), hash: await hashGalleryPasscode(passcode, salt) }));
    sessionStorage.setItem(galleryAdminKey, "verified");
    galleryAdmin.showModal();
    return;
  }
  if (sessionStorage.getItem(galleryAdminKey) === "verified") { galleryAdmin.showModal(); return; }
  const passcode = window.prompt("Enter the Gallery Admin passcode.");
  if (!passcode) return;
  const salt = Uint8Array.from(atob(saved.salt), (character) => character.charCodeAt(0));
  if ((await hashGalleryPasscode(passcode, salt)) !== saved.hash) { window.alert("Incorrect passcode."); return; }
  sessionStorage.setItem(galleryAdminKey, "verified");
  galleryAdmin.showModal();
}

galleryAdminForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(galleryAdminForm);
  const file = form.get("media");
  const type = form.get("mediaType");
  const caption = String(form.get("caption") || "").trim();
  if (!(file instanceof File) || !file.size || !caption) return;
  if ((type === "photo" && !file.type.startsWith("image/")) || (type === "video" && !file.type.startsWith("video/"))) { galleryAdminStatus.textContent = "Choose a file that matches the selected media type."; return; }
  const maximumSize = type === "video" ? 60 * 1024 * 1024 : 10 * 1024 * 1024;
  if (file.size > maximumSize) { galleryAdminStatus.textContent = `Choose a ${type} smaller than ${type === "video" ? "60 MB" : "10 MB"}.`; return; }
  const item = { id: `upload-${Date.now()}-${Math.random().toString(16).slice(2)}`, type, caption, blob: file, createdAt: Date.now() };
  try { await putUploadedGalleryItem(item); galleryItems.push(item); galleryAdminForm.reset(); galleryAdminStatus.textContent = "Added to the live gallery."; galleryLiveStatus.textContent = `${type === "photo" ? "Photo" : "Video"} added to the gallery.`; renderGallery(); }
  catch { galleryAdminStatus.textContent = "This browser could not save the upload. Free some storage and try again."; }
});
function renderGalleryAdminList() {
  if (!galleryAdminList) return;
  galleryAdminList.replaceChildren();
  const heading = document.createElement("h3"); heading.textContent = "Gallery items"; galleryAdminList.appendChild(heading);
  galleryItems.map(effectiveGalleryItem).forEach((item) => {
    const row = document.createElement("div"); row.className = "gallery-admin-row";
    const source = gallerySource(item); const preview = item.type === "video" ? document.createElement("video") : document.createElement("img");
    preview.className = "gallery-admin-thumb"; preview.src = source; if (item.type === "video") { preview.muted = true; preview.preload = "metadata"; } else preview.alt = "";
    const details = document.createElement("div"); const title = document.createElement("p"); title.textContent = item.caption; const type = document.createElement("small"); type.textContent = item.type; details.append(title, type);
    const edit = document.createElement("button"); edit.type = "button"; edit.className = "gallery-admin-edit"; edit.textContent = "Edit"; edit.addEventListener("click", () => editGalleryCaption(item));
    const remove = document.createElement("button"); remove.type = "button"; remove.className = "gallery-admin-delete"; remove.textContent = "Delete"; remove.addEventListener("click", () => deleteGalleryItem(item));
    row.append(preview, details, edit, remove); galleryAdminList.appendChild(row);
  });
}
function editGalleryCaption(item) {
  const caption = window.prompt("Update caption", effectiveGalleryItem(item).caption);
  if (!caption?.trim()) return;
  gallerySettings.captions[item.id] = caption.trim(); saveGallerySettings(); galleryLiveStatus.textContent = "Gallery caption updated."; renderGallery();
}
async function deleteGalleryItem(item) {
  if (!window.confirm(`Delete “${effectiveGalleryItem(item).caption}” from the gallery?`)) return;
  if (item.builtIn) gallerySettings.hidden = [...new Set([...gallerySettings.hidden, item.id])];
  else { await deleteUploadedGalleryItem(item.id); galleryItems = galleryItems.filter((entry) => entry.id !== item.id); }
  saveGallerySettings(); galleryLiveStatus.textContent = "Gallery item deleted."; renderGallery();
}
initialiseGallery();

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


