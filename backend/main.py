"""
StoneVision AI — FastAPI Backend v4.0 FINAL
============================================
Multi-tenant · 5-tier plans · Founder discount
Add-ons · Admin panel · Race-condition-free scan gate
All Gemini errors handled gracefully — frontend never crashes
"""
from __future__ import annotations
import os, base64, io, json, logging, hashlib
from datetime import datetime
from typing import Optional, Annotated

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, field_validator
import httpx
from supabase import create_client, Client
from pdf_service import generate_catalog_pdf

# ── Logging ──────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s"
)
log = logging.getLogger("stonevision")

# ── Config ───────────────────────────────────────────────────
GEMINI_KEY  = os.environ["GEMINI_API_KEY"]
SUPA_URL    = os.environ["SUPABASE_URL"]
SUPA_ANON   = os.environ["SUPABASE_ANON_KEY"]
SUPA_SVC    = os.environ["SUPABASE_SERVICE_KEY"]
APP_URL     = os.environ.get("APP_URL", "https://stonevision.vercel.app")
ADMIN_SECRET= os.environ.get("ADMIN_SECRET", "")  # extra security for admin routes
GEMINI_URL  = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

# Service-role client (bypasses RLS for backend writes)
supa: Client = create_client(SUPA_URL, SUPA_SVC)

# ── App ───────────────────────────────────────────────────────
app = FastAPI(title="StoneVision AI API", version="4.0.0", docs_url="/docs")

