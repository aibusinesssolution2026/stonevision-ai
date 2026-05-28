"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import Link from "next/link";

export default function SignupPage() {
  const supabase = createClient();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  // Company form fields
  const [companyName, setCompanyName] = useState("");
  const [city, setCity] = useState("Melur");
  const [phone, setPhone] = useState("");
  const [gst, setGst] = useState("");
  const [accepted, setAccepted] = useState(false);

  // On mount: check if user is already authenticated (came from OAuth/OTP)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUserId(data.user.id);
        // Pre-fill phone if available
        if (data.user.phone) setPhone(data.user.phone);
        // Check if already has profile
        supabase.from("user_profiles").select("company_id").eq("id", data.user.id).single()
          .then(({ data: p }) => { if (p) window.location.href = "/dashboard"; });
      } else {
        window.location.href = "/login";
      }
    });
  }, []);

  async function createCompany() {
    if (!companyName.trim()) { setError("Company name is required"); return; }
    if (!accepted) { setError("Please accept the terms and disclaimer"); return; }
    if (!userId) { setError("Session expired — please sign in again"); return; }

    setLoading(true); setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email || `${userId}@phone.stonevision.in`;

      // 1. Create company
      const { data: company, error: compErr } = await supabase
        .from("companies")
        .insert({
          name: companyName.trim(),
          owner_email: email,
          phone: phone.trim() || null,
          city: city.trim() || "Melur",
          gst_number: gst.trim() || null,
        })
        .select()
        .single();

      if (compErr) throw new Error(compErr.message);

      // 2. Create user profile linked to company
      const { error: profErr } = await supabase
        .from("user_profiles")
        .insert({
          id: userId,
          company_id: company.id,
          full_name: user?.user_metadata?.full_name || companyName,
          role: "owner",
        });

      if (profErr) throw new Error(profErr.message);

      // Trial subscription is auto-created by DB trigger (tr_trial)
      window.location.href = "/dashboard?welcome=1";

    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Signup failed — try again");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0d0b] flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <div className="font-serif text-4xl text-[#c9a84c] mb-1">StoneVision</div>
        <div className="text-[10px] tracking-[.28em] uppercase text-[#56503f]">
          Create your exporter account
        </div>
      </div>

      <div className="w-full max-w-sm">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 h-1 rounded-full bg-[#c9a84c]"/>
          <div className={`flex-1 h-1 rounded-full ${step === 2 ? "bg-[#c9a84c]" : "bg-[#2e2a24]"}`}/>
        </div>

        <div className="bg-[#1a1714] border border-[#2e2a24] rounded-2xl p-6 space-y-4">
          <div className="font-serif text-xl text-white mb-1">Your Company Details</div>
          <div className="text-xs text-[#56503f] mb-4">This creates your isolated workspace. Other exporters cannot see your data.</div>

          {error && (
            <div className="bg-red-900/20 border border-red-700/40 rounded-xl px-4 py-3 text-xs text-red-400">
              {error}
            </div>
          )}

          {/* Company Name */}
          <div>
            <label className="text-[10px] tracking-widest uppercase text-[#56503f] block mb-2">
              Company / Business Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="e.g. Aryan Granites Pvt Ltd"
              className="w-full bg-[#0f0d0b] border border-[#3d372f] rounded-xl px-4 py-3 text-sm text-white placeholder-[#3d372f] outline-none focus:border-[#c9a84c] transition-colors font-mono"
            />
          </div>

          {/* City */}
          <div>
            <label className="text-[10px] tracking-widest uppercase text-[#56503f] block mb-2">City</label>
            <select
              value={city}
              onChange={e => setCity(e.target.value)}
              className="w-full bg-[#0f0d0b] border border-[#3d372f] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#c9a84c] transition-colors font-mono"
            >
              {["Melur","Madurai","Tiruchirappalli","Salem","Krishnagiri","Karur","Namakkal","Other"].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Phone */}
          <div>
            <label className="text-[10px] tracking-widest uppercase text-[#56503f] block mb-2">
              WhatsApp Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full bg-[#0f0d0b] border border-[#3d372f] rounded-xl px-4 py-3 text-sm text-white placeholder-[#3d372f] outline-none focus:border-[#c9a84c] transition-colors font-mono"
            />
          </div>

          {/* GST */}
          <div>
            <label className="text-[10px] tracking-widest uppercase text-[#56503f] block mb-2">
              GST Number <span className="text-[#3d372f]">(optional)</span>
            </label>
            <input
              type="text"
              value={gst}
              onChange={e => setGst(e.target.value.toUpperCase())}
              placeholder="33XXXXX..."
              className="w-full bg-[#0f0d0b] border border-[#3d372f] rounded-xl px-4 py-3 text-sm text-white placeholder-[#3d372f] outline-none focus:border-[#c9a84c] transition-colors font-mono"
            />
          </div>

          {/* 7-day trial info */}
          <div className="bg-[#c9a84c]/10 border border-[#c9a84c]/20 rounded-xl p-3 text-xs text-[#b8b0a0]">
            🎉 <span className="text-[#c9a84c] font-bold">7-day free trial</span> starts now —
            25 free scans, full PDF & WhatsApp. No payment required.
          </div>

          {/* Legal acceptance */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={e => setAccepted(e.target.checked)}
              className="mt-1 w-4 h-4 accent-[#c9a84c] flex-shrink-0"
            />
            <span className="text-[11px] text-[#b8b0a0] leading-relaxed">
              I accept the{" "}
              <Link href="/terms" target="_blank" className="text-[#c9a84c] hover:underline">Terms of Use</Link>
              {" & "}
              <Link href="/privacy" target="_blank" className="text-[#c9a84c] hover:underline">Privacy Policy</Link>
              . I understand all AI outputs are <strong className="text-white">estimates only</strong>,
              not certified measurements, and I will verify independently before commercial use.
            </span>
          </label>

          <button
            onClick={createCompany}
            disabled={loading || !accepted || !companyName.trim()}
            className="w-full bg-gradient-to-r from-[#7a5e20] to-[#c9a84c] text-black font-bold py-3.5 rounded-xl disabled:opacity-30 hover:opacity-90 transition-opacity text-sm mt-2"
          >
            {loading ? "Creating account…" : "Start Free Trial →"}
          </button>
        </div>

        <div className="text-center mt-4 text-xs text-[#3d372f]">
          Already have an account?{" "}
          <Link href="/login" className="text-[#c9a84c] hover:underline">Sign in →</Link>
        </div>
      </div>
    </div>
  );
}
