"use client";
import React, { useState, useRef, useEffect } from "react";

// Safe wrapper — catches BoundaryDrawer errors without crashing whole page
function SafeBoundaryDrawer(props: {imageUrl:string; cropBox:{x:number;y:number;w:number;h:number}|null; onCropChange:(b:{x:number;y:number;w:number;h:number}|null)=>void}) {
  const [crashed, setCrashed] = useState(false);
  if (crashed) return (
    <div style={{padding:"10px 14px",background:"rgba(255,48,48,.06)",border:"1px solid rgba(255,48,48,.15)",borderRadius:6,fontSize:11,color:"#ff6b6b",display:"flex",gap:10,alignItems:"center"}}>
      <span>Boundary tool unavailable for this image</span>
      <button onClick={()=>setCrashed(false)} style={{marginLeft:"auto",fontSize:10,color:"#b8922a",background:"rgba(184,146,42,.1)",border:"1px solid rgba(184,146,42,.2)",borderRadius:3,padding:"3px 8px",cursor:"pointer"}}>Retry</button>
    </div>
  );
  try {
    return <BoundaryDrawer {...props} onError={()=>setCrashed(true)}/>;
  } catch {
    setCrashed(true);
    return null;
  }
}

interface ScanResult {
  stone_id: string; scan_code: string; scan_ref: string; variety: string;
  variety_confidence: number; variety_reasoning: string;
  dimensions: { length_cm: number; width_cm: number; height_cm: number };
  volume_m3: number; volume_cft: number; weight_kg: number;
  grade: string; quality_notes: string; measurement_confidence: number;
  reference_stick_ok: boolean; export_markets: string[];
  value_per_cft_inr: number; total_value_inr: number;
  flags: string[]; share_url: string; public_link: string;
  public_slug: string; scanned_at: string;
  scan_gate: { remaining: number; tier: string };
  warning?: string;
}

interface BlockEntry {
  id: string;
  images: string[];        // preview URLs (1-3)
  fileNames: string[];
  result: ScanResult | null;
  scanning: boolean;
  error: string;
  // Manual overrides — all editable by human
  manualGrade: string;
  manualVariety: string;
  manualL: string;         // length override in cm
  manualW: string;         // width override in cm
  manualH: string;         // height override in cm
  verified: boolean;       // manually verified checkbox
  cropBox: {x:number;y:number;w:number;h:number}|null; // user-drawn boundary
}

type StepState = "pending"|"running"|"done"|"fail";
const STEP_ICONS: Record<StepState,string> = {pending:"○",running:"◐",done:"✓",fail:"✕"};
const GRADES = ["A1","A2","B1","B2"];
const GRADE_LABEL: Record<string,string> = {
  A1:"A1 — Export Ready",
  A2:"A2 — Exportable",
  B1:"B1 — Domestic Only",
  B2:"B2 — Scrap Grade",
};
const GRADE_COLOR: Record<string,string> = {
  A1:"#2d9e6b",A2:"#d4840a",B1:"#c0392b",B2:"#c0392b"
};

function newBlock(id: string): BlockEntry {
  return { id, images:[], fileNames:[], result:null, scanning:false, error:"",
           manualGrade:"", manualVariety:"", manualL:"", manualW:"", manualH:"", verified:false,
           cropBox:null };
}



