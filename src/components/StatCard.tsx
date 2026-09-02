export default function StatCard({
  label,
  value,
  icon,
  accent = "gold",
}: {
  label: string;
  value: string | number;
  icon: string;
  accent?: "gold" | "amber" | "emerald" | "red" | "slate" | "purple";
}) {
  const accents: Record<string, string> = {
    gold: "bg-slate-900 text-amber-400",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
    slate: "bg-slate-100 text-slate-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${accents[accent]}`}>{icon}</div>
      </div>
    </div>
  );
}
