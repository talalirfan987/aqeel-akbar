"use client";

import { useI18n, Lang } from "@/lib/i18n";

const options: { value: Lang; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "ur", label: "اردو" },
  { value: "roman", label: "Roman" },
];

export default function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <div className="flex items-center rounded-full border border-slate-200 bg-white p-0.5 text-xs font-medium shadow-sm">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => setLang(o.value)}
          className={`rounded-full px-2.5 py-1 transition-colors cursor-pointer ${
            lang === o.value ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
