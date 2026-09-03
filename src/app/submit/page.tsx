"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Draw, PaymentMethod } from "@/lib/types";

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
};

const steps = ["Ticket & Draw", "Payment", "Your Information", "Ticket Verification", "Confirmation"];

const paymentMethods: { id: PaymentMethod; label: string; icon: string }[] = [
  { id: "jazzcash", label: "JazzCash", icon: "📱" },
  { id: "easypaisa", label: "EasyPaisa", icon: "💳" },
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
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentCheckMsg, setPaymentCheckMsg] = useState("");

  useEffect(() => {
    fetch("/api/draws")
      .then((r) => r.json())
      .then((d) => setDraws((d.draws || []).filter((x: Draw) => x.active)))
      .catch(() => setDraws([]));
  }, []);

  const update = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

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
      if (form.customerName.trim().length < 3) e.customerName = "Please enter your full name (min 3 characters)";
      if (!/^03\d{9}$/.test(form.phone.trim())) e.phone = "Enter a valid mobile number (e.g. 03001234567)";
      if (form.city.trim().length < 2) e.city = "Please enter your city";
      if (form.cnic && !/^\d{5}-\d{7}-\d{1}$/.test(form.cnic.trim())) e.cnic = "CNIC should look like 12345-1234567-1";
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

  function onFile(file: File | null) {
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
    const reader = new FileReader();
    reader.onload = () => update({ ticketImage: reader.result as string, ticketImageName: file.name });
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (!validateStep(3)) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
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
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-2xl text-red-600 mb-3">
              🔒
            </div>
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
                    update({ quantity: String(qty), amount: d ? String(d.ticketPrice * qty) : form.amount });
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
                      className={`flex flex-col items-center gap-1 rounded-xl border-2 px-4 py-4 text-sm font-medium transition cursor-pointer ${
                        form.paymentMethod === m.id
                          ? "border-amber-500 bg-amber-50 text-amber-700"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-2xl">{m.icon}</span>
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
                    ? "✓ Payment Confirmed"
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
              <Field label="Full Name" error={errors.customerName} required>
                <input
                  className={inputCls(!!errors.customerName)}
                  value={form.customerName}
                  onChange={(e) => update({ customerName: e.target.value })}
                  placeholder="e.g. Ahmed Raza"
                />
              </Field>
              <Field label="Mobile / WhatsApp Number" error={errors.phone} required>
                <input
                  className={inputCls(!!errors.phone)}
                  value={form.phone}
                  onChange={(e) => update({ phone: e.target.value })}
                  placeholder="03001234567"
                  inputMode="numeric"
                />
              </Field>
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
                  <span className="text-2xl">📎</span>
                  <span className="mt-2 text-sm font-medium text-slate-700">Click to upload or drag &amp; drop</span>
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
                      📄 PDF file selected
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
                <Row label="Full Name" value={form.customerName} />
                <Row label="Mobile Number" value={form.phone} />
                <Row label="City" value={form.city} />
                {form.cnic && <Row label="CNIC / ID" value={form.cnic} />}
                <Row label="Ticket Image" value={form.ticketImageName || "Not attached"} />
              </dl>
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
