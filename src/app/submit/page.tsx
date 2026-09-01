"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Draw } from "@/lib/types";

type FormState = {
  customerName: string;
  phone: string;
  cnic: string;
  drawId: string;
  ticketNumber: string;
  amount: string;
  drawDate: string;
  ticketImage: string;
  ticketImageName: string;
};

const empty: FormState = {
  customerName: "",
  phone: "",
  cnic: "",
  drawId: "",
  ticketNumber: "",
  amount: "",
  drawDate: "",
  ticketImage: "",
  ticketImageName: "",
};

const steps = ["Customer Information", "Ticket Information", "Ticket Verification", "Confirmation"];

export default function SubmitTicketPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draws, setDraws] = useState<Draw[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [fileError, setFileError] = useState("");

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
      if (form.customerName.trim().length < 3) e.customerName = "Please enter your full name (min 3 characters)";
      if (!/^03\d{9}$/.test(form.phone.trim())) e.phone = "Enter a valid mobile number (e.g. 03001234567)";
      if (form.cnic && !/^\d{5}-\d{7}-\d{1}$/.test(form.cnic.trim())) e.cnic = "CNIC should look like 12345-1234567-1";
    }
    if (current === 1) {
      if (!form.drawId) e.drawId = "Please select a lottery/draw";
      if (form.ticketNumber.trim().length < 2) e.ticketNumber = "Enter a valid ticket number";
      if (!form.amount || Number(form.amount) <= 0) e.amount = "Enter a valid ticket amount";
      if (!form.drawDate) e.drawDate = "Select the draw date";
    }
    if (current === 2) {
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
    if (!validateStep(2)) return;
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
        <p className="mt-1 text-sm text-slate-500">Fill in your details across four quick steps.</p>

        <Stepper step={step} />

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-900">{steps[0]}</h2>
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

          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-900">{steps[1]}</h2>
              <Field label="Lottery / Draw" error={errors.drawId} required>
                <select
                  className={inputCls(!!errors.drawId)}
                  value={form.drawId}
                  onChange={(e) => {
                    const d = draws.find((x) => x.id === e.target.value);
                    update({ drawId: e.target.value, amount: d ? String(d.ticketPrice) : form.amount, drawDate: d?.drawDate || "" });
                  }}
                >
                  <option value="">Select a draw</option>
                  {draws.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.drawDate}
                    </option>
                  ))}
                </select>
                {draws.length === 0 && <p className="mt-1 text-xs text-slate-400">Loading available draws…</p>}
              </Field>
              <Field label="Ticket Number" error={errors.ticketNumber} required>
                <input
                  className={inputCls(!!errors.ticketNumber)}
                  value={form.ticketNumber}
                  onChange={(e) => update({ ticketNumber: e.target.value })}
                  placeholder="BL-45001"
                />
              </Field>
              <Field label="Ticket Amount (PKR)" error={errors.amount} required>
                <input
                  type="number"
                  min={0}
                  className={inputCls(!!errors.amount)}
                  value={form.amount}
                  onChange={(e) => update({ amount: e.target.value })}
                />
              </Field>
              <Field label="Draw Date" error={errors.drawDate} required>
                <input
                  type="date"
                  className={inputCls(!!errors.drawDate)}
                  value={form.drawDate}
                  onChange={(e) => update({ drawDate: e.target.value })}
                />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-900">{steps[2]}</h2>
              <Field label="Upload Ticket / Receipt Photo" error={errors.ticketImage || fileError} required>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center hover:border-blue-400">
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

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-900">{steps[3]}</h2>
              <p className="text-sm text-slate-500">Please review your details before submitting.</p>
              <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                <Row label="Full Name" value={form.customerName} />
                <Row label="Mobile Number" value={form.phone} />
                {form.cnic && <Row label="CNIC / ID" value={form.cnic} />}
                <Row label="Lottery / Draw" value={selectedDraw?.name || "—"} />
                <Row label="Ticket Number" value={form.ticketNumber} />
                <Row label="Amount" value={`PKR ${form.amount}`} />
                <Row label="Draw Date" value={form.drawDate} />
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
            {step < 3 ? (
              <button
                onClick={next}
                className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 cursor-pointer"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
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
              i <= step ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"
            }`}
          >
            {i + 1}
          </div>
          {i < steps.length - 1 && <div className={`h-0.5 flex-1 ${i < step ? "bg-blue-600" : "bg-slate-200"}`} />}
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
    hasError ? "border-red-300 focus:ring-red-200" : "border-slate-200 focus:border-blue-400 focus:ring-blue-100"
  }`;
}