ALLOWED_ORIGINS = [
    "https://stonevision.in",
    "https://www.stonevision.in",
    "https://stonevision.vercel.app",
    "https://stonevision-ai-two.vercel.app",
    "https://stonevision-ai.vercel.app",
    "https://stoneaivision-vggu.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# ── Granite AI Prompt ────────────────────────────────────────
GRANITE_PROMPT = """You are a world-class granite identification AI specialising in Melur-Madurai quarry output, Tamil Nadu, India. You have analysed over 50,000 granite blocks.

CRITICAL INSTRUCTION: Return ONLY a raw JSON object. Zero text before or after. No markdown fences. No explanation. If you add any text outside the JSON, the system will crash.

═══ IDENTIFICATION RULES ═══

VARIETY IDENTIFICATION — match by visual texture, colour, and crystal pattern:
• Madura Gold / Imperial Gold → warm gold-brown tones, medium crystals, quartzite veins
• Madura Mahogany → rich brown-burgundy, coarse crystals
• Black Galaxy → jet black with gold/silver sparkle mineral inclusions
• Absolute Black → uniform deep black, fine crystals, no sparkle
• Steel Grey → medium grey, uniform fine crystals
• Kashmir White → white/cream with grey veins and black specks
• Colonial Gold → pale yellow-gold, medium crystals
• Ivory Brown → warm ivory-cream, brown flecks
• Tan Brown → dark brown, medium-coarse, some red tones

DIMENSION MEASUREMENT:
- If a 1-metre reference stick is visible → use it to calibrate scale precisely
- If NO stick → estimate from standard block proportions (typical: 240-280 × 130-160 × 90-110 cm)
- length_cm = longest horizontal edge visible
- width_cm = second horizontal edge (depth)
- height_cm = vertical edge
- Round all to nearest 0.5 cm

QUALITY GRADING:
- A1: Surface pristine, no cracks, no chips — EXPORT READY to Europe/China/USA
- A2: Minor surface scratches or small chips — exportable with disclosure
- B1: Visible hairline cracks or fissures — domestic India market only
- B2: Structural cracks through block — scrap/fill grade

WEIGHT FORMULA: (L × W × H in cm) × 0.00271 = weight in kg

VALUE GUIDE (INR per cft, 2026 Melur prices):
- Premium (Black Galaxy, Absolute Black): ₹6,500-8,000
- Standard (Kashmir White, Steel Grey): ₹4,500-5,500
- Local (Madura Gold, Imperial Gold): ₹3,500-4,800

═══ OUTPUT FORMAT ═══

{"variety":"EXACT_NAME","variety_confidence":0.0_to_1.0,"variety_reasoning":"ONE sentence max — specific visual evidence","dimensions":{"length_cm":0.0,"width_cm":0.0,"height_cm":0.0},"measurement_confidence":0.0_to_1.0,"reference_stick_detected":true_or_false,"estimated_weight_kg":0,"quality_grade":"A1_or_A2_or_B1_or_B2","quality_notes":"max 15 words","export_markets":["list","of","countries"],"estimated_value_inr_per_cft":0,"flags":[]}

FLAGS TO ADD (only when true): "NO_REFERENCE_STICK", "POOR_IMAGE_QUALITY", "MULTIPLE_BLOCKS", "MANUAL_REVIEW_REQUIRED"
"""


# ================================================================
#  AUTH DEPENDENCY
# ================================================================
async def get_current_user(
    authorization: Annotated[Optional[str], Header()] = None
) -> dict:
    """Validate Supabase JWT → return {user_id, email, company_id, role, is_superadmin}"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Authorization header required: Bearer <token>")

    token = authorization.split(" ", 1)[1]
    try:
        anon = create_client(SUPA_URL, SUPA_ANON)
        resp = anon.auth.get_user(token)
        if not resp or not resp.user:
            raise HTTPException(401, "Token expired — please sign in again")
        uid = resp.user.id
        profile = (supa.table("user_profiles")
                   .select("company_id,role,is_superadmin")
                   .eq("id", uid).single().execute())
        if not profile.data:
            raise HTTPException(403, "Profile not found — complete company setup first")
        return {
            "user_id":       uid,
            "email":         resp.user.email or "",
            "company_id":    profile.data["company_id"],
            "role":          profile.data["role"],
            "is_superadmin": profile.data.get("is_superadmin", False),
        }
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Auth error for token ...{token[-8:]}: {e}")
        raise HTTPException(401, "Authentication failed")


async def require_superadmin(ctx: dict = Depends(get_current_user)) -> dict:
    if not ctx.get("is_superadmin"):
        raise HTTPException(403, "Superadmin access required")
    return ctx


# ================================================================
#  SCAN GATE DEPENDENCY
# ================================================================
async def gate_scan(ctx: dict = Depends(get_current_user)) -> dict:
    """Check trial/plan limits before allowing a scan. Atomic — no race conditions."""
    try:
        result = supa.rpc("check_scan_eligibility", {"p_company_id": ctx["company_id"]}).execute()
        el = result.data
    except Exception as e:
        log.error(f"Scan gate DB error: {e}")
        raise HTTPException(503, "Could not verify scan eligibility — try again")

    if not el.get("allowed"):
        reason  = el.get("reason", "Scan not allowed")
        upgrade = el.get("upgrade", False)
        log.info(f"Scan blocked: company={ctx['company_id'][:8]} reason={reason}")
        raise HTTPException(402, {"reason": reason, "upgrade": upgrade})

    ctx.update({
        "scans_remaining":    el.get("scans_remaining", -1),
        "plan":               el.get("plan", "trial"),
        "show_upgrade_at":    el.get("show_upgrade_at", -1),
        "addon_branding":     el.get("addon_branding", False),
        "addon_trust_gallery":el.get("addon_trust_gallery", False),
    })
    return ctx


# ================================================================
#  IMAGE HELPERS
# ================================================================
async def resize_and_encode(raw: bytes, max_px: int = 1024) -> str:
    """Resize to max_px longest edge, return base64 JPEG. Never raises."""
    try:
        from PIL import Image
        img = Image.open(io.BytesIO(raw)).convert("RGB")
        if max(img.size) > max_px:
            img.thumbnail((max_px, max_px), Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=88, optimize=True)
        return base64.b64encode(buf.getvalue()).decode()
    except Exception as e:
        log.warning(f"Resize failed ({e}) — encoding raw bytes")
        return base64.b64encode(raw[:5_000_000]).decode()  # cap at 5MB


def extract_json(text: str) -> Optional[dict]:
    """Extract JSON from Gemini response. Handles markdown fences and leading text."""
    if not text:
        return None
    text = text.strip().replace("```json", "").replace("```", "").strip()
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    try:
        return json.loads(text[start:end+1])
    except (json.JSONDecodeError, ValueError):
        return None


def safe_float(val, default: float = 0.0) -> float:
    """Convert to float, return default on None/NaN/invalid."""
    try:
        result = float(val)
        if result != result:  # NaN check
            return default
        return result
    except (TypeError, ValueError):
        return default


# ================================================================
#  ROUTES
# ================================================================

@app.get("/health")
async def health():
    return {"status": "ok", "version": "4.0.0", "model": "gemini-2.0-flash"}


@app.get("/api/me")
async def me(ctx: dict = Depends(get_current_user)):
    """Current user's company + subscription status."""
    try:
        sub     = supa.table("subscriptions").select("*").eq("company_id", ctx["company_id"]).single().execute()
        company = supa.table("companies").select("name,city,is_verified,logo_url").eq("id", ctx["company_id"]).single().execute()
        plan    = supa.table("plans").select("*").eq("id", sub.data.get("plan_id","trial")).single().execute()
        return {
            "user":         {"id": ctx["user_id"], "email": ctx["email"], "role": ctx["role"]},
            "company":      company.data,
            "subscription": sub.data,
            "plan":         plan.data,
            "is_superadmin":ctx["is_superadmin"],
        }
    except Exception as e:
        log.error(f"me() error: {e}")
        raise HTTPException(500, "Failed to load profile")


@app.post("/api/analyse")
async def analyse(
    file: UploadFile = File(...),
    ctx:  dict       = Depends(gate_scan),
):
    """
    Full scan pipeline:
    1. Validate image
    2. Resize
    3. Call Gemini Vision (with full error handling)
    4. Parse + validate response
    5. Save to DB
    6. Return result
    """
    # ── Validate ───────────────────────────────────────────
    ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, f"Only JPEG, PNG, WEBP accepted. Got: {file.content_type}")

    raw = await file.read()
    if not raw:
        raise HTTPException(400, "Empty file received")
    if len(raw) > 20 * 1024 * 1024:
        raise HTTPException(400, "Image must be under 20MB")

    # ── Resize ─────────────────────────────────────────────
    # Apply user-drawn crop boundary if provided
    crop_x = form_data.get("crop_x")
    crop_y = form_data.get("crop_y")
    crop_w = form_data.get("crop_w")
    crop_h = form_data.get("crop_h")

    if all([crop_x, crop_y, crop_w, crop_h]):
        try:
            from PIL import Image as PILImage
            import io as _io
            pil = PILImage.open(_io.BytesIO(raw)).convert("RGB")
            iw, ih = pil.size
            # Crop coords are in canvas space (600×400) — scale to actual image
            cx = int(float(crop_x) / 600 * iw)
            cy = int(float(crop_y) / 400 * ih)
            cw = int(float(crop_w) / 600 * iw)
            ch = int(float(crop_h) / 400 * ih)
            # Ensure within bounds
            cx = max(0, min(cx, iw-1))
            cy = max(0, min(cy, ih-1))
            cw = max(10, min(cw, iw-cx))
            ch = max(10, min(ch, ih-cy))
            pil_cropped = pil.crop((cx, cy, cx+cw, cy+ch))
            buf = _io.BytesIO()
            pil_cropped.save(buf, format="JPEG", quality=92)
            raw = buf.getvalue()
            log.info(f"Crop applied: {cx},{cy} {cw}×{ch}px from {iw}×{ih}")
        except Exception as e:
            log.warning(f"Crop failed, using full image: {e}")

    b64 = await resize_and_encode(raw, max_px=800)  # 800px is optimal for Gemini vision
    log.info(f"Scan start: company={ctx['company_id'][:8]} size={len(raw)//1024}KB encoded={len(b64)//1024}KB")

    # ── Gemini Vision call ─────────────────────────────────
    payload = {
        "system_instruction": {
            "parts": [{"text": "You are a granite analysis AI. You ONLY output raw JSON. Never output text, explanation, or markdown."}]
        },
        "contents": [{"role": "user", "parts": [
            {"text": GRANITE_PROMPT},
            {"inline_data": {"mime_type": "image/jpeg", "data": b64}},
            {"text": "Identify this granite block now. Output the JSON only."}
        ]}],
        "generationConfig": {
            "temperature": 0.05,
            "maxOutputTokens": 512,
            "response_mime_type": "application/json"
        }
    }

    gemini_error: Optional[str] = None
    ai: Optional[dict] = None

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(f"{GEMINI_URL}?key={GEMINI_KEY}", json=payload)
    except httpx.TimeoutException:
        gemini_error = "Gemini timed out — using partial result"
        log.warning(f"Gemini timeout: company={ctx['company_id'][:8]}")
    except httpx.NetworkError as e:
        gemini_error = "Network error reaching Gemini — retry"
        log.error(f"Gemini network error: {e}")
    except Exception as e:
        gemini_error = "Unexpected error calling Gemini"
        log.error(f"Gemini unexpected: {e}")

    if gemini_error is None:
        # Handle HTTP error codes gracefully
        if resp.status_code == 429:
            # Auto-retry once after 65 seconds
            import asyncio
            log.warning(f"Gemini 429 rate limit — auto-retrying in 30s")
            await asyncio.sleep(30)
            try:
                async with httpx.AsyncClient(timeout=30.0) as client2:
                    resp = await client2.post(f"{GEMINI_URL}?key={GEMINI_KEY}", json=payload)
                if resp.status_code == 429:
                    raise HTTPException(429, "AI rate limit — please wait 1 minute and try again")
            except HTTPException:
                raise
            except Exception:
                raise HTTPException(429, "AI rate limit — please wait 1 minute and try again")
        if resp.status_code == 403:
            log.error("Gemini 403 — check API key")
            raise HTTPException(503, "AI service unavailable — contact support")
        if resp.status_code == 400:
            log.error(f"Gemini 400: {resp.text[:300]}")
            raise HTTPException(400, "Image format rejected by AI — try JPEG under 10MB")
        if not resp.is_success:
            log.error(f"Gemini {resp.status_code}: {resp.text[:200]}")
            raise HTTPException(502, f"AI service error ({resp.status_code}) — retry")

        try:
            data = resp.json()
        except Exception:
            raise HTTPException(502, "Invalid response from AI service")

        # Safety block
        block_reason = data.get("promptFeedback", {}).get("blockReason")
        if block_reason:
            log.warning(f"Gemini safety block: {block_reason}")
            raise HTTPException(400, f"Image blocked by AI safety filter: {block_reason}")

        # Extract text
        try:
            finish = data["candidates"][0].get("finishReason", "")
            if finish == "SAFETY":
                raise HTTPException(400, "Response blocked by safety filter — use plain block photo")
            raw_text = data["candidates"][0]["content"]["parts"][0].get("text", "")
        except (KeyError, IndexError):
            raw_text = ""

        if raw_text.strip():
            ai = extract_json(raw_text)
            if ai is None:
                log.warning(f"JSON parse failed for response: {raw_text[:200]}")
                gemini_error = "AI response format issue — result may be incomplete"

    # ── Validate AI result ─────────────────────────────────
    if ai is None:
        ai = {}

    # Safe extraction of all fields with NaN protection
    variety    = ai.get("variety") or "Unknown (manual review required)"
    v_conf     = safe_float(ai.get("variety_confidence"), 0.5)
    m_conf     = safe_float(ai.get("measurement_confidence"), 0.5)
    dims       = ai.get("dimensions") or {}
    L          = safe_float(dims.get("length_cm"), 0.0)
    W          = safe_float(dims.get("width_cm"), 0.0)
    H          = safe_float(dims.get("height_cm"), 0.0)
    weight     = int(safe_float(ai.get("estimated_weight_kg"), 0))
    grade      = ai.get("quality_grade") if ai.get("quality_grade") in ("A1","A2","B1","B2") else "A2"
    vpf        = int(safe_float(ai.get("estimated_value_inr_per_cft"), 3000))
    vpf        = max(500, min(vpf, 100000))  # clamp to sane range
    cft        = round(L * W * H / 1_000_000 * 35.3147, 2) if L and W and H else 0.0
    total_val  = round(cft * vpf) if cft else 0
    flags      = [f for f in (ai.get("flags") or []) if isinstance(f, str)]
    markets    = [m for m in (ai.get("export_markets") or []) if isinstance(m, str)]
    stick_ok   = bool(ai.get("reference_stick_detected", True))

    if gemini_error:
        flags.append("GEMINI_ERROR")

    # ── Save image ─────────────────────────────────────────
    scan_ts   = datetime.utcnow().strftime("%y%m%d%H%M%S")
    scan_code = f"SV-{scan_ts}"
    img_url   = None
    try:
        img_path = f"{ctx['company_id']}/{scan_code}.jpg"
        supa.storage.from_("stone-images").upload(
            img_path, raw, {"content-type": "image/jpeg", "upsert": "false"}
        )
        img_url = f"{SUPA_URL}/storage/v1/object/public/stone-images/{img_path}"
    except Exception as e:
        log.warning(f"Image storage failed (non-fatal): {e}")

    # ── Save stone to DB ───────────────────────────────────
    pub_link = f"{APP_URL}/catalog/{scan_code}"
    record = {
        "company_id":             ctx["company_id"],
        "scan_code":              scan_code,
        "variety":                variety,
        "variety_confidence":     round(v_conf * 100, 1) if v_conf <= 1 else round(v_conf, 1),
        "variety_reasoning":      str(ai.get("variety_reasoning") or "")[:500],
        "length_cm":              L or None,
        "width_cm":               W or None,
        "height_cm":              H or None,
        "measurement_confidence": round(m_conf * 100, 1) if m_conf <= 1 else round(m_conf, 1),
        "quality_grade":          grade,
        "quality_notes":          str(ai.get("quality_notes") or "")[:300],
        "estimated_weight_kg":    weight or None,
        "value_per_cft_inr":      vpf,
        "total_value_inr":        total_val or None,
        "export_markets":         markets,
        "image_url":              img_url,
        "public_link":            pub_link,
        "ai_flags":               flags,
        "reference_stick_ok":     stick_ok,
        "scanned_by":             ctx["user_id"],
    }

    try:
        ins = supa.table("stones").insert(record).execute()
        stone_id = ins.data[0]["id"]
    except Exception as e:
        log.error(f"DB insert failed: {e}")
        raise HTTPException(500, "Failed to save scan result — please retry")

    log.info(f"Scan saved: {scan_code} | {variety} | {grade} | company={ctx['company_id'][:8]}")

    # ── Upgrade nudge ──────────────────────────────────────
    show_upgrade = (
        ctx["show_upgrade_at"] != -1 and
        ctx["scans_remaining"] != -1 and
        ctx["scans_remaining"] <= 20
    )

    return {
        "stone_id":        stone_id,
        "scan_code":       scan_code,
        "public_link":     pub_link,
        "variety":         variety,
        "variety_confidence": record["variety_confidence"],
        "variety_reasoning":  str(ai.get("variety_reasoning") or ""),
        "dimensions": {"length_cm": L, "width_cm": W, "height_cm": H},
        "volume_cft":      cft,
        "measurement_confidence": record["measurement_confidence"],
        "quality_grade":   grade,
        "quality_notes":   record["quality_notes"],
        "weight_kg":       weight,
        "value_per_cft_inr": vpf,
        "total_value_inr": total_val,
        "export_markets":  markets,
        "flags":           flags,
        "reference_stick_ok": stick_ok,
        "image_url":       img_url,
        "scans_remaining": ctx["scans_remaining"],
        "plan":            ctx["plan"],
        "show_upgrade":    show_upgrade,
        "addon_branding":  ctx["addon_branding"],
        "warning":         gemini_error,
    }


