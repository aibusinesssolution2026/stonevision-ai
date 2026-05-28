"use client";
import Link from "next/link";

export default function LandingPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Manrope:wght@300;400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Manrope',sans-serif;background:#fdfcfa;color:#0c0c0b;overflow-x:hidden;font-size:15px;line-height:1.6}

        /* NAV */
        .sv-nav{display:flex;align-items:center;justify-content:space-between;padding:18px 56px;border-bottom:1px solid #ddd8ce;background:#fdfcfa;position:sticky;top:0;z-index:100;}
        .sv-logo{display:flex;align-items:center;gap:14px;text-decoration:none;}
        .sv-logo img{height:44px;width:auto;object-fit:contain;}
        .sv-logo-text{display:flex;flex-direction:column;gap:1px;}
        .sv-logo-name{font-family:'Cormorant Garamond',Georgia,serif;font-size:20px;font-weight:400;letter-spacing:.14em;text-transform:uppercase;color:#0c0c0b;line-height:1;}
        .sv-logo-slogan{font-size:8px;letter-spacing:.22em;text-transform:uppercase;color:#b8922a;font-weight:500;line-height:1;}
        .sv-nav-links{display:flex;gap:36px;}
        .sv-nav-links a{font-size:13px;color:#8a8678;text-decoration:none;letter-spacing:.06em;font-weight:400;transition:color .2s;}
        .sv-nav-links a:hover{color:#0c0c0b;}
        .sv-nav-cta{font-size:12px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;background:#0c0c0b;color:#fdfcfa;border:none;border-radius:3px;padding:11px 24px;cursor:pointer;transition:all .25s;text-decoration:none;display:inline-block;}
        .sv-nav-cta:hover{background:#b8922a;transform:translateY(-1px);}

        /* HERO */
        .sv-hero{display:grid;grid-template-columns:1fr 1fr;min-height:88vh;border-bottom:1px solid #ddd8ce;}
        .sv-hero-left{padding:80px 56px;display:flex;flex-direction:column;justify-content:center;border-right:1px solid #ddd8ce;background:#fdfcfa;}
        .sv-eyebrow{display:inline-flex;align-items:center;gap:10px;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#b8922a;font-weight:500;margin-bottom:36px;}
        .sv-eyebrow-line{width:36px;height:1px;background:#b8922a;flex-shrink:0;}
        .sv-h1{font-family:'Cormorant Garamond',Georgia,serif;font-size:clamp(52px,6vw,82px);font-weight:300;line-height:.94;letter-spacing:-.01em;color:#0c0c0b;margin-bottom:32px;}
        .sv-h1 em{font-style:italic;color:#b8922a;}
        .sv-hero-sub{font-size:15px;color:#6a6458;font-weight:300;line-height:1.8;max-width:400px;margin-bottom:52px;border-left:2px solid #e8d9b8;padding-left:20px;}
        .sv-hero-actions{display:flex;gap:16px;align-items:center;flex-wrap:wrap;}
        .btn-primary{font-size:11px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;background:#0c0c0b;color:#fdfcfa;border:1px solid #0c0c0b;border-radius:3px;padding:15px 36px;cursor:pointer;text-decoration:none;display:inline-block;transition:all .3s;}
        .btn-primary:hover{background:#b8922a;border-color:#b8922a;transform:translateY(-2px);}
        .btn-secondary{font-size:11px;font-weight:400;letter-spacing:.1em;text-transform:uppercase;color:#8a8678;text-decoration:none;display:inline-flex;align-items:center;gap:8px;transition:all .2s;}
        .btn-secondary:hover{color:#0c0c0b;gap:12px;}
        .sv-hero-right{position:relative;background:#f0ece4;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:56px;overflow:hidden;}
        .sv-hero-right::before{content:'';position:absolute;top:-60px;right:-60px;width:240px;height:240px;border:1px solid #ddd8ce;border-radius:50%;opacity:.4;}
        .sv-hero-right::after{content:'';position:absolute;bottom:-80px;left:-80px;width:320px;height:320px;border:1px solid #ddd8ce;border-radius:50%;opacity:.25;}

        /* SCAN CARD */
        .scan-card{width:100%;max-width:360px;background:#fdfcfa;border:1px solid #ddd8ce;border-radius:8px;overflow:hidden;z-index:1;animation:float 4s ease-in-out infinite;box-shadow:0 20px 60px rgba(12,12,11,.1),0 4px 16px rgba(12,12,11,.06);}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        .scan-hdr{padding:14px 18px;border-bottom:1px solid #ddd8ce;display:flex;align-items:center;justify-content:space-between;background:#fdfcfa;}
        .scan-hdr-title{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#8a8678;font-weight:500;}
        .scan-live{display:flex;align-items:center;gap:5px;font-size:10px;color:#ff4444;letter-spacing:.1em;text-transform:uppercase;}
        .live-dot{width:7px;height:7px;border-radius:50%;background:#ff3030;animation:blink 1.5s ease-in-out infinite;box-shadow:0 0 6px rgba(255,48,48,.8);}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.25}}
        .scan-body{padding:20px 18px;background:#fdfcfa;}
        .scan-img{width:100%;height:140px;background:#c8c0a8;border-radius:4px;margin-bottom:18px;overflow:hidden;position:relative;}
        .granite-base{position:absolute;inset:0;background:#b8b0a0;background-image:repeating-linear-gradient(23deg,transparent,transparent 8px,rgba(255,255,255,.07) 8px,rgba(255,255,255,.07) 9px),repeating-linear-gradient(-15deg,transparent,transparent 12px,rgba(0,0,0,.08) 12px,rgba(0,0,0,.08) 13px),repeating-linear-gradient(72deg,transparent,transparent 6px,rgba(0,0,0,.04) 6px,rgba(0,0,0,.04) 7px);}
        .granite-vein{position:absolute;height:1.5px;background:rgba(255,255,255,.22);border-radius:1px;}
        .scan-line-anim{position:absolute;left:10%;width:80%;height:2px;background:linear-gradient(90deg,transparent,#ff2020,#ff5555,#ff2020,transparent);animation:scan 2.5s ease-in-out infinite;box-shadow:0 0 10px rgba(255,32,32,.7);}
        @keyframes scan{0%{top:12%;opacity:0}15%{opacity:1}85%{opacity:1}100%{top:88%;opacity:0}}
        .scan-corner{position:absolute;width:16px;height:16px;border-color:#ff3030;border-style:solid;}
        .scan-corner.tl{top:8px;left:8px;border-width:2px 0 0 2px;}
        .scan-corner.tr{top:8px;right:8px;border-width:2px 2px 0 0;}
        .scan-corner.bl{bottom:8px;left:8px;border-width:0 0 2px 2px;}
        .scan-corner.br{bottom:8px;right:8px;border-width:0 2px 2px 0;}
        .scan-row{display:flex;justify-content:space-between;margin-bottom:12px;align-items:flex-end;}
        .scan-field-label{font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#aaa49a;margin-bottom:3px;}
        .scan-field-val{font-size:14px;font-weight:500;color:#0c0c0b;font-family:'Cormorant Garamond',Georgia,serif;letter-spacing:.02em;}
        .scan-badge{font-size:9px;letter-spacing:.1em;text-transform:uppercase;padding:4px 10px;border-radius:2px;background:#f5edd8;color:#8a6018;font-weight:500;border:1px solid #e8d0a0;display:inline-block;}
        .scan-progress{height:1.5px;background:#e8e2d8;border-radius:1px;margin-top:14px;overflow:hidden;}
        .scan-progress-fill{height:100%;background:linear-gradient(90deg,#ff6b6b,#ff2d2d);animation:prog 3s ease-in-out infinite alternate;width:70%;}
        @keyframes prog{0%{width:25%}100%{width:92%}}
        .scan-ftr{padding:12px 18px;border-top:1px solid #ddd8ce;display:flex;align-items:center;justify-content:space-between;background:#fafaf6;}
        .scan-ftr-text{font-size:10px;color:#aaa49a;letter-spacing:.06em;}
        .scan-ftr-btn{font-size:9px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:#b8922a;background:none;border:1px solid #e0c87a;border-radius:2px;padding:5px 12px;cursor:pointer;transition:all .2s;}
        .scan-ftr-btn:hover{background:#f5edd8;}

        /* METRICS */
        .sv-metrics{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid #ddd8ce;background:#fdfcfa;}
        .sv-metric{padding:40px 40px;border-right:1px solid #ddd8ce;background:#fdfcfa;}
        .sv-metric:last-child{border-right:none;}
        .sv-metric-n{font-family:'Cormorant Garamond',Georgia,serif;font-size:44px;font-weight:300;color:#0c0c0b;letter-spacing:-.02em;line-height:1;margin-bottom:8px;}
        .sv-metric-suffix{color:#b8922a;font-size:30px;}
        .sv-metric-l{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#aaa49a;font-weight:400;}

        /* HOW */
        .sv-how{display:grid;grid-template-columns:1fr 2fr;border-bottom:1px solid #ddd8ce;background:#fdfcfa;}
        .sv-how-left{padding:72px 56px;border-right:1px solid #ddd8ce;display:flex;flex-direction:column;justify-content:center;background:#fdfcfa;}
        .sv-section-n{font-family:'Cormorant Garamond',Georgia,serif;font-size:88px;font-weight:300;color:#e8e2d8;line-height:1;margin-bottom:16px;letter-spacing:-.03em;}
        .sv-section-tag{font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#b8922a;font-weight:500;margin-bottom:14px;}
        .sv-h2{font-family:'Cormorant Garamond',Georgia,serif;font-size:clamp(28px,3vw,42px);font-weight:300;line-height:1.1;color:#0c0c0b;letter-spacing:-.01em;margin-bottom:16px;}
        .sv-h2 em{font-style:italic;color:#b8922a;}
        .sv-body-text{font-size:14px;color:#6a6458;font-weight:300;line-height:1.85;max-width:280px;}
        .sv-how-right{padding:72px 56px;background:#fdfcfa;}
        .sv-step{display:grid;grid-template-columns:52px 1fr;gap:20px;padding:30px 0;border-bottom:1px solid #ddd8ce;}
        .sv-step:last-child{border-bottom:none;}
        .sv-step-n{font-family:'Cormorant Garamond',Georgia,serif;font-size:13px;font-weight:400;color:#b8922a;letter-spacing:.14em;padding-top:3px;}
        .sv-step-title{font-size:15px;font-weight:500;color:#0c0c0b;margin-bottom:6px;letter-spacing:.01em;}
        .sv-step-body{font-size:13px;color:#6a6458;font-weight:300;line-height:1.75;max-width:480px;}

        /* WHY */
        .sv-why{background:#0c0c0b;padding:88px 56px;border-bottom:1px solid #1a1a16;}
        .sv-why-inner{max-width:1100px;margin:0 auto;}
        .sv-why .sv-section-tag{color:#d4a843;}
        .sv-why .sv-h2{color:#fdfcfa;}
        .sv-why-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:#1c1c18;border:1px solid #1c1c18;border-radius:4px;overflow:hidden;margin-top:56px;}
        .sv-why-card{background:#0f0f0b;padding:44px;transition:background .3s;}
        .sv-why-card:hover{background:#141410;}
        .sv-why-icon{margin-bottom:22px;}
        .sv-why-icon svg{width:22px;height:22px;stroke:#d4a843;fill:none;stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round;}
        .sv-why-title{font-size:14px;font-weight:500;color:#ede8e0;margin-bottom:12px;letter-spacing:.03em;}
        .sv-why-body{font-size:13px;color:#4a4840;font-weight:300;line-height:1.8;max-width:280px;}

        /* CTA */
        .sv-cta{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid #ddd8ce;}
        .sv-cta-left{padding:88px 56px;border-right:1px solid #ddd8ce;display:flex;flex-direction:column;justify-content:center;background:#fdfcfa;}
        .sv-cta-right{background:#f0ece4;padding:88px 56px;display:flex;flex-direction:column;justify-content:center;gap:14px;}
        .sv-plan-label{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#aaa49a;font-weight:400;margin-bottom:10px;}
        .sv-plan{background:#fdfcfa;border:1px solid #ddd8ce;border-radius:4px;padding:20px 24px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;transition:all .25s;text-decoration:none;}
        .sv-plan:hover{border-color:#b8922a;transform:translateX(5px);}
        .sv-plan-name{font-size:14px;font-weight:500;color:#0c0c0b;letter-spacing:.02em;}
        .sv-plan-price{font-size:12px;color:#8a8678;font-weight:300;margin-top:2px;}
        .sv-plan-arrow{font-size:20px;color:#aaa49a;transition:all .2s;}
        .sv-plan:hover .sv-plan-arrow{color:#b8922a;transform:translateX(4px);}
        .sv-plan.featured{background:#0c0c0b;border-color:#0c0c0b;}
        .sv-plan.featured .sv-plan-name{color:#fdfcfa;}
        .sv-plan.featured .sv-plan-price{color:#5a5850;}
        .sv-plan.featured .sv-plan-arrow{color:#d4a843;}
        .sv-wa-btn{display:flex;align-items:center;gap:10px;font-size:11px;color:#8a8678;padding:14px 0;border-top:1px solid #ddd8ce;margin-top:4px;cursor:pointer;transition:color .2s;background:none;border-left:none;border-right:none;border-bottom:none;width:100%;text-align:left;font-family:'Manrope',sans-serif;letter-spacing:.04em;}
        .sv-wa-btn:hover{color:#b8922a;}

        /* FOOTER */
        .sv-footer{padding:32px 56px;display:flex;align-items:center;justify-content:space-between;background:#fdfcfa;border-top:1px solid #ddd8ce;}
        .sv-footer-logo{display:flex;align-items:center;gap:12px;text-decoration:none;}
        .sv-footer-logo img{height:32px;width:auto;object-fit:contain;}
        .sv-footer-name{font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:400;letter-spacing:.12em;text-transform:uppercase;color:#0c0c0b;}
        .sv-footer-copy{font-size:11px;color:#aaa49a;letter-spacing:.06em;}

        @media(max-width:768px){
          .sv-nav{padding:16px 20px;}.sv-nav-links{display:none;}
          .sv-hero,.sv-how,.sv-cta{grid-template-columns:1fr;}
          .sv-hero-left,.sv-how-left,.sv-cta-left{border-right:none;border-bottom:1px solid #ddd8ce;padding:48px 24px;}
          .sv-hero-right,.sv-how-right,.sv-cta-right{padding:48px 24px;}
          .sv-metrics{grid-template-columns:1fr 1fr;}
          .sv-why{padding:56px 24px;}.sv-why-grid{grid-template-columns:1fr;}
          .sv-footer{flex-direction:column;gap:14px;text-align:center;padding:24px;}
        }
      `}</style>

      {/* NAV */}
      <nav className="sv-nav">
        <Link href="/" className="sv-logo">
          <img src="/logo.png" alt="StoneVision AI logo"/>
          <div className="sv-logo-text">
            <span className="sv-logo-name">StoneVision AI</span>
            <span className="sv-logo-slogan">Precision Through Perception</span>
          </div>
        </Link>
        <div className="sv-nav-links">
          <a href="#how">How it works</a>
          <a href="#why">Why it matters</a>
          <a href="#pricing">Pricing</a>
        </div>
        <Link href="/login" className="sv-nav-cta">Sign In</Link>
      </nav>

      {/* HERO */}
      <section className="sv-hero">
        <div className="sv-hero-left">
          <div className="sv-eyebrow">
            <span className="sv-eyebrow-line"/>
            Granite Intelligence · Melur-Madurai
          </div>
          <h1 className="sv-h1">
            Your granite.<br/>
            <em>Verified.</em><br/>
            In 30 seconds.
          </h1>
          <p className="sv-hero-sub">
            AI-powered block analysis that turns a photograph into a certified multilingual PDF catalog — trusted by exporters across India, accepted by buyers from Poland to Dubai.
          </p>
          <div className="sv-hero-actions">
            <Link href="/signup" className="btn-primary">Scan your first block →</Link>
            <a href="#how" className="btn-secondary">See how it works ›</a>
          </div>
        </div>

        <div className="sv-hero-right">
          <div className="scan-card">
            <div className="scan-hdr">
              <span className="scan-hdr-title">AI Scan in Progress</span>
              <span className="scan-live"><span className="live-dot"/>Live</span>
            </div>
            <div className="scan-body">
              <div className="scan-img">
                <div className="granite-base"/>
                <div className="granite-vein" style={{top:"28%",left:"8%",width:"42%",transform:"rotate(12deg)"}}/>
                <div className="granite-vein" style={{top:"55%",left:"35%",width:"30%",transform:"rotate(-6deg)"}}/>
                <div className="granite-vein" style={{top:"72%",left:"58%",width:"22%",transform:"rotate(18deg)"}}/>
                {[{t:14,l:20,w:7,h:4},{t:38,l:58,w:5,h:5},{t:62,l:30,w:6,h:3},{t:24,l:74,w:4,h:6},{t:78,l:62,w:7,h:3},{t:46,l:12,w:5,h:4},{t:82,l:40,w:6,h:4},{t:18,l:44,w:3,h:5},{t:65,l:82,w:5,h:3},{t:40,l:90,w:4,h:4},{t:88,l:18,w:6,h:3},{t:30,l:36,w:3,h:6},{t:56,l:50,w:8,h:3},{t:74,l:24,w:5,h:5}].map((f,i)=>(
                  <div key={i} style={{position:"absolute",top:f.t+"%",left:f.l+"%",width:f.w,height:f.h,borderRadius:"50%",background:"rgba(20,15,10,.4)",opacity:.3+((i*7)%5)*.1,transform:"rotate("+(i*37%180)+"deg)"}}/>
                ))}
                <div className="scan-corner tl"/><div className="scan-corner tr"/>
                <div className="scan-corner bl"/><div className="scan-corner br"/>
                <div className="scan-line-anim"/>
              </div>
              <div className="scan-row">
                <div>
                  <div className="scan-field-label">Variety</div>
                  <div className="scan-field-val">Kashmir White</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div className="scan-field-label">Grade</div>
                  <span className="scan-badge">A1 Export</span>
                </div>
              </div>
              <div className="scan-row">
                <div>
                  <div className="scan-field-label">Dimensions</div>
                  <div className="scan-field-val">248 × 142 × 97 cm</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div className="scan-field-label">Est. Value</div>
                  <div className="scan-field-val">₹5,79,000</div>
                </div>
              </div>
              <div className="scan-progress"><div className="scan-progress-fill"/></div>
            </div>
            <div className="scan-ftr">
              <span className="scan-ftr-text">Gemini Vision · 96% confidence</span>
              <Link href="/signup" className="scan-ftr-btn">Get Started</Link>
            </div>
          </div>
        </div>
      </section>

      {/* METRICS */}
      <div className="sv-metrics">
        {[
          {n:"1,240",s:"+",l:"Blocks Scanned"},
          {n:"30",s:" sec",l:"Average Scan Time"},
          {n:"5",s:"",l:"PDF Languages"},
          {n:"98",s:"%",l:"Buyer Acceptance Rate"},
        ].map(({n,s,l})=>(
          <div key={l} className="sv-metric">
            <div className="sv-metric-n">{n}<span className="sv-metric-suffix">{s}</span></div>
            <div className="sv-metric-l">{l}</div>
          </div>
        ))}
      </div>

      {/* HOW */}
      <section className="sv-how" id="how">
        <div className="sv-how-left">
          <div className="sv-section-n">01</div>
          <div className="sv-section-tag">Process</div>
          <h2 className="sv-h2">From quarry floor<br/>to buyer&apos;s <em>inbox</em></h2>
          <p className="sv-body-text">Four steps. No paperwork. No translators. No delays.</p>
        </div>
        <div className="sv-how-right">
          {[
            {n:"01",t:"Photograph your block",b:"Stand 1–2 metres back. Place a reference stick alongside. Take one clear photo in natural light."},
            {n:"02",t:"AI analyses in 30 seconds",b:"Google Gemini Vision identifies the variety, estimates L×W×H, assigns quality grade and export market suitability."},
            {n:"03",t:"Verify and correct",b:"Review results. Edit any dimension with your tape measure. Override the grade. Tick the verified box."},
            {n:"04",t:"Send a certified PDF catalog",b:"Download in English, Tamil, Arabic, Chinese or Polish. WhatsApp to your buyer. QR-code verified for authenticity."},
          ].map(({n,t,b})=>(
            <div key={n} className="sv-step">
              <div className="sv-step-n">{n} —</div>
              <div><div className="sv-step-title">{t}</div><div className="sv-step-body">{b}</div></div>
            </div>
          ))}
        </div>
      </section>

      {/* WHY */}
      <section className="sv-why" id="why">
        <div className="sv-why-inner">
          <div className="sv-section-tag">Why it matters</div>
          <h2 className="sv-h2">The problems we <em>eliminate</em></h2>
          <div className="sv-why-grid">
            {[
              {icon:<><path d="M3 5h4M3 10h4M3 15h4M10 5l2 2 4-4M10 10l2 2 4-4M10 15l2 2 4-4"/></>,t:"Language barrier, broken",b:"Your Chinese buyer reads in Mandarin. Your Polish client in Polish. One scan — five certified languages, zero translation cost."},
              {icon:<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,t:"Quality disputes, prevented",b:"Every dimension, grade and timestamp is locked into a QR-signed PDF. Buyers verify authenticity before the container ships."},
              {icon:<><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></>,t:"Physical audit, on demand",b:"Need a certified inspector on-site? Book a physical audit from the same platform. Confirmed within 4 hours, same day."},
              {icon:<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></>,t:"LC documentation, cleared",b:"Banks and customs accept our certified reports. Stop losing shipments to paperwork. One PDF handles the entire compliance trail."},
            ].map(({icon,t,b})=>(
              <div key={t} className="sv-why-card">
                <div className="sv-why-icon"><svg viewBox="0 0 24 24">{icon}</svg></div>
                <div className="sv-why-title">{t}</div>
                <div className="sv-why-body">{b}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="sv-cta" id="pricing">
        <div className="sv-cta-left">
          <div className="sv-eyebrow"><span className="sv-eyebrow-line"/>Get started today</div>
          <h2 className="sv-h2">First 100 scans.<br/><em>Completely free.</em></h2>
          <p className="sv-body-text" style={{marginTop:16}}>No credit card. No setup. Scan your first block in under 3 minutes. Upgrade only when ready.</p>
        </div>
        <div className="sv-cta-right">
          <div className="sv-plan-label">Choose your plan</div>
          <Link href="/signup" className="sv-plan">
            <div><div className="sv-plan-name">Free Trial</div><div className="sv-plan-price">100 scans · 30 days · No card needed</div></div>
            <span className="sv-plan-arrow">›</span>
          </Link>
          <a href="https://wa.me/919655071432?text=Hi%2C%20I%20want%20the%20Starter%20Plan" target="_blank" rel="noopener" className="sv-plan">
            <div><div className="sv-plan-name">Starter</div><div className="sv-plan-price">₹4,777 / month · 200 scans · 5 languages</div></div>
            <span className="sv-plan-arrow">›</span>
          </a>
          <a href="https://wa.me/919655071432?text=Hi%2C%20I%20want%20the%20Pro%20Plan" target="_blank" rel="noopener" className="sv-plan featured">
            <div><div className="sv-plan-name">Pro — Most popular</div><div className="sv-plan-price">₹9,777 / month · 500 scans · Full platform</div></div>
            <span className="sv-plan-arrow">›</span>
          </a>
          <button className="sv-wa-btn" onClick={()=>window.open("https://wa.me/919655071432?text=Hi%20StoneVision%20AI%2C%20I%20am%20interested%20in%20the%20Unlimited%20Enterprise%20Plan.","_blank")}>
            <svg viewBox="0 0 24 24" fill="currentColor" style={{width:16,height:16,flexShrink:0}}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM11.99 2C6.478 2 2 6.478 2 11.99c0 1.76.46 3.4 1.26 4.84L2 22l5.26-1.24a9.94 9.94 0 004.73 1.19C17.5 21.95 22 17.47 22 11.96 22 6.46 17.5 2 11.99 2z"/></svg>
            Contact for Unlimited Enterprise pricing
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="sv-footer">
        <Link href="/" className="sv-footer-logo">
          <img src="/logo.png" alt="StoneVision AI"/>
          <span className="sv-footer-name">StoneVision AI</span>
        </Link>
        <div className="sv-footer-copy">© 2026 · Madurai, Tamil Nadu · Powered by Google Gemini Vision</div>
      </footer>
    </>
  );
}
