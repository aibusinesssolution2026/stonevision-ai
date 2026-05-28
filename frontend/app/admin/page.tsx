"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase-client";

interface Company {
  company_id: string; name: string; owner_email: string; whatsapp: string;
  city: string; plan_id: string; display_name: string; is_active: boolean;
  is_founder: boolean; scans_used: number; scans_limit: number; usage_pct: number;
  trial_ends: string|null; billing_ends: string|null; payment_ref: string|null;
  payment_mode: string|null; notes: string|null;
  addon_branding: boolean; addon_trust_gallery: boolean; addon_api_access: boolean;
  joined: string;
}
interface Stats { total_companies:number; active_accounts:number; trial_accounts:number; paid_accounts:number; scans_today:number; total_revenue_inr:number; }
interface Toast { msg:string; ok:boolean; }

const API = process.env.NEXT_PUBLIC_API_URL || "";

const PLANS = [
  { id:"basic",   label:"Basic",   price:10000, founder:5000,  scans:200  },
  { id:"elite",   label:"Elite",   price:20000, founder:10000, scans:500  },
  { id:"premium", label:"Premium", price:30000, founder:15000, scans:1500 },
  { id:"ultra",   label:"Ultra",   price:50000, founder:25000, scans:-1   },
];

const PLAN_STYLE: Record<string,string> = {
  trial:   "badge-trial",
  basic:   "badge-basic",
  elite:   "badge-elite",
  premium: "badge-premium",
  ultra:   "badge-ultra",
};