@app.get("/api/pdf/{scan_code}")
async def get_pdf(scan_code: str, language: str = "EN", ctx: dict = Depends(get_current_user)):
    """
    Generate PDF in requested language, save to Supabase storage, stream to user.
    language: EN | TA | AR | ZH | PL
    Saved PDF URL stored in stones.catalog_pdf_url
    """
    from pdf_multilingual import generate_multilingual_pdf
    SUPPORTED = ["EN","TA","AR","ZH","PL"]
    lang = language.upper()
    if lang not in SUPPORTED:
        lang = "EN"

    try:
        # Try by scan_code first, then by id (UUID) for backward compat
        import re
        stone = None
        if re.match(r"^[0-9a-f]{8}-[0-9a-f]{4}-", scan_code):
            r = (supa.table("stones").select("*")
                 .eq("id", scan_code)
                 .eq("company_id", ctx["company_id"])
                 .single().execute())
            if r.data:
                stone = r
        if not stone:
            stone = (supa.table("stones").select("*")
                     .eq("scan_code", scan_code)
                     .eq("company_id", ctx["company_id"])
                     .single().execute())
        if not stone or not stone.data:
            # Last resort - get most recent stone
            r = (supa.table("stones").select("*")
                 .eq("company_id", ctx["company_id"])
                 .order("scanned_at", desc=True).limit(1).execute())
            if r.data:
                stone = r
                stone.data = r.data[0]
            else:
                raise HTTPException(404, f"Scan {scan_code} not found")

        company = (supa.table("companies").select("name,city,whatsapp,is_verified,logo_url")
                   .eq("id", ctx["company_id"]).single().execute())

        pdf_bytes = generate_multilingual_pdf(stone.data, company.data or {}, language=lang)

        # Save to Supabase storage for later access
        lang_names = {"EN":"English","TA":"Tamil","AR":"Arabic","ZH":"Chinese","PL":"Polish"}
        pdf_path = f"{ctx['company_id']}/{scan_code}-{lang}.pdf"
        pdf_url = None
        try:
            supa.storage.from_("stone-pdfs").upload(
                pdf_path, pdf_bytes,
                {"content-type": "application/pdf", "upsert": "true"}
            )
            pdf_url = f"{SUPA_URL}/storage/v1/object/public/stone-pdfs/{pdf_path}"
            # Update stone record with PDF URL
            supa.table("stones").update({"catalog_pdf_url": pdf_url}).eq("scan_code", scan_code).execute()
            log.info(f"PDF saved: {pdf_path}")
        except Exception as e:
            log.warning(f"PDF storage failed (non-fatal): {e}")

        filename = f"StoneVision-{scan_code}-{lang_names.get(lang,lang)}.pdf"
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "X-PDF-URL": pdf_url or "",
                "X-Language": lang,
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"PDF error {scan_code}/{lang}: {e}")
        raise HTTPException(500, "PDF generation failed — try again")


