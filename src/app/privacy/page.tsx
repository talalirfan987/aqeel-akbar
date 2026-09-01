export default function PrivacyPage() {
  return (
    <main className="flex-1 bg-white">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">Privacy Policy</h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-slate-600">
          <p>We collect only the information necessary to record and verify your ticket submission:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Full name and mobile/WhatsApp number</li>
            <li>CNIC/ID, only where legally required</li>
            <li>Ticket number, draw selection, and amount</li>
            <li>A photo of your physical ticket/receipt</li>
          </ul>
          <p>
            Your information is used solely for verification and record-keeping purposes by authorized operators.
            Public status lookups display only limited, non-sensitive information and never expose your full CNIC,
            phone number, or ticket image.
          </p>
          <p>
            We do not sell or share your personal information with third parties. All admin actions on your record
            are logged for audit and accountability purposes.
          </p>
          <p>You may contact us to request correction or removal of your submitted information where applicable.</p>
        </div>
      </div>
    </main>
  );
}
