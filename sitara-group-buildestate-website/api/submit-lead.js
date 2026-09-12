const EMAIL_TO = "sitaragroupbuildestate@gmail.com";
const DUPLICATE_WINDOW_MS = 5 * 60 * 1000;

function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

function clean(value, maxLength = 1000) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function cleanMessage(value) {
  return String(value || "").trim().replace(/\r\n/g, "\n").slice(0, 4000);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getIpAddress(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) return forwarded.split(",")[0].trim();
  return req.headers["x-real-ip"] || req.socket?.remoteAddress || "";
}

function validateLead(body) {
  const enquiryType = clean(body.enquiry_type || body.enquiryType, 120);
  const timeline = clean(body.timeline, 120);
  const rawMessage = cleanMessage(body.message);
  const details = [rawMessage];
  if (enquiryType) details.push(`Enquiry Type: ${enquiryType}`);
  if (timeline) details.push(`Visit Timeline: ${timeline}`);

  const lead = {
    name: clean(body.name || body.fullName, 120),
    phone: clean(body.phone, 24),
    email: clean(body.email, 254).toLowerCase(),
    project: clean(body.project || body.projectInterest, 160),
    budget: clean(body.budget, 120),
    message: details.filter(Boolean).join("\n\n"),
    source_page: clean(body.source_page || body.sourcePage, 500)
  };

  const errors = {};
  if (lead.name.length < 2) errors.name = "Name is required.";
  if (!/^[+()0-9\s-]{7,24}$/.test(lead.phone)) errors.phone = "Valid phone number is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) errors.email = "Valid email address is required.";
  if (lead.project.length < 2) errors.project = "Project is required.";
  if (lead.budget.length < 2) errors.budget = "Budget is required.";
  if (rawMessage.length < 10) errors.message = "Message must be at least 10 characters.";
  if (!lead.source_page) lead.source_page = "/";

  return { lead, errors };
}

async function supabaseFetch(path, options = {}) {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Supabase environment variables are missing.");

  const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = data?.message || data?.error || "Supabase request failed.";
    throw new Error(message);
  }
  return data;
}

async function isDuplicate(lead) {
  const since = new Date(Date.now() - DUPLICATE_WINDOW_MS).toISOString();
  const params = new URLSearchParams({
    select: "id",
    email: `eq.${lead.email}`,
    phone: `eq.${lead.phone}`,
    created_at: `gte.${since}`,
    limit: "1"
  });
  const rows = await supabaseFetch(`leads?${params.toString()}`, { method: "GET" });
  return Array.isArray(rows) && rows.length > 0;
}

function getEmailDetails(message) {
  const parts = String(message || "").split(/\n\n+/);
  const fields = { message: parts.shift() || "", enquiryType: "Not provided", timeline: "Not provided" };

  parts.forEach((part) => {
    const [label, ...value] = part.split(":");
    const text = value.join(":").trim();
    if (label === "Enquiry Type" && text) fields.enquiryType = text;
    if (label === "Visit Timeline" && text) fields.timeline = text;
  });

  return fields;
}

