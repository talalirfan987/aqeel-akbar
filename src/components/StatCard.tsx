export default function StatCard({
  label,
  value,
  accent = "gold",
}: {
  label: string;
  value: string | number;
  accent?: "gold" | "amber" | "emerald" | "red" | "slate" | "purple";
}) {
  const accents: Record<string, string> = {
    gold: "text-amber-600 border-t-amber-400",
    amber: "text-amber-600 border-t-amber-400",
    emerald: "text-emerald-600 border-t-emerald-400",
    red: "text-red-600 border-t-red-400",
    slate: "text-slate-700 border-t-slate-300",
    purple: "text-purple-600 border-t-purple-400",
  };
  return (
    <div className={`rounded-2xl border border-t-4 border-slate-200 bg-white p-5 shadow-sm ${accents[accent].split(" ")[1]}`}>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1.5 text-2xl font-bold ${accents[accent].split(" ")[0]}`}>{value}</p>
    </div>
  );
}
