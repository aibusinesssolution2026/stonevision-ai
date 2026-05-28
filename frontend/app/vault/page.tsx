"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase-client";
import Link from "next/link";

interface Stone {
  id: string; scan_code: string; variety: string; quality_grade: string;
  length_cm: number; width_cm: number; height_cm: number;
  volume_cft: number; total_value_inr: number; scanned_at: string;
  image_url: string|null; public_link: string|null;
  catalog_pdf_url: string|null; ai_flags: string[];
  quality_notes: string; variety_reasoning: string;
  measurement_confidence: number; variety_confidence: number;
}

// MODULE 1: Product name suggestions for granite varieties
const GRANITE_SUGGESTIONS = [
  "Kashmir White Granite","Black Galaxy Granite","Tan Brown Granite",
  "Red Multicolor Granite","Absolute Black Granite","Steel Grey Granite",
  "Imperial White Granite","Colonial White Granite","Thunder White Granite",
  "Alaska White Granite","Viscon White Granite","P White Granite",
  "Madura Gold Granite","Mystic Spring Granite","River White Granite",
  "New Imperial Red Granite","Ivory Brown Granite","African Red Granite",
  "Baltic Brown Granite","Verde Butterfly Granite","Blue Pearl Granite",
  "Juparana India Granite","Silver Wave Granite","Crystal Yellow Granite",
  "Multicolor Red Granite","Shrimp Pink Granite","Paradiso Granite",
];

// MODULE 1: Measurement units for granite
const UNITS = ["cm","mm","inches","feet","m"];
const GRADES = ["A1","A2","B1","B2"];
const GRADE_COLORS: Record<string,string> = {A1:"#2d9e6b",A2:"#d4840a",B1:"#c0392b",B2:"#c0392b"};

// MODULE 2: Languages for PDF generation
const PDF_LANGS = [
  {code:"EN",label:"English",  flag:"🇬🇧"},
  {code:"TA",label:"Tamil",    flag:"🇮🇳"},
  {code:"AR",label:"Arabic",   flag:"🇦🇪"},
  {code:"ZH",label:"Chinese",  flag:"🇨🇳"},
  {code:"PL",label:"Polish",   flag:"🇵🇱"},
];

const API = process.env.NEXT_PUBLIC_API_URL || "";