function buildEmail(lead, createdAt) {
  const details = getEmailDetails(lead.message);
  const rows = [
    ["Name", lead.name],
    ["Phone", lead.phone],
    ["Email", lead.email],
    ["Project", lead.project],
    ["Budget", lead.budget],
    ["Message", details.message],
    ["Enquiry Type", details.enquiryType],
    ["Visit Timeline", details.timeline],
    ["Date & Time", new Date(createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })],
    ["Website Page", lead.source_page]
  ];

  const bodyRows = rows.map(([label, value]) => {
    const htmlValue = escapeHtml(value).replace(/\n/g, "<br />");
    return `
      <tr>
        <td style="padding:12px 14px;border-bottom:1px solid #eee;color:#6b7280;font-weight:700;width:150px;">${label}</td>
        <td style="padding:12px 14px;border-bottom:1px solid #eee;color:#111827;">${htmlValue}</td>
      </tr>`;
  }).join("");

  return `<!doctype html>
    <html lang="en"><body style="margin:0;padding:0;background:#f4f1ea;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f4f1ea;font-family:Arial,Helvetica,sans-serif;">
        <tr><td align="center" style="padding:24px 12px;">
          <table role="presentation" width="680" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:680px;background:#ffffff;border:1px solid #ded5c5;">
            <tr><td style="padding:26px 28px;background:#111714;border-bottom:3px solid #c9a15c;">
              <img src="https://www.sitara-group.in/assets/sitara-logo.jpeg" width="72" height="72" alt="Sitara Group Buildestate" style="display:block;width:72px;height:72px;max-width:72px;border:0;outline:none;text-decoration:none;background:#ffffff;" />
              <p style="margin:20px 0 0;color:#ffffff;font-family:Georgia,Times New Roman,serif;font-size:26px;line-height:1.2;font-weight:normal;">New Lead - Sitara Group Buildestate</p>
              <p style="margin:8px 0 0;color:#e2c895;font-size:14px;line-height:1.5;">A new enquiry was submitted from the website.</p>
            </td></tr>
            <tr><td style="padding:0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;">${bodyRows}</table>
            </td></tr>
            <tr><td style="padding:20px 28px;background:#fbfaf7;color:#6b6b65;font-size:12px;line-height:1.5;border-top:1px solid #ece7dc;">This email was generated automatically from the Sitara Group Buildestate website.</td></tr>
          </table>
        </td></tr>
      </table>
    </body></html>`;
}

async function sendEmail(lead, createdAt) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const notificationEmail = clean(process.env.LEAD_NOTIFICATION_EMAIL, 254).toLowerCase();
  const to = EMAIL_TO;
  if (!apiKey || !from || !notificationEmail) {
    const missing = [!apiKey && "RESEND_API_KEY", !from && "RESEND_FROM_EMAIL", !notificationEmail && "LEAD_NOTIFICATION_EMAIL"].filter(Boolean);
    throw new Error(`Resend is not configured: missing ${missing.join(", ")}.`);
  }
  if (notificationEmail !== EMAIL_TO) {
    throw new Error(`LEAD_NOTIFICATION_EMAIL must be configured as ${EMAIL_TO}.`);
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to,
      subject: "🚀 New Lead - Sitara Group Buildestate",
      html: buildEmail(lead, createdAt)
    })
  });

  const responseText = await response.text();
  let data = {};
  try { data = responseText ? JSON.parse(responseText) : {}; } catch { data = { responseText }; }
  if (!response.ok) {
    const message = data?.message || data?.name || "Email notification failed.";
    const error = new Error(message);
    error.resendStatus = response.status;
    error.resendResponse = data;
    throw error;
  }
  return data;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { ok: false, message: "Method not allowed." });
  }

  try {
    const { lead, errors } = validateLead(req.body || {});
    if (Object.keys(errors).length > 0) {
      return json(res, 400, { ok: false, message: "Please check the highlighted fields.", errors });
    }

    if (await isDuplicate(lead)) {
      return json(res, 429, { ok: false, message: "This enquiry was already submitted. Our team will contact you shortly." });
    }

    const inserted = await supabaseFetch("leads", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify([{ ...lead, ip_address: clean(getIpAddress(req), 120) }])
    });

    const createdAt = inserted?.[0]?.created_at || new Date().toISOString();
    let notificationSent = true;
    try {
      const email = await sendEmail(lead, createdAt);
      console.info("Lead notification accepted by Resend", { leadId: inserted?.[0]?.id, resendEmailId: email?.id });
    } catch (emailError) {
      notificationSent = false;
      console.error("Lead saved but Resend notification failed", {
        leadId: inserted?.[0]?.id,
        resendStatus: emailError?.resendStatus || null,
        resendResponse: emailError?.resendResponse || null,
        message: emailError?.message || "Unknown Resend error"
      });
    }

    return json(res, 200, { ok: true, notificationSent, message: "Thank you! Our team will contact you shortly." });
  } catch (error) {
    console.error("Lead submission failed", error);
    return json(res, 500, { ok: false, message: "Unable to submit right now. Please try again shortly." });
  }
};
