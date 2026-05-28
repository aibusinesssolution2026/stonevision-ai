"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import StoneScanner from "@/components/StoneScanner";
import Link from "next/link";

export default function ScanPage() {
  const supabase = createClient();
  const [checking, setChecking] = useState(true);
  const [pdfFailed, setPdfFailed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) window.location.href = "/login";
      else setChecking(false);
    });
    const handler = () => setPdfFailed(true);
    window.addEventListener("pdf-failed", handler);
    return () => window.removeEventListener("pdf-failed", handler);
  }, []);

  if (checking) return (
    <div style={{minHeight:"100vh",background:"#0a0908",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <div style={{width:28,height:28,border:"1.5px solid rgba(184,146,42,.4)",borderTopColor:"#b8922a",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#0a0908",color:"#ede8e0",fontFamily:"'Manrope',sans-serif",paddingBottom:80}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Manrope:wght@300;400;500&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        @media print{.no-print{display:none!important}}
      `}</style>

      {/* NAV */}
      <nav className="no-print" style={{
        position:"sticky",top:0,zIndex:50,
        background:"rgba(10,9,8,.97)",
        backdropFilter:"blur(20px)",
        borderBottom:"1px solid rgba(184,146,42,.1)",
        padding:"14px 20px",
        display:"flex",alignItems:"center",justifyContent:"space-between",
      }}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Link href="/dashboard" style={{
            color:"#b8922a",textDecoration:"none",
            fontSize:11,letterSpacing:".1em",textTransform:"uppercase",
            display:"flex",alignItems:"center",gap:6,fontWeight:500,
            background:"rgba(184,146,42,.08)",
            border:"1px solid rgba(184,146,42,.2)",
            borderRadius:4,padding:"6px 12px",
          }}>
            ← Dashboard
          </Link>
        </div>
        <div style={{
          fontFamily:"'Cormorant Garamond',Georgia,serif",
          fontSize:16,fontWeight:300,color:"#ede8e0",letterSpacing:".1em",
        }}>
          StoneVision AI
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>window.print()} className="no-print" style={{
            fontSize:10,color:"#b8922a",letterSpacing:".08em",
            background:"rgba(184,146,42,.06)",
            border:"1px solid rgba(184,146,42,.2)",
            borderRadius:4,padding:"6px 12px",cursor:"pointer",
            fontFamily:"'Manrope',sans-serif",
          }}>
            🖨 Print
          </button>
          <Link href="/vault" style={{
            fontSize:10,color:"#5a5850",textDecoration:"none",
            border:"1px solid rgba(255,255,255,.06)",
            padding:"6px 12px",borderRadius:4,letterSpacing:".08em",
          }}>
            Vault
          </Link>
        </div>
      </nav>

      {/* PDF failed banner */}
      {pdfFailed && (
        <div className="no-print" style={{
          background:"rgba(184,146,42,.06)",
          border:"none",borderBottom:"1px solid rgba(184,146,42,.15)",
          padding:"12px 20px",
          display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",
        }}>
          <span style={{fontSize:16}}>⚠️</span>
          <div style={{flex:1,minWidth:200}}>
            <div style={{fontSize:12,color:"#b8922a",fontWeight:500,marginBottom:2,letterSpacing:".02em"}}>PDF generation experiencing delays</div>
            <div style={{fontSize:11,color:"#5a5850"}}>Use <strong style={{color:"#b8922a"}}>Print / Save as PDF</strong> to export via your browser instead.</div>
          </div>
          <button onClick={()=>window.print()} style={{
            background:"#b8922a",color:"#0a0908",border:"none",
            borderRadius:4,padding:"8px 16px",fontSize:11,fontWeight:600,
            cursor:"pointer",letterSpacing:".08em",fontFamily:"'Manrope',sans-serif",
          }}>Print Now</button>
          <button onClick={()=>setPdfFailed(false)} style={{background:"none",border:"none",color:"#3a3830",cursor:"pointer",fontSize:18,padding:4}}>✕</button>
        </div>
      )}

      {/* Page header */}
      <div style={{
        padding:"28px 20px 0",
        borderBottom:"1px solid rgba(255,255,255,.04)",
        maxWidth:600,margin:"0 auto",
      }}>
        <div style={{
          fontSize:9,letterSpacing:".22em",textTransform:"uppercase",
          color:"rgba(184,146,42,.5)",marginBottom:10,fontWeight:500,
          display:"flex",alignItems:"center",gap:8,
        }}>
          <span style={{width:20,height:"1px",background:"rgba(184,146,42,.3)",display:"inline-block"}}/>
          Scan Block
        </div>
        <h1 style={{
          fontFamily:"'Cormorant Garamond',Georgia,serif",
          fontSize:30,fontWeight:300,color:"#ede8e0",
          letterSpacing:".02em",marginBottom:8,lineHeight:1.1,
        }}>
          Analyse your granite
        </h1>
        <p style={{fontSize:12,color:"#3a3830",marginBottom:20,fontWeight:300,lineHeight:1.6}}>
          Place a 1m reference stick beside the block before photographing for best accuracy
        </p>
      </div>

      {/* Scanner */}
      <div style={{padding:"20px",maxWidth:600,margin:"0 auto"}}>
        <StoneScanner />
      </div>

      {/* Bottom nav */}
      <nav className="no-print" style={{
        position:"fixed",bottom:0,left:0,right:0,
        background:"rgba(10,9,8,.98)",
        backdropFilter:"blur(20px)",
        borderTop:"1px solid rgba(184,146,42,.1)",
        display:"grid",gridTemplateColumns:"repeat(4,1fr)",
        zIndex:50,
      }}>
        {[
          {href:"/dashboard",icon:"◈",label:"Home"},
          {href:"/scan",icon:"📷",label:"Scan",fab:true},
          {href:"/vault",icon:"📦",label:"Vault"},
          {href:"/pricing",icon:"💳",label:"Plans"},
        ].map(({href,icon,label,fab})=>(
          <Link key={href} href={href} style={{
            display:"flex",flexDirection:"column",alignItems:"center",
            justifyContent:"center",gap:3,padding:"10px 0",
            color:href==="/scan"?"#b8922a":"#3a3830",textDecoration:"none",
          }}>
            {fab
              ? <div style={{width:46,height:46,marginTop:-18,
                  background:"linear-gradient(135deg,#8a6018,#b8922a,#d4a843)",
                  borderRadius:"50%",display:"flex",alignItems:"center",
                  justifyContent:"center",fontSize:18,color:"#0a0908",
                  boxShadow:"0 4px 20px rgba(184,146,42,.35)"}}>
                  {icon}
                </div>
              : <span style={{fontSize:18}}>{icon}</span>
            }
            <span style={{fontSize:8,letterSpacing:".12em",textTransform:"uppercase"}}>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
