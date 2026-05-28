"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase-client";

const LINKS = [
  {href:"/dashboard", icon:"◈",  label:"Home"},
  {href:"/scan",      icon:"📷", label:"Scan", fab:true},
  {href:"/vault",     icon:"📦", label:"Vault"},
  {href:"/pricing",   icon:"💳", label:"Plans"},
];

export function TopNav({title, subtitle, back}: {title:string; subtitle?:string; back?:string}) {
  const pathname = usePathname();
  const supabase = createClient();

  return (
    <nav style={{position:"sticky",top:0,zIndex:50,background:"rgba(10,9,8,.97)",backdropFilter:"blur(20px)",borderBottom:"1px solid #2a2620",padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",fontFamily:"sans-serif"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        {back && <Link href={back} style={{color:"#c9a84c",textDecoration:"none",fontSize:20,lineHeight:1,marginRight:4}}>←</Link>}
        <div style={{width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#8a6820,#c9a84c)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#0a0908",fontWeight:"bold"}}>◈</div>
        <div>
          <div style={{color:"#c9a84c",fontWeight:600,fontSize:13}}>{title}</div>
          {subtitle && <div style={{color:"#4a4438",fontSize:9,letterSpacing:2,textTransform:"uppercase"}}>{subtitle}</div>}
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <Link href="/dashboard" style={{fontSize:11,color:pathname==="/dashboard"?"#c9a84c":"#6a6050",textDecoration:"none",padding:"5px 10px",borderRadius:7,background:pathname==="/dashboard"?"rgba(201,168,76,.1)":"transparent",border:"1px solid #2a2620"}}>
          Dashboard
        </Link>
        <button onClick={async()=>{await supabase.auth.signOut();localStorage.removeItem("sv_token");window.location.href="/login";}}
          style={{fontSize:11,color:"#6a6050",background:"none",border:"none",cursor:"pointer",padding:"5px"}}>
          Sign out
        </button>
      </div>
    </nav>
  );
}

export function BottomNav({active}: {active?:string}) {
  const pathname = usePathname();
  const current = active || pathname;

  return (
    <nav style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(10,9,8,.97)",backdropFilter:"blur(20px)",borderTop:"1px solid #2a2620",display:"grid",gridTemplateColumns:"repeat(4,1fr)",zIndex:50,fontFamily:"sans-serif"}}>
      {LINKS.map(({href,icon,label,fab})=>{
        const isActive = current === href || (href !== "/" && current?.startsWith(href));
        return (
          <Link key={href} href={href} style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,padding:"10px 0",color:isActive?"#c9a84c":"#6a6050",textDecoration:"none"}}>
            {fab
              ? <div style={{width:46,height:46,marginTop:-18,background:"linear-gradient(135deg,#8a6820,#c9a84c)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:"#0a0908",boxShadow:"0 4px 16px rgba(201,168,76,.35)"}}>{icon}</div>
              : <span style={{fontSize:18}}>{icon}</span>
            }
            <span style={{fontSize:9,letterSpacing:1,textTransform:"uppercase",marginTop:fab?4:0}}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
