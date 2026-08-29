const TO_EMAIL = "natasha@chaconiaco.com";
const FROM_EMAIL = "Chaconia & Co. <natasha@chaconiaco.com>";

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const readBody = async (req) => {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
};

const sendJson = (res, status, body) => {
  res.setHeader("Content-Type", "application/json");
  res.status(status).end(JSON.stringify(body));
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { ok: false, error: "Method not allowed" });
  }

  if (!process.env.RESEND_API_KEY) {
    return sendJson(res, 503, { ok: false, error: "Email is not configured yet" });
  }

  let body;
  try {
    body = await readBody(req);
  } catch (error) {
    return sendJson(res, 400, { ok: false, error: "Invalid form data" });
  }

  if (String(body.website || "").trim()) {
    return sendJson(res, 200, { ok: true });
  }

  const formType = String(body.formType || "Contact form").trim().slice(0, 80);
  const name = String(body.name || "").trim().slice(0, 160);
  const email = String(body.email || "").trim().slice(0, 180);
  const subjectChoice = String(body.subject || "").trim().slice(0, 120);
  const message = String(body.message || "").trim().slice(0, 4000);

  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return sendJson(res, 400, { ok: false, error: "Please include your name and a valid email" });
  }

  const isGuestList = formType.toLowerCase().includes("guest");
  const subject = isGuestList
    ? "New Chaconia guest list request"
    : `New Chaconia inquiry${subjectChoice && subjectChoice !== "Select an option" ? `: ${subjectChoice}` : ""}`;

  const lines = [
    `Form: ${formType}`,
    `Name: ${name}`,
    `Email: ${email}`,
    subjectChoice && subjectChoice !== "Select an option" ? `Subject: ${subjectChoice}` : "",
    "",
    message || (isGuestList ? "Guest list signup from chaconiaco.com." : "No message provided.")
  ].filter(Boolean);

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.55;color:#161616">
      <h2 style="margin:0 0 16px">New Chaconia site submission</h2>
      <p><strong>Form:</strong> ${escapeHtml(formType)}</p>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      ${subjectChoice && subjectChoice !== "Select an option" ? `<p><strong>Subject:</strong> ${escapeHtml(subjectChoice)}</p>` : ""}
      <hr style="border:0;border-top:1px solid #ddd;margin:18px 0">
      <p>${escapeHtml(message || (isGuestList ? "Guest list signup from chaconiaco.com." : "No message provided.")).replace(/\n/g, "<br>")}</p>
    </div>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        reply_to: email,
        subject,
        text: lines.join("\n"),
        html
      })
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      return sendJson(res, 502, { ok: false, error: result.message || "Email could not be sent" });
    }

    return sendJson(res, 200, { ok: true });
  } catch (error) {
    return sendJson(res, 502, { ok: false, error: "Email could not be sent" });
  }
}