@app.get("/api/pdf/{scan_code}/url")
async def get_pdf_url(scan_code: str, ctx: dict = Depends(get_current_user)):
    """Get the stored PDF URL for a scan (if previously generated)."""
    stone = (supa.table("stones").select("scan_code,catalog_pdf_url,variety,scanned_at")
             .eq("scan_code", scan_code)
             .eq("company_id", ctx["company_id"])
             .single().execute())
    if not stone.data:
        raise HTTPException(404, "Scan not found")
    return {"scan_code": scan_code, "pdf_url": stone.data.get("catalog_pdf_url"), "variety": stone.data.get("variety")}


@app.get("/api/stones")
async def list_stones(
    limit: int = 20,
    offset: int = 0,
    ctx: dict = Depends(get_current_user),
):
    """Paginated stone list for current company."""
    rows = (supa.table("stones")
            .select("id,scan_code,variety,quality_grade,length_cm,width_cm,height_cm,volume_cft,total_value_inr,scanned_at,image_url,public_link,ai_flags,catalog_pdf_url")
            .eq("company_id", ctx["company_id"])
            .eq("is_archived", False)
            .order("scanned_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute())
    return {"stones": rows.data, "limit": limit, "offset": offset}


@app.get("/catalog/{scan_code}")
async def public_catalog(scan_code: str):
    """Public — no auth. Used by QR code on PDF."""
    try:
        stone = (supa.table("stones")
                 .select("scan_code,variety,quality_grade,length_cm,width_cm,height_cm,volume_m3,volume_cft,estimated_weight_kg,export_markets,quality_notes,scanned_at,variety_confidence,measurement_confidence")
                 .eq("scan_code", scan_code)
                 .not_.is_("public_link", "null")
                 .single().execute())
        if not stone.data:
            raise HTTPException(404, "Stone catalog not found")
        return stone.data
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Public catalog error {scan_code}: {e}")
        raise HTTPException(500, "Could not load catalog")


@app.post("/api/share/{scan_code}")
async def log_share(scan_code: str, channel: str = "whatsapp", ctx: dict = Depends(get_current_user)):
    stone = (supa.table("stones").select("id").eq("scan_code", scan_code).eq("company_id", ctx["company_id"]).single().execute())
    if not stone.data:
        raise HTTPException(404, "Stone not found")
    supa.table("share_events").insert({"stone_id": stone.data["id"], "company_id": ctx["company_id"], "channel": channel}).execute()
    return {"logged": True}


# ================================================================
#  ADMIN ROUTES — Superadmin only
# ================================================================

@app.get("/admin/companies")
async def admin_companies(ctx: dict = Depends(require_superadmin)):
    """All companies with full subscription status."""
    try:
        rows = supa.rpc("admin_list_companies").execute()
        return {"companies": rows.data, "total": len(rows.data)}
    except Exception as e:
        log.error(f"admin_companies error: {e}")
        raise HTTPException(500, "Failed to load company list")


class ActivatePlanRequest(BaseModel):
    company_id:   str
    plan_id:      str
    amount_inr:   int
    is_founder:   bool = False
    months:       int  = 1
    payment_ref:  Optional[str] = None
    payment_mode: str = "upi"
    notes:        Optional[str] = None

    @field_validator("plan_id")
    @classmethod
    def valid_plan(cls, v: str) -> str:
        if v not in ("basic","elite","premium","ultra"):
            raise ValueError(f"Invalid plan: {v}. Must be basic/elite/premium/ultra")
        return v

    @field_validator("amount_inr")
    @classmethod
    def positive_amount(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("amount_inr must be positive")
        return v


@app.post("/admin/activate-plan")
async def admin_activate_plan(body: ActivatePlanRequest, ctx: dict = Depends(require_superadmin)):
    """
    Call this after receiving payment from a company.
    Activates their plan and resets scan counter.
    """
    try:
        result = supa.rpc("admin_activate_plan", {
            "p_company_id":  body.company_id,
            "p_plan_id":     body.plan_id,
            "p_amount_inr":  body.amount_inr,
            "p_is_founder":  body.is_founder,
            "p_months":      body.months,
            "p_payment_ref": body.payment_ref,
            "p_pay_mode":    body.payment_mode,
            "p_notes":       body.notes,
        }).execute()
        log.info(f"Plan activated: {body.company_id[:8]} → {body.plan_id} by admin={ctx['user_id'][:8]}")
        return result.data
    except Exception as e:
        log.error(f"activate_plan error: {e}")
        raise HTTPException(500, f"Activation failed: {e}")


class AddonRequest(BaseModel):
    company_id:   str
    addon:        str   # 'branding' | 'trust_gallery' | 'api_access'
    amount_inr:   int = 0
    payment_ref:  Optional[str] = None
    notes:        Optional[str] = None

    @field_validator("addon")
    @classmethod
    def valid_addon(cls, v: str) -> str:
        if v not in ("branding","trust_gallery","api_access"):
            raise ValueError(f"Invalid addon: {v}")
        return v


@app.post("/admin/activate-addon")
async def admin_activate_addon(body: AddonRequest, ctx: dict = Depends(require_superadmin)):
    """Activate an add-on for a company after payment."""
    try:
        result = supa.rpc("admin_activate_addon", {
            "p_company_id":  body.company_id,
            "p_addon":       body.addon,
            "p_amount_inr":  body.amount_inr,
            "p_payment_ref": body.payment_ref,
            "p_notes":       body.notes,
        }).execute()
        log.info(f"Addon activated: {body.company_id[:8]} → {body.addon}")
        return result.data
    except Exception as e:
        raise HTTPException(500, f"Addon activation failed: {e}")


@app.post("/admin/suspend/{company_id}")
async def admin_suspend(company_id: str, reason: str = "", ctx: dict = Depends(require_superadmin)):
    result = supa.rpc("admin_suspend", {"p_company_id": company_id, "p_reason": reason}).execute()
    log.info(f"Company suspended: {company_id[:8]} by admin={ctx['user_id'][:8]} reason={reason}")
    return result.data


@app.post("/admin/reinstate/{company_id}")
async def admin_reinstate(company_id: str, ctx: dict = Depends(require_superadmin)):
    result = supa.rpc("admin_reinstate", {"p_company_id": company_id}).execute()
    log.info(f"Company reinstated: {company_id[:8]} by admin={ctx['user_id'][:8]}")
    return result.data


@app.get("/admin/stats")
async def admin_stats(ctx: dict = Depends(require_superadmin)):
    """Dashboard metrics for admin."""
    try:
        companies  = supa.table("companies").select("id", count="exact").execute()
        active     = supa.table("subscriptions").select("id", count="exact").eq("is_active", True).execute()
        trial      = supa.table("subscriptions").select("id", count="exact").eq("plan_id","trial").execute()
        paid       = supa.table("subscriptions").select("id", count="exact").neq("plan_id","trial").eq("is_active",True).execute()
        scans_today= (supa.table("stones").select("id", count="exact")
                      .gte("scanned_at", datetime.utcnow().strftime("%Y-%m-%d")).execute())
        revenue    = supa.table("payment_logs").select("amount_inr").execute()
        total_rev  = sum(r["amount_inr"] for r in (revenue.data or []))
        return {
            "total_companies":  companies.count or 0,
            "active_accounts":  active.count or 0,
            "trial_accounts":   trial.count or 0,
            "paid_accounts":    paid.count or 0,
            "scans_today":      scans_today.count or 0,
            "total_revenue_inr":total_rev,
        }
    except Exception as e:
        raise HTTPException(500, f"Stats error: {e}")


# ================================================================
#  PLANS (public — no auth needed)
# ================================================================
@app.get("/api/plans")
async def get_plans():
    plans = supa.table("plans").select("*").order("sort_order").execute()
    return {"plans": plans.data}


# ================================================================
#  ERROR HANDLERS — prevent 500 stack traces leaking to frontend
# ================================================================
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    log.error(f"Unhandled exception on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error — our team has been notified"}
    )


# ================================================================
#  BUYER PORTAL ROUTES
# ================================================================

async def require_buyer(ctx: dict = Depends(get_current_user)) -> dict:
    """Ensure caller has buyer role."""
    if ctx.get("role") != "buyer" and not ctx.get("is_superadmin"):
        raise HTTPException(403, "Buyer account required")
    return ctx


@app.get("/api/buyer/manifests")
async def buyer_manifests(ctx: dict = Depends(require_buyer)):
    """All manifests for this buyer with stone + company data joined."""
    try:
        rows = (supa.table("stone_manifests")
                .select("*,stones(*),companies(name,city,whatsapp)")
                .eq("buyer_uid", ctx["user_id"])
                .order("created_at", desc=True)
                .execute())
        return {"manifests": rows.data or []}
    except Exception as e:
        log.error(f"buyer_manifests error: {e}")
        raise HTTPException(500, "Failed to load manifests")


@app.post("/api/buyer/manifests/{manifest_id}/verify")
async def buyer_verify(manifest_id: str, ctx: dict = Depends(require_buyer)):
    """Buyer verifies and locks a manifest."""
    try:
        result = supa.rpc("buyer_verify_manifest", {"p_manifest_id": manifest_id}).execute()
        data = result.data
        if not data or not data.get("success"):
            raise HTTPException(400, data.get("error", "Verification failed"))
        log.info(f"Manifest verified: {manifest_id} by buyer={ctx['user_id'][:8]}")
        return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))


