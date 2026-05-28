"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";

// ── MODULE 2: Complete i18n dictionary ──────────────────────────
export const TRANSLATIONS = {
  EN: {
    // Navigation
    dashboard:   "Dashboard",
    scan:        "Scan",
    vault:       "Vault",
    pricing:     "Pricing",
    audit:       "Audit",
    invite:      "Invite Supplier",
    signOut:     "Sign out",
    // Vault
    stoneVault:  "Stone Vault",
    searchPlaceholder: "Search variety, scan ID...",
    allGrades:   "All Grades",
    noBlocks:    "No blocks yet",
    startScan:   "Start scanning",
    pdfLang:     "PDF + Language",
    share:       "Share",
    view:        "View",
    pdfSaved:    "PDF Saved",
    selectLang:  "Select Language",
    defaultPDF:  "Default",
    translated:  "Translated PDF",
    cancel:      "Cancel",
    deletePDF:   "Delete PDF",
    confirmDel:  "Delete this saved PDF?",
    generating:  "Generating...",
    // Scan
    scanBlock:   "Scan Block",
    placeStick:  "Place a 1m reference stick beside the block before photographing",
    analyse:     "Analyse with Gemini Vision",
    analysing:   "Analysing...",
    downloadPDF: "Download PDF",
    shareWA:     "Share WhatsApp",
    newScan:     "New Scan",
    // Audit
    bookAudit:   "Book Physical Audit",
    selectService:"Select Service",
    schedule:    "Schedule",
    yourDetails: "Your Details",
    confirm:     "Confirm via WhatsApp",
    // Common
    back:        "Back",
    continue:    "Continue",
    retry:       "Retry",
    loading:     "Loading...",
    save:        "Save",
    error:       "Error",
    success:     "Success",
    required:    "Required",
  },
  TA: {
    dashboard:   "Kadamaigal Palakai",
    scan:        "Scan",
    vault:       "Kalanjiyam",
    pricing:     "Vilai",
    audit:       "Tharaniyal",
    invite:      "Vathariyalai Azhaikkavum",
    signOut:     "Veliyeru",
    stoneVault:  "Kal Kalanjiyam",
    searchPlaceholder: "Vagaipadu, scan ID thedi...",
    allGrades:   "Ellaa Tharangal",
    noBlocks:    "Kal illai",
    startScan:   "Scan seyyungal",
    pdfLang:     "PDF + Mozhi",
    share:       "Pangidu",
    view:        "Paarkka",
    pdfSaved:    "PDF Saemikkappattathu",
    selectLang:  "Mozhi Theru",
    defaultPDF:  "Iniyappu",
    translated:  "Thirukkappattathu",
    cancel:      "Raththu",
    deletePDF:   "PDF Nee",
    confirmDel:  "Indha PDF-ai neekkavuma?",
    generating:  "Uruvaakirathu...",
    scanBlock:   "Kal Scan Seyya",
    placeStick:  "Photographyku munbu 1m reference stick vaikavum",
    analyse:     "Gemini Vision-al Aayvu Seyya",
    analysing:   "Aayvu Seykirathu...",
    downloadPDF: "PDF Irakku",
    shareWA:     "WhatsApp-il Pangidu",
    newScan:     "Puthu Scan",
    bookAudit:   "Tharaniyal Peyar Seyya",
    selectService:"Sevaiyai Theru",
    schedule:    "Theydi",
    yourDetails: "Ungal Vivaragal",
    confirm:     "WhatsApp Moolamaga Unruppadi Seyyungal",
    back:        "Piragu",
    continue:    "Thodaru",
    retry:       "Marupadiyum Muyarchi",
    loading:     "Ertrukirathu...",
    save:        "Saemi",
    error:       "Pizhai",
    success:     "Vetri",
    required:    "Kattayam",
  },
  AR: {
    dashboard:   "Lauhat Al-Qiyadah",
    scan:        "Mash",
    vault:       "Al-Khizana",
    pricing:     "Al-Asaar",
    audit:       "Al-Tafteesh",
    invite:      "Daawat Al-Muwarid",
    signOut:     "Khuruuj",
    stoneVault:  "Khizanat Al-Hajar",
    searchPlaceholder: "Bahth...",
    allGrades:   "Kull Al-Darajat",
    noBlocks:    "La Hijara",
    startScan:   "Ibda Al-Mash",
    pdfLang:     "PDF + Lugha",
    share:       "Mushaaraka",
    view:        "Ard",
    pdfSaved:    "PDF Mahfuz",
    selectLang:  "Ikhtiyar Al-Lugha",
    defaultPDF:  "Iftiradi",
    translated:  "Mutarjam",
    cancel:      "Ilgha",
    deletePDF:   "Hathf PDF",
    confirmDel:  "Hathf hadha al-PDF?",
    generating:  "Jariy al-insha...",
    scanBlock:   "Mash Al-Khatl",
    placeStick:  "Daa asa al-marja qabla al-tasweer",
    analyse:     "Tahleel bi Gemini Vision",
    analysing:   "Jariy al-tahleel...",
    downloadPDF: "Tanziil PDF",
    shareWA:     "Mushaaraka WhatsApp",
    newScan:     "Mash Jadeed",
    bookAudit:   "Hajz Tafteesh",
    selectService:"Ikhtiyar Al-Khidma",
    schedule:    "Jadwala",
    yourDetails: "Bayanaatuk",
    confirm:     "Taakeed via WhatsApp",
    back:        "Ruju",
    continue:    "Mutaaba",
    retry:       "Iaada Al-Muhawala",
    loading:     "Jariy al-tahmeel...",
    save:        "Hifz",
    error:       "Khata",
    success:     "Najah",
    required:    "Matloob",
  },
  DE: {
    dashboard:   "Armaturenbrett",
    scan:        "Scannen",
    vault:       "Tresor",
    pricing:     "Preise",
    audit:       "Prüfung",
    invite:      "Lieferant einladen",
    signOut:     "Abmelden",
    stoneVault:  "Steintresor",
    searchPlaceholder: "Sorte, Scan-ID suchen...",
    allGrades:   "Alle Klassen",
    noBlocks:    "Keine Blöcke",
    startScan:   "Scannen beginnen",
    pdfLang:     "PDF + Sprache",
    share:       "Teilen",
    view:        "Ansehen",
    pdfSaved:    "PDF gespeichert",
    selectLang:  "Sprache wählen",
    defaultPDF:  "Standard",
    translated:  "Übersetztes PDF",
    cancel:      "Abbrechen",
    deletePDF:   "PDF löschen",
    confirmDel:  "Dieses PDF löschen?",
    generating:  "Wird generiert...",
    scanBlock:   "Block scannen",
    placeStick:  "Legen Sie einen 1m Referenzstock neben den Block",
    analyse:     "Mit Gemini Vision analysieren",
    analysing:   "Wird analysiert...",
    downloadPDF: "PDF herunterladen",
    shareWA:     "WhatsApp teilen",
    newScan:     "Neuer Scan",
    bookAudit:   "Prüfung buchen",
    selectService:"Service auswählen",
    schedule:    "Terminplan",
    yourDetails: "Ihre Daten",
    confirm:     "Über WhatsApp bestätigen",
    back:        "Zurück",
    continue:    "Weiter",
    retry:       "Erneut versuchen",
    loading:     "Wird geladen...",
    save:        "Speichern",
    error:       "Fehler",
    success:     "Erfolg",
    required:    "Pflichtfeld",
  },
  JA: {
    dashboard:   "ダッシュボード",
    scan:        "スキャン",
    vault:       "保管庫",
    pricing:     "料金",
    audit:       "監査",
    invite:      "サプライヤーを招待",
    signOut:     "サインアウト",
    stoneVault:  "石材保管庫",
    searchPlaceholder: "品種、スキャンIDを検索...",
    allGrades:   "全グレード",
    noBlocks:    "ブロックなし",
    startScan:   "スキャン開始",
    pdfLang:     "PDF + 言語",
    share:       "共有",
    view:        "表示",
    pdfSaved:    "PDF保存済み",
    selectLang:  "言語を選択",
    defaultPDF:  "デフォルト",
    translated:  "翻訳済みPDF",
    cancel:      "キャンセル",
    deletePDF:   "PDFを削除",
    confirmDel:  "このPDFを削除しますか？",
    generating:  "生成中...",
    scanBlock:   "ブロックをスキャン",
    placeStick:  "撮影前に1mの参照棒をブロックの隣に置いてください",
    analyse:     "Gemini Visionで分析",
    analysing:   "分析中...",
    downloadPDF: "PDFダウンロード",
    shareWA:     "WhatsAppで共有",
    newScan:     "新しいスキャン",
    bookAudit:   "監査を予約",
    selectService:"サービスを選択",
    schedule:    "スケジュール",
    yourDetails: "あなたの詳細",
    confirm:     "WhatsAppで確認",
    back:        "戻る",
    continue:    "続ける",
    retry:       "再試行",
    loading:     "読み込み中...",
    save:        "保存",
    error:       "エラー",
    success:     "成功",
    required:    "必須",
  },
} as const;

