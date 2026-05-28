"use client";
import Link from "next/link";

const STATUS_STEPS = [
  {id:"pending",    label:"Pending Assignment", icon:"⏳", desc:"Booking received. Assigning auditor.",         color:"#d4840a"},
  {id:"confirmed",  label:"Auditor Confirmed",  icon:"✅", desc:"Auditor assigned and on the way.",             color:"#2d9e6b"},
  {id:"in_progress",label:"Audit In Progress",  icon:"🔍", desc:"Physical measurement underway at your site.",  color:"#5b8dd9"},
  {id:"completed",  label:"Report Delivered",   icon:"📄", desc:"Certified report sent to your WhatsApp.",      color:"#c9a84c"},
];

export default function AuditStatusPage() {
  return (
    <div style={{minHeight:"100vh",background:"#0a0908",color:"#f0ebe0",fontFamily:"sans-serif",paddingBottom:60}}>
      <nav style={{position:"sticky",top:0,zIndex:50,background:"rgba(10,9,8,.97)",borderBottom:"1px solid #2a2620",padding:"14px 20px",display:"flex",alignItems:"center",gap:12}}>
        <Link href="/audit" style={{color:"#c9a84c",textDecoration:"none",fontSize:20}}>←</Link>
        <div>
          <div style={{color:"#c9a84c",fontWeight:600,fontSize:14}}>Audit Status</div>
          <div style={{color:"#4a4438",fontSize:9,letterSpacing:2,textTransform:"uppercase"}}>Track your booking</div>
        </div>
      </nav>

      <div style={{maxWidth:500,margin:"0 auto",padding:"32px 16px"}}>

        {/* Status flow diagram */}
        <div style={{background:"#1a1814",border:"1px solid #2a2620",borderRadius:20,padding:24,marginBottom:24}}>
          <div style={{fontSize:11,color:"#6a6050",letterSpacing:2,textTransform:"uppercase",marginBottom:20}}>Booking Status Flow</div>
          {STATUS_STEPS.map((s,i)=>(
            <div key={s.id} style={{display:"flex",gap:14,marginBottom:i<STATUS_STEPS.length-1?0:0}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:36}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:`${s.color}15`,border:`2px solid ${s.color}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>
                  {s.icon}
                </div>
                {i < STATUS_STEPS.length-1 && <div style={{width:2,flex:1,background:"#2a2620",minHeight:24,margin:"4px 0"}}/>}
              </div>
              <div style={{paddingBottom:i<STATUS_STEPS.length-1?20:0,paddingTop:4}}>
                <div style={{fontSize:13,color:s.color,fontWeight:600,marginBottom:3}}>{s.label}</div>
                <div style={{fontSize:11,color:"#6a6050",lineHeight:1.5}}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* WhatsApp check */}
        <div style={{background:"rgba(45,158,107,.06)",border:"1px solid rgba(45,158,107,.2)",borderRadius:14,padding:18,marginBottom:20,textAlign:"center"}}>
          <div style={{fontSize:28,marginBottom:8}}>💬</div>
          <div style={{fontSize:13,color:"#2d9e6b",fontWeight:600,marginBottom:6}}>Check Your WhatsApp</div>
          <div style={{fontSize:11,color:"#6a6050",lineHeight:1.6,marginBottom:14}}>
            All status updates are sent directly to the WhatsApp number you provided during booking. Check for messages from +91 9655071432.
          </div>
          <a href="https://wa.me/919655071432" target="_blank" rel="noopener" style={{display:"inline-block",background:"#2d9e6b",color:"#fff",padding:"10px 20px",borderRadius:10,fontSize:12,fontWeight:600,textDecoration:"none"}}>
            Open WhatsApp Chat
          </a>
        </div>

        {/* Actions */}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <Link href="/audit/book" style={{display:"block",textAlign:"center",background:"linear-gradient(135deg,#8a6820,#c9a84c)",color:"#0a0908",padding:"13px",borderRadius:12,fontSize:13,fontWeight:700,textDecoration:"none"}}>
            Book Another Audit
          </Link>
          <Link href="/dashboard" style={{display:"block",textAlign:"center",background:"#1a1814",border:"1px solid #2a2620",color:"#6a6050",padding:"13px",borderRadius:12,fontSize:13,textDecoration:"none"}}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
