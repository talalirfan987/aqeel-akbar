export default function AboutPage() {
  return (
    <main className="flex-1 bg-white">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">About Akeel Akbar Lottery</h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-slate-600">
          <p>
            My name is Akeel Akbar, and I&apos;m originally from Turbat, Balochistan. I have been running my lottery
            business for years, and over that time I&apos;ve built a large, loyal customer base of people who trust
            me with their tickets draw after draw.
          </p>
          <p>
            If you&apos;re a new customer, I understand that trust has to be earned before you hand over your money.
            That&apos;s exactly why I run everything openly and transparently — every draw, every result, and every
            winner is out in the open for everyone to see, not hidden away. Nothing happens behind closed doors.
          </p>
          <p>
            This platform is part of that transparency. Every ticket you submit gets a reference ID you can track
            yourself, every verification is logged, and every winner is published on the{" "}
            <a href="/winners" className="font-medium text-amber-700 underline">
              Winners
            </a>{" "}
            page for anyone to check. You don&apos;t have to just take my word for it — you can watch how I operate
            in this industry, see the results for yourself, and then decide to trust me. That&apos;s how I&apos;ve
            built my business, and that&apos;s how I intend to keep it.
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
