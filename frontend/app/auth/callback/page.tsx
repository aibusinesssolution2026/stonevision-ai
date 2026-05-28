"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";

export default function AuthCallbackPage() {
  const supabase = createClient();
  const [status, setStatus] = useState("Signing you in…");

  useEffect(() => {
    async function go() {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        setTimeout(async () => {
          const { data: d2 } = await supabase.auth.getSession();
          if (d2.session) {
            localStorage.setItem("sv_token", d2.session.access_token);
            route(d2.session.user.id, supabase);
          } else {
            window.location.href = "/login";
          }
        }, 2000);
        return;
      }
      localStorage.setItem("sv_token", data.session.access_token);
      route(data.session.user.id, supabase);
    }

    async function route(uid: string, sb: any) {
      setStatus("Loading your dashboard…");
      const { data: p } = await sb.from("user_profiles").select("company_id").eq("id", uid).single();
      window.location.href = p?.company_id ? "/dashboard" : "/signup";
    }

    go();
  }, []);

  return (
    <div style={{
      minHeight:"100vh",background:"#0c0c0b",
      display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",gap:20,
      fontFamily:"'Manrope',sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Manrope:wght@300;400;500&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}
      `}</style>
      <div style={{width:64,height:64,borderRadius:16,background:"rgba(26,24,20,.9)",border:"1px solid rgba(184,146,42,.2)",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <img src="/logo.png" alt="" style={{width:48,height:48,objectFit:"contain",borderRadius:10}}/>
      </div>
      <div style={{width:32,height:32,border:"1.5px solid rgba(184,146,42,.4)",borderTopColor:"#b8922a",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
      <p style={{fontSize:13,color:"#5a5850",letterSpacing:".06em",fontWeight:300,animation:"pulse 2s ease-in-out infinite"}}>
        {status}
      </p>
    </div>
  );
}