// ── Boundary Drawer Component ──────────────────────────────────
// User draws a rectangle on the photo to mark the block boundary
function BoundaryDrawer({
  imageUrl,
  cropBox,
  onCropChange,
  onError,
}: {
  imageUrl: string;
  cropBox: {x:number;y:number;w:number;h:number}|null;
  onCropChange: (box:{x:number;y:number;w:number;h:number}|null) => void;
  onError?: () => void;
}) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const drawing    = useRef(false);
  const startPt    = useRef({x:0,y:0});
  const imgLoaded  = useRef(false);
  const imgEl      = useRef<HTMLImageElement|null>(null);
  const [box,       setBox]       = useState<{x:number;y:number;w:number;h:number}|null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [imgReady,  setImgReady]  = useState(false);
  const [error,     setError]     = useState("");

  // Load image safely whenever imageUrl changes
  useEffect(() => {
    setImgReady(false);
    setError("");
    setBox(null);
    setConfirmed(false);
    imgLoaded.current = false;

    if (!imageUrl) return;

    const img = new Image();
    img.onload = () => {
      imgEl.current  = img;
      imgLoaded.current = true;
      setImgReady(true);
    };
    img.onerror = () => {
      setError("Could not load image for boundary drawing");
      onError?.();
    };
    img.src = imageUrl;

    return () => {
      img.onload  = null;
      img.onerror = null;
    };
  }, [imageUrl]);

  // Draw canvas whenever image loads or box changes
  useEffect(() => {
    if (!imgReady) return;
    drawCanvas(box);
  }, [imgReady, box]);

  function drawCanvas(b: {x:number;y:number;w:number;h:number}|null) {
    const canvas = canvasRef.current;
    const img    = imgEl.current;
    if (!canvas || !img || !imgLoaded.current) return;

    try {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas size to match image
      canvas.width  = img.naturalWidth  || 600;
      canvas.height = img.naturalHeight || 400;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      if (!b) return;

      // Dim outside
      ctx.fillStyle = "rgba(0,0,0,.5)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Restore inside box
      ctx.drawImage(img,
        (b.x / canvas.width)  * img.naturalWidth,
        (b.y / canvas.height) * img.naturalHeight,
        (b.w / canvas.width)  * img.naturalWidth,
        (b.h / canvas.height) * img.naturalHeight,
        b.x, b.y, b.w, b.h
      );

      // Red border
      ctx.strokeStyle = "#ff2020";
      ctx.lineWidth   = 2.5;
      ctx.strokeRect(b.x, b.y, b.w, b.h);

      // Corner L-marks
      const cs = 12;
      ctx.strokeStyle = "#ff2020";
      ctx.lineWidth   = 3;
      [
        [b.x,     b.y,     1, 1],
        [b.x+b.w, b.y,    -1, 1],
        [b.x,     b.y+b.h, 1,-1],
        [b.x+b.w, b.y+b.h,-1,-1],
      ].forEach(([px,py,dx,dy]) => {
        ctx.beginPath();
        ctx.moveTo(px + dx*cs, py);
        ctx.lineTo(px, py);
        ctx.lineTo(px, py + dy*cs);
        ctx.stroke();
      });

      // Label
      ctx.font      = "bold 12px sans-serif";
      ctx.fillStyle = "#ff2020";
      ctx.fillText("Block boundary", b.x + 8, b.y + 18);

      const pw = Math.round((b.w / canvas.width)  * 100);
      const ph = Math.round((b.h / canvas.height) * 100);
      ctx.font      = "10px sans-serif";
      ctx.fillStyle = "rgba(255,48,48,.7)";
      ctx.fillText(`${pw}% × ${ph}% of frame`, b.x + 8, b.y + b.h - 8);

    } catch(e) {
      console.warn("BoundaryDrawer draw error:", e);
    }
  }

  function getPos(e: React.MouseEvent<HTMLCanvasElement>|React.TouchEvent<HTMLCanvasElement>): {x:number,y:number} {
    const canvas = canvasRef.current;
    if (!canvas) return {x:0, y:0};
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / (rect.width  || 1);
    const scaleY = canvas.height / (rect.height || 1);
    const isTouch = "touches" in e;
    const clientX = isTouch ? (e as React.TouchEvent).touches[0]?.clientX ?? 0 : (e as React.MouseEvent).clientX;
    const clientY = isTouch ? (e as React.TouchEvent).touches[0]?.clientY ?? 0 : (e as React.MouseEvent).clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top)  * scaleY,
    };
  }

  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>|React.TouchEvent<HTMLCanvasElement>) {
    if (!imgReady) return;
    e.preventDefault();
    drawing.current = true;
    setConfirmed(false);
    startPt.current = getPos(e);
    setBox(null);
  }

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>|React.TouchEvent<HTMLCanvasElement>) {
    if (!drawing.current || !imgReady) return;
    e.preventDefault();
    const p = getPos(e);
    const b = {
      x: Math.min(startPt.current.x, p.x),
      y: Math.min(startPt.current.y, p.y),
      w: Math.abs(p.x - startPt.current.x),
      h: Math.abs(p.y - startPt.current.y),
    };
    setBox(b);
    drawCanvas(b);
  }

  function onMouseUp(e: React.MouseEvent<HTMLCanvasElement>|React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault();
    drawing.current = false;
  }

  function confirm() {
    if (!box || box.w < 20 || box.h < 20) return;
    onCropChange(box);
    setConfirmed(true);
  }

  function reset() {
    setBox(null);
    setConfirmed(false);
    onCropChange(null);
    if (imgReady) drawCanvas(null);
  }

  // Error state
  if (error) return (
    <div style={{background:"rgba(255,48,48,.06)",border:"1px solid rgba(255,48,48,.2)",borderRadius:8,padding:"10px 14px",fontSize:11,color:"#ff6b6b"}}>
      {error} — boundary drawing unavailable for this image
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:8}}>

      {/* Instruction banner */}
      <div style={{
        display:"flex",alignItems:"center",gap:8,
        padding:"8px 12px",
        background:"rgba(255,48,48,.06)",
        border:"1px solid rgba(255,48,48,.15)",
        borderRadius:6,
      }}>
        <span style={{fontSize:14,flexShrink:0}}>✏️</span>
        <div style={{flex:1}}>
          <div style={{fontSize:11,color:"#ff6b6b",fontWeight:500,marginBottom:1}}>
            {confirmed ? "✓ Boundary confirmed — AI will analyse this area" : "Draw block boundary"}
          </div>
          <div style={{fontSize:10,color:"#3a3830",lineHeight:1.4}}>
            {confirmed ? "Tap Redraw to change selection" : imgReady ? "Drag on the photo to mark the granite block edges" : "Loading image…"}
          </div>
        </div>
        {confirmed && (
          <button onClick={reset} style={{
            fontSize:9,color:"#ff6b6b",letterSpacing:".08em",
            background:"rgba(255,48,48,.1)",border:"1px solid rgba(255,48,48,.2)",
            borderRadius:3,padding:"3px 8px",cursor:"pointer",flexShrink:0,
            fontFamily:"Manrope,sans-serif",
          }}>Redraw</button>
        )}
      </div>

      {/* Canvas */}
      <div style={{
        position:"relative",width:"100%",
        borderRadius:8,overflow:"hidden",
        border:`1.5px solid ${confirmed?"rgba(255,48,48,.4)":"rgba(184,146,42,.15)"}`,
        minHeight:120,
        background:"#111",
        display:"flex",alignItems:"center",justifyContent:"center",
      }}>
        {!imgReady && (
          <div style={{position:"absolute",fontSize:11,color:"#3a3830"}}>Loading…</div>
        )}
        <canvas
          ref={canvasRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onMouseDown}
          onTouchMove={onMouseMove}
          onTouchEnd={onMouseUp}
          style={{
            width:"100%",height:"auto",display:"block",
            cursor: imgReady ? (confirmed ? "default" : "crosshair") : "default",
            userSelect:"none",touchAction:"none",
            opacity: imgReady ? 1 : 0,
          }}
        />
      </div>

      {/* Confirm button */}
      {box && box.w > 20 && box.h > 20 && !confirmed && (
        <button onClick={confirm} style={{
          width:"100%",padding:"11px",borderRadius:5,
          background:"linear-gradient(135deg,#cc2020,#ff3030)",
          color:"#fff",border:"none",cursor:"pointer",
          fontSize:11,fontWeight:500,letterSpacing:".1em",
          textTransform:"uppercase" as const,
          fontFamily:"Manrope,sans-serif",
        }}>
          ✓ Confirm Boundary
        </button>
      )}
    </div>
  );
}


