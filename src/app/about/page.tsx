export default function AboutPage() {
  return (
    <main className="flex-1 bg-white">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">About This Platform</h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-slate-600">
          <p>
            The Balochistan Lottery Management System is a digital record-management platform built to replace
            manual, paper-based ticket record keeping. It allows customers to submit their ticket information and
            receipt photos digitally, and allows an authorized operator to verify, track, and manage those records
            from a secure dashboard.
          </p>
          <p>
            This platform does not itself conduct or officiate any draw, and it does not guarantee any winning
            outcome. It is strictly a record-keeping and verification tool intended to bring transparency,
            accountability, and an auditable history to the ticket submission process.
          </p>
          <p>
            All submissions go through a manual verification step performed by an authorized operator before being
            marked as Verified. Every status change is logged for audit purposes.
          </p>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
            Participation may be subject to applicable provincial regulations and age restrictions (18+ where
            applicable). Please ensure you comply with local laws before submitting a ticket.
          </div>
        </div>
      </div>
    </main>
  );
}
