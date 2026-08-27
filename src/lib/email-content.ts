// Builds the workshop-specific confirmation email content (subject + body)
// dynamically from the participant's actual registration data.
//
// Nothing here is hardcoded per participant: the session name(s), timing(s),
// date, day and venue all come from the registration record and the
// Admin-configured Class / Session Schedule. Only the outfit / instruction
// copy is fixed per session type (Govind Bolo vs Tandav), exactly as the
// WhatsApp confirmation flow already works.

import { getSelectedSessions, type SelectedSession } from "@/lib/whatsapp-template";

export type SessionKind = "govind" | "tandav" | "generic";

export type ResolvedSession = SelectedSession & { kind: SessionKind };

const classify = (name: string): SessionKind => {
  const n = name.toLowerCase();
  if (n.includes("govind bolo") || n.includes("govind")) return "govind";
  if (n.includes("tandav")) return "tandav";
  return "generic";
};

/** Resolves the session(s) the participant actually registered for, with the
 *  matching workshop "kind" so the right instructions can be attached. */
export function resolveSessions(enr: any): ResolvedSession[] {
  const sessions = getSelectedSessions(enr);
  const prog = enr?.program;
  const w1 = String(prog?.workshop1_name ?? "").trim();
  const w2 = String(prog?.workshop2_name ?? "").trim();

  const fallbackNames: string[] = [];
  if (enr?.registration_type === "both") {
    if (w1) fallbackNames.push(w1);
    if (w2) fallbackNames.push(w2);
  } else {
    const sel = enr?.selected_workshop === "w2" ? w2 : w1;
    if (sel) fallbackNames.push(sel);
  }

  if (!sessions.length) {
    return fallbackNames.map((name) => ({ name, time: "", kind: classify(name) }));
  }

  return sessions.map((s, i) => {
    const kindFromSession = classify(s.name);
    const kind =
      kindFromSession !== "generic"
        ? kindFromSession
        : classify(fallbackNames[i] ?? fallbackNames[0] ?? String(prog?.name ?? ""));
    return { ...s, name: s.name || fallbackNames[i] || "", kind };
  });
}

const OUTFIT: Record<SessionKind, { title: string; lines: string[] }> = {
  generic: {
    title: "👗 What to Wear / Bring",
    lines: [
      "Wear a comfortable outfit you can move and dance freely in.",
      "Carry a water bottle and a small towel.",
      "👣 No need to wear shoes.",
    ],
  },
  govind: {
    title: "👗 Outfit for GOVIND BOLO",
    lines: [
      "Shri Krishna or Radha Rani outfit, OR White with Blue/Yellow elements — look as beautiful as you can! ✨",
      "If you don’t have anything specific, wear a comfortable outfit in this colour theme.",
      "👣 No need to wear shoes.",
    ],
  },
  tandav: {
    title: "🔱 Outfit Theme: Tandav (Shiva Theme)",
    lines: [
      "Wear an all-black outfit — dhoti and black top, or you can customize your outfit.",
    ],
  },
};

const DISPLAY: Record<SessionKind, string> = {
  govind: "GOVIND BOLO",
  tandav: "TANDAV",
  generic: "",
};

export function formatDay(dateStr: unknown): string {
  const raw = String(dateStr ?? "").trim();
  if (!raw) return "";
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { weekday: "long" });
}

