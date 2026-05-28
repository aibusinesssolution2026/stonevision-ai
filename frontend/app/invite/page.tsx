"use client";
import { useState } from "react";
import Link from "next/link";

const AUDIT_TYPES = [
  {id:"pre_shipment",    label:"Pre-Shipment Inspection",      icon:"🚢"},
  {id:"factory_audit",  label:"Factory Compliance Audit",      icon:"🏭"},
  {id:"customs_docs",   label:"Customs Documentation Check",   icon:"📜"},
  {id:"quality_control",label:"Quality Control Verification",  icon:"🔍"},
];

interface InviteForm {
  supplier_company: string;
  contact_person:   string;
  email:            string;
  whatsapp:         string;
  audit_type:       string;
  notes:            string;
}

const EMPTY: InviteForm = {
  supplier_company:"", contact_person:"", email:"",
  whatsapp:"", audit_type:"pre_shipment", notes:"",
};

export default function InviteSupplierPage() {
  const [form,    setForm]    = useState<InviteForm>(EMPTY);
  const [busy,    setBusy]    = useState(false);
  const [result,  setResult]  = useState<{token:string; url:string; whatsapp_link:string}|null>(null);
  const [errors,  setErrors]  = useState<Partial<InviteForm>>({});

  const upd = (k: keyof InviteForm, v: string) => {
    setForm(f => ({...f,[k]:v}));
    setErrors(e => ({...e,[k]:""}));
  };

  function validate(): boolean {
    const e: Partial<InviteForm> = {};
    if (!form.supplier_company.trim()) e.supplier_company = "Required";
    if (!form.contact_person.trim())   e.contact_person   = "Required";
    if (!form.email.match(/^[^@]+@[^@]+\.[^@]+$/)) e.email = "Valid email required";
    if (!form.whatsapp.match(/^\+?[0-9]{10,15}$/)) e.whatsapp = "Valid phone required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setBusy(true);
    try {
      const token = localStorage.getItem("sv_token") || "";
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/invite/supplier`,
        {
          method: "POST",
          headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
          body: JSON.stringify(form),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(data);
    } catch(e:any) {
      alert("Error: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  const inp = (err?:string) => ({
    width:"100%", background:"#1a1814",
    border: `1px solid ${err?"#c0392b":"#2a2620"}`,
    color:"#f0ebe0", borderRadius:10,
    padding:"11px 14px", fontSize:13, outline:"none",
    boxSizing:"border-box" as const,
  });
  const lbl = {fontSize:11, color:"#6a6050", display:"block", marginBottom:5, letterSpacing:1, textTransform:"uppercase" as const};
  const err = {fontSize:10, color:"#c0392b", marginTop:3};

  if (result) return (
    <div style={{minHeight:"100vh",background:"#0a0908",display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:"sans-serif"}}>
      <div style={{background:"#1a1814",border:"1px solid rgba(45,158,107,.3)",borderRadius:24,padding:32,maxWidth:480,width:"100%"}}>
        <div style={{fontSize:40,textAlign:"center",marginBottom:16}}>✅</div>
        <h2 style={{fontSize:22,color:"#f0ebe0",textAlign:"center",marginBottom:8}}>Invitation Sent!</h2>
        <p style={{fontSize:13,color:"#8a8070",textAlign:"center",lineHeight:1.6,marginBottom:24}}>
          {form.contact_person} at {form.supplier_company} has been invited to schedule their audit.
        </p>

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {/* Tokenized link */}
          <div style={{background:"#242118",border:"1px solid #3a3528",borderRadius:12,padding:14}}>
            <div style={{fontSize:10,color:"#c9a84c",letterSpacing:2,marginBottom:6}}>SECURE INVITE LINK</div>
            <div style={{fontSize:11,color:"#b8b09a",wordBreak:"break-all" as const,marginBottom:8}}>{result.url}</div>
            <button onClick={()=>navigator.clipboard.writeText(result.url)}
              style={{fontSize:11,color:"#c9a84c",background:"none",border:"1px solid rgba(201,168,76,.3)",borderRadius:7,padding:"5px 12px",cursor:"pointer"}}>
              Copy Link
            </button>
          </div>

          {/* WhatsApp send */}
          <a href={result.whatsapp_link} target="_blank" rel="noopener"
            style={{display:"flex",alignItems:"center",gap:10,background:"rgba(45,158,107,.1)",border:"1px solid rgba(45,158,107,.3)",borderRadius:12,padding:14,textDecoration:"none"}}>
            <span style={{fontSize:24}}>💬</span>
            <div>
              <div style={{fontSize:12,color:"#2d9e6b",fontWeight:600}}>Send via WhatsApp</div>
              <div style={{fontSize:10,color:"#6a6050"}}>Opens pre-filled message to {form.whatsapp}</div>
            </div>
          </a>

          {/* Email note */}
          <div style={{background:"rgba(91,141,217,.08)",border:"1px solid rgba(91,141,217,.2)",borderRadius:12,padding:14,fontSize:11,color:"#8a9ebf",lineHeight:1.6}}>
            📧 A professional email has been sent to <strong style={{color:"#f0ebe0"}}>{form.email}</strong> with the audit request and booking instructions.
          </div>
        </div>

        <button onClick={()=>{setResult(null);setForm(EMPTY);}} style={{width:"100%",marginTop:20,background:"linear-gradient(135deg,#8a6820,#c9a84c)",color:"#0a0908",border:"none",borderRadius:12,padding:"13px",fontSize:13,fontWeight:700,cursor:"pointer"}}>
          Invite Another Supplier
        </button>
        <Link href="/dashboard" style={{display:"block",textAlign:"center",marginTop:12,color:"#6a6050",textDecoration:"none",fontSize:12}}>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#0a0908",color:"#f0ebe0",fontFamily:"sans-serif",paddingBottom:60}}>
      <nav style={{position:"sticky",top:0,zIndex:50,background:"rgba(10,9,8,.97)",borderBottom:"1px solid #2a2620",padding:"13px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Link href="/dashboard" style={{color:"#c9a84c",textDecoration:"none",fontSize:18}}>←</Link>
          <div>
            <div style={{color:"#c9a84c",fontWeight:600,fontSize:14}}>Invite Supplier</div>
            <div style={{color:"#4a4438",fontSize:9,letterSpacing:2,textTransform:"uppercase"}}>Request Physical Audit</div>
          </div>
        </div>
        <Link href="/dashboard" style={{fontSize:11,color:"#6a6050",textDecoration:"none",border:"1px solid #2a2620",padding:"6px 12px",borderRadius:8}}>Dashboard</Link>
      </nav>

      <div style={{maxWidth:560,margin:"0 auto",padding:"28px 16px"}}>

        {/* Value prop */}
        <div style={{background:"rgba(201,168,76,.05)",border:"1px solid rgba(201,168,76,.15)",borderRadius:16,padding:18,marginBottom:24}}>
          <div style={{fontSize:11,color:"#c9a84c",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Why Invite Your Supplier?</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[
              {icon:"🏦",text:"Banks accept our certified audit reports for LC documentation"},
              {icon:"🛃",text:"Prevents costly customs delays at port of entry"},
              {icon:"🤝",text:"Builds trust with transparent pre-shipment verification"},
              {icon:"📄",text:"Multilingual certified PDF delivered in 24 hours"},
            ].map(b=>(
              <div key={b.text} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                <span style={{fontSize:16,flexShrink:0}}>{b.icon}</span>
                <span style={{fontSize:11,color:"#8a8070",lineHeight:1.5}}>{b.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <h2 style={{fontSize:22,color:"#f0ebe0",marginBottom:6}}>Supplier Details</h2>
        <p style={{fontSize:12,color:"#6a6050",marginBottom:22,lineHeight:1.6}}>
          We will send your supplier a professional invitation with audit booking instructions.
        </p>

        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div>
            <label style={lbl}>Supplier Company Name *</label>
            <input value={form.supplier_company} onChange={e=>upd("supplier_company",e.target.value)}
              placeholder="Melur Granite Exports Pvt Ltd" style={inp(errors.supplier_company)}/>
            {errors.supplier_company && <div style={err}>{errors.supplier_company}</div>}
          </div>

          <div>
            <label style={lbl}>Contact Person Name *</label>
            <input value={form.contact_person} onChange={e=>upd("contact_person",e.target.value)}
              placeholder="Mr. Selva Kumar" style={inp(errors.contact_person)}/>
            {errors.contact_person && <div style={err}>{errors.contact_person}</div>}
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={lbl}>Email Address *</label>
              <input type="email" value={form.email} onChange={e=>upd("email",e.target.value)}
                placeholder="supplier@company.com" style={inp(errors.email)}/>
              {errors.email && <div style={err}>{errors.email}</div>}
            </div>
            <div>
              <label style={lbl}>WhatsApp Number *</label>
              <input type="tel" value={form.whatsapp} onChange={e=>upd("whatsapp",e.target.value)}
                placeholder="+91 98765 43210" style={inp(errors.whatsapp)}/>
              {errors.whatsapp && <div style={err}>{errors.whatsapp}</div>}
            </div>
          </div>

          <div>
            <label style={lbl}>Audit Type *</label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {AUDIT_TYPES.map(a=>(
                <button key={a.id} onClick={()=>upd("audit_type",a.id)} style={{
                  display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:12,
                  cursor:"pointer",textAlign:"left",
                  background:form.audit_type===a.id?"rgba(201,168,76,.08)":"#1a1814",
                  border:`${form.audit_type===a.id?"2":"1"}px solid ${form.audit_type===a.id?"#c9a84c":"#2a2620"}`,
                  color:"#f0ebe0",
                }}>
                  <span style={{fontSize:20}}>{a.icon}</span>
                  <span style={{fontSize:11,lineHeight:1.4}}>{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={lbl}>Additional Notes</label>
            <textarea value={form.notes} onChange={e=>upd("notes",e.target.value)}
              placeholder="Specific requirements, shipment details, container number..."
              rows={3} style={{...inp(),"resize":"vertical" as const}}/>
          </div>

          <button onClick={submit} disabled={busy} style={{
            width:"100%",background:"linear-gradient(135deg,#8a6820,#c9a84c,#e8c96a)",
            color:"#0a0908",border:"none",borderRadius:12,padding:"15px",
            fontSize:14,fontWeight:700,cursor:"pointer",opacity:busy?0.6:1,
            boxShadow:"0 6px 24px rgba(201,168,76,.3)",
          }}>
            {busy?"Generating Invite...":"📨 Send Audit Invitation"}
          </button>

          <div style={{fontSize:10,color:"#3a3428",textAlign:"center",lineHeight:1.6}}>
            Your supplier receives a professional email + WhatsApp with a secure tokenized booking link.
            Their data is isolated and encrypted. Only you can see their audit results.
          </div>
        </div>
      </div>
    </div>
  );
}
