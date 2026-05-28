#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
#  StoneVision AI — Mac M3 Setup Script
#  Run once: chmod +x setup.sh && ./setup.sh
# ═══════════════════════════════════════════════════════════
set -e
RED='\033[0;31m'; GREEN='\033[0;32m'; GOLD='\033[0;33m'; BLUE='\033[0;34m'; NC='\033[0m'; BOLD='\033[1m'

header() { echo -e "\n${GOLD}${BOLD}══ $1 ══${NC}"; }
ok()     { echo -e "  ${GREEN}✓${NC}  $1"; }
info()   { echo -e "  ${BLUE}ℹ${NC}  $1"; }
err()    { echo -e "  ${RED}✕${NC}  $1"; exit 1; }

echo -e "${GOLD}${BOLD}"
echo "  ◈ StoneVision AI — Mac M3 Setup"
echo "  Production-grade · TDD · Zero-error"
echo -e "${NC}"

# ── Check Mac M3 ────────────────────────────────────────────
header "1/8 System Check"
[[ "$(uname)" == "Darwin" ]] || err "This script is for macOS"
ARCH=$(uname -m)
info "Architecture: $ARCH"
[[ "$ARCH" == "arm64" ]] && ok "Apple Silicon (M1/M2/M3) detected — optimal performance"

# ── Homebrew ────────────────────────────────────────────────
header "2/8 Homebrew"
if ! command -v brew &>/dev/null; then
  info "Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi
ok "Homebrew ready"

# ── Core tools ──────────────────────────────────────────────
header "3/8 Core Tools"
for tool in node python3 git docker; do
  if ! command -v $tool &>/dev/null; then
    info "Installing $tool..."
    case $tool in
      node)   brew install node@20 && brew link node@20 ;;
      python3) brew install python@3.12 ;;
      git)    brew install git ;;
      docker) brew install --cask docker && info "Start Docker Desktop from Applications" ;;
    esac
  fi
  ok "$tool: $(command -v $tool)"
done

# ── Node version check ──────────────────────────────────────
NODE_V=$(node --version | cut -d. -f1 | tr -d v)
[[ $NODE_V -ge 18 ]] || err "Node 18+ required, got $(node --version)"
ok "Node $(node --version)"

# ── Python version check ────────────────────────────────────
PY_V=$(python3 --version | cut -d. -f2)
[[ $PY_V -ge 11 ]] || info "Python 3.11+ recommended, got $(python3 --version)"

# ── Supabase CLI ────────────────────────────────────────────
header "4/8 Supabase CLI"
if ! command -v supabase &>/dev/null; then
  brew install supabase/tap/supabase
fi
ok "Supabase CLI: $(supabase --version)"

# ── Backend Python env ──────────────────────────────────────
header "5/8 Backend (FastAPI)"
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt -q
ok "Python venv created and packages installed"

# Verify critical imports
python3 -c "
import fastapi, uvicorn, httpx, supabase, fpdf, qrcode, PIL, pytest
print('  All Python imports OK')
"
deactivate
cd ..

# ── Frontend Node deps ──────────────────────────────────────
header "6/8 Frontend (Next.js)"
cd frontend
npm install --legacy-peer-deps --silent
ok "Node packages installed ($(ls node_modules | wc -l | tr -d ' ') packages)"
cd ..

# ── Test dependencies ───────────────────────────────────────
header "7/8 Test Suite"
cd tests
npm install --silent 2>/dev/null || true
cd ..
pip install pytest pytest-asyncio httpx --break-system-packages -q 2>/dev/null || true
ok "Test dependencies ready"

# ── Environment file ────────────────────────────────────────
header "8/8 Environment"
if [[ ! -f .env ]]; then
  cp .env.example .env
  info "Created .env from template — fill in your keys:"
  echo ""
  echo "  ${GOLD}Required:${NC}"
  echo "    GEMINI_API_KEY     → aistudio.google.com/app/apikey"
  echo "    SUPABASE_URL       → supabase.com → Settings → API"
  echo "    SUPABASE_ANON_KEY  → supabase.com → Settings → API"
  echo "    SUPABASE_SERVICE_KEY → supabase.com → Settings → API"
  echo ""
  info "Open .env and fill in the values, then run: ./scripts/dev.sh"
else
  ok ".env already exists"
fi

# ── Summary ─────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}══════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  Setup Complete! ◈${NC}"
echo -e "${GREEN}${BOLD}══════════════════════════════════════${NC}"
echo ""
echo "  Next steps:"
echo "  1. Fill in .env with your API keys"
echo "  2. ./scripts/run-tests.sh   ← run test suite first"
echo "  3. ./scripts/dev.sh         ← start local dev servers"
echo "  4. Open http://localhost:3000"
echo ""