class DisputeRequest(BaseModel):
    reason: str

    @field_validator("reason")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Dispute reason cannot be empty")
        return v.strip()


@app.post("/api/buyer/manifests/{manifest_id}/dispute")
async def buyer_dispute(manifest_id: str, body: DisputeRequest, ctx: dict = Depends(require_buyer)):
    """Buyer raises a dispute on a manifest."""
    try:
        result = supa.rpc("buyer_dispute_manifest", {
            "p_manifest_id": manifest_id, "p_reason": body.reason
        }).execute()
        data = result.data
        if not data or not data.get("success"):
            raise HTTPException(400, data.get("error", "Dispute failed"))
        log.info(f"Manifest disputed: {manifest_id} reason={body.reason[:40]}")
        return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))


class InviteRequest(BaseModel):
    whatsapp:     str
    company_name: Optional[str] = None
    email:        Optional[str] = None


@app.post("/api/buyer/invite")
async def create_invite(body: InviteRequest, ctx: dict = Depends(require_buyer)):
    """Create a one-time invite token for an exporter."""
    try:
        result = supa.rpc("create_invite_token", {
            "p_target_whatsapp": body.whatsapp,
            "p_target_email":    body.email,
            "p_company_hint":    body.company_name,
        }).execute()
        data = result.data
        if not data or not data.get("success"):
            raise HTTPException(400, data.get("error", "Failed to create invite"))
        # Update APP_URL to real domain
        invite_url = data.get("invite_url", "").replace(
            "https://stonevision.in",
            APP_URL
        )
        log.info(f"Invite created: {invite_url[:60]} by buyer={ctx['user_id'][:8]}")
        return {"success": True, "invite_url": invite_url, "token": data.get("token")}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))


