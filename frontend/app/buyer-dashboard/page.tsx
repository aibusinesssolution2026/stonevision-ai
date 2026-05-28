"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase-client";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────
interface Manifest {
  id: string;
  stone_id: string;
  company_id: string;
  verification_status: "pending_upload"|"supplier_submitted"|"buyer_verified"|"disputed";
  carrier_name: string|null;
  container_number: string|null;
  bill_of_lading: string|null;
  vessel_name: string|null;
  port_of_loading: string|null;
  port_of_discharge: string|null;
  etd: string|null;
  eta: string|null;
  verified_at: string|null;
  disputed_at: string|null;
  dispute_reason: string|null;
  exporter_notes: string|null;
  buyer_notes: string|null;
  data_snapshot_hash: string|null;
  snapshot_taken_at: string|null;
  created_at: string;
  // joined
  stones: {
    scan_code: string;
    variety: string;
    quality_grade: string;
    length_cm: number;
    width_cm: number;
    height_cm: number;
    volume_cft: number;
    variety_confidence: number;
    measurement_confidence: number;
    image_url: string|null;
    public_link: string|null;
    ai_flags: string[];
    scanned_at: string;
  };
  companies: { name: string; city: string; whatsapp: string|null; };
}

interface Stats {
  total: number; pending: number; submitted: number;
  verified: number; disputed: number;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const STATUS_CONFIG = {
  pending_upload:    { label: "Awaiting upload",  color: "text-stone-400",   bg: "bg-stone-800/50 border-stone-700/50"  },
  supplier_submitted:{ label: "Ready to verify",  color: "text-amber-400",   bg: "bg-amber-900/30 border-amber-700/40"  },
  buyer_verified:    { label: "Verified & locked", color: "text-emerald-400", bg: "bg-emerald-900/30 border-emerald-700/40"},
  disputed:          { label: "Disputed",          color: "text-red-400",     bg: "bg-red-900/30 border-red-700/40"      },
};

export default function BuyerDashboard() {
  const supabase = createClient();
  const [token,      setToken]      = useState("");
  const [manifests,  setManifests]  = useState<Manifest[]>([]);
  const [stats,      setStats]      = useState<Stats>({ total:0,pending:0,submitted:0,verified:0,disputed:0 });
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState<Manifest|null>(null);
  const [filter,     setFilter]     = useState<string>("all");
  const [busy,       setBusy]       = useState(false);
  const [toast,      setToast]      = useState<{msg:string;ok:boolean}|null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteCompany, setInviteCompany] = useState("");
  const [inviteLink, setInviteLink] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { window.location.href = "/login"; return; }
      setToken(data.session.access_token);
    });
  }, []);

  useEffect(() => { if (token) load(); }, [token]);

  const api = useCallback(async (path: string, opts: RequestInit = {}) => {
    const res = await fetch(`${API}${path}`, {
      ...opts,
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", ...((opts.headers||{}) as Record<string,string>) },
    });
    if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.detail||`HTTP ${res.status}`); }
    return res.json();
  }, [token]);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  async function load() {
    setLoading(true);
    try {
      const d = await api("/api/buyer/manifests");
      const ms: Manifest[] = d.manifests || [];
      setManifests(ms);
      setStats({
        total:     ms.length,
        pending:   ms.filter(m=>m.verification_status==="pending_upload").length,
        submitted: ms.filter(m=>m.verification_status==="supplier_submitted").length,
        verified:  ms.filter(m=>m.verification_status==="buyer_verified").length,
        disputed:  ms.filter(m=>m.verification_status==="disputed").length,
      });
    } catch(e: unknown) { showToast((e as Error).message, false); }
    finally { setLoading(false); }
  }

  async function verify(manifest: Manifest) {
    setBusy(true);
    try {
      await api(`/api/buyer/manifests/${manifest.id}/verify`, { method: "POST" });
      showToast("Manifest verified and locked");
      await load();
      setSelected(null);
    } catch(e: unknown) { showToast((e as Error).message, false); }
    finally { setBusy(false); }
  }

  async function dispute(manifest: Manifest) {
    if (!disputeReason.trim()) { showToast("Enter a reason for the dispute", false); return; }
    setBusy(true);
    try {
      await api(`/api/buyer/manifests/${manifest.id}/dispute`, {
        method: "POST", body: JSON.stringify({ reason: disputeReason }),
      });
      showToast("Dispute raised — exporter notified");
      setDisputeReason(""); await load(); setSelected(null);
    } catch(e: unknown) { showToast((e as Error).message, false); }
    finally { setBusy(false); }
  }

  async function createInvite() {
    if (!invitePhone.trim()) { showToast("Enter WhatsApp number", false); return; }
    setBusy(true);
    try {
      const d = await api("/api/buyer/invite", {
        method: "POST",
        body: JSON.stringify({ whatsapp: invitePhone, company_name: inviteCompany }),
      });
      const link = d.invite_url;
      setInviteLink(link);
      const name = inviteCompany || "sir";
      const waMsg = `Hello ${name} 🙏\n\nWe require all upcoming container manifests for our global accounts to be verified via StoneVision AI's Gemini Vision pipeline.\n\nPlease tap this link to activate your 25-scan trial, upload the blocks, and generate our Verified PDFs instantly:\n\n${link}\n\nThank you.`;
      window.open(`https://wa.me/${invitePhone.replace(/\D/g,"")}?text=${encodeURIComponent(waMsg)}`, "_blank");
    } catch(e: unknown) { showToast((e as Error).message, false); }
    finally { setBusy(false); }
  }

  const filtered = filter === "all" ? manifests : manifests.filter(m => m.verification_status === filter);
  const fmtDate  = (s: string|null) => s ? new Date(s).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "—";
  const conf     = (v: number) => `${Math.round(v)}%`;

  return (
    <div className="min-h-screen bg-[#0c0b09] text-[#e8e2d4] font-mono">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[9999] px-5 py-3 rounded-xl text-sm border shadow-2xl
          ${toast.ok ? "bg-emerald-900/90 border-emerald-600/50 text-emerald-200"
                     : "bg-red-900/90 border-red-600/50 text-red-200"}`}>
          {toast.msg}
        </div>
      )}

      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-[#0c0b09]/95 backdrop-blur border-b border-[#2a2520] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-[#8a6820] to-[#c9a84c] rounded-lg flex items-center justify-center text-[#0c0b09] font-black text-sm">◈</div>
          <div>
            <div className="text-[#c9a84c] font-bold text-sm">StoneVision AI</div>
            <div className="text-[10px] text-[#4a4438] tracking-widest uppercase">Buyer Portal</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowInvite(true)}
            className="text-xs bg-[#c9a84c] text-[#0c0b09] font-bold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
            + Invite Exporter
          </button>
          <button onClick={() => load()} className="text-xs text-[#4a4438] hover:text-[#c9a84c] px-3 py-2 border border-[#2a2520] rounded-lg">
            ↻
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* STATS */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {[
            { label: "Total",     value: stats.total,     color: "text-[#e8e2d4]" },
            { label: "Awaiting",  value: stats.pending,   color: "text-stone-400"  },
            { label: "To Verify", value: stats.submitted, color: "text-amber-400"  },
            { label: "Verified",  value: stats.verified,  color: "text-emerald-400"},
            { label: "Disputed",  value: stats.disputed,  color: "text-red-400"    },
          ].map(s => (
            <div key={s.label} className="bg-[#161310] border border-[#2a2520] rounded-xl p-4 text-center cursor-pointer hover:border-[#3a3228]"
              onClick={() => setFilter(
                s.label==="Awaiting"  ? "pending_upload" :
                s.label==="To Verify" ? "supplier_submitted" :
                s.label==="Verified"  ? "buyer_verified" :
                s.label==="Disputed"  ? "disputed" : "all"
              )}>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[9px] tracking-widest uppercase text-[#4a4438] mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* DISCLAIMER */}
        <div className="bg-amber-900/10 border border-amber-700/20 rounded-xl px-5 py-3 mb-5 text-xs text-amber-300/80 leading-relaxed">
          <span className="font-bold text-amber-400">Important:</span> All dimensions are AI estimates with ±5–15% margin. Verify with certified survey before issuing Letters of Credit, customs declarations, or final contracts. StoneVision AI provides verification workflow tools — not certified measurement services.
        </div>

        {/* FILTER ROW */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {["all","pending_upload","supplier_submitted","buyer_verified","disputed"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-[11px] px-3 py-1.5 rounded-full border transition-all ${
                filter===f ? "border-[#c9a84c] bg-[#c9a84c]/10 text-[#c9a84c]"
                           : "border-[#2a2520] text-[#4a4438] hover:border-[#3a3228]"
              }`}>
              {f==="all" ? "All" : STATUS_CONFIG[f as keyof typeof STATUS_CONFIG]?.label || f}
            </button>
          ))}
        </div>

        {/* MANIFEST LIST */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">📦</div>
            <div className="text-[#4a4438] text-sm">
              {manifests.length === 0
                ? "No manifests yet — invite exporters to get started"
                : "No manifests match this filter"}
            </div>
            {manifests.length === 0 && (
              <button onClick={() => setShowInvite(true)}
                className="mt-4 text-xs bg-[#c9a84c] text-[#0c0b09] font-bold px-5 py-2.5 rounded-lg">
                + Invite Your First Exporter
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(m => {
              const st = STATUS_CONFIG[m.verification_status];
              const stone = m.stones;
              return (
                <div key={m.id}
                  className={`border rounded-2xl overflow-hidden cursor-pointer transition-all hover:border-[#3a3228] ${st.bg}`}
                  onClick={() => setSelected(m)}>
                  <div className="flex flex-wrap items-center gap-4 p-5">
                    {/* Stone image or placeholder */}
                    <div className="w-16 h-16 rounded-xl bg-[#1e1b16] border border-[#2a2520] flex-shrink-0 overflow-hidden">
                      {stone?.image_url
                        ? <img src={stone.image_url} alt="" className="w-full h-full object-cover"/>
                        : <div className="w-full h-full flex items-center justify-center text-2xl">🪨</div>}
                    </div>
                    {/* Stone info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-sm text-[#e8e2d4]">{stone?.variety || "—"}</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${st.bg} ${st.color}`}>
                          {st.label}
                        </span>
                        {stone?.quality_grade && (
                          <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold ${
                            stone.quality_grade==="A1" ? "bg-emerald-900/40 border-emerald-700/40 text-emerald-400" :
                            stone.quality_grade==="A2" ? "bg-amber-900/40 border-amber-700/40 text-amber-400" :
                            "bg-red-900/40 border-red-700/40 text-red-400"}`}>
                            Grade {stone.quality_grade}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#4a4438]">
                        {stone?.length_cm} × {stone?.width_cm} × {stone?.height_cm} cm
                        {stone?.volume_cft ? ` · ${stone.volume_cft} cft` : ""}
                        {" · "}{m.companies?.name || "—"}, {m.companies?.city || ""}
                      </div>
                      <div className="text-[11px] text-[#4a4438] mt-0.5">
                        Scan: {stone?.scan_code || "—"}
                        {m.container_number ? ` · Container: ${m.container_number}` : ""}
                        {m.eta ? ` · ETA: ${fmtDate(m.eta)}` : ""}
                      </div>
                    </div>
                    {/* Confidence meters */}
                    <div className="hidden md:block text-right">
                      <div className="text-[10px] text-[#4a4438] mb-1">AI Confidence</div>
                      <div className="text-xs text-[#e8e2d4]">
                        Variety: {stone?.variety_confidence ? conf(stone.variety_confidence) : "—"}
                      </div>
                      <div className="text-xs text-[#e8e2d4]">
                        Dims: {stone?.measurement_confidence ? conf(stone.measurement_confidence) : "—"}
                      </div>
                    </div>
                    <div className="text-xs text-[#4a4438]">→</div>
                  </div>
                  {/* Shipping strip if data exists */}
                  {(m.carrier_name || m.port_of_discharge) && (
                    <div className="flex items-center gap-4 px-5 pb-4 text-[11px] text-[#4a4438]">
                      <span>📦 {m.carrier_name || "—"}</span>
                      <span>🚢 {m.port_of_loading || "Tuticorin"} → {m.port_of_discharge || "—"}</span>
                      {m.vessel_name && <span>🛳 {m.vessel_name}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══ MANIFEST DETAIL MODAL ══ */}
      {selected && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => { setSelected(null); setDisputeReason(""); }}>
          <div className="bg-[#161310] border border-[#3a3228] rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#2a2520]">
              <div>
                <div className="text-[#c9a84c] font-bold text-base">{selected.stones?.variety}</div>
                <div className="text-[11px] text-[#4a4438] mt-0.5">
                  {selected.stones?.scan_code} · {selected.companies?.name}
                </div>
              </div>
              <button onClick={() => { setSelected(null); setDisputeReason(""); }}
                className="text-[#4a4438] hover:text-[#e8e2d4] text-xl w-8 h-8 flex items-center justify-center">✕</button>
            </div>

            <div className="p-6 grid md:grid-cols-2 gap-6">

              {/* LEFT: Stone image + AI data */}
              <div>
                <div className="text-[10px] tracking-widest uppercase text-[#4a4438] mb-3">
                  Quarry photograph + AI analysis
                </div>
                <div className="rounded-xl overflow-hidden border border-[#2a2520] mb-4 bg-[#0c0b09]">
                  {selected.stones?.image_url
                    ? <img src={selected.stones.image_url} alt="Stone" className="w-full max-h-52 object-cover"/>
                    : <div className="h-40 flex items-center justify-center text-4xl">🪨</div>}
                </div>
                {/* AI dimensions */}
                <div className="bg-[#0c0b09] border border-[#2a2520] rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-[#1a1714] border-b border-[#2a2520] flex items-center gap-2">
                    <span className="text-[10px] tracking-widest uppercase text-[#4a4438]">Gemini Vision measurements</span>
                  </div>
                  {[
                    ["Length (est.)",     `${selected.stones?.length_cm} cm`],
                    ["Width (est.)",      `${selected.stones?.width_cm} cm`],
                    ["Height (est.)",     `${selected.stones?.height_cm} cm`],
                    ["Volume (est.)",     `${selected.stones?.volume_cft} cft`],
                    ["Grade",             selected.stones?.quality_grade || "—"],
                    ["Variety conf.",     selected.stones?.variety_confidence ? conf(selected.stones.variety_confidence) : "—"],
                    ["Dims conf.",        selected.stones?.measurement_confidence ? conf(selected.stones.measurement_confidence) : "—"],
                    ["Scanned",           fmtDate(selected.stones?.scanned_at)],
                  ].map(([k,v]) => (
                    <div key={k} className="flex justify-between px-4 py-2.5 border-b border-[#2a2520] last:border-0 text-xs">
                      <span className="text-[#4a4438]">{k}</span>
                      <span className="text-[#e8e2d4] font-medium">{v}</span>
                    </div>
                  ))}
                </div>
                {/* AI flags warning */}
                {(selected.stones?.ai_flags||[]).length > 0 && (
                  <div className="mt-3 bg-red-900/20 border border-red-700/30 rounded-xl px-4 py-3 text-xs text-red-400">
                    ⚠ AI flags: {(selected.stones?.ai_flags||[]).join(" · ")}
                  </div>
                )}
              </div>

              {/* RIGHT: Shipping + verification */}
              <div>
                <div className="text-[10px] tracking-widest uppercase text-[#4a4438] mb-3">
                  Shipment details
                </div>
                <div className="bg-[#0c0b09] border border-[#2a2520] rounded-xl overflow-hidden mb-4">
                  {[
                    ["Status",         STATUS_CONFIG[selected.verification_status]?.label || selected.verification_status],
                    ["Carrier",        selected.carrier_name || "Not submitted"],
                    ["Container",      selected.container_number || "Not submitted"],
                    ["Bill of Lading", selected.bill_of_lading || "Not submitted"],
                    ["Vessel",         selected.vessel_name || "Not submitted"],
                    ["Loading port",   selected.port_of_loading || "Tuticorin"],
                    ["Discharge port", selected.port_of_discharge || "Not submitted"],
                    ["ETD",            fmtDate(selected.etd)],
                    ["ETA",            fmtDate(selected.eta)],
                  ].map(([k,v]) => (
                    <div key={k} className="flex justify-between px-4 py-2.5 border-b border-[#2a2520] last:border-0 text-xs">
                      <span className="text-[#4a4438]">{k}</span>
                      <span className={`font-medium ${v==="Not submitted" ? "text-[#4a4438] italic" : "text-[#e8e2d4]"}`}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* Data integrity note */}
                {selected.data_snapshot_hash && (
                  <div className="bg-[#0c0b09] border border-[#2a2520] rounded-xl px-4 py-3 mb-4">
                    <div className="text-[10px] tracking-widest uppercase text-[#4a4438] mb-2">Data snapshot hash</div>
                    <div className="font-mono text-[9px] text-[#4a4438] break-all leading-relaxed">{selected.data_snapshot_hash}</div>
                    <div className="text-[10px] text-[#4a4438] mt-2 italic">
                      Recorded at time of submission. Not a tamper-proof certificate — for reference only.
                    </div>
                  </div>
                )}

                {/* Verified info */}
                {selected.verification_status === "buyer_verified" && selected.verified_at && (
                  <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-xl px-4 py-3 mb-4 text-xs text-emerald-400">
                    ✓ Verified and locked on {fmtDate(selected.verified_at)}
                  </div>
                )}

                {/* Dispute info */}
                {selected.verification_status === "disputed" && selected.dispute_reason && (
                  <div className="bg-red-900/20 border border-red-700/30 rounded-xl px-4 py-3 mb-4 text-xs text-red-400">
                    ⚠ Disputed: {selected.dispute_reason}
                  </div>
                )}

                {/* Exporter notes */}
                {selected.exporter_notes && (
                  <div className="bg-[#1a1714] border border-[#2a2520] rounded-xl px-4 py-3 mb-4 text-xs text-[#b8b0a0] italic">
                    Exporter note: {selected.exporter_notes}
                  </div>
                )}

                {/* Action buttons — only for supplier_submitted */}
                {selected.verification_status === "supplier_submitted" && (
                  <div className="space-y-3">
                    <div className="bg-amber-900/10 border border-amber-700/20 rounded-xl px-4 py-3 text-[11px] text-amber-300/80 leading-relaxed">
                      Verify only after independently confirming dimensions. AI estimates carry ±5–15% margin.
                    </div>
                    <button onClick={() => verify(selected)} disabled={busy}
                      className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition-colors text-sm disabled:opacity-40">
                      {busy ? "Processing…" : "✓ Verify & Lock Manifest"}
                    </button>
                    <div>
                      <input
                        type="text" value={disputeReason} onChange={e => setDisputeReason(e.target.value)}
                        placeholder="Reason for dispute (required before flagging)…"
                        className="w-full bg-[#0c0b09] border border-[#3a3228] rounded-xl px-4 py-2.5 text-xs text-[#e8e2d4] placeholder-[#3a3228] outline-none focus:border-red-700/50 mb-2"/>
                      <button onClick={() => dispute(selected)} disabled={busy || !disputeReason.trim()}
                        className="w-full bg-red-900/40 border border-red-700/50 text-red-400 font-bold py-2.5 rounded-xl hover:bg-red-900/60 transition-colors text-sm disabled:opacity-40">
                        {busy ? "…" : "⚠ Flag Dispute"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Public link */}
                {selected.stones?.public_link && (
                  <a href={selected.stones.public_link} target="_blank" rel="noopener"
                    className="mt-4 block text-center text-[11px] text-[#c9a84c] hover:underline">
                    View public catalog page →
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ INVITE EXPORTER MODAL ══ */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4"
          onClick={() => { setShowInvite(false); setInviteLink(""); }}>
          <div className="bg-[#161310] border border-[#3a3228] rounded-2xl w-full max-w-md"
            onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="text-[#c9a84c] font-bold text-base mb-1">Invite Exporter via WhatsApp</div>
              <div className="text-[11px] text-[#4a4438] mb-5 leading-relaxed">
                Send a secure invite link. The exporter signs up, submits stone data, and you can verify from this dashboard.
              </div>

              {inviteLink ? (
                <div className="space-y-4">
                  <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-xl p-4 text-xs text-emerald-400">
                    ✓ Invite sent via WhatsApp. Link valid for 30 days.
                  </div>
                  <div className="bg-[#0c0b09] border border-[#2a2520] rounded-xl px-4 py-3">
                    <div className="text-[10px] text-[#4a4438] mb-2">Invite link</div>
                    <div className="font-mono text-[10px] text-[#c9a84c] break-all">{inviteLink}</div>
                  </div>
                  <button onClick={() => { setShowInvite(false); setInviteLink(""); setInvitePhone(""); setInviteCompany(""); }}
                    className="w-full py-3 border border-[#2a2520] text-[#4a4438] rounded-xl text-sm hover:text-[#e8e2d4] transition-colors">
                    Done
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] tracking-widest uppercase text-[#4a4438] block mb-2">
                      Exporter WhatsApp number *
                    </label>
                    <input type="tel" value={invitePhone} onChange={e => setInvitePhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-[#0c0b09] border border-[#2a2520] rounded-xl px-4 py-3 text-sm text-[#e8e2d4] placeholder-[#3a3228] outline-none focus:border-[#c9a84c]/40"/>
                  </div>
                  <div>
                    <label className="text-[10px] tracking-widest uppercase text-[#4a4438] block mb-2">
                      Exporter company name (optional)
                    </label>
                    <input type="text" value={inviteCompany} onChange={e => setInviteCompany(e.target.value)}
                      placeholder="e.g. Aryan Granites Pvt Ltd"
                      className="w-full bg-[#0c0b09] border border-[#2a2520] rounded-xl px-4 py-3 text-sm text-[#e8e2d4] placeholder-[#3a3228] outline-none focus:border-[#c9a84c]/40"/>
                  </div>
                  <div className="bg-[#1a1714] border border-[#2a2520] rounded-xl px-4 py-3 text-[11px] text-[#6a6050] leading-relaxed italic">
                    WhatsApp will open with a pre-written message in English and Tamil asking the exporter to register and submit their stone data.
                  </div>
                  <button onClick={createInvite} disabled={busy || !invitePhone.trim()}
                    className="w-full bg-gradient-to-r from-[#7a5e20] to-[#c9a84c] text-[#0c0b09] font-bold py-3.5 rounded-xl disabled:opacity-30 hover:opacity-90 transition-opacity text-sm">
                    {busy ? "Generating…" : "💬 Send WhatsApp Invite"}
                  </button>
                  <button onClick={() => setShowInvite(false)}
                    className="w-full py-2 text-xs text-[#4a4438] hover:text-[#e8e2d4] transition-colors">
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