export function formatWorkshopDate(dateStr: unknown): string {
  const raw = String(dateStr ?? "").trim();
  if (!raw) return "";
  const d = new Date(raw);
  return Number.isNaN(d.getTime())
    ? raw
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export type EmailContent = {
  subject: string;
  headline: string;
  bodyHtml: string;
  bodyText: string;
  sessionSummary: string;
  sessionTime: string;
  day: string;
  workshopDate: string;
};

/** Builds the dynamic subject + body for the approval confirmation email. */
export function buildConfirmationContent(enr: any): EmailContent {
  const prog = enr?.program;
  const workshopName = String(prog?.name ?? "").trim() || "Pune Bhakti Dance Experience";
  const venue = String(prog?.venue ?? "").trim();
  const workshopDate = formatWorkshopDate(prog?.event_date);
  const day = formatDay(prog?.event_date);

  const sessions = resolveSessions(enr).filter((s) => s.name || s.time);
  const kinds = Array.from(new Set(sessions.map((s) => s.kind).filter((k) => k !== "generic")));
  const isBoth = kinds.length > 1;
  const primary: SessionKind = isBoth ? "generic" : (kinds[0] ?? "generic");

  const label = (s: ResolvedSession) => DISPLAY[s.kind] || s.name || workshopName;
  const sessionSummary = sessions
    .map((s) => [s.time, label(s)].filter(Boolean).join(" – "))
    .join(" | ");
  const sessionTime = sessions.map((s) => s.time).filter(Boolean).join(" & ");

  // Subject
  let subject: string;
  if (isBoth) {
    subject = `🎉 Registration Confirmed – ${kinds.map((k) => DISPLAY[k]).join(" + ")} | ${workshopName}`;
  } else if (primary === "govind") {
    subject = `🎉 Registration Confirmed – GOVIND BOLO | ${workshopName}`;
  } else if (primary === "tandav") {
    subject = `❤️ Registration Confirmed – TANDAV | ${workshopName}`;
  } else {
    subject = `🎉 Registration Confirmed – ${workshopName}`;
  }

  const headline =
    primary === "tandav"
      ? "❤️ Your seat has been successfully confirmed for our TANDAV Workshop ❤️"
      : "🎉 Your Spot is Confirmed! 🎉";

  // ---- Body blocks (shared by HTML + plain text) -------------------------
  const htmlParts: string[] = [];
  const textParts: string[] = [];

  const push = (html: string, text: string) => {
    htmlParts.push(html);
    textParts.push(text);
  };

  push(
    `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;"><strong>${esc(workshopName)} by Tejas D Dhoke ⭐</strong></p>`,
    `${workshopName} by Tejas D Dhoke`,
  );

  const detailRows: string[] = [];
  const detailText: string[] = [];
  if (sessions.length) {
    detailRows.push(
      `<p style="margin:0 0 6px;font-size:15px;line-height:1.6;">You’re registered for:</p>` +
        sessions
          .map(
            (s) =>
              `<p style="margin:0 0 6px;font-size:16px;line-height:1.6;">🕕 <strong>${esc(
                [s.time, label(s)].filter(Boolean).join(" – "),
              )}</strong></p>`,
          )
          .join(""),
    );
    detailText.push(
      `You’re registered for:\n${sessions
        .map((s) => `🕕 ${[s.time, label(s)].filter(Boolean).join(" – ")}`)
        .join("\n")}`,
    );
  }
  if (workshopDate) {
    detailRows.push(
      `<p style="margin:0 0 6px;font-size:15px;line-height:1.6;">📅 <strong>${esc(workshopDate)}${
        day ? ` | ${esc(day)}` : ""
      }</strong></p>`,
    );
    detailText.push(`📅 ${workshopDate}${day ? ` | ${day}` : ""}`);
  }
  if (venue) {
    detailRows.push(`<p style="margin:0 0 6px;font-size:15px;line-height:1.6;">📍 ${esc(venue)}</p>`);
    detailText.push(`📍 ${venue}`);
  }
  push(
    `<div style="margin:0 0 18px;padding:14px 16px;background:#faf7f2;border-radius:10px;">${detailRows.join("")}</div>`,
    detailText.join("\n"),
  );

  push(
    `<p style="margin:0 0 18px;font-size:15px;line-height:1.6;">🕗 Please arrive <strong>10 minutes prior</strong> to your class.</p>`,
    "🕗 Please arrive 10 minutes prior to your class.",
  );

  // Outfit instructions — one block per registered session type.
  const outfitKinds = (isBoth ? kinds : [primary]).filter(
    (k): k is Exclude<SessionKind, "generic"> => k === "govind" || k === "tandav",
  );
  for (const k of outfitKinds) {
    const o = OUTFIT[k];
    push(
      `<div style="margin:0 0 16px;"><p style="margin:0 0 6px;font-size:16px;line-height:1.6;"><strong>${esc(
        o.title,
      )}</strong></p>${o.lines
        .map((l) => `<p style="margin:0 0 4px;font-size:15px;line-height:1.6;">${esc(l)}</p>`)
        .join("")}</div>`,
      `${o.title}\n${o.lines.join("\n")}`,
    );
  }

  push(
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;">⚠️ <strong>Note:</strong> Your seat is confirmed, so no refunds/cancellations are available.</p>`,
    "⚠️ Note: Your seat is confirmed, so no refunds/cancellations are available.",
  );

  const signOff =
    primary === "tandav"
      ? "See you with full energyyy ❤️✌🏻<br/>One Energy ❤️"
      : "See you on the dance floor! 💃";
  push(
    `<p style="margin:0;font-size:16px;line-height:1.6;">${signOff}</p>`,
    signOff.replace(/<br\/>/g, "\n"),
  );

  return {
    subject,
    headline,
    bodyHtml: htmlParts.join(""),
    bodyText: [headline, ...textParts].join("\n\n"),
    sessionSummary,
    sessionTime,
    day,
    workshopDate,
  };
}