// ── 3D Block Diagram Component ─────────────────────────────────
function BlockDiagram({ L, W, H }: { L: number; W: number; H: number }) {
  // Isometric projection constants
  const ISO_ANGLE = 30 * (Math.PI / 180);
  const cos30 = Math.cos(ISO_ANGLE);
  const sin30 = Math.sin(ISO_ANGLE);

  // Scale to fit in viewBox — max dimension maps to ~160px
  const maxDim = Math.max(L, W, H);
  const scale  = 160 / maxDim;
  const sl = L * scale;
  const sw = W * scale;
  const sh = H * scale;

  // Isometric offset helpers
  const ix = (x: number, y: number) => x * cos30 - y * cos30;
  const iy = (x: number, y: number) => x * sin30 + y * sin30;

  // Origin — bottom-left-front corner, centred in SVG
  const ox = 200;
  const oy = 240;

  // 8 corners of the block in isometric space
  // Front-bottom-left = origin
  const pts = {
    // Bottom face
    fbl: [ox,                       oy],
    fbr: [ox + ix(sl,0),            oy + iy(sl,0)],
    bbr: [ox + ix(sl,sw),           oy + iy(sl,sw)],
    bbl: [ox + ix(0,sw),            oy + iy(0,sw)],
    // Top face (shift up by sh)
    ftl: [ox,                       oy - sh],
    ftr: [ox + ix(sl,0),            oy + iy(sl,0) - sh],
    btr: [ox + ix(sl,sw),           oy + iy(sl,sw) - sh],
    btl: [ox + ix(0,sw),            oy + iy(0,sw) - sh],
  };

  const p = (key: keyof typeof pts) => pts[key].join(",");

  // Dimension label positions
  const midL_x = (pts.fbl[0] + pts.fbr[0]) / 2;
  const midL_y = (pts.fbl[1] + pts.fbr[1]) / 2 + 16;

  const midW_x = (pts.fbr[0] + pts.bbr[0]) / 2 + 14;
  const midW_y = (pts.fbr[1] + pts.bbr[1]) / 2 + 6;

  const midH_x = pts.ftr[0] + 14;
  const midH_y = (pts.ftr[1] + pts.fbr[1]) / 2;

  const Lft = (L / 30.48).toFixed(1);
  const Wft = (W / 30.48).toFixed(1);
  const Hft = (H / 30.48).toFixed(1);

  return (
    <div style={{
      background:"rgba(10,9,8,.8)",
      border:"1px solid rgba(184,146,42,.15)",
      borderRadius:8,
      padding:"16px 8px 8px",
    }}>
      <div style={{fontSize:9,color:"rgba(184,146,42,.5)",letterSpacing:".18em",textTransform:"uppercase",textAlign:"center",marginBottom:8,fontWeight:500}}>
        Block Diagram
      </div>

      <svg viewBox="0 0 400 300" style={{width:"100%",maxHeight:220}} xmlns="http://www.w3.org/2000/svg">

        {/* Definitions */}
        <defs>
          <marker id="arrowGold" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="rgba(184,146,42,.8)"/>
          </marker>
          <marker id="arrowGoldR" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
            <path d="M0,0 L6,3 L0,6 Z" fill="rgba(184,146,42,.8)"/>
          </marker>
        </defs>

        {/* ── BLOCK FACES ── */}

        {/* Bottom face — darkest */}
        <polygon
          points={`${p("fbl")} ${p("fbr")} ${p("bbr")} ${p("bbl")}`}
          fill="rgba(180,160,120,.08)"
          stroke="rgba(184,146,42,.25)"
          strokeWidth="1"
        />

        {/* Left face — medium */}
        <polygon
          points={`${p("fbl")} ${p("bbl")} ${p("btl")} ${p("ftl")}`}
          fill="rgba(180,160,120,.12)"
          stroke="rgba(184,146,42,.3)"
          strokeWidth="1"
        />

        {/* Right face — medium */}
        <polygon
          points={`${p("fbr")} ${p("bbr")} ${p("btr")} ${p("ftr")}`}
          fill="rgba(140,120,90,.1)"
          stroke="rgba(184,146,42,.25)"
          strokeWidth="1"
        />

        {/* Front face — lightest, most visible */}
        <polygon
          points={`${p("fbl")} ${p("fbr")} ${p("ftr")} ${p("ftl")}`}
          fill="rgba(220,200,160,.14)"
          stroke="rgba(184,146,42,.4)"
          strokeWidth="1.2"
        />

        {/* Top face — highlighted */}
        <polygon
          points={`${p("ftl")} ${p("ftr")} ${p("btr")} ${p("btl")}`}
          fill="rgba(220,200,160,.18)"
          stroke="rgba(184,146,42,.5)"
          strokeWidth="1.2"
        />

        {/* ── DIMENSION LINES ── */}

        {/* Length line — along front bottom */}
        <line
          x1={pts.fbl[0]} y1={pts.fbl[1]+10}
          x2={pts.fbr[0]} y2={pts.fbr[1]+10}
          stroke="rgba(184,146,42,.6)" strokeWidth="1"
          markerStart="url(#arrowGoldR)" markerEnd="url(#arrowGold)"
          strokeDasharray="3,2"
        />
        <text x={midL_x} y={midL_y + 8} textAnchor="middle"
          fill="#b8922a" fontSize="11" fontFamily="'Cormorant Garamond',Georgia,serif">
          {L} cm
        </text>
        <text x={midL_x} y={midL_y + 20} textAnchor="middle"
          fill="rgba(184,146,42,.5)" fontSize="9" fontFamily="Manrope,sans-serif">
          {Lft} ft
        </text>

        {/* Width line — along right bottom */}
        <line
          x1={pts.fbr[0]+10} y1={pts.fbr[1]+5}
          x2={pts.bbr[0]+10} y2={pts.bbr[1]+5}
          stroke="rgba(45,200,120,.5)" strokeWidth="1"
          strokeDasharray="3,2"
        />
        <text x={midW_x + 8} y={midW_y} textAnchor="start"
          fill="#2dc878" fontSize="11" fontFamily="'Cormorant Garamond',Georgia,serif">
          {W} cm
        </text>
        <text x={midW_x + 8} y={midW_y + 12} textAnchor="start"
          fill="rgba(45,200,120,.5)" fontSize="9" fontFamily="Manrope,sans-serif">
          {Wft} ft
        </text>

        {/* Height line — right front vertical */}
        <line
          x1={pts.fbr[0]+18} y1={pts.fbr[1]}
          x2={pts.ftr[0]+18} y2={pts.ftr[1]}
          stroke="rgba(91,141,217,.6)" strokeWidth="1"
          markerStart="url(#arrowGoldR)" markerEnd="url(#arrowGold)"
          strokeDasharray="3,2"
        />
        <text x={midH_x + 10} y={midH_y} textAnchor="start"
          fill="#5b8dd9" fontSize="11" fontFamily="'Cormorant Garamond',Georgia,serif">
          {H} cm
        </text>
        <text x={midH_x + 10} y={midH_y + 12} textAnchor="start"
          fill="rgba(91,141,217,.5)" fontSize="9" fontFamily="Manrope,sans-serif">
          {Hft} ft
        </text>

        {/* Corner dots */}
        {[pts.fbl,pts.fbr,pts.ftl,pts.ftr,pts.bbl,pts.bbr,pts.btl,pts.btr].map((pt,i)=>(
          <circle key={i} cx={pt[0]} cy={pt[1]} r="2.5"
            fill="rgba(184,146,42,.4)" stroke="rgba(184,146,42,.6)" strokeWidth="0.5"/>
        ))}

        {/* Granite texture lines on front face */}
        {[0.3,0.5,0.7].map((t,i)=>(
          <line key={i}
            x1={pts.ftl[0] + (pts.ftr[0]-pts.ftl[0])*0.1}
            y1={pts.ftl[1] + (pts.fbl[1]-pts.ftl[1])*t + (i-1)*8}
            x2={pts.ftr[0] - (pts.ftr[0]-pts.ftl[0])*0.1}
            y2={pts.ftr[1] + (pts.fbr[1]-pts.ftr[1])*t + (i-1)*6}
            stroke="rgba(255,255,255,.06)" strokeWidth="1.5"
          />
        ))}
      </svg>

      {/* Legend */}
      <div style={{display:"flex",justifyContent:"center",gap:16,marginTop:4}}>
        {[
          {color:"#b8922a",label:`L = ${L}cm`},
          {color:"#2dc878",label:`W = ${W}cm`},
          {color:"#5b8dd9",label:`H = ${H}cm`},
        ].map(({color,label})=>(
          <div key={label} style={{display:"flex",alignItems:"center",gap:4}}>
            <div style={{width:12,height:2,background:color,borderRadius:1}}/>
            <span style={{fontSize:9,color,letterSpacing:".04em"}}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StoneScanner() {
  const [blocks, setBlocks] = useState<BlockEntry[]>([newBlock("1")]);
  const [activeBlock, setActiveBlock] = useState("1");
  const [showVerifyModal, setShowVerifyModal] = useState<string|null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sleep = (ms:number) => new Promise(r=>setTimeout(r,ms));
  // Global lock — prevents simultaneous Gemini API calls which cause 429
  const scanningRef = useRef<boolean>(false);
  const scanQueueRef = useRef<string[]>([]);

  const updateBlock = (id:string, patch: Partial<BlockEntry>) => {
    setBlocks(bs => bs.map(b => b.id===id ? {...b,...patch} : b));
  };

  function addBlock() {
    if (blocks.length >= 10) return;
    const id = Date.now().toString();
    setBlocks(bs => [...bs, newBlock(id)]);
    setActiveBlock(id);
  }

  function removeBlock(id:string) {
    if (blocks.length === 1) return;
    setBlocks(bs => bs.filter(b => b.id !== id));
    setActiveBlock(blocks[0].id === id ? blocks[1]?.id : blocks[0].id);
  }

  function onFiles(blockId:string, e:React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files||[]).slice(0,3);
    if (!files.length) return;
    const block = blocks.find(b=>b.id===blockId);
    if (!block) return;

    const remaining = 3 - block.images.length;
    const toAdd = files.slice(0, remaining);
    if (!toAdd.length) return;

    // Read files sequentially using promises to avoid race conditions
    const readFile = (file: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = (ev) => resolve(ev.target?.result as string);
        reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
        reader.readAsDataURL(file);
      });

    // Process all files then update state ONCE
    Promise.all(toAdd.map(f => readFile(f)))
      .then(newDataUrls => {
        const combined = [...block.images, ...newDataUrls].slice(0, 3);
        const combinedNames = [...block.fileNames, ...toAdd.map(f=>f.name)].slice(0, 3);
        updateBlock(blockId, {
          images: combined,
          fileNames: combinedNames,
          result: null,
          error: "",
          cropBox: null,  // reset boundary when new images added
        });
      })
      .catch(err => {
        updateBlock(blockId, { error: `Image load failed: ${err.message}` });
      });
  }

  function removeImage(blockId:string, idx:number) {
    const block = blocks.find(b=>b.id===blockId);
    if (!block) return;
    const images = block.images.filter((_,i)=>i!==idx);
    const fileNames = block.fileNames.filter((_,i)=>i!==idx);
    updateBlock(blockId, { images, fileNames });
  }

  function resizeImage(dataUrl:string,maxPx=1024):Promise<Blob> {
    return new Promise((res,rej)=>{
      const img=new Image();
      img.onload=()=>{
        let{width:w,height:h}=img;
        if(w>maxPx||h>maxPx){const sc=maxPx/Math.max(w,h);w=Math.round(w*sc);h=Math.round(h*sc);}
        const c=document.createElement("canvas");c.width=w;c.height=h;
        c.getContext("2d")!.drawImage(img,0,0,w,h);
        c.toBlob(b=>b?res(b):rej(new Error("Resize failed")),"image/jpeg",0.88);
      };
      img.onerror=()=>rej(new Error("Could not read image"));
      img.src=dataUrl;
    });
  }

  async function scanBlock(blockId:string) {
    // PREVENT DUPLICATE CALLS: if already scanning this block, ignore
    const block = blocks.find(b=>b.id===blockId);
    if (!block || block.images.length===0) return;
    if (block.scanning) return; // already in progress

    // GLOBAL LOCK: if another block is being scanned, queue this one
    if (scanningRef.current) {
      updateBlock(blockId, {error:"Waiting for previous scan to complete..."});
      // Wait for lock to release then retry
      let waited = 0;
      while (scanningRef.current && waited < 120) {
        await sleep(1000);
        waited++;
      }
      updateBlock(blockId, {error:""});
    }

    const token = localStorage.getItem("sv_token");
    if (!token) { updateBlock(blockId,{error:"Not logged in — please sign in again"}); return; }

    // Acquire lock
    scanningRef.current = true;
    updateBlock(blockId, {scanning:true, error:"", result:null});

    try {
      // Only send first image to API (primary image)
      const blob = await resizeImage(block.images[0]);
      const form = new FormData();
      form.append("file", blob, block.fileNames[0]||"block.jpg");

      // Pass crop boundary so AI focuses on the marked area
      if (block.cropBox) {
        form.append("crop_x", block.cropBox.x.toString());
        form.append("crop_y", block.cropBox.y.toString());
        form.append("crop_w", block.cropBox.w.toString());
        form.append("crop_h", block.cropBox.h.toString());
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analyse`,{
        method:"POST",
        headers:{Authorization:`Bearer ${token}`},
        body:form
      });

      if (res.status===402) {
        const e=await res.json();
        throw new Error(e.detail?.message||"Scan limit reached. Please upgrade your plan.");
      }

      if (res.status===429) {
        // Rate limited — countdown then retry ONCE
        scanningRef.current = false;
        updateBlock(blockId,{scanning:false});
        for(let i=30;i>0;i--){
          updateBlock(blockId,{error:`AI busy — retrying in ${i}s...`});
          await sleep(1000);
        }
        updateBlock(blockId,{error:""});
        // Release lock and retry once
        await scanBlock(blockId);
        return;
      }

      if (res.status===503) {
        scanningRef.current = false;
        updateBlock(blockId,{scanning:false});
        for(let i=15;i>0;i--){
          updateBlock(blockId,{error:`AI service busy — retrying in ${i}s...`});
          await sleep(1000);
        }
        updateBlock(blockId,{error:""});
        await scanBlock(blockId);
        return;
      }

      if (res.status===401) {
        scanningRef.current = false;
        window.location.href="/login";
        return;
      }

      if (!res.ok) {
        const e=await res.json().catch(()=>({}));
        throw new Error(e.detail||`Analysis failed (${res.status}) — please try again`);
      }

      const data:ScanResult = await res.json();
      updateBlock(blockId, {
        result:data,
        scanning:false,
        error:"",
        manualGrade:   data.grade||"",
        manualVariety: data.variety||"",
        manualL: data.dimensions?.length_cm?.toString()||"",
        manualW: data.dimensions?.width_cm?.toString()||"",
        manualH: data.dimensions?.height_cm?.toString()||"",
      });

    } catch(e:unknown) {
      const msg = e instanceof Error ? e.message : "Unexpected error — please try again";
      updateBlock(blockId, {error:msg, scanning:false});
    } finally {
      // Always release lock
      scanningRef.current = false;
    }
  }

  async function downloadPDF(blockId:string) {
    const block = blocks.find(b=>b.id===blockId);
    if (!block?.result) return;
    if (!block.verified) { setShowVerifyModal(blockId); return; }

    const token = localStorage.getItem("sv_token");
    const scanCode = block.result.scan_code || block.result.scan_ref;

    // Update grade/variety if manually changed
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pdf/${scanCode}`,{
      headers:{Authorization:`Bearer ${token}`}
    });
    if (!res.ok) { alert("PDF failed — " + res.status); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href=url; a.download=`StoneVision-${scanCode}.pdf`; a.click();
    URL.revokeObjectURL(url);
  }

  async function shareWhatsApp(blockId:string) {
    const block = blocks.find(b=>b.id===blockId);
    if (!block?.result) return;
    if (!block.verified) { setShowVerifyModal(blockId); return; }

    const r = block.result;
    const grade = block.manualGrade || r.grade;
    const variety = block.manualVariety || r.variety;
    const scanCode = r.scan_code || r.scan_ref;
    const link = r.public_link || r.share_url || "";

    const L = block.manualL || r.dimensions.length_cm;
    const W = block.manualW || r.dimensions.width_cm;
    const H = block.manualH || r.dimensions.height_cm;
    const text = `🪨 *${variety}* — ${scanCode}
📐 ${L}×${W}×${H} cm
📦 ${r.volume_cft} cft · ~${r.weight_kg?.toFixed(0)} kg
🏷️ Grade ${grade}${block.verified?" ✓ Manually verified":""}
💰 Est. ₹${r.value_per_cft_inr?.toLocaleString("en-IN")}/cft · ₹${r.total_value_inr?.toLocaleString("en-IN")}
🌍 ${r.export_markets?.join(", ")||"—"}

⚠️ AI estimate ±${r.measurement_confidence>=85?"5":"10"}% — verify before commercial use

${link}`;

    if (navigator.share) {
      try { await navigator.share({title:`StoneVision — ${variety}`,text,url:link}); return; }
      catch(_) {}
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,"_blank");
  }

  const activeB = blocks.find(b=>b.id===activeBlock) || blocks[0];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>

      {/* Block tabs */}
      {blocks.length > 1 && (
        <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4}}>
          {blocks.map((b,i) => (
            <button key={b.id} onClick={()=>setActiveBlock(b.id)} style={{
              flexShrink:0,padding:"6px 14px",borderRadius:10,fontSize:12,fontWeight:500,
              background:activeBlock===b.id?"#c9a84c":"#1a1814",
              color:activeBlock===b.id?"#0a0908":"#6a6050",
              border:`1px solid ${activeBlock===b.id?"#c9a84c":"#2a2620"}`,cursor:"pointer"
            }}>
              Block {i+1} {b.result?"✓":b.scanning?"⟳":""}
            </button>
          ))}
          {blocks.length < 10 && (
            <button onClick={addBlock} style={{
              flexShrink:0,padding:"6px 14px",borderRadius:10,fontSize:12,
              background:"transparent",color:"#c9a84c",
              border:"1px dashed #3a3528",cursor:"pointer"
            }}>+ Add Block</button>
          )}
        </div>
      )}

      {/* Active block */}
      {activeB && (
        <BlockPanel
          block={activeB}
          onAddImages={(e)=>onFiles(activeB.id,e)}
          onRemoveImage={(i)=>removeImage(activeB.id,i)}
          onScan={()=>scanBlock(activeB.id)}
          onRemoveBlock={blocks.length>1?()=>removeBlock(activeB.id):undefined}
          onGradeChange={(g)=>updateBlock(activeB.id,{manualGrade:g})}
          onVarietyChange={(v)=>updateBlock(activeB.id,{manualVariety:v})}
          onLChange={(v)=>updateBlock(activeB.id,{manualL:v})}
          onWChange={(v)=>updateBlock(activeB.id,{manualW:v})}
          onHChange={(v)=>updateBlock(activeB.id,{manualH:v})}
          onVerifyChange={(v)=>updateBlock(activeB.id,{verified:v})}
          onCropChange={(box)=>updateBlock(activeB.id,{cropBox:box})}
          onPDF={()=>downloadPDF(activeB.id)}
          onShare={()=>shareWhatsApp(activeB.id)}
          onClear={()=>updateBlock(activeB.id,{images:[],fileNames:[],result:null,error:"",verified:false,manualGrade:"",manualVariety:"",manualL:"",manualW:"",manualH:"",cropBox:null})}
          inputRef={activeB.id===activeBlock?inputRef:undefined}
        />
      )}

      {blocks.length === 1 && (
        <button onClick={addBlock} style={{
          padding:"12px",borderRadius:14,fontSize:12,color:"#c9a84c",
          background:"transparent",border:"1px dashed #3a3528",cursor:"pointer"
        }}>+ Add Another Block (up to 10)</button>
      )}

      {/* Verify modal */}
      {showVerifyModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
          onClick={()=>setShowVerifyModal(null)}>
          <div style={{background:"#1a1814",border:"1px solid #2a2620",borderRadius:20,padding:24,maxWidth:340,width:"100%"}}
            onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:18,color:"#f0ebe0",fontFamily:"serif",marginBottom:8}}>Confirm before sharing</div>
            <p style={{fontSize:13,color:"#8a8070",lineHeight:1.6,marginBottom:20}}>
              Please confirm that you have independently verified the dimensions and grade before generating the PDF or sharing with buyers.
            </p>
            <div style={{background:"rgba(212,132,10,.08)",border:"1px solid rgba(212,132,10,.2)",borderRadius:12,padding:"12px 16px",fontSize:12,color:"#b8a070",marginBottom:20,lineHeight:1.6}}>
              ⚠️ AI estimates carry ±5–15% error margin. Verify with tape measure before any commercial contract.
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setShowVerifyModal(null)} style={{flex:1,padding:"11px",borderRadius:12,background:"transparent",border:"1px solid #2a2620",color:"#6a6050",cursor:"pointer",fontSize:13}}>
                Cancel
              </button>
              <button onClick={()=>{
                updateBlock(showVerifyModal,{verified:true});
                setShowVerifyModal(null);
              }} style={{flex:2,padding:"11px",borderRadius:12,background:"linear-gradient(135deg,#8a6820,#c9a84c)",color:"#0a0908",border:"none",cursor:"pointer",fontSize:13,fontWeight:700}}>
                ✓ Verified — Generate PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BlockPanel({block,onAddImages,onRemoveImage,onScan,onRemoveBlock,onGradeChange,onVarietyChange,onLChange,onWChange,onHChange,onVerifyChange,onPDF,onShare,onClear,inputRef}: {
  block:BlockEntry;
  onAddImages:(e:React.ChangeEvent<HTMLInputElement>)=>void;
  onRemoveImage:(i:number)=>void;
  onScan:()=>void;
  onRemoveBlock?:()=>void;
  onGradeChange:(g:string)=>void;
  onVarietyChange:(v:string)=>void;
  onLChange:(v:string)=>void;
  onWChange:(v:string)=>void;
  onHChange:(v:string)=>void;
  onVerifyChange:(v:boolean)=>void;
  onCropChange:(box:{x:number;y:number;w:number;h:number}|null)=>void;
  onPDF:()=>void;
  onShare:()=>void;
  onClear:()=>void;
  inputRef?:React.RefObject<HTMLInputElement>;
}) {
  const localRef = useRef<HTMLInputElement>(null);
  const ref = inputRef || localRef;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>

      {/* Image upload area */}
      {block.images.length === 0 ? (
        <label style={{
          display:"block",
          border:"1px dashed rgba(184,146,42,.25)",
          borderRadius:12,padding:44,
          textAlign:"center",cursor:"pointer",transition:"all .3s",
          background:"rgba(184,146,42,.03)",
        }}>
          <input ref={ref} type="file" accept="image/*" multiple onChange={e=>{onAddImages(e);e.target.value="";}} style={{display:"none"}}/>
          <div style={{marginBottom:16}}>
            <svg viewBox="0 0 48 48" fill="none" style={{width:48,height:48,margin:"0 auto"}}>
              <rect x="4" y="10" width="40" height="30" rx="4" stroke="rgba(184,146,42,.35)" strokeWidth="1.5"/>
              <circle cx="24" cy="25" r="8" stroke="rgba(184,146,42,.35)" strokeWidth="1.5"/>
              <circle cx="24" cy="25" r="4" fill="rgba(184,146,42,.2)"/>
              <path d="M17 10 L20 6 L28 6 L31 10" stroke="rgba(184,146,42,.35)" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="36" cy="16" r="2" fill="rgba(184,146,42,.4)"/>
            </svg>
          </div>
          <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:18,fontWeight:300,color:"#ede8e0",marginBottom:6,letterSpacing:".02em"}}>
            Photograph your block
          </div>
          <div style={{fontSize:11,color:"#3a3830",fontWeight:300,lineHeight:1.6}}>
            Upload 1–3 photos · First photo used for AI analysis
          </div>
        </label>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{display:"flex",gap:10,overflowX:"auto"}}>
            {block.images.map((img,i)=>(
              <div key={i} style={{position:"relative",flexShrink:0}}>
                <img src={img} alt="" style={{width:100,height:100,objectFit:"cover",borderRadius:12,border:"1px solid #2a2620"}}/>
                <button onClick={()=>onRemoveImage(i)} style={{
                  position:"absolute",top:4,right:4,width:20,height:20,
                  background:"rgba(0,0,0,.7)",border:"none",borderRadius:"50%",
                  color:"#fff",fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"
                }}>✕</button>
                {i===0 && <div style={{position:"absolute",bottom:4,left:4,fontSize:8,background:"#c9a84c",color:"#0a0908",padding:"1px 5px",borderRadius:4,fontWeight:700}}>PRIMARY</div>}
              </div>
            ))}
            {block.images.length < 3 && (
              <label style={{
                width:100,height:100,borderRadius:8,
                border:"1px dashed rgba(184,146,42,.2)",
                background:"rgba(184,146,42,.03)",
                display:"flex",alignItems:"center",justifyContent:"center",
                cursor:"pointer",flexShrink:0,flexDirection:"column",gap:4
              }}>
                <input type="file" accept="image/*" multiple onChange={e=>{onAddImages(e);e.target.value="";}} style={{display:"none"}}/>
                <span style={{fontSize:22,color:"rgba(184,146,42,.4)"}}>+</span>
                <span style={{fontSize:9,color:"#3a3830",letterSpacing:".08em",textTransform:"uppercase"}}>Add</span>
              </label>
            )}
          </div>
          <div style={{fontSize:10,color:"#4a4438"}}>
            {block.images.length}/3 photos · First photo used for AI analysis
          </div>
        </div>
      )}

      {/* Boundary drawer — shown when image is uploaded but not yet scanned */}
      {block.images.length > 0 && !block.result && !block.scanning && (
        <SafeBoundaryDrawer
          imageUrl={block.images[0]}
          cropBox={block.cropBox}
          onCropChange={onCropChange}
        />
      )}

      {/* Tips */}
      {block.images.length===0 && (
        <div style={{
          background:"rgba(184,146,42,.04)",
          border:"1px solid rgba(184,146,42,.12)",
          borderRadius:8,padding:"14px 16px",
        }}>
          <div style={{fontSize:9,color:"rgba(184,146,42,.6)",letterSpacing:".18em",textTransform:"uppercase",marginBottom:12,fontWeight:500}}>
            For best accuracy
          </div>
          {[
            "Full 1m reference stick visible in frame",
            "Shoot straight-on from 1–2m distance",
            "Natural daylight — no harsh shadows",
            "Capture all 3 faces (Length, Width, Height)",
          ].map(t=>(
            <div key={t} style={{display:"flex",gap:10,marginBottom:8,fontSize:12,color:"#5a5850",fontWeight:300,lineHeight:1.5}}>
              <span style={{color:"rgba(184,146,42,.4)",fontSize:10,marginTop:1,flexShrink:0}}>—</span>{t}
            </div>
          ))}
        </div>
      )}

      {/* Scan button */}
      {block.images.length>0 && !block.result && (
        <button onClick={onScan} disabled={block.scanning} style={{
          width:"100%",
          background:block.scanning?"transparent":"linear-gradient(135deg,#8a6018,#b8922a,#d4a843)",
          color:block.scanning?"#b8922a":"#0a0908",
          fontWeight:500,fontSize:13,letterSpacing:".1em",textTransform:"uppercase",
          padding:"16px",borderRadius:6,
          border:block.scanning?"1px solid rgba(184,146,42,.3)":"none",
          cursor:block.scanning?"not-allowed":"pointer",
          opacity:block.scanning?0.7:1,transition:"all .3s",
          fontFamily:"'Manrope',sans-serif",
          display:"flex",alignItems:"center",justifyContent:"center",gap:10,
        }}>
          {block.scanning
            ? <><div style={{width:14,height:14,border:"1.5px solid rgba(255,60,60,.4)",borderTopColor:"#ff3030",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>Analysing with Gemini AI…</>
            : "Analyse with Gemini Vision →"
          }
        </button>
      )}

      {/* Scanning indicator */}
      {block.scanning && (
        <div style={{
          background:"rgba(184,146,42,.04)",border:"1px solid rgba(184,146,42,.12)",
          borderRadius:8,padding:24,textAlign:"center"
        }}>
          <div style={{width:28,height:28,border:"1.5px solid rgba(184,146,42,.3)",borderTopColor:"#b8922a",borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 14px"}}/>
          <div style={{fontSize:13,color:"#b8922a",letterSpacing:".06em",fontWeight:300}}>Gemini Vision analysing…</div>
          <div style={{fontSize:10,color:"#3a3830",marginTop:6,letterSpacing:".08em"}}>Identifying variety, dimensions and grade</div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* Error */}
      {block.error && (
        <div style={{background:"rgba(180,50,40,.1)",border:"1px solid rgba(180,50,40,.2)",borderRadius:6,padding:"12px 16px",fontSize:12,color:"#c06858",fontWeight:300}}>
          ✕ {block.error}
        </div>
      )}

      {/* Result */}
      {block.result && (
        <div style={{display:"flex",flexDirection:"column",gap:14}}>

          {/* Variety + confidence */}
          <div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(184,146,42,.15)",borderRadius:8,overflow:"hidden"}}>
            {block.images[0] && <img src={block.images[0]} alt="" style={{width:"100%",maxHeight:200,objectFit:"cover",borderBottom:"1px solid rgba(184,146,42,.1)"}}/>}
            <div style={{padding:18}}>
              <div style={{fontFamily:"'Cormorant Garamond',Georgia,serif",fontSize:24,fontWeight:300,color:"#ede8e0",marginBottom:4,letterSpacing:".02em"}}>
                {block.result.variety}
              </div>
              <div style={{fontSize:11,color:"#6a6050",marginBottom:10}}>
                AI Confidence: {block.result.variety_confidence}%
              </div>
              <div style={{height:4,background:"#2a2620",borderRadius:99,overflow:"hidden",marginBottom:8}}>
                <div style={{height:"100%",borderRadius:99,transition:"width .5s",
                  width:`${block.result.variety_confidence}%`,
                  background:block.result.variety_confidence>=85?"#2d9e6b":block.result.variety_confidence>=70?"#c9a84c":"#e74c3c"
                }}/>
              </div>
              {block.result.flags.length>0 && (
                <div style={{background:"rgba(192,57,43,.12)",border:"1px solid rgba(192,57,43,.25)",borderRadius:10,padding:"8px 12px",fontSize:11,color:"#e74c3c"}}>
                  ⚠ {block.result.flags.map(f=>f.replace(/_/g," ")).join(" · ")}
                </div>
              )}
            </div>
          </div>

          {/* Editable Dimensions — Human Verification */}
          <div style={{background:"rgba(10,9,8,.6)",border:"1px solid rgba(184,146,42,.12)",borderRadius:8,padding:18}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div style={{fontSize:9,color:"rgba(184,146,42,.5)",letterSpacing:".18em",textTransform:"uppercase",fontWeight:500}}>
                Dimensions
              </div>
              <div style={{fontSize:9,color:"#3a3830",letterSpacing:".06em"}}>tap to correct</div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
              {[
                {label:"Length",val:block.manualL,ai:block.result!.dimensions.length_cm,onChange:onLChange},
                {label:"Width", val:block.manualW,ai:block.result!.dimensions.width_cm, onChange:onWChange},
                {label:"Height",val:block.manualH,ai:block.result!.dimensions.height_cm,onChange:onHChange},
              ].map(({label,val,ai,onChange})=>{
                const isHuman = val !== "" && val !== ai?.toString();
                return (
                  <div key={label}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5}}>
                      <span style={{fontSize:9,color:"#5a5850",letterSpacing:".08em",textTransform:"uppercase"}}>{label}</span>
                      {isHuman && (
                        <span style={{fontSize:7,letterSpacing:".08em",textTransform:"uppercase",background:"rgba(45,200,120,.12)",border:"1px solid rgba(45,200,120,.25)",color:"#2dc878",borderRadius:2,padding:"1px 5px",fontWeight:600}}>
                          ✎ Human
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      value={val}
                      onChange={e=>onChange(e.target.value)}
                      style={{
                        width:"100%",
                        background:isHuman?"rgba(45,200,120,.06)":"rgba(255,255,255,.03)",
                        border:`1px solid ${isHuman?"rgba(45,200,120,.35)":"rgba(255,255,255,.07)"}`,
                        color:isHuman?"#2dc878":"#ede8e0",
                        borderRadius:4,padding:"10px 6px",fontSize:20,
                        fontFamily:"'Cormorant Garamond',Georgia,serif",
                        textAlign:"center",outline:"none",
                        boxSizing:"border-box" as const,
                        transition:"all .2s",
                      }}
                      placeholder={ai?.toString()||"0"}
                      step="0.5"
                      min="0"
                    />
                    <div style={{marginTop:4,textAlign:"center"}}>
                      {isHuman ? (
                        <div>
                          <div style={{fontSize:8,color:"rgba(45,200,120,.6)",letterSpacing:".04em"}}>Human verified</div>
                          <div style={{fontSize:8,color:"#2a2820",marginTop:1}}>AI was: {ai} cm</div>
                        </div>
                      ) : (
                        <div style={{fontSize:8,color:"#2a2820",letterSpacing:".04em"}}>AI estimate · cm</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Human verification status strip */}
            {(() => {
              const lEdited = block.manualL !== "" && block.manualL !== block.result!.dimensions.length_cm?.toString();
              const wEdited = block.manualW !== "" && block.manualW !== block.result!.dimensions.width_cm?.toString();
              const hEdited = block.manualH !== "" && block.manualH !== block.result!.dimensions.height_cm?.toString();
              const anyEdited = lEdited || wEdited || hEdited;
              return anyEdited ? (
                <div style={{background:"rgba(45,200,120,.06)",border:"1px solid rgba(45,200,120,.15)",borderRadius:4,padding:"10px 12px",display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:24,height:24,borderRadius:"50%",background:"rgba(45,200,120,.15)",border:"1px solid rgba(45,200,120,.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <span style={{fontSize:12}}>✎</span>
                  </div>
                  <div>
                    <div style={{fontSize:11,color:"#2dc878",fontWeight:500,marginBottom:2}}>Updated by Human</div>
                    <div style={{fontSize:9,color:"rgba(45,200,120,.5)",lineHeight:1.5}}>Manual measurements override AI · PDF will show Human Verified badge to your buyer</div>
                  </div>
                </div>
              ) : (
                <div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.04)",borderRadius:4,padding:"8px 12px",display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:11}}>🤖</span>
                  <div style={{fontSize:9,color:"#2a2820",letterSpacing:".04em"}}>AI estimated · Edit any value above to mark as human-verified</div>
                </div>
              );
            })()}
          </div>

          {/* AI estimate warning */}
          <div style={{background:"rgba(212,132,10,.06)",border:"1px solid rgba(212,132,10,.2)",borderRadius:14,padding:"10px 16px",fontSize:11,color:"#b8a070",lineHeight:1.6}}>
            <span style={{color:"#d4840a",fontWeight:600}}>⚠ AI Estimate:</span> ±{block.result.measurement_confidence>=85?"5":"10"}% margin. Always verify with tape measure before commercial use.
          </div>

          {/* 3D Block Diagram */}
          <BlockDiagram
            L={parseFloat(block.manualL) || block.result.dimensions?.length_cm || 248}
            W={parseFloat(block.manualW) || block.result.dimensions?.width_cm  || 142}
            H={parseFloat(block.manualH) || block.result.dimensions?.height_cm || 97}
          />

          {/* Details table */}
          <div style={{background:"#1a1814",border:"1px solid #2a2620",borderRadius:16,overflow:"hidden"}}>
            {[
              ["Volume",`${block.result.volume_m3} m³ · ${block.result.volume_cft} cft`,""],
              ["Est. Weight",`${block.result.weight_kg?.toFixed(0)} kg`,""],
              ["Est. Value",`₹${block.result.value_per_cft_inr?.toLocaleString("en-IN")}/cft · ₹${block.result.total_value_inr?.toLocaleString("en-IN")}`,""],
              ["Markets",(block.result.export_markets?.join(", ")||"—"),""],
              ["Scan ID",(block.result.scan_code||block.result.scan_ref||"—"),""],
            ].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"11px 16px",borderBottom:"1px solid #2a2620",fontSize:12}}>
                <span style={{color:"#6a6050"}}>{k}</span>
                <span style={{color:"#f0ebe0",fontWeight:500,textAlign:"right",maxWidth:"60%"}}>{v}</span>
              </div>
            ))}
          </div>

          {/* MANUAL OVERRIDE SECTION */}
          <div style={{
            background:"rgba(184,146,42,.03)",
            border:"1px solid rgba(184,146,42,.12)",
            borderRadius:8,padding:18,
          }}>
            <div style={{fontSize:9,color:"rgba(184,146,42,.6)",letterSpacing:".18em",textTransform:"uppercase",marginBottom:16,fontWeight:500}}>
              Manual Corrections
            </div>

            {/* Grade override */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,color:"#6a6050",marginBottom:8}}>
                Grade {(!block.result.grade||block.result.grade==="A2")&&<span style={{color:"#d4840a",fontSize:10}}> — verify and correct if needed</span>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                {GRADES.map(g=>(
                  <button key={g} onClick={()=>onGradeChange(g)} style={{
                    padding:"10px 4px",borderRadius:10,fontSize:11,fontWeight:600,
                    cursor:"pointer",border:"1px solid",textAlign:"center",
                    background:(block.manualGrade||block.result?.grade)===g?`${GRADE_COLOR[g]}25`:"transparent",
                    color:(block.manualGrade||block.result?.grade)===g?GRADE_COLOR[g]:"#6a6050",
                    borderColor:(block.manualGrade||block.result?.grade)===g?GRADE_COLOR[g]:"#2a2620",
                  }}>
                    {g}
                  </button>
                ))}
              </div>
              <div style={{fontSize:10,color:"#4a4438",marginTop:6}}>
                {GRADE_LABEL[block.manualGrade||block.result?.grade||"A2"]}
              </div>
            </div>

            {/* Variety override */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,color:"#6a6050",marginBottom:6}}>Variety (edit if AI is wrong)</div>
              <input
                type="text"
                value={block.manualVariety||block.result?.variety||""}
                onChange={e=>onVarietyChange(e.target.value)}
                style={{width:"100%",background:"#111009",border:"1px solid #2a2620",color:"#f0ebe0",borderRadius:10,padding:"10px 14px",fontSize:13,outline:"none",boxSizing:"border-box"}}
                placeholder="e.g. Kashmir White"
              />
            </div>

            {/* Verified checkbox */}
            <label style={{
                display:"flex",alignItems:"flex-start",gap:14,cursor:"pointer",
                padding:"16px",
                background:block.verified?"rgba(45,200,120,.07)":"rgba(255,255,255,.02)",
                border:`2px solid ${block.verified?"rgba(45,200,120,.3)":"rgba(255,255,255,.06)"}`,
                borderRadius:6,transition:"all .25s",
              }}>
                <div style={{
                  width:22,height:22,borderRadius:4,flexShrink:0,marginTop:1,
                  background:block.verified?"#2dc878":"transparent",
                  border:`2px solid ${block.verified?"#2dc878":"rgba(255,255,255,.15)"}`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  transition:"all .2s",
                }}>
                  <input type="checkbox" checked={block.verified} onChange={e=>onVerifyChange(e.target.checked)}
                    style={{opacity:0,position:"absolute",width:22,height:22,cursor:"pointer"}}/>
                  {block.verified && <span style={{fontSize:13,color:"#0a0908",fontWeight:700,lineHeight:1}}>✓</span>}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500,color:block.verified?"#2dc878":"#5a5850",marginBottom:5,letterSpacing:".02em"}}>
                    {block.verified
                      ? "✎ Human Verified — Confirmed by physical inspection"
                      : "Mark as Human Verified"}
                  </div>
                  <div style={{fontSize:11,color:"#3a3830",lineHeight:1.65,fontWeight:300}}>
                    {block.verified
                      ? "You have physically measured this block. The PDF sent to your buyer will show a Human Verified badge — this builds trust and reduces disputes."
                      : "Tick after physically measuring with tape. Your buyer receives a PDF with a Human Verified trust badge, confirming these are not just AI estimates."}
                  </div>
                  {block.verified && (
                    <div style={{
                      marginTop:10,display:"inline-flex",alignItems:"center",gap:6,
                      background:"rgba(45,200,120,.08)",
                      border:"1px solid rgba(45,200,120,.18)",
                      borderRadius:3,padding:"4px 10px",
                    }}>
                      <span style={{fontSize:9,color:"#2dc878",letterSpacing:".14em",textTransform:"uppercase",fontWeight:600}}>✎ Human Verified</span>
                      <span style={{fontSize:8,color:"rgba(45,200,120,.45)"}}>badge appears on buyer PDF</span>
                    </div>
                  )}
                </div>
              </label>
          </div>

          {/* AI Reasoning */}
          {block.result.variety_reasoning && (
            <div style={{background:"#1a1814",border:"1px solid #2a2620",borderRadius:14,padding:14}}>
              <div style={{fontSize:10,color:"#6a6050",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>AI Reasoning</div>
              <div style={{fontSize:12,color:"#b8b09a",lineHeight:1.7}}>{block.result.variety_reasoning}</div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <button onClick={onPDF} style={{
              padding:"13px",borderRadius:4,fontSize:11,fontWeight:500,
              letterSpacing:".08em",textTransform:"uppercase",cursor:"pointer",
              fontFamily:"'Manrope',sans-serif",
              background:block.verified?"linear-gradient(135deg,#8a6018,#b8922a)":"transparent",
              border:block.verified?"none":"1px solid rgba(184,146,42,.2)",
              color:block.verified?"#0a0908":"rgba(184,146,42,.5)",
            }}>
              {block.verified?"Download PDF":"PDF (verify first)"}
            </button>
            <button onClick={onShare} style={{
              padding:"13px",borderRadius:4,fontSize:11,fontWeight:500,
              letterSpacing:".08em",textTransform:"uppercase",cursor:"pointer",
              fontFamily:"'Manrope',sans-serif",
              background:block.verified?"rgba(184,146,42,.08)":"transparent",
              border:`1px solid ${block.verified?"rgba(184,146,42,.3)":"rgba(184,146,42,.1)"}`,
              color:block.verified?"#b8922a":"rgba(184,146,42,.3)",
            }}>
              {block.verified?"Share WhatsApp":"Share (verify first)"}
            </button>
          </div>

          <div style={{display:"flex",gap:10}}>
            <button onClick={onClear} style={{
              flex:1,padding:"12px",borderRadius:4,fontSize:11,
              letterSpacing:".08em",textTransform:"uppercase",
              color:"#3a3830",background:"transparent",
              border:"1px solid rgba(255,255,255,.06)",cursor:"pointer",
              fontFamily:"'Manrope',sans-serif",
            }}>
              New Scan
            </button>
            {onRemoveBlock && (
              <button onClick={onRemoveBlock} style={{padding:"12px 16px",borderRadius:12,fontSize:12,color:"#c0392b",background:"transparent",border:"1px solid rgba(192,57,43,.3)",cursor:"pointer"}}>
                🗑 Remove
              </button>
            )}
          </div>

          {block.result.scan_gate && (
            <div style={{textAlign:"center",fontSize:11,color:"#4a4438"}}>
              {block.result.scan_gate.remaining} scans remaining
            </div>
          )}
        </div>
      )}
    </div>
  );
}