export type LangCode = keyof typeof TRANSLATIONS;
export type TranslationKeys = keyof typeof TRANSLATIONS.EN;

// ── Context ─────────────────────────────────────────────────────
interface LangContextType {
  lang:   LangCode;
  setLang:(lang: LangCode) => void;
  t:      (key: TranslationKeys) => string;
}

const LangContext = createContext<LangContextType>({
  lang:    "EN",
  setLang: ()=>{},
  t:       (k)=>k,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(() => {
    if (typeof window === "undefined") return "EN";
    return (localStorage.getItem("sv_lang") as LangCode) || "EN";
  });

  const setLang = useCallback((newLang: LangCode) => {
    setLangState(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("sv_lang", newLang);
    }
  }, []);

  // FIX 2: t() function — instant re-render on lang change
  const t = useCallback((key: TranslationKeys): string => {
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.EN[key] || key;
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

// ── Hook ────────────────────────────────────────────────────────
export function useLang() {
  return useContext(LangContext);
}

// ── Language selector component ─────────────────────────────────
const LANG_OPTIONS: {code:LangCode; label:string; flag:string}[] = [
  {code:"EN", label:"English",  flag:"🇬🇧"},
  {code:"TA", label:"Tamil",    flag:"🇮🇳"},
  {code:"AR", label:"Arabic",   flag:"🇦🇪"},
  {code:"DE", label:"Deutsch",  flag:"🇩🇪"},
  {code:"JA", label:"日本語",   flag:"🇯🇵"},
];

export function LangSelector({ style }: { style?: React.CSSProperties }) {
  const { lang, setLang } = useLang();
  const current = LANG_OPTIONS.find(l=>l.code===lang) || LANG_OPTIONS[0];

  return (
    <select
      value={lang}
      onChange={e => setLang(e.target.value as LangCode)}
      aria-label="Select language"
      style={{
        background:"#1a1814", border:"1px solid #2a2620",
        color:"#c9a84c", borderRadius:8,
        padding:"5px 8px", fontSize:11, cursor:"pointer", outline:"none",
        ...style,
      }}
    >
      {LANG_OPTIONS.map(l=>(
        <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
      ))}
    </select>
  );
}

export { LANG_OPTIONS };
