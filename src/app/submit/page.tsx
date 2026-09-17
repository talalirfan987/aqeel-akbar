"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import type { Draw, PaymentMethod } from "@/lib/types";
import {
  CITY_ERROR,
  CITY_REGEX,
  CNIC_ERROR,
  CNIC_REGEX,
  NAME_ERROR,
  NAME_REGEX,
  PAKISTAN_DIAL_CODE,
  PHONE_ERROR,
  PHONE_REGEX,
} from "@/lib/validation";

// Each holder row is one ticket, so there's no separate quantity to type in per row.
type HolderRow = { name: string; phone: string };

type FormState = {
  drawId: string;
  quantity: string;
  amount: string;
  drawDate: string;
  paymentMethod: PaymentMethod | "";
  paymentConfirmed: boolean;
  customerName: string;
  phone: string;
  city: string;
  cnic: string;
  ticketImage: string;
  ticketImageName: string;
  splitTickets: boolean;
  holders: HolderRow[];
};

function todayDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const empty: FormState = {
  drawId: "",
  quantity: "1",
  amount: "",
  drawDate: todayDate(),
  paymentMethod: "",
  paymentConfirmed: false,
  customerName: "",
  phone: "",
  city: "",
  cnic: "",
  ticketImage: "",
  ticketImageName: "",
  splitTickets: false,
  holders: [],
};

const steps = ["Ticket & Draw", "Payment", "Your Information", "Ticket Verification", "Confirmation"];

const paymentMethods: { id: PaymentMethod; label: string }[] = [
  { id: "jazzcash", label: "JazzCash" },
  { id: "easypaisa", label: "EasyPaisa" },
];

