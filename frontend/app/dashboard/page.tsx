"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";
import Link from "next/link";

const G = {
  dark:   "#0a0908",
  dark2:  "#111009",
  dark3:  "#1a1814",
  dark4:  "#242118",
  border: "#2a2620",
  border2:"#3a3528",
  gold:   "#c9a84c",
  goldL:  "#e8c96a",
  goldD:  "#8a6820",
  text:   "#f0ebe0",
  text2:  "#b8b09a",
  text3:  "#6a6050",
  green:  "#2d9e6b",
  red:    "#c0392b",
  amber:  "#d4840a",
};

export default function DashboardPage() {
  const supabase = createClient();
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [sharing, setSharing] = useState<string|null>(null);

  useEffect(() => {
    async function load() {
      // Always refresh session from Supabase — don't rely only on localStorage
      let { data: { session } } = await supabase.auth.getSession();
      
      // If no session, try to refresh the token
      if (!session) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        session = refreshed.session;
      }
      
      if (!session) { window.location.href = "/login"; return; }
      
      // Save fresh token
      localStorage.setItem("sv_token", session.access_token);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/me`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        if (res.status === 401) { window.location.href = "/login"; return; }
        if (res.status === 403) { window.location.href = "/signup"; return; }
        if (!res.ok) throw new Error(`Error ${res.status}`);
        setData(await res.json());
      } catch(e: any) { setError(e.message); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  async function getPDF(stone: any) {
    const token = localStorage.getItem("sv_token");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pdf/${stone.scan_code}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) { alert("PDF failed"); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `StoneVision-${stone.scan_code}.pdf`; a.click();
    URL.revokeObjectURL(url);
  }

  async function shareStone(stone: any) {
    setSharing(stone.id);
    const text = `🪨 *${stone.variety}* — ${stone.scan_code}\n📐 ${stone.length_cm}×${stone.width_cm}×${stone.height_cm} cm\n🏷️ Grade ${stone.quality_grade}\n\n⚠️ AI estimate — verify before commercial use\n\n${stone.public_link||""}`;
    if (navigator.share) {
      try { await navigator.share({ title: `StoneVision — ${stone.variety}`, text, url: stone.public_link||"" }); } catch(_) {}
    } else {
      await navigator.clipboard.writeText(text);
    }
    setSharing(null);
  }

  const card = {
    background: G.dark3,
    border: `1px solid ${G.border}`,
    borderRadius: 20,
    padding: 20,
  };

  if (loading) return (
    <div style={{minHeight:"100vh",background:G.dark,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <div style={{fontFamily:"serif",fontSize:24,color:G.gold}}>◈ StoneVision</div>
      <div style={{width:32,height:32,border:`2px solid ${G.gold}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{minHeight:"100vh",background:G.dark,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{...card,maxWidth:360,width:"100%",textAlign:"center"}}>
        <div style={{color:"#e74c3c",marginBottom:16,fontSize:14}}>{error}</div>
        <button onClick={()=>window.location.reload()} style={{background:G.gold,color:G.dark,padding:"10px 24px",borderRadius:12,border:"none",fontWeight:700,cursor:"pointer"}}>Retry</button>
      </div>
    </div>
  );

  const co  = data?.company || {};
  const sub = data?.subscription || {};
  const plan= data?.plan || {};
  const used = sub.scans_used || 0;
  const limit = sub.scans_limit || 100;
  const pct = Math.min(100, Math.round((used/limit)*100));
  const barColor = pct>=90?"#e74c3c":pct>=70?"#f39c12":G.green;

  return (
    <div style={{minHeight:"100vh",background:G.dark,color:G.text,fontFamily:"Outfit,sans-serif",paddingBottom:80}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&family=Playfair+Display:wght@400;600;700&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .fade{animation:fadeUp .4s ease forwards}
        .card-h{transition:all .2s}
        .card-h:hover{border-color:rgba(201,168,76,.25)!important;transform:translateY(-1px)}
        .btn-g{background:linear-gradient(135deg,#8a6820,#c9a84c,#e8c96a);transition:opacity .2s;border:none;cursor:pointer}
        .btn-g:hover{opacity:.88}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-track{background:${G.dark2}}
        ::-webkit-scrollbar-thumb{background:${G.border2};border-radius:2px}
      `}</style>

      {/* NAV */}
      <nav style={{
        position:"sticky",top:0,zIndex:50,
        background:"rgba(10,9,8,.95)",backdropFilter:"blur(20px)",
        borderBottom:`1px solid ${G.border}`,
        padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"
      }}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{
            width:34,height:34,borderRadius:10,
            background:`linear-gradient(135deg,${G.goldD},${G.gold})`,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:16,color:G.dark,fontWeight:"bold"
          }}>◈</div>
          <div>
            <div style={{color:G.gold,fontWeight:600,fontSize:13,letterSpacing:1}}>StoneVision AI</div>
            <div style={{color:G.text3,fontSize:9,letterSpacing:2,textTransform:"uppercase"}}>{co.city||"Melur"} · Granite</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <Link href="/admin" style={{fontSize:11,color:G.text3,textDecoration:"none",padding:"6px 12px",border:`1px solid ${G.border}`,borderRadius:8}}>⚙ Admin</Link>
          <button onClick={async()=>{await supabase.auth.signOut();localStorage.removeItem("sv_token");window.location.href="/login";}}
            style={{fontSize:11,color:G.text3,background:"none",border:"none",cursor:"pointer",padding:"6px 4px"}}>Sign out</button>
        </div>
      </nav>

      <div style={{maxWidth:480,margin:"0 auto",padding:"20px 16px",display:"flex",flexDirection:"column",gap:16}}>

        {/* HERO */}
        <div className="fade" style={{
          background:`linear-gradient(135deg,${G.dark3},${G.dark4})`,
          border:`1px solid ${G.border}`,borderRadius:24,padding:24,
          position:"relative",overflow:"hidden"
        }}>
          <div style={{position:"absolute",right:-10,top:"50%",transform:"translateY(-50%)",fontSize:100,color:`${G.gold}08`,fontFamily:"serif",lineHeight:1,pointerEvents:"none"}}>◈</div>
          <div style={{fontSize:10,color:G.text3,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>Welcome back</div>
          <div style={{fontFamily:"Playfair Display,serif",fontSize:26,color:G.text,lineHeight:1.2,marginBottom:4}}>
            {co.name||"Your Company"}
          </div>
          <div style={{fontSize:12,color:G.text3,marginBottom:20}}>{co.city||"Melur"}, Tamil Nadu</div>
          <Link href="/scan" className="btn-g" style={{
            display:"inline-flex",alignItems:"center",gap:8,
            color:G.dark,padding:"12px 24px",borderRadius:14,
            fontSize:13,fontWeight:700,textDecoration:"none",
            boxShadow:`0 6px 24px rgba(201,168,76,.3)`
          }}>
            📷 Scan New Block
          </Link>
        </div>

        {/* SUBSCRIPTION */}
        <div className="fade" style={{...card}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
            <div>
              <div style={{fontSize:10,color:G.text3,letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>Plan</div>
              <div style={{color:G.gold,fontWeight:600,fontSize:15}}>{plan.display_name||"Free Trial"}</div>
            </div>
            <div style={{
              background:`${G.gold}18`,border:`1px solid ${G.gold}30`,
              borderRadius:999,padding:"4px 12px",fontSize:10,color:G.gold,fontWeight:600
            }}>
              {limit===-1?"Unlimited":limit} scans
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:G.text3,marginBottom:6}}>
            <span>Usage</span><span>{used} / {limit===-1?"∞":limit}</span>
          </div>
          <div style={{height:6,background:G.border,borderRadius:99,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${pct}%`,background:barColor,borderRadius:99,transition:"width .5s"}}/>
          </div>
          <div style={{marginTop:8,fontSize:11,color:G.text3}}>
            {limit===-1?"Unlimited scans":`${limit-used} remaining`}
            {sub.trial_ends_at && sub.plan_id==="trial" && (
              <span style={{color:G.amber,marginLeft:8}}>
                · Trial ends {new Date(sub.trial_ends_at).toLocaleDateString("en-IN",{day:"2-digit",month:"short"})}
              </span>
            )}
          </div>
        </div>

        {/* STATS */}
        <div className="fade" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {[
            {label:"Scans Used",val:used,color:G.gold},
            {label:"Remaining",val:limit===-1?"∞":Math.max(0,limit-used),color:G.green},
          ].map(s=>(
            <div key={s.label} style={{
              background:G.dark3,border:`1px solid ${G.border}`,borderRadius:16,padding:16,textAlign:"center"
            }}>
              <div style={{fontFamily:"Playfair Display,serif",fontSize:32,color:s.color,fontWeight:700}}>{s.val}</div>
              <div style={{fontSize:9,color:G.text3,letterSpacing:2,textTransform:"uppercase",marginTop:4}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* DISCLAIMER */}
        <div style={{
          background:"rgba(212,132,10,.06)",border:"1px solid rgba(212,132,10,.2)",
          borderRadius:14,padding:"12px 16px",fontSize:11,color:"#b8a070",lineHeight:1.6
        }}>
          <span style={{color:G.amber,fontWeight:600}}>⚠ AI Estimates:</span> All outputs are ±5–15% estimates. Verify independently before commercial contracts.
        </div>

        {/* RECENT BLOCKS */}
        <div className="fade" style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontSize:10,color:G.text3,letterSpacing:2,textTransform:"uppercase"}}>Recent Blocks</div>
        </div>

        <RecentStones supabase={supabase} token={localStorage.getItem("sv_token")||""} getPDF={getPDF} shareStone={shareStone} sharing={sharing} />

      </div>

      {/* BOTTOM NAV */}
      <nav style={{
        position:"fixed",bottom:0,left:0,right:0,
        background:"rgba(10,9,8,.97)",backdropFilter:"blur(20px)",
        borderTop:`1px solid ${G.border}`,
        display:"grid",gridTemplateColumns:"repeat(4,1fr)",zIndex:50
      }}>
        {[
          {href:"/dashboard",icon:"◈",label:"Home"},
          {href:"/scan",icon:"📷",label:"Scan",fab:true},
          {href:"/vault",icon:"📦",label:"Vault"},
          {href:"/pricing",icon:"💳",label:"Plans"},
        ].map(({href,icon,label,fab})=>(
          <Link key={href} href={href} style={{
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
            gap:4,padding:"10px 0",color:G.text3,textDecoration:"none",
            transition:"color .2s",position:"relative"
          }}
          onMouseEnter={e=>(e.currentTarget.style.color=G.gold)}
          onMouseLeave={e=>(e.currentTarget.style.color=G.text3)}>
            {fab ? (
              <div style={{
                width:48,height:48,marginTop:-20,
                background:`linear-gradient(135deg,${G.goldD},${G.gold})`,
                borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:20,color:G.dark,boxShadow:`0 4px 20px rgba(201,168,76,.35)`
              }}>{icon}</div>
            ) : <span style={{fontSize:20}}>{icon}</span>}
            <span style={{fontSize:9,letterSpacing:2,textTransform:"uppercase"}}>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

function RecentStones({supabase,token,getPDF,shareStone,sharing}: any) {
  const [stones,setStones] = useState<any[]>([]);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    supabase.from("stones").select("id,scan_code,variety,quality_grade,length_cm,width_cm,height_cm,total_value_inr,scanned_at,image_url,public_link")
      .eq("is_archived",false).order("scanned_at",{ascending:false}).limit(10)
      .then(({data}:any)=>{setStones(data||[]);setLoading(false);});
  },[]);

  if (loading) return <div style={{textAlign:"center",color:"#3a3428",fontSize:12,padding:20}}>Loading…</div>;

  if (stones.length===0) return (
    <div style={{background:"#1a1814",border:"1px solid #2a2620",borderRadius:20,padding:40,textAlign:"center"}}>
      <div style={{fontSize:40,marginBottom:12}}>📷</div>
      <div style={{fontFamily:"serif",color:"#6a6050",marginBottom:4}}>No blocks yet</div>
      <div style={{fontSize:11,color:"#4a4438"}}>Tap Scan to analyse your first block</div>
    </div>
  );

  const gradeColor = (g:string) => g==="A1"?"#2d9e6b":g==="A2"?"#d4840a":"#c0392b";

  return (
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {stones.map((s:any)=>(
        <div key={s.id} className="card-h" style={{
          background:"#1a1814",border:"1px solid #2a2620",borderRadius:20,overflow:"hidden"
        }}>
          <div style={{display:"flex",gap:14,padding:"16px 16px 12px"}}>
            <div style={{
              width:50,height:50,borderRadius:12,background:"#242118",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,overflow:"hidden"
            }}>
              {s.image_url ? <img src={s.image_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : "🪨"}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                <span style={{fontFamily:"serif",fontSize:15,color:"#f0ebe0"}}>{s.variety||"Unknown"}</span>
                <span style={{
                  fontSize:9,padding:"2px 8px",borderRadius:999,fontWeight:600,
                  background:`${gradeColor(s.quality_grade)}20`,
                  border:`1px solid ${gradeColor(s.quality_grade)}40`,
                  color:gradeColor(s.quality_grade)
                }}>{s.quality_grade}</span>
              </div>
              <div style={{fontSize:11,color:"#6a6050"}}>
                {s.length_cm}×{s.width_cm}×{s.height_cm} cm · {s.scan_code}
              </div>
              {s.total_value_inr && (
                <div style={{fontSize:11,color:"#c9a84c",marginTop:2}}>
                  Est. ₹{s.total_value_inr.toLocaleString("en-IN")}
                </div>
              )}
            </div>
          </div>
          <div style={{display:"flex",borderTop:"1px solid #2a2620"}}>
            {[
              {label:"📄 PDF",  color:"#5b8dd9", fn:()=>getPDF(s)},
              {label:"💬 Share",color:"#2d9e6b", fn:()=>shareStone(s), disabled:sharing===s.id},
              {label:"👁 View", color:"#c9a84c", href:s.public_link},
            ].map((a,i)=>(
              a.href ? (
                <a key={i} href={a.href} target="_blank" rel="noopener" style={{
                  flex:1,padding:"10px 0",textAlign:"center",fontSize:11,color:a.color,
                  textDecoration:"none",borderRight:i<2?"1px solid #2a2620":"none"
                }}>{a.label}</a>
              ) : (
                <button key={i} onClick={a.fn} disabled={a.disabled} style={{
                  flex:1,padding:"10px 0",fontSize:11,color:a.color,background:"none",
                  border:"none",borderRight:i<2?"1px solid #2a2620":"none",cursor:"pointer",
                  opacity:a.disabled?0.5:1
                }}>{sharing===s.id&&a.label.includes("Share")?"…":a.label}</button>
              )
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
