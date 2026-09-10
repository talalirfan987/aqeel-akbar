"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Lang = "en" | "ur" | "roman";

const dict = {
  en: {
    heroTitle: "Lucky Lottery Ticket Management",
    heroSubtitle: "Submit, verify, and manage your ticket records securely and easily.",
    submitTicket: "Get Your Ticket",
    checkStatus: "Check Ticket Status",
    step1: "Enter your information",
    step2: "Submit your ticket",
    step3: "Receive your reference ID",
    step4: "Track verification status",
    home: "Home",
    about: "About",
    contact: "Contact",
    winners: "Winners",
    adminLogin: "Admin Login",
    disclaimer:
      "Every ticket, verification, and winner is tracked and published openly here — nothing happens behind closed doors. Trust is built through transparency, not promises.",
  },
  ur: {
    heroTitle: "لکی لاٹری ٹکٹ مینجمنٹ",
    heroSubtitle: "اپنے ٹکٹ ریکارڈ محفوظ اور آسان طریقے سے جمع، تصدیق اور منظم کریں۔",
    submitTicket: "ٹکٹ جمع کروائیں",
    checkStatus: "ٹکٹ کی صورتحال دیکھیں",
    step1: "اپنی معلومات درج کریں",
    step2: "اپنا ٹکٹ جمع کروائیں",
    step3: "اپنی ریفرنس آئی ڈی حاصل کریں",
    step4: "تصدیق کی صورتحال دیکھیں",
    home: "ہوم",
    about: "ہمارے بارے میں",
    contact: "رابطہ کریں",
    winners: "فاتحین",
    adminLogin: "ایڈمن لاگ ان",
    disclaimer: "ہر ٹکٹ، تصدیق اور فاتح یہاں کھلے عام ٹریک اور شائع کیا جاتا ہے — کچھ بھی پردے کے پیچھے نہیں ہوتا۔ اعتماد شفافیت سے بنتا ہے، وعدوں سے نہیں۔",
  },
  roman: {
    heroTitle: "Lucky Lottery Ticket Management",
    heroSubtitle: "Apne ticket records ko surakhsit aur asaan tareeqay se submit, verify aur manage karein.",
    submitTicket: "Ticket Submit Karein",
    checkStatus: "Ticket Status Check Karein",
    step1: "Apni maloomat darj karein",
    step2: "Apna ticket submit karein",
    step3: "Apni reference ID hasil karein",
    step4: "Verification status track karein",
    home: "Home",
    about: "Hamare Baray Mein",
    contact: "Rabta Karein",
    winners: "Winners",
    adminLogin: "Admin Login",
    disclaimer: "Har ticket, verification aur winner yahan khule taur par track aur publish hota hai — kuch bhi chupaya nahi jata. Bharosa transparency se banta hai, waadon se nahi.",
  },
} as const;

type DictKey = keyof typeof dict.en;

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: DictKey) => string;
}

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("blm_lang") as Lang | null;
      if (saved) setLangState(saved);
    } catch {}
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("blm_lang", l);
    } catch {}
  };

  const t = (key: DictKey) => dict[lang][key] || dict.en[key];

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