@app.get("/api/buyer/stats")
async def buyer_stats(ctx: dict = Depends(require_buyer)):
    """Summary stats for buyer dashboard."""
    try:
        rows = (supa.table("stone_manifests").select("verification_status")
                .eq("buyer_uid", ctx["user_id"]).execute())
        statuses = [r["verification_status"] for r in (rows.data or [])]
        return {
            "total":     len(statuses),
            "pending":   statuses.count("pending_upload"),
            "submitted": statuses.count("supplier_submitted"),
            "verified":  statuses.count("buyer_verified"),
            "disputed":  statuses.count("disputed"),
        }
    except Exception as e:
        raise HTTPException(500, str(e))


@app.get("/api/register/validate-token/{token}")
async def validate_invite_token(token: str):
    """Public — validate an invite token before signup. Returns company hint."""
    try:
        row = (supa.table("invite_tokens")
               .select("id,company_name_hint,expires_at,used_at")
               .eq("token", token)
               .single().execute())
        if not row.data:
            raise HTTPException(404, "Invite link not found or expired")
        if row.data.get("used_at"):
            raise HTTPException(410, "This invite link has already been used")
        from datetime import datetime, timezone
        exp = row.data.get("expires_at")
        if exp and datetime.now(timezone.utc) > datetime.fromisoformat(exp.replace("Z","+00:00")):
            raise HTTPException(410, "Invite link has expired")
        return {
            "valid":        True,
            "company_hint": row.data.get("company_name_hint"),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))


# ================================================================
#  MULTILINGUAL PDF ROUTE
# ================================================================