export default function AdminPanel() {
  const supabase = createClient();
  const [token,    setToken]    = useState("");
  const [cos,      setCos]      = useState<Company[]>([]);
  const [stats,    setStats]    = useState<Stats|null>(null);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("all");
  const [modal,    setModal]    = useState<"plan"|"addon"|"suspend"|null>(null);
  const [sel,      setSel]      = useState<Company|null>(null);
  const [busy,     setBusy]     = useState(false);
  const [toast,    setToast]    = useState<Toast|null>(null);
  const [planId,   setPlanId]   = useState("elite");
  const [amount,   setAmount]   = useState("");
  const [founder,  setFounder]  = useState(false);
  const [months,   setMonths]   = useState("1");
  const [payRef,   setPayRef]   = useState("");
  const [payMode,  setPayMode]  = useState("upi");
  const [note,     setNote]     = useState("");
  const [suspendR, setSuspendR] = useState("");
  const [addonId,  setAddonId]  = useState("branding");
  const [addonAmt, setAddonAmt] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { window.location.href="/login"; return; }
      setToken(data.session.access_token);
    });
  }, []);

  useEffect(() => { if (token) { load(); loadStats(); } }, [token]);

  const api = useCallback(async (path:string, opts:RequestInit={}) => {
    const res = await fetch(`${API}${path}`, {
      ...opts,
      headers: { Authorization:`Bearer ${token}`, "Content-Type":"application/json", ...((opts.headers||{}) as Record<string,string>) },
    });
    if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.detail||`HTTP ${res.status}`); }
    return res.json();
  }, [token]);

  const showToast = (msg:string, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),4000); };

  async function load() {
    setLoading(true);
    try { const d = await api("/admin/companies"); setCos(d.companies||[]); }
    catch(e:unknown) { showToast((e as Error).message, false); }
    finally { setLoading(false); }
  }

  async function loadStats() {
    try { const d = await api("/admin/stats"); setStats(d); } catch(_) {}
  }

  function openModal(co:Company, m:typeof modal) {
    setSel(co); setModal(m);
    const p = co.plan_id==="trial"?"elite":co.plan_id;
    setPlanId(p);
    const plan = PLANS.find(x=>x.id===p);
    setAmount(String(plan?.price||""));
    setFounder(co.is_founder); setMonths("1");
    setPayRef(co.payment_ref||""); setPayMode(co.payment_mode||"upi");
    setNote(""); setSuspendR(""); setAddonAmt("2000");
  }

  async function activatePlan() {
    if (!sel||!planId||!amount) { showToast("Fill all fields","err" as unknown as false); return; }
    setBusy(true);
    try {
      const d = await api("/admin/activate-plan", { method:"POST", body:JSON.stringify({
        company_id:sel.company_id, plan_id:planId, amount_inr:parseInt(amount),
        is_founder:founder, months:parseInt(months), payment_ref:payRef||null,
        payment_mode:payMode, notes:note||null,
      })});
      showToast(`✓ ${d.company} activated on ${d.plan}`);
      setModal(null); load(); loadStats();
    } catch(e:unknown) { showToast((e as Error).message,false); }
    finally { setBusy(false); }
  }

  async function activateAddon() {
    if (!sel) return;
    setBusy(true);
    try {
      await api("/admin/activate-addon", { method:"POST", body:JSON.stringify({
        company_id:sel.company_id, addon:addonId, amount_inr:parseInt(addonAmt)||0,
        payment_ref:payRef||null, notes:note||null,
      })});
      showToast(`✓ ${addonId} activated`); setModal(null); load();
    } catch(e:unknown) { showToast((e as Error).message,false); }
    finally { setBusy(false); }
  }

  async function toggleSuspend() {
    if (!sel) return;
    if (sel.is_active && !suspendR.trim()) { showToast("Enter a reason",false); return; }
    setBusy(true);
    try {
      if (sel.is_active) {
        await api(`/admin/suspend/${sel.company_id}`, {method:"POST",body:JSON.stringify({reason:suspendR})});
        showToast(`⚠ ${sel.name} suspended`,false);
      } else {
        await api(`/admin/reinstate/${sel.company_id}`, {method:"POST"});
        showToast(`✓ ${sel.name} reinstated`);
      }
      setModal(null); load();
    } catch(e:unknown) { showToast((e as Error).message,false); }
    finally { setBusy(false); }
  }

  const filtered = cos.filter(co => {
    const q = search.toLowerCase();
    const ms = !q || co.name.toLowerCase().includes(q) || co.owner_email.toLowerCase().includes(q);
    const mp = filter==="all" || co.plan_id===filter;
    return ms && mp;
  });

  const fmtDate = (s:string|null) => s ? new Date(s).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "—";
  const daysLeft = (s:string|null) => s ? Math.ceil((new Date(s).getTime()-Date.now())/86400000) : null;

  return (
    <div className="min-h-screen" style={{background:"var(--dark)"}}>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[9999] px-5 py-3 rounded-2xl text-sm font-medium shadow-2xl border transition-all fade-up
          ${toast.ok ? "bg-emerald-900/90 border-emerald-700/50 text-emerald-200" : "bg-red-900/90 border-red-700/50 text-red-200"}`}>
          {toast.msg}
        </div>
      )}

      {/* NAV */}
      <nav className="sticky top-0 z-50 glass border-b border-[#2a2620] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl btn-gold flex items-center justify-center">
              <span className="text-[#0a0908] font-bold text-base font-display">◈</span>
            </div>
            <div>
              <div className="text-[#c9a84c] font-semibold text-sm tracking-wide">StoneVision AI</div>
              <div className="text-[10px] text-[#4a4438] tracking-[.15em] uppercase">Admin Panel</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={()=>{load();loadStats();}}
              className="text-xs text-[#4a4438] hover:text-[#c9a84c] transition-colors px-3 py-1.5 border border-[#2a2620] rounded-xl hover:border-[#3a3528]">
              ↻ Refresh
            </button>
            <button onClick={()=>supabase.auth.signOut().then(()=>window.location.href="/login")}
              className="text-xs text-[#4a4438] hover:text-red-400 transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* STATS */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8 fade-up">
            {[
              { label:"Total",      val:stats.total_companies,   color:"text-[#f0ebe0]" },
              { label:"Active",     val:stats.active_accounts,   color:"text-emerald-400" },
              { label:"Trial",      val:stats.trial_accounts,    color:"text-[#c9a84c]" },
              { label:"Paid",       val:stats.paid_accounts,     color:"text-sky-400" },
              { label:"Scans Today",val:stats.scans_today,       color:"text-violet-400" },
              { label:"Revenue",    val:`₹${(stats.total_revenue_inr/100000).toFixed(1)}L`, color:"text-[#e8c96a]" },
            ].map(s => (
              <div key={s.label} className="stat-card cursor-pointer card-hover">
                <div className={`text-2xl font-bold font-display ${s.color}`}>{s.val}</div>
                <div className="text-[9px] tracking-[.15em] uppercase mt-1" style={{color:"var(--text-3)"}}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* FILTERS */}
        <div className="flex flex-wrap gap-3 mb-6 fade-up-1">
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search company, email…"
            className="input-sv flex-1 min-w-48 max-w-xs text-sm py-2.5 px-4 rounded-xl"/>
          <select value={filter} onChange={e=>setFilter(e.target.value)}
            className="input-sv w-auto text-sm py-2.5 px-4 rounded-xl cursor-pointer">
            <option value="all">All Plans</option>
            <option value="trial">Trial</option>
            {PLANS.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <div className="flex items-center text-xs px-3" style={{color:"var(--text-3)"}}>
            {filtered.length} of {cos.length}
          </div>
        </div>

        {/* COMPANY CARDS */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-2 border-[#c9a84c] border-t-transparent rounded-full spin-slow"/>
          </div>
        ) : (
          <div className="space-y-3 fade-up-2">
            {filtered.map(co => {
              const dl = daysLeft(co.plan_id==="trial" ? co.trial_ends : co.billing_ends);
              const urgent = dl !== null && dl <= 7 && co.is_active;
              const bar = Math.min(100, co.usage_pct||0);
              const barColor = bar>=90?"bg-red-500":bar>=70?"bg-amber-500":"bg-emerald-500";

              return (
                <div key={co.company_id}
                  className={`glass rounded-2xl overflow-hidden card-hover ${!co.is_active?"opacity-60":""}`}>

                  <div className="flex flex-wrap items-center gap-4 px-6 py-5">
                    {/* Status */}
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${co.is_active?"bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,.6)]":"bg-red-500"}`}/>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-semibold text-sm text-[#f0ebe0]">{co.name}</span>
                        {co.is_founder && <span className="text-[9px] bg-[#c9a84c]/15 border border-[#c9a84c]/30 text-[#c9a84c] px-2 py-0.5 rounded-full tracking-wide font-medium">FOUNDER 50%</span>}
                        {urgent && <span className="text-[9px] bg-amber-900/30 border border-amber-700/40 text-amber-400 px-2 py-0.5 rounded-full">⚡ {dl}d left</span>}
                      </div>
                      <div className="text-[11px]" style={{color:"var(--text-3)"}}>
                        {co.owner_email} · {co.city}
                      </div>
                    </div>

                    {/* Plan badge */}
                    <span className={`text-[10px] font-semibold px-3 py-1.5 rounded-full tracking-wide ${PLAN_STYLE[co.plan_id]||PLAN_STYLE.trial}`}>
                      {co.display_name||co.plan_id}
                    </span>

                    {/* Usage */}
                    <div className="w-36 hidden md:block">
                      <div className="flex justify-between text-[10px] mb-1" style={{color:"var(--text-3)"}}>
                        <span>Scans</span>
                        <span>{co.scans_used}/{co.scans_limit===-1?"∞":co.scans_limit}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{background:"var(--border)"}}>
                        <div className={`h-full rounded-full transition-all ${barColor}`} style={{width:`${bar}%`}}/>
                      </div>
                    </div>

                    {/* Expiry */}
                    <div className="text-right hidden lg:block">
                      <div className="text-[10px]" style={{color:"var(--text-3)"}}>
                        {co.plan_id==="trial"?"Trial ends":"Billing ends"}
                      </div>
                      <div className={`text-xs font-medium ${urgent?"text-amber-400":"text-[#b8b09a]"}`}>
                        {fmtDate(co.plan_id==="trial"?co.trial_ends:co.billing_ends)}
                      </div>
                    </div>
                  </div>

                  {/* Addons */}
                  {(co.addon_branding||co.addon_trust_gallery||co.addon_api_access) && (
                    <div className="px-6 pb-3 flex gap-2">
                      {co.addon_branding      && <span className="text-[9px] bg-violet-900/30 border border-violet-700/40 text-violet-300 px-2 py-0.5 rounded-full">🎨 Branding</span>}
                      {co.addon_trust_gallery && <span className="text-[9px] bg-sky-900/30 border border-sky-700/40 text-sky-300 px-2 py-0.5 rounded-full">🏆 Trust Gallery</span>}
                      {co.addon_api_access    && <span className="text-[9px] bg-emerald-900/30 border border-emerald-700/40 text-emerald-300 px-2 py-0.5 rounded-full">🔌 API</span>}
                    </div>
                  )}

                  {/* Notes */}
                  {co.notes && (
                    <div className="mx-6 mb-3 px-3 py-2 rounded-xl text-[11px] italic" style={{background:"var(--dark-4)",color:"var(--text-3)"}}>
                      📝 {co.notes}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 px-6 pb-5 pt-1">
                    <button onClick={()=>openModal(co,"plan")}
                      className="flex-1 min-w-28 btn-gold text-[#0a0908] text-xs font-semibold py-2.5 px-4 rounded-xl">
                      {co.plan_id==="trial"?"⚡ Activate Plan":"↻ Change Plan"}
                    </button>
                    <button onClick={()=>openModal(co,"addon")}
                      className="flex-1 min-w-24 text-xs py-2.5 px-4 rounded-xl border font-medium transition-colors hover:border-[#3a3528]"
                      style={{background:"var(--dark-4)",border:"1px solid var(--border)",color:"var(--text-2)"}}>
                      + Add-on
                    </button>
                    <button onClick={()=>openModal(co,"suspend")}
                      className={`flex-1 min-w-24 text-xs py-2.5 px-4 rounded-xl border font-medium transition-colors
                        ${co.is_active?"bg-red-900/20 border-red-900/40 text-red-400 hover:bg-red-900/30":"bg-emerald-900/20 border-emerald-900/40 text-emerald-400 hover:bg-emerald-900/30"}`}>
                      {co.is_active?"⏸ Suspend":"▶ Reinstate"}
                    </button>
                    {co.whatsapp && (
                      <a href={`https://wa.me/${co.whatsapp.replace(/\D/g,"")}?text=${encodeURIComponent(`Hello ${co.name.split(" ")[0]} sir, your StoneVision AI plan is now active! 🙏`)}`}
                        target="_blank" rel="noopener"
                        className="flex-shrink-0 text-emerald-500 text-xs py-2.5 px-4 rounded-xl border border-[#2a2620] hover:border-emerald-700/40 transition-colors"
                        style={{background:"var(--dark-4)"}}>
                        💬
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: Activate Plan */}
      {modal==="plan" && sel && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4"
          onClick={()=>setModal(null)}>
          <div className="glass rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e=>e.stopPropagation()}>
            <div className="p-7">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="font-display text-lg text-[#f0ebe0]">Activate Plan</h3>
                  <p className="text-sm mt-0.5" style={{color:"var(--text-3)"}}>{sel.name}</p>
                </div>
                <button onClick={()=>setModal(null)} className="text-[#4a4438] hover:text-[#f0ebe0] w-8 h-8 flex items-center justify-center text-xl transition-colors">✕</button>
              </div>

              {/* Plan selector */}
              <div className="grid grid-cols-2 gap-2 mb-5">
                {PLANS.map(p=>(
                  <button key={p.id} onClick={()=>{setPlanId(p.id);setAmount(String(founder?p.founder:p.price));}}
                    className={`p-3 rounded-2xl border text-left transition-all
                      ${planId===p.id?"border-[#c9a84c] bg-[#c9a84c]/8":"hover:border-[#3a3528]"}`}
                    style={{border:planId===p.id?"1px solid var(--gold)":"1px solid var(--border)",background:planId===p.id?"rgba(201,168,76,.08)":"var(--dark-3)"}}>
                    <div className="font-semibold text-sm text-[#f0ebe0]">{p.label}</div>
                    <div className="text-[10px] mt-0.5" style={{color:"var(--text-3)"}}>₹{p.price.toLocaleString("en-IN")}/mo</div>
                    <div className="text-[10px]" style={{color:"var(--text-3)"}}>{p.scans===-1?"Unlimited":p.scans} scans</div>
                  </button>
                ))}
              </div>

              {/* Founder */}
              <label className="flex items-center gap-3 mb-5 cursor-pointer p-3 rounded-xl" style={{background:"var(--dark-3)"}}>
                <input type="checkbox" checked={founder}
                  onChange={e=>{setFounder(e.target.checked);const p=PLANS.find(x=>x.id===planId);if(p)setAmount(String(e.target.checked?p.founder:p.price));}}
                  className="w-4 h-4 accent-[#c9a84c]"/>
                <span className="text-sm text-[#f0ebe0]">Founder Discount <span className="text-[#c9a84c] font-bold">50% off</span></span>
              </label>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-[10px] tracking-[.12em] uppercase mb-2 block" style={{color:"var(--text-3)"}}>Amount (₹) *</label>
                  <input type="number" value={amount} onChange={e=>setAmount(e.target.value)}
                    className="input-sv rounded-xl text-sm py-2.5"/>
                </div>
                <div>
                  <label className="text-[10px] tracking-[.12em] uppercase mb-2 block" style={{color:"var(--text-3)"}}>Months</label>
                  <select value={months} onChange={e=>setMonths(e.target.value)}
                    className="input-sv rounded-xl text-sm py-2.5 cursor-pointer">
                    {[1,2,3,6,12].map(m=><option key={m} value={m}>{m} month{m>1?"s":""}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-[10px] tracking-[.12em] uppercase mb-2 block" style={{color:"var(--text-3)"}}>Payment Mode</label>
                  <select value={payMode} onChange={e=>setPayMode(e.target.value)}
                    className="input-sv rounded-xl text-sm py-2.5 cursor-pointer">
                    <option value="upi">UPI / GPay</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] tracking-[.12em] uppercase mb-2 block" style={{color:"var(--text-3)"}}>Transaction Ref</label>
                  <input type="text" value={payRef} onChange={e=>setPayRef(e.target.value)}
                    placeholder="UPI-TXN-…" className="input-sv rounded-xl text-sm py-2.5"/>
                </div>
              </div>

              <div className="mb-6">
                <label className="text-[10px] tracking-[.12em] uppercase mb-2 block" style={{color:"var(--text-3)"}}>Note</label>
                <input type="text" value={note} onChange={e=>setNote(e.target.value)}
                  placeholder="e.g. GPay from Aryan Granites 21 May"
                  className="input-sv rounded-xl text-sm py-2.5"/>
              </div>

              <button onClick={activatePlan} disabled={busy||!amount||!planId}
                className="w-full btn-gold text-[#0a0908] font-semibold py-3.5 rounded-2xl text-sm disabled:opacity-30">
                {busy?"Activating…":`⚡ Activate ${PLANS.find(p=>p.id===planId)?.label}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Addon */}
      {modal==="addon" && sel && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4"
          onClick={()=>setModal(null)}>
          <div className="glass rounded-3xl w-full max-w-sm shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="p-7">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="font-display text-lg text-[#f0ebe0]">Add-on</h3>
                  <p className="text-sm mt-0.5" style={{color:"var(--text-3)"}}>{sel.name}</p>
                </div>
                <button onClick={()=>setModal(null)} className="text-[#4a4438] hover:text-[#f0ebe0] w-8 h-8 flex items-center justify-center text-xl">✕</button>
              </div>
              {[{id:"branding",label:"Custom Branding",price:2000,icon:"🎨"},{id:"trust_gallery",label:"Trust Gallery",price:1500,icon:"🏆"},{id:"api_access",label:"API Access",price:5000,icon:"🔌"}].map(a=>(
                <button key={a.id} onClick={()=>{setAddonId(a.id);setAddonAmt(String(a.price));}}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center gap-3 mb-2 transition-all
                    ${addonId===a.id?"border-[#c9a84c]":"hover:border-[#3a3528]"}`}
                  style={{border:addonId===a.id?"1px solid var(--gold)":"1px solid var(--border)",background:"var(--dark-3)"}}>
                  <span className="text-xl">{a.icon}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-[#f0ebe0]">{a.label}</div>
                    <div className="text-[10px]" style={{color:"var(--text-3)"}}>₹{a.price.toLocaleString("en-IN")}/mo</div>
                  </div>
                </button>
              ))}
              <div className="grid grid-cols-2 gap-3 mt-4 mb-5">
                <div>
                  <label className="text-[10px] tracking-[.12em] uppercase mb-2 block" style={{color:"var(--text-3)"}}>Amount (₹)</label>
                  <input type="number" value={addonAmt} onChange={e=>setAddonAmt(e.target.value)} className="input-sv rounded-xl text-sm py-2.5"/>
                </div>
                <div>
                  <label className="text-[10px] tracking-[.12em] uppercase mb-2 block" style={{color:"var(--text-3)"}}>Ref</label>
                  <input type="text" value={payRef} onChange={e=>setPayRef(e.target.value)} placeholder="TXN-…" className="input-sv rounded-xl text-sm py-2.5"/>
                </div>
              </div>
              <button onClick={activateAddon} disabled={busy}
                className="w-full btn-gold text-[#0a0908] font-semibold py-3.5 rounded-2xl text-sm disabled:opacity-30">
                {busy?"Activating…":"Activate Add-on"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Suspend */}
      {modal==="suspend" && sel && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4"
          onClick={()=>setModal(null)}>
          <div className="glass rounded-3xl w-full max-w-sm shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="p-7">
              <h3 className="font-display text-lg text-[#f0ebe0] mb-1">
                {sel.is_active?"⏸ Suspend Account":"▶ Reinstate Account"}
              </h3>
              <p className="text-sm mb-5" style={{color:"var(--text-3)"}}>{sel.name}</p>
              {sel.is_active ? (
                <>
                  <div className="bg-red-900/10 border border-red-900/30 rounded-xl p-4 text-xs text-red-300 mb-4 leading-relaxed">
                    This will immediately block all scans and PDF generation.
                  </div>
                  <input type="text" value={suspendR} onChange={e=>setSuspendR(e.target.value)}
                    placeholder="Reason (required)" className="input-sv rounded-xl text-sm py-2.5 mb-4"/>
                  <button onClick={toggleSuspend} disabled={busy||!suspendR.trim()}
                    className="w-full bg-red-900/40 border border-red-700/50 text-red-300 font-semibold py-3 rounded-2xl text-sm disabled:opacity-30 hover:bg-red-900/60 transition-colors">
                    {busy?"Suspending…":"Confirm Suspend"}
                  </button>
                </>
              ) : (
                <>
                  <div className="bg-emerald-900/10 border border-emerald-900/30 rounded-xl p-4 text-xs text-emerald-300 mb-4">
                    This will restore full access immediately.
                  </div>
                  <button onClick={toggleSuspend} disabled={busy}
                    className="w-full bg-emerald-900/40 border border-emerald-700/50 text-emerald-300 font-semibold py-3 rounded-2xl text-sm disabled:opacity-30 hover:bg-emerald-900/60 transition-colors">
                    {busy?"Reinstating…":"▶ Reinstate Account"}
                  </button>
                </>
              )}
              <button onClick={()=>setModal(null)} className="w-full mt-2 py-2.5 text-xs transition-colors" style={{color:"var(--text-3)"}}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
