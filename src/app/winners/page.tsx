"use client";

import { useEffect, useState } from "react";

interface WinnerEntry {
  id: string;
  srNo: number;
  name: string;
  address: string;
  prize: string;
}

interface WinnerList {
  listTitle: string;
  listDate: string;
  entries: WinnerEntry[];
}

interface TicketWinner {
  referenceId: string;
  customerName: string;
  city?: string;
  ticketNumber: string;
  drawName: string;
  drawDate: string;
  prize: string | null;
}

export default function WinnersPage() {
  const [lists, setLists] = useState<WinnerList[] | null>(null);
  const [ticketWinners, setTicketWinners] = useState<TicketWinner[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/winners")
      .then((r) => r.json())
      .then((d) => {
        setLists(d.lists || []);
        setTicketWinners(d.ticketWinners || []);
      })
      .catch(() => setError("Failed to load winners."));
  }, []);

  return (
    <main className="flex-1 bg-slate-950">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Winners</h1>
          <p className="mt-2 text-sm text-amber-200/60">
            Every draw result announced by Lucky Lottery — out in the open, for everyone to see.
          </p>
        </div>

        {error && <p className="mt-6 text-center text-sm text-red-400">{error}</p>}

        {lists === null && !error && <p className="mt-8 text-center text-sm text-slate-400">Loading winners…</p>}

        {lists && lists.length === 0 && ticketWinners.length === 0 && (
          <div className="mt-8 rounded-xl border border-amber-400/20 bg-white/5 p-6 text-center text-sm text-slate-300">
            No winners have been announced yet.
          </div>
        )}

        <div className="mt-8 space-y-10">
          {lists?.map((list) => (
            <div key={`${list.listTitle}__${list.listDate}`} className="overflow-hidden rounded-2xl border border-amber-400/20 bg-white/5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-400/20 bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-amber-500/15 px-5 py-4">
                <h2 className="text-base font-bold tracking-wide text-amber-300">{list.listTitle}</h2>
                <span className="rounded-full border border-amber-400/30 px-3 py-1 text-xs font-medium text-amber-100">
                  {list.listDate}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-amber-200/50">
                      <th className="px-5 py-3 font-semibold">#</th>
                      <th className="px-5 py-3 font-semibold">Winner&apos;s Name</th>
                      <th className="px-5 py-3 font-semibold">Address</th>
                      <th className="px-5 py-3 font-semibold">Car&apos;s / Bikes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.entries.map((w) => (
                      <tr key={w.id} className="border-t border-white/5">
                        <td className="px-5 py-3 text-slate-400">{w.srNo}</td>
                        <td className="px-5 py-3 font-medium text-white">{w.name}</td>
                        <td className="px-5 py-3 text-slate-300">{w.address}</td>
                        <td className="px-5 py-3 font-semibold text-amber-400">{w.prize}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {ticketWinners.length > 0 && (
          <div className="mt-10">
            <h2 className="text-sm font-bold uppercase tracking-wide text-amber-200/70">Verified Ticket Winners</h2>
            <p className="mt-1 text-xs text-slate-400">Tickets submitted and verified on this platform that won a prize.</p>
            <div className="mt-4 space-y-3">
              {ticketWinners.map((w) => (
                <div key={w.referenceId} className="rounded-xl border border-amber-400/20 bg-white/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-white">{w.customerName}</p>
                    {w.prize && (
                      <span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-300">
                        {w.prize}
                      </span>
                    )}
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-400 sm:grid-cols-4">
                    {w.city && (
                      <div>
                        <dt className="text-slate-500">City</dt>
                        <dd className="text-slate-200">{w.city}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-slate-500">Ticket No.</dt>
                      <dd className="text-slate-200">{w.ticketNumber}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Draw</dt>
                      <dd className="text-slate-200">{w.drawName}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Draw Date</dt>
                      <dd className="text-slate-200">{w.drawDate}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
