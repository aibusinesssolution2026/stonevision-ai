"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface StoneData {
  scan_code: string; variety: string; quality_grade: string;
  length_cm: number; width_cm: number; height_cm: number;
  volume_m3: number; volume_cft: number; estimated_weight_kg: number;
  value_per_cft_inr: number; total_value_inr: number;
  export_markets: string[]; quality_notes: string;
  variety_confidence: number; measurement_confidence: number;
  reference_stick_ok: boolean; ai_flags: string[];
  scanned_at: string; variety_reasoning: string;
  image_url: string | null; public_link: string | null;
  company?: { name: string; city: string; whatsapp: string; is_verified: boolean };
}

const API = process.env.NEXT_PUBLIC_API_URL || "";

const GRADE_COLOR: Record<string,string> = {
  A1:"#2d9e6b", A2:"#d4840a", B1:"#c0392b", B2:"#c0392b"
};
const GRADE_LABEL: Record<string,string> = {
  A1:"A1 — Export Ready — Top Quality",
  A2:"A2 — Exportable with Disclosure",
  B1:"B1 — Domestic Market Only",
  B2:"B2 — Domestic / Scrap Grade",
};

export default function CatalogPage() {
  const params = useParams();
  const scan_code = params?.scan_code as string;
  const [stone, setStone] = useState<StoneData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [lang, setLang] = useState("EN");
  const [showLangPicker, setShowLangPicker] = useState(false);

  useEffect(() => {
    if (!scan_code) return;
    // Try public endpoint first, then authenticated
    fetch(`${API}/catalog/${scan_code}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => { setStone(d); setLoading(false); })
      .catch(() => {
        // Try authenticated
        const token = localStorage.getItem("sv_token");
        if (!token) { setError("Stone not found or not public"); setLoading(false); return; }
        fetch(`${API}/api/stones/${scan_code}`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.ok ? r.json() : Promise.reject(r.status))
          .then(d => { setStone(d); setLoading(false); })
          .catch(() => { setError("Stone not found"); setLoading(false); });
      });
  }, [scan_code]);

  async function downloadPDF() {
    const token = localStorage.getItem("sv_token");
    if (!token) { window.print(); return; }
    setPdfBusy(true); setPdfError(false);
    try {
      const res = await fetch(`${API}/api/pdf/${scan_code}?language=${lang}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(res.status.toString());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `StoneVision-${scan_code}-${lang}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setPdfError(true);
    } finally {
      setPdfBusy(false);
    }
  }

  const fmtDate = (s: string) => s ? new Date(s).toLocaleDateString("en-IN", {
    day:"2-digit", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit"
  }) : "—";

  const LANGS = [
    {code:"EN",label:"English",flag:"🇬🇧"},
    {code:"TA",label:"Tamil",flag:"🇮🇳"},
    {code:"AR",label:"Arabic",flag:"🇦🇪"},
    {code:"ZH",label:"Chinese",flag:"🇨🇳"},
    {code:"PL",label:"Polish",flag:"🇵🇱"},
  ];

  if (loading) return (
    <div style={{minHeight:"100vh",background:"#0a0908",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <div style={{width:32,height:32,border:"2px solid #c9a84c",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
      <div style={{color:"#6a6050",fontFamily:"sans-serif",fontSize:13}}>Loading catalog…</div>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );

  if (error || !stone) return (
    <div style={{minHeight:"100vh",background:"#0a0908",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"sans-serif"}}>
      <div style={{color:"#6a6050",fontSize:14}}>{error || "Stone not found"}</div>
    </div>
  );

  const grade = stone.quality_grade || "A2";
  const gc = GRADE_COLOR[grade] || "#d4840a";

  return (
    <>
      {/* ══════════════════════════════════════════════
          PRINT STYLESHEET — hides UI, shows clean report
      ══════════════════════════════════════════════ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&family=Playfair+Display:wght@400;600;700&display=swap');

        @media print {
          /* Hide all UI chrome */
          .no-print, nav, .action-bar, .lang-picker, .print-tip { display: none !important; }

          /* Reset body for clean print */
          body {
            background: white !important;
            color: black !important;
            font-family: 'Outfit', Arial, sans-serif !important;
            font-size: 11pt !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Page margins */
          @page {
            margin: 15mm 12mm 15mm 12mm;
            size: A4 portrait;
          }

          /* Show print-only elements */
          .print-only { display: block !important; }

          /* Force white backgrounds */
          .report-card {
            background: white !important;
            border: 1px solid #ddd !important;
            box-shadow: none !important;
            border-radius: 4px !important;
            page-break-inside: avoid;
          }

          /* Header */
          .report-header {
            background: white !important;
            border-bottom: 2px solid #c9a84c !important;
            padding: 12pt 0 8pt !important;
          }

          /* Dimension boxes */
          .dim-box {
            border: 1px solid #ccc !important;
            background: #f9f9f9 !important;
          }

          /* Grade badge */
          .grade-badge {
            border: 2px solid currentColor !important;
            background: transparent !important;
          }

          /* Tables */
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { border: 1px solid #ddd !important; padding: 6pt 8pt !important; text-align: left !important; font-size: 10pt !important; }
          th { background: #f5f5f5 !important; font-weight: 600 !important; }

          /* Page breaks */
          .page-break { page-break-before: always; }
          .no-break { page-break-inside: avoid; }

          /* Warning footer */
          .print-disclaimer {
            border-top: 1px solid #ccc !important;
            padding-top: 8pt !important;
            font-size: 8pt !important;
            color: #666 !important;
          }

          /* Confidence bars — show as text in print */
          .confidence-bar { display: none !important; }
          .confidence-text { display: inline !important; }

          /* Hide image on print if low quality */
          .stone-image { max-height: 200px !important; }
        }

        /* Screen styles */
        @media screen {
          .print-only { display: none; }
          .confidence-text { display: none; }
        }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade { animation: fadeIn .4s ease forwards; }
      `}</style>

      {/* ══════════════════════════════════════════════
          SCREEN NAV BAR — hidden on print
      ══════════════════════════════════════════════ */}
      <nav className="no-print" style={{
        position:"sticky",top:0,zIndex:50,
        background:"rgba(10,9,8,.97)",backdropFilter:"blur(20px)",
        borderBottom:"1px solid #2a2620",
        padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",
        fontFamily:"Outfit,sans-serif"
      }}>
        {/* FIX: Logo links to home, back goes to dashboard */}
        <Link href="/" style={{display:"flex",alignItems:"center",gap:10,textDecoration:"none"}}>
          <img src="/logo.png" alt="StoneVision AI" style={{height:36,width:"auto",objectFit:"contain"}}/>
          <div>
            <div style={{color:"#c9a84c",fontWeight:600,fontSize:13,fontFamily:"'Cormorant Garamond',Georgia,serif",letterSpacing:".06em"}}>StoneVision AI</div>
            <div style={{color:"#4a4438",fontSize:9,letterSpacing:2,textTransform:"uppercase"}}>Granite Catalog</div>
          </div>
        </Link>
        <div style={{display:"flex",gap:10}}>
          <Link href="/dashboard" style={{
            fontSize:11,color:"#b8922a",
            background:"rgba(184,146,42,.08)",
            border:"1px solid rgba(184,146,42,.2)",
            borderRadius:6,padding:"7px 14px",cursor:"pointer",
            fontFamily:"Manrope,sans-serif",textDecoration:"none",
            display:"flex",alignItems:"center",gap:5,fontWeight:500,letterSpacing:".04em",
          }}>← Dashboard</Link>
          <button onClick={()=>window.print()} style={{fontSize:11,color:"#5b8dd9",background:"rgba(91,141,217,.1)",border:"1px solid rgba(91,141,217,.3)",borderRadius:6,padding:"7px 12px",cursor:"pointer",fontFamily:"Manrope,sans-serif"}}>🖨 Print</button>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════
          ACTION BAR — PDF download + language picker
          Hidden on print
      ══════════════════════════════════════════════ */}
      <div className="action-bar no-print" style={{
        background:"#111009",borderBottom:"1px solid #2a2620",
        padding:"12px 20px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",
        fontFamily:"Outfit,sans-serif"
      }}>
        {/* PDF Download */}
        <button onClick={downloadPDF} disabled={pdfBusy} style={{
          display:"flex",alignItems:"center",gap:7,
          background:"linear-gradient(135deg,#8a6820,#c9a84c)",color:"#0a0908",
          border:"none",borderRadius:10,padding:"9px 18px",fontSize:12,fontWeight:700,
          cursor:"pointer",opacity:pdfBusy?0.6:1,fontFamily:"Outfit,sans-serif"
        }}>
          {pdfBusy
            ? <><div style={{width:12,height:12,border:"2px solid #0a0908",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/> Generating…</>
            : <>📄 Download PDF ({lang})</>
          }
        </button>

        {/* Language picker */}
        <div style={{position:"relative"}}>
          <button onClick={()=>setShowLangPicker(p=>!p)} style={{
            display:"flex",alignItems:"center",gap:6,
            background:"#1a1814",border:"1px solid #2a2620",color:"#c9a84c",
            borderRadius:10,padding:"9px 14px",fontSize:12,fontWeight:500,
            cursor:"pointer",fontFamily:"Outfit,sans-serif"
          }}>
            {LANGS.find(l=>l.code===lang)?.flag} {lang} ▾
          </button>
          {showLangPicker && (
            <div style={{position:"absolute",top:"100%",left:0,marginTop:6,background:"#1a1814",border:"1px solid #2a2620",borderRadius:12,overflow:"hidden",zIndex:100,minWidth:160,boxShadow:"0 8px 32px rgba(0,0,0,.4)"}}>
              {LANGS.map(l=>(
                <button key={l.code} onClick={()=>{setLang(l.code);setShowLangPicker(false);}} style={{
                  display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 14px",
                  background:lang===l.code?"rgba(201,168,76,.1)":"transparent",
                  border:"none",color:lang===l.code?"#c9a84c":"#b8b09a",
                  fontSize:12,cursor:"pointer",fontFamily:"Outfit,sans-serif",textAlign:"left"
                }}>
                  <span style={{fontSize:18}}>{l.flag}</span>{l.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Print button */}
        <button onClick={()=>window.print()} style={{
          display:"flex",alignItems:"center",gap:7,
          background:"rgba(91,141,217,.1)",border:"1px solid rgba(91,141,217,.3)",color:"#5b8dd9",
          borderRadius:10,padding:"9px 14px",fontSize:12,fontWeight:500,
          cursor:"pointer",fontFamily:"Outfit,sans-serif"
        }}>
          🖨 Print / Save as PDF
        </button>
      </div>

      {/* ══════════════════════════════════════════════
          PDF FALLBACK TIP — shown when PDF fails
      ══════════════════════════════════════════════ */}
      {pdfError && (
        <div className="print-tip no-print" style={{
          background:"rgba(212,132,10,.08)",border:"1px solid rgba(212,132,10,.3)",
          padding:"12px 20px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",
          fontFamily:"Outfit,sans-serif"
        }}>
          <span style={{fontSize:20}}>⚠️</span>
          <div style={{flex:1,minWidth:200}}>
            <div style={{fontSize:13,color:"#d4840a",fontWeight:600,marginBottom:2}}>
              PDF generation experiencing delays?
            </div>
            <div style={{fontSize:11,color:"#b8a070",lineHeight:1.5}}>
              Click <strong style={{color:"#c9a84c"}}>Print / Save as PDF</strong> above to save this page directly via your browser — works on Chrome, Safari, and Firefox. Choose "Save as PDF" in the print dialog.
            </div>
          </div>
          <button onClick={()=>window.print()} style={{
            background:"#d4840a",color:"#0a0908",border:"none",borderRadius:8,
            padding:"8px 16px",fontSize:12,fontWeight:700,cursor:"pointer",
            fontFamily:"Outfit,sans-serif",flexShrink:0
          }}>
            🖨 Print Now
          </button>
          <button onClick={()=>setPdfError(false)} style={{
            background:"none",border:"none",color:"#6a6050",fontSize:16,cursor:"pointer",padding:4
          }}>✕</button>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          REPORT BODY — shown on screen AND print
      ══════════════════════════════════════════════ */}
      <div style={{
        maxWidth:780,margin:"0 auto",padding:"24px 16px 48px",
        fontFamily:"Outfit,sans-serif",
        color:"var(--print-color,#f0ebe0)"
      }}>

        {/* REPORT HEADER */}
        <div className="report-header no-break fade" style={{
          borderBottom:"2px solid #c9a84c",paddingBottom:20,marginBottom:24
        }}>
          {/* Print-only branding */}
          <div className="print-only" style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
            <div>
              <div style={{fontSize:18,fontWeight:700,color:"#c9a84c",letterSpacing:1}}>◈ StoneVision AI</div>
              <div style={{fontSize:9,color:"#666",letterSpacing:2,textTransform:"uppercase"}}>Granite Intelligence · Melur-Madurai · support@stonevision.in</div>
            </div>
            <div style={{textAlign:"right",fontSize:9,color:"#666"}}>
              <div>Scan ID: {stone.scan_code}</div>
              <div>Generated: {new Date().toLocaleDateString("en-IN")}</div>
            </div>
          </div>

          <div style={{display:"flex",alignItems:"flex-start",gap:16,flexWrap:"wrap"}}>
            {/* Stone image */}
            {stone.image_url && (
              <img className="stone-image" src={stone.image_url} alt={stone.variety}
                style={{width:120,height:120,objectFit:"cover",borderRadius:12,border:"1px solid #2a2620",flexShrink:0}}/>
            )}
            <div style={{flex:1,minWidth:200}}>
              <div style={{fontSize:9,color:"#6a6050",letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>Granite Block Catalog</div>
              <h1 style={{fontFamily:"Playfair Display,serif",fontSize:"clamp(22px,4vw,32px)",color:"#f0ebe0",margin:"0 0 10px",lineHeight:1.2}}>
                {stone.variety || "Unknown Granite"}
              </h1>
              <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                <span className="grade-badge" style={{
                  display:"inline-flex",alignItems:"center",gap:6,
                  color:gc,border:`2px solid ${gc}`,
                  borderRadius:999,padding:"5px 14px",fontSize:12,fontWeight:700
                }}>
                  {grade} — {GRADE_LABEL[grade]?.split("—")[1]?.trim()}
                </span>
                {stone.company?.is_verified && (
                  <span style={{fontSize:10,color:"#2d9e6b",border:"1px solid #2d9e6b",borderRadius:999,padding:"3px 10px"}}>✓ StoneVision Certified</span>
                )}
              </div>
            </div>
            {/* Company info */}
            {stone.company && (
              <div style={{textAlign:"right",fontSize:11,color:"#6a6050",minWidth:150}}>
                <div style={{color:"#f0ebe0",fontWeight:600,marginBottom:3}}>{stone.company.name}</div>
                <div>{stone.company.city}, Tamil Nadu</div>
                <div>India</div>
                {stone.company.whatsapp && <div style={{color:"#c9a84c",marginTop:4}}>{stone.company.whatsapp}</div>}
              </div>
            )}
          </div>
        </div>

        {/* DIMENSIONS */}
        <div className="no-break" style={{marginBottom:24}}>
          <div style={{fontSize:10,color:"#6a6050",letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>
            Estimated Dimensions (±5–15% AI margin)
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
            {[
              {label:"LENGTH",val:stone.length_cm,unit:"cm"},
              {label:"WIDTH", val:stone.width_cm, unit:"cm"},
              {label:"HEIGHT",val:stone.height_cm,unit:"cm"},
            ].map(({label,val,unit})=>(
              <div key={label} className="dim-box report-card" style={{
                background:"#1a1814",border:"1px solid #2a2620",
                borderRadius:14,padding:"16px 12px",textAlign:"center"
              }}>
                <div style={{fontSize:9,color:"#6a6050",letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>{label}</div>
                <div style={{fontFamily:"Playfair Display,serif",fontSize:28,color:"#f0ebe0",fontWeight:600}}>{val||"—"}</div>
                <div style={{fontSize:10,color:"#6a6050",marginTop:4}}>{unit} (AI est.)</div>
              </div>
            ))}
          </div>
        </div>

        {/* AI CONFIDENCE */}
        <div className="report-card no-break" style={{
          background:"#1a1814",border:"1px solid #2a2620",borderRadius:16,padding:16,marginBottom:20
        }}>
          <div style={{fontSize:10,color:"#6a6050",letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>AI Analysis Confidence</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            {[
              {label:"Variety Identification",val:stone.variety_confidence},
              {label:"Dimension Accuracy",   val:stone.measurement_confidence},
            ].map(({label,val})=>(
              <div key={label}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:6}}>
                  <span style={{color:"#b8b09a"}}>{label}</span>
                  <span style={{color:"#c9a84c",fontWeight:600}}>{val}%</span>
                </div>
                <div className="confidence-bar" style={{height:6,background:"#2a2620",borderRadius:99,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${val||0}%`,borderRadius:99,background:val>=85?"#2d9e6b":val>=70?"#c9a84c":"#e74c3c"}}/>
                </div>
                <span className="confidence-text" style={{fontSize:10,color:"#6a6050"}}>{val}% confidence</span>
              </div>
            ))}
          </div>
          {stone.reference_stick_ok !== undefined && (
            <div style={{marginTop:12,fontSize:11,color:stone.reference_stick_ok?"#2d9e6b":"#e74c3c"}}>
              {stone.reference_stick_ok?"✓ Reference stick detected in photo":"⚠ Reference stick not detected — dimensions less accurate"}
            </div>
          )}
        </div>

        {/* DETAILS TABLE */}
        <div className="report-card no-break" style={{
          background:"#1a1814",border:"1px solid #2a2620",borderRadius:16,overflow:"hidden",marginBottom:20
        }}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <tbody>
              {[
                ["Scan ID",      stone.scan_code||"—"],
                ["Variety",      stone.variety||"—"],
                ["Grade",        `${grade} — ${GRADE_LABEL[grade]||""}`],
                ["Volume",       `${stone.volume_m3||"—"} m³  ·  ${stone.volume_cft||"—"} cft`],
                ["Est. Weight",  stone.estimated_weight_kg ? `${stone.estimated_weight_kg.toLocaleString("en-IN")} kg` : "—"],
                ["Value/cft",    stone.value_per_cft_inr ? `₹${stone.value_per_cft_inr.toLocaleString("en-IN")}` : "—"],
                ["Total Value",  stone.total_value_inr ? `₹${stone.total_value_inr.toLocaleString("en-IN")}` : "—"],
                ["Export Markets",(stone.export_markets||[]).join(", ")||"—"],
                ["Scanned At",   fmtDate(stone.scanned_at)],
                ["AI Source",    "Google Gemini Vision · StoneVision AI v4"],
              ].map(([k,v],i)=>(
                <tr key={k} style={{background:i%2===0?"rgba(255,255,255,.02)":"transparent"}}>
                  <td style={{padding:"11px 16px",fontSize:11,color:"#6a6050",borderBottom:"1px solid #2a2620",width:"38%",borderRight:"1px solid #2a2620"}}>{k}</td>
                  <td style={{padding:"11px 16px",fontSize:11,color:"#f0ebe0",borderBottom:"1px solid #2a2620"}}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* QUALITY NOTES */}
        {stone.quality_notes && (
          <div className="report-card no-break" style={{background:"#1a1814",border:"1px solid #2a2620",borderRadius:14,padding:16,marginBottom:20}}>
            <div style={{fontSize:10,color:"#6a6050",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Quality Notes</div>
            <div style={{fontSize:12,color:"#b8b09a",lineHeight:1.7}}>{stone.quality_notes}</div>
          </div>
        )}

        {/* AI REASONING */}
        {stone.variety_reasoning && (
          <div className="report-card no-break" style={{background:"#1a1814",border:"1px solid #2a2620",borderRadius:14,padding:16,marginBottom:20}}>
            <div style={{fontSize:10,color:"#6a6050",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>AI Variety Reasoning</div>
            <div style={{fontSize:12,color:"#b8b09a",lineHeight:1.7}}>{stone.variety_reasoning}</div>
          </div>
        )}

        {/* AI FLAGS */}
        {stone.ai_flags && stone.ai_flags.length > 0 && (
          <div style={{background:"rgba(192,57,43,.08)",border:"1px solid rgba(192,57,43,.25)",borderRadius:12,padding:"12px 16px",marginBottom:20}}>
            <div style={{fontSize:10,color:"#e74c3c",letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>AI Flags</div>
            <div style={{fontSize:12,color:"#e74c3c"}}>{stone.ai_flags.map((f:string)=>f.replace(/_/g," ")).join("  ·  ")}</div>
          </div>
        )}

        {/* LEGAL DISCLAIMER */}
        <div className="print-disclaimer" style={{
          background:"rgba(212,132,10,.05)",
          border:"1px solid rgba(212,132,10,.2)",
          borderRadius:12,padding:"14px 16px",marginBottom:20
        }}>
          <div style={{fontSize:10,color:"#d4840a",fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>
            ⚠ Important Legal Disclaimer
          </div>
          <div style={{fontSize:10,color:"#8a7050",lineHeight:1.7}}>
            All dimensions, variety identifications and value estimates in this document are AI-generated from photographic analysis 
            using Google Gemini Vision technology. These are <strong style={{color:"#d4840a"}}>ESTIMATES ONLY — not certified measurements</strong>. 
            Error margin: ±5% to ±15%. Actual dimensions may vary based on lighting, angle, and reference stick placement. 
            This document must be independently verified by a qualified surveyor before any commercial contract, 
            Letter of Credit, or customs declaration. StoneVision AI and the exporter accept no liability for 
            decisions made solely on the basis of this AI-generated report.
          </div>
        </div>

        {/* POWERED BY FOOTER */}
        <div style={{
          borderTop:"1px solid #2a2620",paddingTop:16,
          display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10
        }}>
          <div style={{fontSize:11,color:"#4a4438"}}>
            <span style={{color:"#c9a84c",fontWeight:600}}>◈ StoneVision AI</span>
            <span style={{margin:"0 8px"}}>·</span>
            <span>support@stonevision.in</span>
            <span style={{margin:"0 8px"}}>·</span>
            <span>Madurai, Tamil Nadu, India</span>
          </div>
          <div style={{fontSize:10,color:"#3a3428"}}>
            {stone.scan_code} · {new Date().getFullYear()} © StoneVision AI
          </div>
        </div>
      </div>
    </>
  );
}
