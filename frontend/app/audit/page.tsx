import Link from "next/link";

export default function AuditPage() {
  const services = [
    {
      id: "pre_shipment",
      icon: "🚢",
      title: "Pre-Shipment Inspection",
      desc: "Physical block measurement before your container loads. Certified report accepted by most banks for LC documentation.",
      price: "Rs.4,000",
      duration: "4-6 hours",
      blocks: "Up to 50 blocks",
      color: "#5b8dd9",
    },
    {
      id: "full_audit",
      icon: "📋",
      title: "Full Quarry Audit",
      desc: "Complete inventory audit with calibrated tools. Ideal for large orders. Includes photo documentation and signed report.",
      price: "Rs.6,000",
      duration: "Full day",
      blocks: "Up to 100 blocks",
      color: "#c9a84c",
    },
    {
      id: "customs_docs",
      icon: "📜",
      title: "Customs Documentation Verification",
      desc: "Our team verifies your export documents against physical stock. Prevents customs delays and LC discrepancies.",
      price: "Rs.2,500",
      duration: "2-3 hours",
      blocks: "Document check",
      color: "#2d9e6b",
    },
  ];

  return (
    <div style={{minHeight:"100vh",background:"#0a0908",color:"#f0ebe0",fontFamily:"sans-serif",paddingBottom:80}}>
      <style>{"@import url(\'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&family=Playfair+Display:wght@400;600;700&display=swap\');"}</style>

      <nav style={{position:"sticky",top:0,zIndex:50,background:"rgba(10,9,8,.97)",borderBottom:"1px solid #2a2620",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <Link href="/dashboard" style={{color:"#c9a84c",textDecoration:"none",fontSize:20}}>←</Link>
          <div>
            <div style={{color:"#c9a84c",fontWeight:600,fontSize:14}}>Physical Audit Services</div>
            <div style={{color:"#4a4438",fontSize:9,letterSpacing:2,textTransform:"uppercase"}}>StoneVision AI · Melur-Madurai</div>
          </div>
        </div>
        <Link href="/audit/book" style={{background:"linear-gradient(135deg,#8a6820,#c9a84c)",color:"#0a0908",padding:"8px 16px",borderRadius:10,fontSize:12,fontWeight:700,textDecoration:"none"}}>
          Book Now
        </Link>
      </nav>

      <div style={{maxWidth:700,margin:"0 auto",padding:"32px 16px"}}>

        {/* VALUE PROPOSITION */}
        <div style={{background:"rgba(201,168,76,.05)",border:"1px solid rgba(201,168,76,.2)",borderRadius:20,padding:24,marginBottom:32,textAlign:"center"}}>
          <div style={{fontSize:11,color:"#c9a84c",letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>Why Book a Physical Audit?</div>
          <h1 style={{fontFamily:"Playfair Display,serif",fontSize:28,color:"#f0ebe0",marginBottom:12,lineHeight:1.2}}>
            Turn AI Estimates into Certified Measurements
          </h1>
          <p style={{fontSize:13,color:"#8a8070",lineHeight:1.7,marginBottom:20}}>
            AI scanning gives you a fast 30-second estimate. Physical audit gives your foreign buyer 
            a <strong style={{color:"#c9a84c"}}>legally signed document</strong> they can use for Letter of Credit, 
            customs declarations, and quality disputes — before the container ships.
          </p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
            {[
              {icon:"🏦",label:"LC Accepted",desc:"Banks accept our certified reports"},
              {icon:"🛃",label:"Customs Ready",desc:"Prevents delays at port of entry"},
              {icon:"🤝",label:"Buyer Trust",desc:"Signed report builds international credibility"},
            ].map(b=>(
              <div key={b.label} style={{background:"#1a1814",borderRadius:12,padding:14,border:"1px solid #2a2620"}}>
                <div style={{fontSize:22,marginBottom:6}}>{b.icon}</div>
                <div style={{fontSize:11,color:"#c9a84c",fontWeight:600,marginBottom:4}}>{b.label}</div>
                <div style={{fontSize:10,color:"#6a6050",lineHeight:1.4}}>{b.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ELEVATOR PITCH */}
        <div style={{background:"rgba(45,158,107,.06)",border:"1px solid rgba(45,158,107,.2)",borderRadius:14,padding:16,marginBottom:28,display:"flex",gap:14,alignItems:"flex-start"}}>
          <span style={{fontSize:28,flexShrink:0}}>💡</span>
          <div>
            <div style={{fontSize:12,color:"#2d9e6b",fontWeight:600,marginBottom:4}}>For Foreign Exporters</div>
            <p style={{fontSize:12,color:"#8a9e8a",lineHeight:1.6,margin:0}}>
              Stop losing orders to trust gaps. Our auditors visit your Indian supplier, physically measure every granite block, 
              and hand you a certified report — in English or your local language — before you commit to payment. 
              Book once, receive a report that protects your investment from quarry to container.
            </p>
          </div>
        </div>

        {/* SERVICE CARDS */}
        <div style={{fontSize:10,color:"#6a6050",letterSpacing:2,textTransform:"uppercase",marginBottom:14}}>Select a Service</div>
        <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:28}}>
          {services.map(s=>(
            <div key={s.id} style={{background:"#1a1814",border:"1px solid #2a2620",borderRadius:18,overflow:"hidden"}}>
              <div style={{display:"flex",gap:16,padding:"18px 18px 14px"}}>
                <div style={{fontSize:36,flexShrink:0,width:52,textAlign:"center"}}>{s.icon}</div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
                    <span style={{fontFamily:"Playfair Display,serif",fontSize:17,color:"#f0ebe0"}}>{s.title}</span>
                    <span style={{fontSize:9,padding:"2px 10px",borderRadius:999,border:`1px solid ${s.color}40`,color:s.color,fontWeight:600}}>{s.price}</span>
                  </div>
                  <p style={{fontSize:12,color:"#8a8070",lineHeight:1.6,margin:"0 0 10px"}}>{s.desc}</p>
                  <div style={{display:"flex",gap:16,fontSize:10,color:"#4a4438"}}>
                    <span>⏱ {s.duration}</span>
                    <span>📦 {s.blocks}</span>
                  </div>
                </div>
              </div>
              <div style={{borderTop:"1px solid #2a2620",padding:"0"}}>
                <Link href={`/audit/book?service=${s.id}`} style={{
                  display:"block",textAlign:"center",padding:"12px",
                  fontSize:12,fontWeight:600,textDecoration:"none",
                  color:s.color,background:`${s.color}08`
                }}>
                  Book {s.title} →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* PROCESS */}
        <div style={{background:"#1a1814",border:"1px solid #2a2620",borderRadius:18,padding:22,marginBottom:28}}>
          <div style={{fontSize:11,color:"#6a6050",letterSpacing:2,textTransform:"uppercase",marginBottom:16}}>How It Works</div>
          {[
            {n:"01",title:"Book Online",desc:"Select service, choose date and time slot, provide quarry location."},
            {n:"02",title:"Auditor Assigned",desc:"We assign a trained auditor within 4 hours and confirm via WhatsApp."},
            {n:"03",title:"Physical Visit",desc:"Auditor arrives with calibrated tools, measures every block, documents with photos."},
            {n:"04",title:"Certified Report",desc:"Signed report delivered digitally within 2 hours of audit completion."},
          ].map(s=>(
            <div key={s.n} style={{display:"flex",gap:14,marginBottom:16}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:"rgba(201,168,76,.1)",border:"1px solid rgba(201,168,76,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#c9a84c",fontWeight:700,flexShrink:0}}>{s.n}</div>
              <div>
                <div style={{fontSize:13,color:"#f0ebe0",fontWeight:500,marginBottom:2}}>{s.title}</div>
                <div style={{fontSize:11,color:"#6a6050",lineHeight:1.5}}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <Link href="/audit/book" style={{
          display:"block",textAlign:"center",
          background:"linear-gradient(135deg,#8a6820,#c9a84c,#e8c96a)",
          color:"#0a0908",padding:"16px",borderRadius:14,
          fontSize:14,fontWeight:700,textDecoration:"none",
          boxShadow:"0 6px 24px rgba(201,168,76,.3)"
        }}>
          📋 Schedule Your Audit Now
        </Link>
      </div>
    </div>
  );
}