export default function SubmitTicketPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draws, setDraws] = useState<Draw[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [fileError, setFileError] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentCheckMsg, setPaymentCheckMsg] = useState("");

  useEffect(() => {
    fetch("/api/draws")
      .then((r) => r.json())
      .then((d) => {
        const now = Date.now();
        const allActive = (d.draws || []).filter((x: Draw) => x.active);
        const openDraws = allActive.filter((x: Draw) => !x.timerEndMs || x.timerEndMs > now);
        setDraws(openDraws.length > 0 ? openDraws : allActive);
      })
      .catch(() => setDraws([]));
  }, []);

  const update = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  function toggleSplit(on: boolean) {
    setForm((f) => ({
      ...f,
      splitTickets: on,
      holders: on && f.holders.length === 0 ? [{ name: f.customerName, phone: f.phone }] : f.holders,
    }));
  }
  function addHolder() {
    setForm((f) => ({ ...f, holders: [...f.holders, { name: "", phone: "" }] }));
  }
  function removeHolder(index: number) {
    setForm((f) => ({ ...f, holders: f.holders.filter((_, i) => i !== index) }));
  }
  function updateHolder(index: number, patch: Partial<HolderRow>) {
    setForm((f) => ({
      ...f,
      holders: f.holders.map((h, i) => (i === index ? { ...h, ...patch } : h)),
    }));
  }

  function validateStep(current: number): boolean {
    const e: Record<string, string> = {};
    if (current === 0) {
      if (!form.drawId) e.drawId = "Please select a lottery/draw";
      if (!form.quantity || Number(form.quantity) <= 0) e.quantity = "Enter a valid number of tickets";
      if (!form.amount || Number(form.amount) <= 0) e.amount = "Enter a valid ticket amount";
      if (!form.drawDate) e.drawDate = "Select the draw date";
    }
    if (current === 1) {
      if (!form.paymentMethod) e.paymentMethod = "Please select a payment method";
      if (!form.paymentConfirmed) e.paymentConfirmed = "Please confirm the payment before continuing";
    }
    if (current === 2) {
      if (form.splitTickets) {
        if (form.holders.length === 0) e.holders = "Add at least one person to assign tickets to";
        form.holders.forEach((h, i) => {
          const hName = h.name.trim();
          if (hName.length < 3) e[`holder_${i}_name`] = "Enter a full name (min 3 characters)";
          else if (!NAME_REGEX.test(hName)) e[`holder_${i}_name`] = NAME_ERROR;
          if (!PHONE_REGEX.test(h.phone.trim())) e[`holder_${i}_phone`] = PHONE_ERROR;
        });
        if (!e.holders && form.holders.length !== Number(form.quantity)) {
          e.holders = `You've added ${form.holders.length} ${form.holders.length === 1 ? "person" : "people"}, but selected ${form.quantity} ticket${Number(form.quantity) === 1 ? "" : "s"}. Add or remove rows so each ticket has one name.`;
        }
      } else {
        const name = form.customerName.trim();
        if (name.length < 3) e.customerName = "Please enter your full name (min 3 characters)";
        else if (!NAME_REGEX.test(name)) e.customerName = NAME_ERROR;
        if (!PHONE_REGEX.test(form.phone.trim())) e.phone = PHONE_ERROR;
      }
      const city = form.city.trim();
      if (city.length < 2) e.city = "Please enter your city";
      else if (!CITY_REGEX.test(city)) e.city = CITY_ERROR;
      if (form.cnic && !CNIC_REGEX.test(form.cnic.trim())) e.cnic = CNIC_ERROR;
    }
    if (current === 3) {
      if (!form.ticketImage) e.ticketImage = "Please upload a photo of your ticket/receipt";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, steps.length - 1));
  }
  function back() {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  }

  // Mock payment-status check. Once JazzCash/EasyPaisa merchant credentials are
  // available this should call their real payment-status API instead.
  async function checkPaymentReceived() {
    if (!form.paymentMethod) {
      setErrors((er) => ({ ...er, paymentMethod: "Please select a payment method" }));
      return;
    }
    setCheckingPayment(true);
    setPaymentCheckMsg("");
    await new Promise((r) => setTimeout(r, 1200));
    update({ paymentConfirmed: true });
    setErrors((er) => ({ ...er, paymentConfirmed: "" }));
    setPaymentCheckMsg(`Payment received via ${form.paymentMethod === "jazzcash" ? "JazzCash" : "EasyPaisa"}.`);
    setCheckingPayment(false);
  }

  async function onFile(file: File | null) {
    setFileError("");
    if (!file) return;
    const okTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!okTypes.includes(file.type)) {
      setFileError("Only JPG, PNG or PDF files are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFileError("File must be smaller than 5MB.");
      return;
    }
    setUploadingFile(true);
    try {
      let imageUrl = "";
      try {
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
        });
        imageUrl = blob.url;
      } catch {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", {
          method: "PUT",
          body: formData,
        });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        imageUrl = data.url;
      }
      update({ ticketImage: imageUrl, ticketImageName: file.name });
    } catch {
      setFileError("Upload failed. Please try again.");
    } finally {
      setUploadingFile(false);
    }
  }

  async function handleSubmit() {
    if (!validateStep(3)) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      // When tickets are split across multiple people, the first holder becomes the
      // submission's primary contact; the full breakdown goes in `holders`. Otherwise
      // only the single customerName/phone fields are sent (and `holders` is omitted,
      // so any leftover rows from a toggled-off split don't get sent by mistake).
      const payload = {
        ...form,
        amount: Number(form.amount),
        customerName: form.splitTickets ? form.holders[0]?.name || form.customerName : form.customerName,
        phone: form.splitTickets ? form.holders[0]?.phone || form.phone : form.phone,
        holders: form.splitTickets
          ? form.holders.map((h) => ({ name: h.name, phone: h.phone, quantity: 1 }))
          : undefined,
      };
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      router.push(`/submit/success?ref=${encodeURIComponent(data.referenceId)}`);
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  const selectedDraw = draws.find((d) => d.id === form.drawId);

  return (
    <main className="flex-1 bg-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">Submit Your Ticket</h1>
        <p className="mt-1 text-sm text-slate-500">Fill in your details across five quick steps.</p>

        <Stepper step={step} />

        {draws.length === 0 && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <h2 className="text-lg font-bold text-red-900">Submissions Currently Closed</h2>
            <p className="mt-1 text-sm text-red-700">
              The deadline for current draw submissions has ended or no active draw is open right now. Please wait for the next draw announcement.
            </p>
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-900">{steps[0]}</h2>
              <Field label="Lottery / Draw" error={errors.drawId} required>
                <select
                  disabled={draws.length === 0}
                  className={inputCls(!!errors.drawId)}
                  value={form.drawId}
                  onChange={(e) => {
                    const d = draws.find((x) => x.id === e.target.value);
                    const qty = Number(form.quantity) || 1;
                    update({
                      drawId: e.target.value,
                      amount: d ? String(d.ticketPrice * qty) : form.amount,
                    });
                  }}
                >
                  <option value="">Select a draw</option>
                  {draws.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.drawDate}
                    </option>
                  ))}
                </select>
                {draws.length === 0 && <p className="mt-1 text-xs text-red-500 font-medium">No active draw open for submission.</p>}
              </Field>
              <Field label="Number of Tickets" error={errors.quantity} required>
                <input
                  type="number"
                  min={1}
                  className={inputCls(!!errors.quantity)}
                  value={form.quantity}
                  onChange={(e) => {
                    const qty = Math.max(1, Number(e.target.value) || 1);
                    const d = draws.find((x) => x.id === form.drawId);
                    update({
                      quantity: String(qty),
                      amount: d ? String(d.ticketPrice * qty) : form.amount,
                      // A single ticket can't be split across people — drop any split setup.
                      ...(qty <= 1 ? { splitTickets: false, holders: [] } : {}),
                    });
                  }}
                />
              </Field>
              <Field label="Ticket Amount (PKR)" error={errors.amount} hint={form.drawId ? "Set automatically: number of tickets × ticket price" : undefined} required>
                <input
                  type="text"
                  readOnly
                  className={`${inputCls(!!errors.amount)} bg-slate-50 text-slate-700 cursor-not-allowed`}
                  value={form.amount ? `PKR ${form.amount}` : ""}
                  placeholder="Select a draw first"
                />
              </Field>
              <Field label="Draw Date" error={errors.drawDate} hint="Set automatically to today's date" required>
                <input
                  type="date"
                  readOnly
                  className={`${inputCls(!!errors.drawDate)} bg-slate-50 text-slate-700 cursor-not-allowed`}
                  value={form.drawDate}
                />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-900">{steps[1]}</h2>
              <p className="text-sm text-slate-500">
                Pay <span className="font-semibold text-slate-900">PKR {form.amount || 0}</span> using your preferred method, then confirm below.
              </p>
              <Field label="Payment Method" error={errors.paymentMethod} required>
                <div className="grid grid-cols-2 gap-3">
                  {paymentMethods.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        update({ paymentMethod: m.id, paymentConfirmed: false });
                        setPaymentCheckMsg("");
                      }}
                      className={`flex items-center justify-center rounded-xl border-2 px-4 py-4 text-sm font-medium transition cursor-pointer ${
                        form.paymentMethod === m.id
                          ? "border-amber-500 bg-amber-50 text-amber-700"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </Field>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-600">
                  Once you have sent the payment, tap the button below. We&apos;ll check whether it has been received.
                </p>
                <button
                  type="button"
                  onClick={checkPaymentReceived}
                  disabled={checkingPayment || form.paymentConfirmed}
                  className="mt-3 w-full rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  {checkingPayment
                    ? "Checking payment…"
                    : form.paymentConfirmed
                    ? "Payment Confirmed"
                    : "I've Paid — Confirm Payment"}
                </button>
                {errors.paymentConfirmed && (
                  <p className="mt-2 text-xs font-medium text-red-600">{errors.paymentConfirmed}</p>
                )}
                {paymentCheckMsg && (
                  <p className="mt-2 text-xs font-medium text-emerald-600">{paymentCheckMsg}</p>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-900">{steps[2]}</h2>

              {Number(form.quantity) > 1 && (
                <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 cursor-pointer accent-amber-600"
                    checked={form.splitTickets}
                    onChange={(e) => toggleSplit(e.target.checked)}
                  />
                  <span>
                    <span className="font-medium">Split these {form.quantity} tickets among multiple people</span>
                    <span className="block text-xs text-slate-500">
                      e.g. 4 tickets for one person, 2 for another, 4 for a third — instead of one name for all {form.quantity}.
                    </span>
                  </span>
                </label>
              )}

              {!form.splitTickets ? (
                <>
                  <Field label="Full Name" error={errors.customerName} required>
                    <input
                      className={inputCls(!!errors.customerName)}
                      value={form.customerName}
                      onChange={(e) => update({ customerName: e.target.value })}
                      placeholder="e.g. Ahmed Raza"
                    />
                  </Field>
                  <Field label="Mobile / WhatsApp Number" error={errors.phone} required>
                    <div className="flex items-stretch">
                      <span className="flex items-center gap-1 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600">
                        {PAKISTAN_DIAL_CODE}
                      </span>
                      <input
                        className={`${inputCls(!!errors.phone)} rounded-l-none`}
                        value={form.phone}
                        onChange={(e) => update({ phone: e.target.value })}
                        placeholder="03001234567"
                        inputMode="numeric"
                      />
                    </div>
                  </Field>
                </>
              ) : (
                <Field
                  label="Ticket Holders"
                  error={errors.holders}
                  hint={!errors.holders ? `Assigned so far: ${form.holders.length} / ${form.quantity} tickets (one ticket per person)` : undefined}
                  required
                >
                  <div className="space-y-3">
                    {form.holders.map((h, i) => (
                      <div key={i} className="rounded-xl border border-slate-200 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-slate-500">Person {i + 1}</p>
                          {form.holders.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeHolder(i)}
                              className="text-xs font-medium text-red-500 hover:underline cursor-pointer"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          <div>
                            <input
                              className={inputCls(!!errors[`holder_${i}_name`])}
                              value={h.name}
                              onChange={(e) => updateHolder(i, { name: e.target.value })}
                              placeholder="Full name"
                            />
                            {errors[`holder_${i}_name`] && (
                              <p className="mt-1 text-xs font-medium text-red-600">{errors[`holder_${i}_name`]}</p>
                            )}
                          </div>
                          <div>
                            <div className="flex items-stretch">
                              <span className="flex items-center gap-1 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 px-2 text-xs font-medium text-slate-600">
                                {PAKISTAN_DIAL_CODE}
                              </span>
                              <input
                                className={`${inputCls(!!errors[`holder_${i}_phone`])} rounded-l-none`}
                                value={h.phone}
                                onChange={(e) => updateHolder(i, { phone: e.target.value })}
                                placeholder="03001234567"
                                inputMode="numeric"
                              />
                            </div>
                            {errors[`holder_${i}_phone`] && (
                              <p className="mt-1 text-xs font-medium text-red-600">{errors[`holder_${i}_phone`]}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addHolder}
                      className="w-full rounded-xl border-2 border-dashed border-slate-300 py-2 text-sm font-medium text-slate-600 hover:border-amber-400 hover:text-amber-700 cursor-pointer"
                    >
                      + Add another person
                    </button>
                  </div>
                </Field>
              )}

              <Field label="City" error={errors.city} required>
                <input
                  className={inputCls(!!errors.city)}
                  value={form.city}
                  onChange={(e) => update({ city: e.target.value })}
                  placeholder="e.g. Lahore"
                />
              </Field>
              <Field label="CNIC / ID (optional)" error={errors.cnic} hint="Only if required by regulation">
                <input
                  className={inputCls(!!errors.cnic)}
                  value={form.cnic}
                  onChange={(e) => update({ cnic: e.target.value })}
                  placeholder="12345-1234567-1"
                />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-900">{steps[3]}</h2>
              <Field label="Upload Ticket / Receipt Photo" error={errors.ticketImage || fileError} required>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center hover:border-amber-400">
                  <span className="text-sm font-medium text-slate-700">Click to upload or drag &amp; drop</span>
                  <span className="mt-1 text-xs text-slate-400">JPG, PNG or PDF · Max 5MB</span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                    className="hidden"
                    onChange={(e) => onFile(e.target.files?.[0] || null)}
                  />
                </label>
              </Field>
              {form.ticketImage && (
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="mb-2 text-xs font-medium text-slate-500">Preview: {form.ticketImageName}</p>
                  {form.ticketImage.startsWith("data:image") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.ticketImage} alt="Ticket preview" className="max-h-64 rounded-lg border border-slate-100 object-contain" />
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                      PDF file selected
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-900">{steps[4]}</h2>
              <p className="text-sm text-slate-500">Please review your details before submitting.</p>
              <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                <Row label="Lottery / Draw" value={selectedDraw?.name || "—"} />
                <Row label="Number of Tickets" value={form.quantity} />
                <Row label="Amount" value={`PKR ${form.amount}`} />
                <Row label="Draw Date" value={form.drawDate} />
                <Row
                  label="Payment"
                  value={`${form.paymentMethod === "jazzcash" ? "JazzCash" : "EasyPaisa"} — ${
                    form.paymentConfirmed ? "Confirmed" : "Not confirmed"
                  }`}
                />
                {!form.splitTickets && (
                  <>
                    <Row label="Full Name" value={form.customerName} />
                    <Row label="Mobile Number" value={form.phone} />
                  </>
                )}
                <Row label="City" value={form.city} />
                {form.cnic && <Row label="CNIC / ID" value={form.cnic} />}
                <Row label="Ticket Image" value={form.ticketImageName || "Not attached"} />
              </dl>
              {form.splitTickets && (
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Ticket Holders</p>
                  <ul className="space-y-1 text-sm text-slate-700">
                    {form.holders.map((h, i) => (
                      <li key={i} className="flex justify-between gap-4">
                        <span>Ticket {i + 1}</span>
                        <span className="font-medium">
                          {h.name || "—"} ({PAKISTAN_DIAL_CODE} {h.phone || "—"})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {submitError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</div>
              )}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              onClick={back}
              disabled={step === 0 || submitting}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 disabled:opacity-40 cursor-pointer"
            >
              Back
            </button>
            {step < steps.length - 1 ? (
              <button
                onClick={next}
                disabled={draws.length === 0}
                className="rounded-xl bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting || draws.length === 0}
                className="rounded-xl bg-amber-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? "Submitting…" : "Submit Ticket"}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <ol className="mt-6 flex items-center gap-2">
      {steps.map((s, i) => (
        <li key={s} className="flex flex-1 items-center gap-2">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
              i <= step ? "bg-amber-600 text-white" : "bg-slate-200 text-slate-500"
            }`}
          >
            {i + 1}
          </div>
          {i < steps.length - 1 && <div className={`h-0.5 flex-1 ${i < step ? "bg-amber-600" : "bg-slate-200"}`} />}
        </li>
      ))}
    </ol>
  );
}

function Field({
  label,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 px-4 py-3 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900 text-right">{value}</dd>
    </div>
  );
}

function inputCls(hasError: boolean) {
  return `w-full rounded-xl border px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:ring-2 ${
    hasError ? "border-red-300 focus:ring-red-200" : "border-slate-200 focus:border-amber-400 focus:ring-amber-100"
  }`;
}
