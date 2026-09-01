import { getSession } from "@/lib/auth";

export default async function SettingsPage() {
  const session = await getSession();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Admin account and platform configuration.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-bold text-slate-900">Admin Account</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-slate-500">Name</dt><dd className="font-medium text-slate-900">{session?.name}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Username</dt><dd className="font-medium text-slate-900">{session?.username}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Role</dt><dd className="font-medium text-slate-900">{session?.role}</dd></div>
        </dl>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-2 text-sm font-bold text-slate-900">Notification Integrations</h2>
        <p className="text-sm text-slate-500">
          WhatsApp/SMS delivery is not yet connected. The notification log already records every event
          (submission, verification, rejection, cancellation) with the exact message text — connect a provider
          (e.g. Twilio, WhatsApp Cloud API) here to enable live delivery.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-2 text-sm font-bold text-slate-900">Security</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-500">
          <li>Admin sessions use signed, httpOnly cookies that expire after 8 hours.</li>
          <li>All ticket submissions and admin logins are rate-limited.</li>
          <li>File uploads are restricted to JPG, PNG, and PDF, up to 5MB.</li>
          <li>Every admin action is written to the audit log.</li>
        </ul>
      </div>
    </div>
  );
}
