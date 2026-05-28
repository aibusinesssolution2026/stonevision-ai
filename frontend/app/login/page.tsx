"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import Link from "next/link";

export default function LoginPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function loginGoogle() {
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) { setError(error.message); setLoading(false); }
  }

  return (
    <div style={{
      minHeight:"100vh",
      background:"#0a0908",
      display:"flex",
      fontFamily:"'Manrope',sans-serif",
      position:"relative",
      overflow:"hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Manrope:wght@300;400;500&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
        .fade1{animation:fadeUp .8s cubic-bezier(0.16,1,0.3,1) both}
        .fade2{animation:fadeUp .8s .1s cubic-bezier(0.16,1,0.3,1) both}
        .fade3{animation:fadeUp .8s .2s cubic-bezier(0.16,1,0.3,1) both}
        .g-btn{transition:all .3s cubic-bezier(0.16,1,0.3,1);cursor:pointer;}
        .g-btn:hover{transform:translateY(-2px);box-shadow:0 16px 48px rgba(0,0,0,.4);}
        .wa-btn{transition:all .3s cubic-bezier(0.16,1,0.3,1);}
        .wa-btn:hover{background:rgba(184,146,42,.08)!important;border-color:rgba(184,146,42,.45)!important;}
      `}</style>

      {/* Left panel — branding */}
      <div style={{
        flex:1,
        display:"flex",flexDirection:"column",
        justifyContent:"center",alignItems:"center",
        padding:64,
        borderRight:"1px solid rgba(184,146,42,.1)",
        background:"linear-gradient(160deg,#0f0d0a 0%,#0a0908 60%,#0c0a06 100%)",
        position:"relative",
        overflow:"hidden",
      }}>
        {/* Decorative radial */}
        <div style={{
          position:"absolute",top:"50%",left:"50%",
          transform:"translate(-50%,-50%)",
          width:600,height:600,
          background:"radial-gradient(circle,rgba(184,146,42,.06) 0%,transparent 65%)",
          pointerEvents:"none",
        }}/>
        {/* Corner lines */}
        <div style={{position:"absolute",top:40,left:40,width:48,height:48,borderTop:"1px solid rgba(184,146,42,.2)",borderLeft:"1px solid rgba(184,146,42,.2)"}}/>
        <div style={{position:"absolute",bottom:40,right:40,width:48,height:48,borderBottom:"1px solid rgba(184,146,42,.2)",borderRight:"1px solid rgba(184,146,42,.2)"}}/>

        <div className="fade1" style={{textAlign:"center",zIndex:1,maxWidth:420}}>
          {/* Logo on white pill so it's visible */}
          <div style={{
            width:120,height:120,
            borderRadius:28,
            background:"#ffffff",
            margin:"0 auto 32px",
            display:"flex",alignItems:"center",justifyContent:"center",
            boxShadow:"0 0 0 1px rgba(184,146,42,.3), 0 20px 60px rgba(0,0,0,.5), 0 0 80px rgba(184,146,42,.12)",
            padding:12,
          }}>
            <img src="/logo.png" alt="StoneVision AI" style={{width:"100%",height:"100%",objectFit:"contain"}}/>
          </div>

          <h1 style={{
            fontFamily:"'Cormorant Garamond',Georgia,serif",
            fontSize:44,fontWeight:300,
            color:"#ede8e0",
            letterSpacing:".06em",
            lineHeight:1,
            marginBottom:12,
          }}>StoneVision AI</h1>

          <div style={{
            fontSize:10,letterSpacing:".26em",textTransform:"uppercase",
            color:"#b8922a",fontWeight:500,marginBottom:40,
          }}>
            Precision Through Perception
          </div>

          {/* Tagline */}
          <p style={{
            fontFamily:"'Cormorant Garamond',Georgia,serif",
            fontSize:20,fontWeight:300,fontStyle:"italic",
            color:"rgba(237,232,224,.45)",
            lineHeight:1.6,
            marginBottom:48,
          }}>
            "Focus on closing the profitable deal — not preparing for it."
          </p>

          {/* Feature pills */}
          <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>
            {["30-sec AI scan","5 languages","QR certified","Physical audit"].map(f=>(
              <div key={f} style={{
                fontSize:10,letterSpacing:".1em",
                color:"rgba(184,146,42,.7)",
                border:"1px solid rgba(184,146,42,.18)",
                borderRadius:999,
                padding:"5px 14px",
                background:"rgba(184,146,42,.04)",
              }}>{f}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — sign in */}
      <div style={{
        width:480,flexShrink:0,
        display:"flex",flexDirection:"column",
        justifyContent:"center",
        padding:"64px 56px",
        background:"#0a0908",
      }}>

        <div className="fade2">
          <div style={{
            fontSize:10,letterSpacing:".22em",textTransform:"uppercase",
            color:"rgba(184,146,42,.5)",fontWeight:500,marginBottom:20,
            display:"flex",alignItems:"center",gap:10,
          }}>
            <span style={{width:24,height:"1px",background:"rgba(184,146,42,.3)",display:"inline-block"}}/>
            Exporter Portal
          </div>

          <h2 style={{
            fontFamily:"'Cormorant Garamond',Georgia,serif",
            fontSize:36,fontWeight:300,
            color:"#ede8e0",letterSpacing:".02em",
            marginBottom:8,lineHeight:1.1,
          }}>Welcome back</h2>
          <p style={{fontSize:13,color:"#3a3830",fontWeight:300,marginBottom:36,lineHeight:1.6}}>
            Sign in to verify, catalogue and share your granite blocks with international buyers.
          </p>
        </div>

        <div className="fade3" style={{display:"flex",flexDirection:"column",gap:14}}>

          {error && (
            <div style={{
              background:"rgba(180,50,40,.1)",border:"1px solid rgba(180,50,40,.2)",
              borderRadius:6,padding:"10px 14px",
              color:"#c06858",fontSize:12,lineHeight:1.5,
            }}>
              {error}
            </div>
          )}

          {/* Google button */}
          <button className="g-btn" onClick={loginGoogle} disabled={loading} style={{
            width:"100%",
            display:"flex",alignItems:"center",justifyContent:"center",gap:12,
            background:"#fdfcfa",
            border:"none",
            borderRadius:6,
            padding:"15px 20px",
            opacity:loading?0.7:1,
          }}>
            {loading ? (
              <div style={{width:18,height:18,border:"2px solid #2a2418",borderTopColor:"transparent",borderRadius:"50%",animation:"spin .9s linear infinite"}}/>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            <span style={{fontSize:14,fontWeight:500,color:"#1a1410",letterSpacing:".02em"}}>
              {loading?"Redirecting…":"Continue with Google"}
            </span>
          </button>

          {/* Divider */}
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{flex:1,height:"1px",background:"rgba(255,255,255,.05)"}}/>
            <span style={{fontSize:10,color:"#2a2820",letterSpacing:".1em"}}>OR</span>
            <div style={{flex:1,height:"1px",background:"rgba(255,255,255,.05)"}}/>
          </div>

          {/* WhatsApp access */}
          <a className="wa-btn"
            href="https://wa.me/919655071432?text=Hi%20StoneVision%20AI%2C%20I%20want%20to%20access%20the%20platform%20to%20scan%20my%20granite%20blocks%20and%20generate%20multilingual%20PDF%20catalogs.%20Please%20help%20me%20get%20started."
            target="_blank" rel="noopener"
            style={{
              width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:10,
              background:"transparent",
              border:"1px solid rgba(184,146,42,.18)",
              borderRadius:6,padding:"14px 20px",
              textDecoration:"none",
            }}>
            <svg viewBox="0 0 24 24" fill="#b8922a" style={{width:18,height:18,flexShrink:0}}>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM11.99 2C6.478 2 2 6.478 2 11.99c0 1.76.46 3.4 1.26 4.84L2 22l5.26-1.24a9.94 9.94 0 004.73 1.19C17.5 21.95 22 17.47 22 11.96 22 6.46 17.5 2 11.99 2z"/>
            </svg>
            <span style={{fontSize:12,fontWeight:400,color:"rgba(184,146,42,.7)",letterSpacing:".05em"}}>
              Request access via WhatsApp
            </span>
          </a>

          {/* Footer */}
          <div style={{paddingTop:16,borderTop:"1px solid rgba(255,255,255,.04)"}}>
            <p style={{fontSize:12,color:"#2a2820",marginBottom:8,textAlign:"center"}}>
              New exporter?{" "}
              <Link href="/signup" style={{color:"#b8922a",textDecoration:"none",fontWeight:500}}>
                Create account →
              </Link>
            </p>
            <p style={{fontSize:10,color:"#1e1c18",lineHeight:1.7,textAlign:"center"}}>
              By signing in you accept our{" "}
              <Link href="/terms" style={{color:"#2a2820",textDecoration:"underline"}}>Terms</Link>
              {" & "}
              <Link href="/terms" style={{color:"#2a2820",textDecoration:"underline"}}>Privacy Policy</Link>.
              AI outputs are estimates only.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile: hide left panel below 768px */}
      <style>{`
        @media(max-width:768px){
          div[style*="flex:1"]{display:none!important}
          div[style*="width:480px"]{width:100%!important;padding:48px 28px!important}
        }
      `}</style>
    </div>
  );
}
