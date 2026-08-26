import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getMyProfile, updateMyProfile } from "@/lib/admin-profile.functions";
import { isValidName, normalizeName, NAME_ERROR_MESSAGE, NAME_MAX_LENGTH } from "@/lib/name-validation";
import { isValidPhone, sanitizePhone, PHONE_ERROR_MESSAGE, PHONE_LENGTH } from "@/lib/phone-validation";

export type AdminProfile = { id: string; full_name: string; email: string; phone: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

export function MyProfileTab({
  profile,
  onSaved,
}: {
  profile: AdminProfile | null;
  onSaved: (p: AdminProfile) => void;
}) {
  const load = useServerFn(getMyProfile);
  const save = useServerFn(updateMyProfile);

  const [row, setRow] = useState<AdminProfile | null>(profile);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => { setRow(profile); }, [profile]);

  // Only fetch when the parent has not already supplied the profile.
  useEffect(() => {
    if (profile) return;
    let alive = true;
    load().then((p: any) => { if (alive) { setRow(p); onSaved(p); } }).catch(() => {});
    return () => { alive = false; };
  }, [profile]);

  const startEdit = () => {
    setForm({
      full_name: row?.full_name ?? "",
      email: row?.email ?? "",
      phone: sanitizePhone(row?.phone ?? ""),
    });
    setErrors({});
    setEditing(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = "Name is required.";
    else if (!isValidName(form.full_name)) e.full_name = NAME_ERROR_MESSAGE;
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!EMAIL_RE.test(form.email.trim())) e.email = "Please enter a valid email address.";
    if (!form.phone.trim()) e.phone = "Phone number is required.";
    else if (!isValidPhone(form.phone)) e.phone = PHONE_ERROR_MESSAGE;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) { toast.error("Please fix the highlighted fields."); return; }
    setSaving(true);
    try {
      const updated: any = await save({
        data: {
          fullName: normalizeName(form.full_name),
          email: form.email.trim(),
          phone: form.phone,
        },
      });
      setRow(updated);
      onSaved(updated);
      setEditing(false);
      toast.success("Profile updated.");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!row) return <p className="text-sm text-muted-foreground">Loading your profile…</p>;

  return (
    <div className="max-w-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold">My profile</h2>
          <p className="text-sm text-muted-foreground">
            Your admin account details. The phone number below is used as the WhatsApp sender/support contact in student confirmation messages.
          </p>
        </div>
        {!editing && (
          <button type="button" onClick={startEdit}
            className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground sm:text-sm">
            Edit profile
          </button>
        )}
      </div>

      {!editing ? (
        <dl className="mt-5 space-y-3 rounded-2xl border border-border bg-background p-4 sm:p-5">
          {[
            ["Name", row.full_name || "—"],
            ["Email", row.email || "—"],
            ["Phone number", row.phone || "—"],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-4">
              <dt className="w-40 shrink-0 text-xs uppercase tracking-wide text-muted-foreground">{k}</dt>
              <dd className="min-w-0 break-words text-sm font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <form onSubmit={submit} className="mt-5 space-y-4 rounded-2xl border border-border bg-background p-4 sm:p-5">
          <Field label="Name" error={errors.full_name}>
            <input
              className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm"
              value={form.full_name}
              maxLength={NAME_MAX_LENGTH}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Full name"
            />
          </Field>
          <Field label="Email" error={errors.email}>
            <input
              type="email"
              className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm"
              value={form.email}
              maxLength={255}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
            />
          </Field>
          <Field label="Phone number" error={errors.phone}>
            <input
              inputMode="numeric"
              className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm"
              value={form.phone}
              maxLength={PHONE_LENGTH}
              onChange={(e) => setForm({ ...form, phone: sanitizePhone(e.target.value) })}
              placeholder="10-digit mobile number"
            />
          </Field>
          <div className="flex flex-wrap gap-2 pt-1">
            <button type="submit" disabled={saving}
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button type="button" onClick={() => setEditing(false)} disabled={saving}
              className="rounded-full border border-border px-4 py-2 text-sm font-medium">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}