@app.get("/api/pdf/{scan_code}/{language}")
async def get_pdf_multilingual(
    scan_code: str,
    language: str = "EN",
    ctx: dict = Depends(get_current_user)
):
    """
    Generate PDF in specified language.
    language: EN | TA | AR | ZH | PL
    """
    from pdf_multilingual import generate_multilingual_pdf

    SUPPORTED = ["EN", "TA", "AR", "ZH", "PL"]
    lang = language.upper()
    if lang not in SUPPORTED:
        raise HTTPException(400, f"Language must be one of: {', '.join(SUPPORTED)}")

    try:
        # Try by scan_code first, then by id (UUID) for backward compat
        import re
        stone = None
        if re.match(r"^[0-9a-f]{8}-[0-9a-f]{4}-", scan_code):
            r = (supa.table("stones").select("*")
                 .eq("id", scan_code)
                 .eq("company_id", ctx["company_id"])
                 .single().execute())
            if r.data:
                stone = r
        if not stone:
            stone = (supa.table("stones").select("*")
                     .eq("scan_code", scan_code)
                     .eq("company_id", ctx["company_id"])
                     .single().execute())
        if not stone or not stone.data:
            # Last resort - get most recent stone
            r = (supa.table("stones").select("*")
                 .eq("company_id", ctx["company_id"])
                 .order("scanned_at", desc=True).limit(1).execute())
            if r.data:
                stone = r
                stone.data = r.data[0]
            else:
                raise HTTPException(404, f"Scan {scan_code} not found")

        company = (supa.table("companies")
                   .select("name,city,whatsapp,is_verified")
                   .eq("id", ctx["company_id"]).single().execute())

        pdf_bytes = generate_multilingual_pdf(
            stone=stone.data,
            company=company.data or {},
            language=lang
        )

        lang_names = {"EN":"English","TA":"Tamil","AR":"Arabic","ZH":"Chinese","PL":"Polish"}
        filename = f"StoneVision-{scan_code}-{lang_names.get(lang, lang)}.pdf"

        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Multilingual PDF error {scan_code}/{lang}: {e}")
        raise HTTPException(500, "PDF generation failed")


@app.get("/api/pdf/{scan_code}")
async def get_pdf_default(scan_code: str, ctx: dict = Depends(get_current_user)):
    """Default English PDF — backward compatible."""
    return await get_pdf_multilingual(scan_code, "EN", ctx)


# ================================================================
#  MODULE 1: SUPPLIER INVITATION ENGINE
# ================================================================

import hashlib, secrets
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

INVITE_EXPIRY_DAYS = 7

@app.post("/api/invite/supplier")
async def invite_supplier(
    payload: dict,
    ctx: dict = Depends(get_current_user)
):
    """
    Exporter invites their Indian supplier to schedule a physical audit.
    Generates a unique tokenized link + WhatsApp message.
    """
    # Validate required fields
    required = ["supplier_company","contact_person","email","whatsapp","audit_type"]
    for field in required:
        if not payload.get(field,"").strip():
            raise HTTPException(400, f"Missing required field: {field}")

    # Sanitize inputs
    supplier_company = payload["supplier_company"].strip()[:200]
    contact_person   = payload["contact_person"].strip()[:100]
    email            = payload["email"].strip().lower()[:200]
    whatsapp         = re.sub(r"[^0-9+]", "", payload["whatsapp"])[:20]
    audit_type       = payload["audit_type"].strip()
    notes            = payload.get("notes","").strip()[:500]

    AUDIT_LABELS = {
        "pre_shipment":    "Pre-Shipment Inspection",
        "factory_audit":   "Factory Compliance Audit",
        "customs_docs":    "Customs Documentation Check",
        "quality_control": "Quality Control Verification",
    }
    if audit_type not in AUDIT_LABELS:
        raise HTTPException(400, "Invalid audit type")

    # Get exporter info
    exporter = (supa.table("companies")
                .select("name,owner_email,whatsapp,city")
                .eq("id", ctx["company_id"])
                .single().execute())
    if not exporter.data:
        raise HTTPException(404, "Company not found")
    exporter_name = exporter.data.get("name","")

    # Generate secure token
    token = secrets.token_urlsafe(24)
    expires_at = (datetime.utcnow() + timedelta(days=INVITE_EXPIRY_DAYS)).isoformat()

    # Store invite in Supabase
    try:
        invite_rec = {
            "token":            token,
            "exporter_id":      ctx["company_id"],
            "exporter_name":    exporter_name,
            "supplier_company": supplier_company,
            "contact_person":   contact_person,
            "email":            email,
            "whatsapp":         whatsapp,
            "audit_type":       audit_type,
            "audit_type_label": AUDIT_LABELS[audit_type],
            "notes":            notes,
            "status":           "pending",
            "expires_at":       expires_at,
            "created_at":       datetime.utcnow().isoformat(),
        }
        supa.table("supplier_invites").insert(invite_rec).execute()
    except Exception as e:
        log.warning(f"Could not store invite (table may not exist): {e}")
        # Continue anyway — token is generated

    # Build tokenized URL
    base_url = os.environ.get("APP_URL", "https://stonevision-ai-two.vercel.app")
    invite_url = f"{base_url}/onboard/supplier?token={token}"

    # WhatsApp message (professional)
    wa_msg = (
        f"Hello {contact_person},%0A%0A"
        f"*{exporter_name}* has requested a *{AUDIT_LABELS[audit_type]}* "
        f"for your upcoming shipment through StoneVision AI.%0A%0A"
        f"This audit helps ensure your goods clear international customs smoothly "
        f"and builds trust with your buyer.%0A%0A"
        f"*Book your audit here:*%0A{invite_url}%0A%0A"
        f"The link expires in {INVITE_EXPIRY_DAYS} days.%0A%0A"
        f"Questions? Reply here or call us at +91 9655071432."
    )
    wa_number = whatsapp.replace("+", "")
    whatsapp_link = f"https://wa.me/{wa_number}?text={wa_msg}"

    log.info(f"Supplier invite generated: company={ctx['company_id'][:8]} token={token[:8]}...")

    return {
        "success": True,
        "token":   token,
        "url":     invite_url,
        "whatsapp_link": whatsapp_link,
        "expires_at":    expires_at,
        "email_sent": False,  # Set True when SMTP configured
        "message": f"Invitation generated for {contact_person} at {supplier_company}",
    }