// MODULE 1: Smart autocomplete input
function AutocompleteInput({value, onChange, suggestions, placeholder}: {
  value: string;
  onChange: (v:string) => void;
  suggestions: string[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.length < 2) { setOpen(false); return; }
    const f = suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase())).slice(0,6);
    setFiltered(f);
    setOpen(f.length > 0);
  }, [value]);

  useEffect(() => {
    function click(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", click);
    return () => document.removeEventListener("mousedown", click);
  }, []);

  return (
    <div ref={ref} style={{position:"relative"}}>
      <input value={value} onChange={e=>onChange(e.target.value)}
        placeholder={placeholder||"Type to search..."}
        style={{width:"100%",background:"#1a1814",border:"1px solid #2a2620",color:"#f0ebe0",borderRadius:10,padding:"10px 14px",fontSize:13,outline:"none",boxSizing:"border-box" as const}}/>
      {open && (
        <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#1a1814",border:"1px solid #3a3528",borderRadius:10,zIndex:50,overflow:"hidden",boxShadow:"0 8px 24px rgba(0,0,0,.4)",marginTop:4}}>
          {filtered.map(s=>(
            <button key={s} onClick={()=>{onChange(s);setOpen(false);}} style={{
              display:"block",width:"100%",padding:"9px 14px",textAlign:"left",
              background:"transparent",border:"none",color:"#f0ebe0",fontSize:12,
              cursor:"pointer",borderBottom:"1px solid #2a2620",
            }}
            onMouseEnter={e=>(e.currentTarget.style.background="#242118")}
            onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// MODULE 1: Dimension input with unit selector
function DimInput({label, value, unit, onValue, onUnit}: {
  label:string; value:string; unit:string;
  onValue:(v:string)=>void; onUnit:(u:string)=>void;
}) {
  return (
    <div>
      <div style={{fontSize:10,color:"#6a6050",marginBottom:5,letterSpacing:1,textTransform:"uppercase" as const}}>{label}</div>
      <div style={{display:"flex",gap:6}}>
        <input type="number" value={value} onChange={e=>onValue(e.target.value)} step="0.5" min="0"
          style={{flex:1,background:"#1a1814",border:"1px solid #2a2620",color:"#f0ebe0",borderRadius:8,padding:"9px 10px",fontSize:13,outline:"none",boxSizing:"border-box" as const,textAlign:"center" as const}}/>
        <select value={unit} onChange={e=>onUnit(e.target.value)}
          style={{background:"#1a1814",border:"1px solid #2a2620",color:"#c9a84c",borderRadius:8,padding:"9px 6px",fontSize:11,outline:"none",cursor:"pointer"}}>
          {UNITS.map(u=><option key={u} value={u}>{u}</option>)}
        </select>
      </div>
    </div>
  );
}

// MODULE 1: Edit modal
function EditModal({stone, token, onSave, onClose}: {
  stone: Stone;
  token: string;
  onSave: () => void;
  onClose: () => void;
}) {
  const [variety,  setVariety]  = useState(stone.variety||"");
  const [grade,    setGrade]    = useState(stone.quality_grade||"A2");
  const [notes,    setNotes]    = useState(stone.quality_notes||"");
  const [l,        setL]        = useState(stone.length_cm?.toString()||"");
  const [w,        setW]        = useState(stone.width_cm?.toString()||"");
  const [h,        setH]        = useState(stone.height_cm?.toString()||"");
  const [unit,     setUnit]     = useState("cm");
  const [busy,     setBusy]     = useState(false);
  const [error,    setError]    = useState("");

  // Convert dimensions when unit changes
  const CONV: Record<string,number> = {cm:1,mm:10,inches:0.3937,feet:0.0328,m:0.01};
  function convertedVal(cmVal: string, toUnit: string) {
    const n = parseFloat(cmVal);
    if (isNaN(n)) return cmVal;
    return (n * CONV[toUnit]).toFixed(2);
  }

  async function save() {
    setBusy(true); setError("");
    // Convert back to cm for storage
    const BACK: Record<string,number> = {cm:1,mm:0.1,inches:2.54,feet:30.48,m:100};
    const factor = BACK[unit] || 1;
    const patch = {
      variety: variety.trim(),
      quality_grade: grade,
      quality_notes: notes.trim(),
      length_cm: Math.round(parseFloat(l) * factor * 10) / 10,
      width_cm:  Math.round(parseFloat(w) * factor * 10) / 10,
      height_cm: Math.round(parseFloat(h) * factor * 10) / 10,
    };
    try {
      const res = await fetch(`${API}/api/stones/${stone.scan_code}`, {
        method:"PATCH",
        headers:{"Content-Type":"application/json", Authorization:`Bearer ${token}`},
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(await res.text());
      onSave();
    } catch(e:any) {
      setError(e.message || "Save failed");
    } finally { setBusy(false); }
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{background:"#1a1814",border:"1px solid #3a3528",borderRadius:22,padding:24,maxWidth:480,width:"100%",maxHeight:"90vh",overflowY:"auto" as const}} onClick={e=>e.stopPropagation()}>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div>
            <div style={{fontSize:16,color:"#f0ebe0",fontWeight:600}}>Edit Stone Record</div>
            <div style={{fontSize:10,color:"#6a6050",marginTop:2}}>{stone.scan_code}</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#6a6050",fontSize:20,cursor:"pointer",padding:4}}>✕</button>
        </div>

        {/* AI original values banner */}
        <div style={{background:"rgba(201,168,76,.06)",border:"1px solid rgba(201,168,76,.15)",borderRadius:10,padding:"10px 14px",marginBottom:18,fontSize:11,color:"#b8a070"}}>
          <span style={{color:"#c9a84c",fontWeight:600}}>AI detected:</span>{" "}
          {stone.variety} · {stone.length_cm}×{stone.width_cm}×{stone.height_cm} cm · Grade {stone.quality_grade} ({stone.variety_confidence}% confidence)
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:16}}>

          {/* MODULE 1: Variety with autocomplete */}
          <div>
            <div style={{fontSize:10,color:"#6a6050",marginBottom:5,letterSpacing:1,textTransform:"uppercase" as const}}>Granite Variety *</div>
            <AutocompleteInput value={variety} onChange={setVariety}
              suggestions={GRANITE_SUGGESTIONS} placeholder="Start typing variety name..."/>
          </div>

          {/* Grade selector */}
          <div>
            <div style={{fontSize:10,color:"#6a6050",marginBottom:8,letterSpacing:1,textTransform:"uppercase" as const}}>Quality Grade *</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
              {GRADES.map(g=>(
                <button key={g} onClick={()=>setGrade(g)} style={{
                  padding:"9px 4px",borderRadius:9,fontSize:12,fontWeight:600,cursor:"pointer",
                  background:grade===g?`${GRADE_COLORS[g]}20`:"transparent",
                  color:grade===g?GRADE_COLORS[g]:"#6a6050",
                  border:`${grade===g?"2":"1"}px solid ${grade===g?GRADE_COLORS[g]:"#2a2620"}`,
                }}>
                  {g}
                </button>
              ))}
            </div>
            <div style={{fontSize:10,color:GRADE_COLORS[grade],marginTop:5}}>
              {grade==="A1"?"Export Ready — Top Quality":grade==="A2"?"Exportable with Disclosure":grade==="B1"?"Domestic Market Only":"Domestic / Scrap Grade"}
            </div>
          </div>

          {/* MODULE 1: Dimensions with unit selector */}
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div style={{fontSize:10,color:"#6a6050",letterSpacing:1,textTransform:"uppercase" as const}}>Dimensions</div>
              <div style={{display:"flex",alignItems:"center",gap:6,fontSize:10,color:"#6a6050"}}>
                Display unit:
                <select value={unit} onChange={e=>{
                  // Convert all values when global unit changes
                  const BACK: Record<string,number> = {cm:1,mm:0.1,inches:2.54,feet:30.48,m:100};
                  const FROM: Record<string,number> = {cm:1,mm:10,inches:0.3937,feet:0.0328,m:0.01};
                  const toCm = (v:string, u:string) => (parseFloat(v)||0) * BACK[u];
                  const fromCm = (v:number, u:string) => (v * FROM[u]).toFixed(2);
                  const newUnit = e.target.value;
                  setL(fromCm(toCm(l,unit),newUnit));
                  setW(fromCm(toCm(w,unit),newUnit));
                  setH(fromCm(toCm(h,unit),newUnit));
                  setUnit(newUnit);
                }} style={{background:"#242118",border:"1px solid #2a2620",color:"#c9a84c",borderRadius:6,padding:"3px 6px",fontSize:10,outline:"none",cursor:"pointer"}}>
                  {UNITS.map(u=><option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
              <DimInput label="Length" value={l} unit={unit} onValue={setL} onUnit={u=>{
                const BACK: Record<string,number> = {cm:1,mm:0.1,inches:2.54,feet:30.48,m:100};
                const FROM: Record<string,number> = {cm:1,mm:10,inches:0.3937,feet:0.0328,m:0.01};
                const cmVal = (parseFloat(l)||0) * BACK[unit];
                setL((cmVal * FROM[u]).toFixed(2));
                setUnit(u);
              }}/>
              <DimInput label="Width" value={w} unit={unit} onValue={setW} onUnit={u=>{
                const BACK: Record<string,number> = {cm:1,mm:0.1,inches:2.54,feet:30.48,m:100};
                const FROM: Record<string,number> = {cm:1,mm:10,inches:0.3937,feet:0.0328,m:0.01};
                const cmVal = (parseFloat(w)||0) * BACK[unit];
                setW((cmVal * FROM[u]).toFixed(2));
                setUnit(u);
              }}/>
              <DimInput label="Height" value={h} unit={unit} onValue={setH} onUnit={u=>{
                const BACK: Record<string,number> = {cm:1,mm:0.1,inches:2.54,feet:30.48,m:100};
                const FROM: Record<string,number> = {cm:1,mm:10,inches:0.3937,feet:0.0328,m:0.01};
                const cmVal = (parseFloat(h)||0) * BACK[unit];
                setH((cmVal * FROM[u]).toFixed(2));
                setUnit(u);
              }}/>
            </div>
          </div>

          {/* Quality notes */}
          <div>
            <div style={{fontSize:10,color:"#6a6050",marginBottom:5,letterSpacing:1,textTransform:"uppercase" as const}}>Quality Notes</div>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2}
              placeholder="Any observations, defects, or special qualities..."
              style={{width:"100%",background:"#1a1814",border:"1px solid #2a2620",color:"#f0ebe0",borderRadius:10,padding:"10px 14px",fontSize:12,outline:"none",resize:"vertical" as const,fontFamily:"sans-serif",boxSizing:"border-box" as const}}/>
          </div>

          {error && <div style={{background:"rgba(192,57,43,.15)",border:"1px solid rgba(192,57,43,.3)",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#e74c3c"}}>{error}</div>}

          <div style={{display:"flex",gap:10}}>
            <button onClick={onClose} style={{flex:1,background:"transparent",border:"1px solid #2a2620",color:"#6a6050",borderRadius:11,padding:"12px",cursor:"pointer",fontSize:13}}>
              Cancel
            </button>
            <button onClick={save} disabled={busy} style={{flex:2,background:"linear-gradient(135deg,#8a6820,#c9a84c)",color:"#0a0908",border:"none",borderRadius:11,padding:"12px",fontSize:13,fontWeight:700,cursor:"pointer",opacity:busy?0.6:1}}>
              {busy?"Saving...":"✓ Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// MODULE 2: PDF modal with language selection + share link
function PDFModal({stone, token, onClose}: {stone:Stone; token:string; onClose:()=>void}) {
  const [lang,       setLang]       = useState("EN");
  const [generating, setGenerating] = useState(false);
  const [shareUrl,   setShareUrl]   = useState<string|null>(stone.catalog_pdf_url||null);
  const [copied,     setCopied]     = useState(false);
  const [error,      setError]      = useState("");

  // MODULE 2: Generate PDF in selected language and get shareable URL
  async function generateAndShare() {
    setGenerating(true); setError(""); setShareUrl(null);
    try {
      // Pass language to backend — backend saves to storage and returns URL in header
      const res = await fetch(`${API}/api/pdf/${stone.scan_code}?language=${lang}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`PDF generation failed (${res.status})`);

      // Get the saved URL from response header (set by backend after storage upload)
      const pdfUrl = res.headers.get("X-PDF-URL") || null;
      if (pdfUrl) setShareUrl(pdfUrl);

      // Also trigger browser download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const langName = PDF_LANGS.find(l=>l.code===lang)?.label||lang;
      a.href = url;
      a.download = `StoneVision-${stone.scan_code}-${langName}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch(e:any) {
      setError(e.message);
    } finally { setGenerating(false); }
  }

  // MODULE 2: Copy share URL to clipboard
  async function copyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // MODULE 2: WhatsApp share link
  function whatsappShare() {
    const url = shareUrl || stone.public_link || "";
    const langName = PDF_LANGS.find(l=>l.code===lang)?.label || "English";
    const msg = `Granite Block Catalog - ${stone.variety||"Unknown"}%0A%0AScan: ${stone.scan_code}%0ADimensions: ${stone.length_cm}x${stone.width_cm}x${stone.height_cm} cm%0AGrade: ${stone.quality_grade}%0ALanguage: ${langName}%0A%0APDF: ${url}%0A%0AVerify: ${API}/verify/${stone.scan_code}`;
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{background:"#1a1814",border:"1px solid #2a2620",borderRadius:22,padding:22,width:"100%",maxWidth:460}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:16,color:"#f0ebe0",marginBottom:4,fontWeight:600}}>Generate PDF</div>
        <div style={{fontSize:11,color:"#6a6050",marginBottom:18}}>{stone.variety} · {stone.scan_code}</div>

        {/* MODULE 2: Language selector */}
        <div style={{fontSize:10,color:"#6a6050",letterSpacing:1,textTransform:"uppercase" as const,marginBottom:10}}>Select Output Language</div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:18}}>
          {PDF_LANGS.map(l=>(
            <button key={l.code} onClick={()=>setLang(l.code)} style={{
              display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"12px 14px",borderRadius:12,cursor:"pointer",
              background:lang===l.code?"rgba(201,168,76,.08)":"#242118",
              border:lang===l.code?"2px solid #c9a84c":"1px solid #2a2620",
            }}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:20}}>{l.flag}</span>
                <div style={{textAlign:"left"}}>
                  <div style={{fontSize:13,color:"#f0ebe0",fontWeight:500}}>{l.label}</div>
                  <div style={{fontSize:9,color:"#4a4438"}}>{l.code==="EN"?"Default":"Fully translated PDF"}</div>
                </div>
              </div>
              {lang===l.code&&<span style={{color:"#c9a84c",fontWeight:700,fontSize:13}}>✓</span>}
            </button>
          ))}
        </div>

        {error && <div style={{background:"rgba(192,57,43,.12)",border:"1px solid rgba(192,57,43,.3)",borderRadius:8,padding:"8px 12px",fontSize:11,color:"#e74c3c",marginBottom:12}}>{error}</div>}

        {/* Generate + Download button */}
        <button onClick={generateAndShare} disabled={generating} style={{
          width:"100%",background:"linear-gradient(135deg,#8a6820,#c9a84c)",color:"#0a0908",
          border:"none",borderRadius:11,padding:"13px",fontSize:13,fontWeight:700,
          cursor:"pointer",opacity:generating?0.6:1,marginBottom:shareUrl?12:0,
        }}>
          {generating
            ? <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                <span style={{width:14,height:14,border:"2px solid #0a0908",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite",display:"inline-block"}}/>
                Generating {PDF_LANGS.find(l=>l.code===lang)?.label} PDF...
              </span>
            : `📄 Download ${PDF_LANGS.find(l=>l.code===lang)?.label} PDF`
          }
        </button>

        {/* MODULE 2: Share URL panel — appears after generation */}
        {shareUrl && (
          <div style={{background:"rgba(45,158,107,.06)",border:"1px solid rgba(45,158,107,.2)",borderRadius:12,padding:14,marginBottom:12}}>
            <div style={{fontSize:10,color:"#2d9e6b",letterSpacing:1,marginBottom:8}}>SHAREABLE LINK READY</div>
            <div style={{fontSize:10,color:"#6a6050",wordBreak:"break-all" as const,marginBottom:10,lineHeight:1.5}}>
              {shareUrl.length>60?shareUrl.slice(0,60)+"...":shareUrl}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <button onClick={copyLink} style={{
                padding:"9px",borderRadius:9,fontSize:11,fontWeight:600,cursor:"pointer",
                background:copied?"rgba(45,158,107,.2)":"rgba(91,141,217,.1)",
                border:`1px solid ${copied?"rgba(45,158,107,.4)":"rgba(91,141,217,.3)"}`,
                color:copied?"#2d9e6b":"#5b8dd9",
              }}>
                {copied?"✓ Copied!":"📋 Copy Link"}
              </button>
              <button onClick={whatsappShare} style={{
                padding:"9px",borderRadius:9,fontSize:11,fontWeight:600,cursor:"pointer",
                background:"rgba(45,158,107,.1)",border:"1px solid rgba(45,158,107,.3)",
                color:"#2d9e6b",
              }}>
                💬 Share WhatsApp
              </button>
            </div>
          </div>
        )}

        <button onClick={onClose} style={{width:"100%",padding:"10px",borderRadius:10,background:"transparent",border:"1px solid #2a2620",color:"#6a6050",cursor:"pointer",fontSize:13}}>
          Close
        </button>
      </div>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );
}

export default function VaultPage() {
  const supabase = createClient();
  const [stones,    setStones]    = useState<Stone[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [grade,     setGrade]     = useState("all");
  const [token,     setToken]     = useState("");
  const [editing,   setEditing]   = useState<Stone|null>(null);
  const [pdfStone,  setPdfStone]  = useState<Stone|null>(null);
  const [deleting,  setDeleting]  = useState<string|null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { window.location.href = "/login"; return; }
      setToken(data.session.access_token);
      localStorage.setItem("sv_token", data.session.access_token);
    });
  }, []);

  useEffect(() => { if (token) load(); }, [token]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/stones?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed");
      const d = await res.json();
      setStones(d.stones || []);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function deletePDF(stone: Stone) {
    if (!confirm("Delete the saved PDF for this stone?")) return;
    setDeleting(stone.id);
    try {
      await fetch(`${API}/api/pdf/${stone.scan_code}`, {
        method:"DELETE",
        headers:{ Authorization:`Bearer ${token}` }
      });
      await load();
    } catch(e) { console.error(e); }
    finally { setDeleting(null); }
  }

  const fmtDate = (s:string) => new Date(s).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
  const gradeColor = (g:string) => GRADE_COLORS[g]||"#6a6050";

  const filtered = stones.filter(s => {
    const q = search.toLowerCase();
    const ms = !q||(s.variety||"").toLowerCase().includes(q)||(s.scan_code||"").toLowerCase().includes(q);
    const mg = grade==="all"||s.quality_grade===grade;
    return ms && mg;
  });

  return (
    <div style={{minHeight:"100vh",background:"#0a0908",color:"#f0ebe0",fontFamily:"sans-serif",paddingBottom:80}}>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>

      <nav style={{position:"sticky",top:0,zIndex:50,background:"rgba(10,9,8,.97)",backdropFilter:"blur(20px)",borderBottom:"1px solid #2a2620",padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Link href="/dashboard" style={{color:"#c9a84c",textDecoration:"none",fontSize:18}}>←</Link>
          <div>
            <div style={{color:"#c9a84c",fontWeight:600,fontSize:14}}>Stone Vault</div>
            <div style={{color:"#4a4438",fontSize:9,letterSpacing:2,textTransform:"uppercase"}}>{stones.length} blocks stored</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <Link href="/dashboard" style={{fontSize:11,color:"#6a6050",textDecoration:"none",border:"1px solid #2a2620",padding:"5px 10px",borderRadius:7}}>Dashboard</Link>
          <button onClick={load} style={{fontSize:11,color:"#6a6050",background:"none",border:"1px solid #2a2620",borderRadius:7,padding:"5px 9px",cursor:"pointer"}}>↻</button>
        </div>
      </nav>

      <div style={{maxWidth:600,margin:"0 auto",padding:16}}>
        <div style={{display:"flex",gap:10,marginBottom:16}}>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search variety, scan ID..."
            style={{flex:1,background:"#1a1814",border:"1px solid #2a2620",color:"#f0ebe0",borderRadius:11,padding:"9px 14px",fontSize:13,outline:"none"}}/>
          <select value={grade} onChange={e=>setGrade(e.target.value)}
            style={{background:"#1a1814",border:"1px solid #2a2620",color:"#f0ebe0",borderRadius:11,padding:"9px 10px",fontSize:12,outline:"none",cursor:"pointer"}}>
            <option value="all">All</option>
            {GRADES.map(g=><option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{textAlign:"center",padding:40}}>
            <div style={{width:28,height:28,border:"2px solid #c9a84c",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto"}}/>
          </div>
        ) : filtered.length===0 ? (
          <div style={{background:"#1a1814",border:"1px solid #2a2620",borderRadius:18,padding:40,textAlign:"center"}}>
            <div style={{fontSize:36,marginBottom:12}}>📦</div>
            <div style={{color:"#6a6050"}}>{stones.length===0?"No blocks yet":"No matches"}</div>
            {stones.length===0&&<Link href="/scan" style={{color:"#c9a84c",textDecoration:"none",fontSize:12,display:"block",marginTop:8}}>Start scanning →</Link>}
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {filtered.map(stone=>(
              <div key={stone.id} style={{background:"#1a1814",border:"1px solid #2a2620",borderRadius:18,overflow:"hidden"}}>
                <div style={{display:"flex",gap:12,padding:"14px 14px 10px"}}>
                  <div style={{width:50,height:50,borderRadius:10,background:"#242118",flexShrink:0,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>
                    {stone.image_url?<img src={stone.image_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:"🪨"}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:3}}>
                      <span style={{fontSize:14,color:"#f0ebe0",fontWeight:500}}>{stone.variety||"Unknown"}</span>
                      <span style={{fontSize:9,padding:"2px 7px",borderRadius:999,fontWeight:600,background:gradeColor(stone.quality_grade)+"20",border:"1px solid "+gradeColor(stone.quality_grade)+"40",color:gradeColor(stone.quality_grade)}}>{stone.quality_grade}</span>
                      {stone.catalog_pdf_url&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:999,background:"rgba(91,141,217,.15)",border:"1px solid rgba(91,141,217,.3)",color:"#5b8dd9"}}>PDF</span>}
                    </div>
                    <div style={{fontSize:11,color:"#6a6050"}}>{stone.length_cm}×{stone.width_cm}×{stone.height_cm} cm · {stone.scan_code}</div>
                    <div style={{fontSize:10,color:"#4a4438",marginTop:2}}>{fmtDate(stone.scanned_at)}</div>
                    {stone.total_value_inr&&<div style={{fontSize:11,color:"#c9a84c",marginTop:2}}>₹{stone.total_value_inr.toLocaleString("en-IN")}</div>}
                  </div>
                  {/* MODULE 1: Edit button */}
                  <button onClick={()=>setEditing(stone)} style={{
                    flexShrink:0,background:"rgba(201,168,76,.08)",border:"1px solid rgba(201,168,76,.2)",
                    color:"#c9a84c",borderRadius:9,padding:"6px 10px",cursor:"pointer",fontSize:11,fontWeight:600,
                    alignSelf:"flex-start",
                  }}>
                    ✏ Edit
                  </button>
                </div>

                <div style={{display:"flex",borderTop:"1px solid #2a2620"}}>
                  <button onClick={()=>setPdfStone(stone)} style={{flex:1,padding:"9px 0",fontSize:11,color:"#5b8dd9",background:"none",border:"none",borderRight:"1px solid #2a2620",cursor:"pointer"}}>
                    📄 PDF
                  </button>
                  {stone.public_link&&(
                    <a href={stone.public_link} target="_blank" rel="noopener" style={{flex:1,padding:"9px 0",fontSize:11,color:"#c9a84c",textDecoration:"none",textAlign:"center",display:"block",borderRight:"1px solid #2a2620"}}>
                      🔗 View
                    </a>
                  )}
                  <a href={`https://wa.me/?text=${encodeURIComponent(stone.variety+" | "+stone.scan_code+" | "+stone.length_cm+"x"+stone.width_cm+"x"+stone.height_cm+"cm | Grade "+stone.quality_grade+(stone.public_link?" | "+stone.public_link:""))}`}
                    target="_blank" rel="noopener"
                    style={{flex:1,padding:"9px 0",fontSize:11,color:"#2d9e6b",textDecoration:"none",textAlign:"center",display:"block",borderRight:stone.catalog_pdf_url?"1px solid #2a2620":"none"}}>
                    💬
                  </a>
                  {stone.catalog_pdf_url&&(
                    <button onClick={()=>deletePDF(stone)} disabled={deleting===stone.id}
                      style={{flex:1,padding:"9px 0",fontSize:11,color:"#c0392b",background:"none",border:"none",cursor:"pointer",opacity:deleting===stone.id?0.5:1}}>
                      {deleting===stone.id?"...":"🗑"}
                    </button>
                  )}
                </div>

                {stone.catalog_pdf_url&&(
                  <div style={{padding:"8px 14px",borderTop:"1px solid #1e1c18",background:"rgba(91,141,217,.04)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <a href={stone.catalog_pdf_url} target="_blank" rel="noopener" style={{fontSize:10,color:"#5b8dd9",textDecoration:"none"}}>📎 Saved PDF</a>
                    <button onClick={async()=>{await navigator.clipboard.writeText(stone.catalog_pdf_url!);alert("Link copied!");}}
                      style={{fontSize:9,color:"#4a4438",background:"none",border:"none",cursor:"pointer"}}>Copy link</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <nav style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(10,9,8,.97)",backdropFilter:"blur(20px)",borderTop:"1px solid #2a2620",display:"grid",gridTemplateColumns:"repeat(4,1fr)",zIndex:50}}>
        {[{href:"/dashboard",icon:"◈",label:"Home"},{href:"/scan",icon:"📷",label:"Scan",fab:true},{href:"/vault",icon:"📦",label:"Vault"},{href:"/pricing",icon:"💳",label:"Plans"}].map(({href,icon,label,fab})=>(
          <Link key={href} href={href} style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,padding:"10px 0",color:href==="/vault"?"#c9a84c":"#6a6050",textDecoration:"none"}}>
            {fab?<div style={{width:46,height:46,marginTop:-18,background:"linear-gradient(135deg,#8a6820,#c9a84c)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:"#0a0908"}}>{icon}</div>:<span style={{fontSize:18}}>{icon}</span>}
            <span style={{fontSize:9,letterSpacing:1,textTransform:"uppercase"}}>{label}</span>
          </Link>
        ))}
      </nav>

      {/* Modals */}
      {editing && <EditModal stone={editing} token={token} onSave={()=>{load();setEditing(null);}} onClose={()=>setEditing(null)}/>}
      {pdfStone && <PDFModal stone={pdfStone} token={token} onClose={()=>setPdfStone(null)}/>}
    </div>
  );
}
