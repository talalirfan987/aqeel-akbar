export default function TermsPage() {
  return (
    <main className="flex-1 bg-white">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">Terms &amp; Conditions</h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-slate-600">
          <ol className="list-decimal space-y-3 pl-5">
            <li>This platform is a digital record-management tool for lottery ticket submissions. It does not conduct or officiate draws.</li>
            <li>Submitting a ticket does not guarantee verification or any winning outcome. Every submission is subject to manual review by an authorized operator.</li>
            <li>A ticket number can only be verified once. Duplicate ticket numbers will be flagged for manual review.</li>
            <li>Rejected tickets remain in the system for audit purposes and are not deleted.</li>
            <li>Once a ticket is verified, its information can no longer be changed by the customer.</li>
            <li>Users must provide accurate information. Submitting false or fraudulent information may result in rejection or cancellation of the ticket record.</li>
            <li>Participation may be subject to applicable provincial regulations and age restrictions (18+ where applicable). It is the user&apos;s responsibility to comply with local laws.</li>
            <li>We reserve the right to update these terms at any time. Continued use of the platform constitutes acceptance of the updated terms.</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