@app.get("/api/invite/verify")
async def verify_invite_token(token: str):
    """
    Public endpoint — supplier clicks the link, we verify the token.
    Returns invite details without exposing exporter private data.
    """
    if not token or len(token) < 10:
        raise HTTPException(400, "Invalid token format")

    try:
        result = (supa.table("supplier_invites")
                  .select("*")
                  .eq("token", token)
                  .eq("status", "pending")
                  .single().execute())

        if not result.data:
            raise HTTPException(404, "Invitation not found or already used")

        invite = result.data
        if datetime.fromisoformat(invite["expires_at"]) < datetime.utcnow():
            raise HTTPException(410, "This invitation link has expired. Please ask your buyer to send a new one.")

        # Return safe subset — don't expose internal IDs
        return {
            "token":           token,
            "exporter_name":   invite.get("exporter_name", "Your Buyer"),
            "exporter_company":invite.get("exporter_name", ""),
            "supplier_company":invite.get("supplier_company",""),
            "contact_person":  invite.get("contact_person",""),
            "audit_type":      invite.get("audit_type",""),
            "audit_type_label":invite.get("audit_type_label","Physical Audit"),
            "expires_at":      invite.get("expires_at",""),
        }
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Invite verify error: {e}")
        raise HTTPException(500, "Could not verify invitation")


# ── PDF DELETE ENDPOINT (Module 3) ──────────────────────────────

@app.delete("/api/pdf/{scan_code}")
async def delete_pdf(scan_code: str, ctx: dict = Depends(get_current_user)):
    """
    Securely delete a generated PDF from storage and clear DB record.
    Only the owning company can delete their stones' PDFs.
    """
    # Verify ownership
    stone = (supa.table("stones")
             .select("id,scan_code,catalog_pdf_url,company_id")
             .eq("scan_code", scan_code)
             .eq("company_id", ctx["company_id"])  # Ownership check
             .single().execute())

    if not stone.data:
        raise HTTPException(404, "Stone not found or access denied")

    pdf_url = stone.data.get("catalog_pdf_url")
    deleted_from_storage = False

    # Delete from Supabase storage
    if pdf_url:
        for lang in ["EN","TA","AR","ZH","PL"]:
            path = f"{ctx['company_id']}/{scan_code}-{lang}.pdf"
            try:
                supa.storage.from_("stone-pdfs").remove([path])
                deleted_from_storage = True
                log.info(f"Deleted PDF from storage: {path}")
            except Exception as e:
                log.warning(f"Could not delete {path}: {e}")

    # Clear catalog_pdf_url in database
    supa.table("stones").update({"catalog_pdf_url": None}).eq("scan_code", scan_code).execute()

    return {
        "success": True,
        "scan_code": scan_code,
        "deleted_from_storage": deleted_from_storage,
        "message": f"PDF records cleared for {scan_code}",
    }


# ================================================================
#  MODULE 1: STONE RECORD EDITING
# ================================================================

@app.patch("/api/stones/{scan_code}")
async def update_stone(scan_code: str, payload: dict, ctx: dict = Depends(get_current_user)):
    """
    Update editable fields on a stone record.
    Only the owning company can edit their stones.
    Validates all inputs before saving.
    """
    ALLOWED = {"variety","quality_grade","quality_notes","length_cm","width_cm","height_cm"}
    GRADE_VALID = {"A1","A2","B1","B2"}

    # Build update dict with only allowed fields
    update = {}
    for k, v in payload.items():
        if k not in ALLOWED:
            continue
        if k == "quality_grade" and v not in GRADE_VALID:
            raise HTTPException(400, f"Invalid grade: {v}")
        if k in ("length_cm","width_cm","height_cm"):
            try:
                val = float(v)
                if val <= 0 or val > 9999:
                    raise HTTPException(400, f"{k} must be between 0 and 9999")
                update[k] = round(val, 2)
            except (TypeError, ValueError):
                raise HTTPException(400, f"{k} must be a number")
        elif k in ("variety","quality_notes"):
            update[k] = str(v).strip()[:500]
        else:
            update[k] = v

    if not update:
        raise HTTPException(400, "No valid fields to update")

    # Verify ownership before updating
    existing = (supa.table("stones").select("id,company_id")
               .eq("scan_code", scan_code)
               .eq("company_id", ctx["company_id"])
               .single().execute())

    if not existing.data:
        raise HTTPException(404, "Stone not found or access denied")

    update["updated_at"] = datetime.utcnow().isoformat()

    result = (supa.table("stones").update(update)
              .eq("scan_code", scan_code)
              .eq("company_id", ctx["company_id"])
              .execute())

    log.info(f"Stone updated: {scan_code} fields={list(update.keys())}")
    return {"success": True, "scan_code": scan_code, "updated": list(update.keys())}


@app.get("/api/verify/{scan_code}")
async def verify_document(scan_code: str):
    """
    Public verification endpoint — anyone can verify a StoneVision document.
    Used by QR codes embedded in PDFs.
    """
    try:
        stone = (supa.table("stones")
                 .select("scan_code,variety,quality_grade,company_id,scanned_at,catalog_pdf_url")
                 .eq("scan_code", scan_code)
                 .single().execute())

        if not stone.data:
            return {"verified": False, "scan_code": scan_code, "message": "Document not found"}

        # Get company name (safe, no private data)
        company = (supa.table("companies")
                   .select("name,city,is_verified")
                   .eq("id", stone.data["company_id"])
                   .single().execute())

        return {
            "verified":      True,
            "scan_code":     stone.data["scan_code"],
            "variety":       stone.data.get("variety",""),
            "grade":         stone.data.get("quality_grade",""),
            "company_name":  company.data.get("name","") if company.data else "",
            "generated_at":  stone.data.get("scanned_at",""),
            "language":      "EN",
            "pdf_url":       stone.data.get("catalog_pdf_url",""),
        }
    except Exception as e:
        log.error(f"Verify error: {e}")
        return {"verified": False, "scan_code": scan_code}
