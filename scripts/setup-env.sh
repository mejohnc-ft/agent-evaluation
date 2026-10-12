#!/usr/bin/env bash
# Creates .env.local for development. Run it yourself in a terminal; secrets are read with hidden input
# and never echoed. Re-running keeps existing values unless you enter a new one.
# Check without revealing values: scripts/setup-env.sh --check
set -euo pipefail
cd "$(dirname "$0")/.."
ENV_FILE=.env.local

current() { [[ -f $ENV_FILE ]] && grep -E "^$1=" "$ENV_FILE" | head -1 | cut -d= -f2- || true; }

ask_secret() { # name, prompt
  local value; read -rsp "$2 (Enter to keep current/blank): " value; echo >&2
  value=$(printf '%s' "$value" | tr -d '[:space:]')
  [[ -n $value ]] && printf '%s' "$value" || current "$1"
}

# --check: report which variables are set, never their values.
if [[ ${1:-} == --check ]]; then
  [[ -f $ENV_FILE ]] || { echo "$ENV_FILE missing"; exit 1; }
  bad=$(grep -vcE '^(#.*|[A-Z_]+=.*)?$' "$ENV_FILE" || true)
  echo "malformed lines: $bad"
  for v in OPENROUTER_API_KEY MODEL_ID JUDGE_MODEL_ID SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY RESEND_API_KEY; do
    [[ -n $(current "$v") ]] && echo "$v: set" || echo "$v: empty"
  done
  key=$(current OPENROUTER_API_KEY)
  if [[ -n $key ]]; then
    curl -sS https://openrouter.ai/api/v1/key -H "Authorization: Bearer $key" \
      | jq '{ok: (.data != null), label: .data.label, limit: .data.limit, limit_remaining: .data.limit_remaining, error: .error.message}'
  fi
  exit 0
fi

OPENROUTER_API_KEY=$(ask_secret OPENROUTER_API_KEY "Personal OpenRouter key (dev, NOT the Cadre key)")
SUPABASE_SERVICE_ROLE_KEY=$(ask_secret SUPABASE_SERVICE_ROLE_KEY "Supabase service role key (Phase 2; may skip)")
RESEND_API_KEY=$(ask_secret RESEND_API_KEY "Resend API key (optional; may skip)")

if [[ -n $OPENROUTER_API_KEY && ! $OPENROUTER_API_KEY =~ ^sk-or-v1-[0-9a-f]{64}$ ]]; then
  echo "That doesn't look like an OpenRouter key (expected sk-or-v1- + 64 hex). Nothing written." >&2; exit 1
fi

umask 177
cat > "$ENV_FILE" <<ENV
# Development only. The Cadre key never goes here (see decisions.md).
OPENROUTER_API_KEY=$OPENROUTER_API_KEY
MODEL_ID=anthropic/claude-haiku-5.5
JUDGE_MODEL_ID=anthropic/claude-sonnet-5.5
SUPABASE_URL=https://dbtidufiywzghiocijaa.supabase.co
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY=$RESEND_API_KEY
HANDOFF_NOTIFY_EMAIL=$(current HANDOFF_NOTIFY_EMAIL)
DAILY_SPEND_LIMIT_USD=1
ENV
echo "Wrote $ENV_FILE (mode 600)."

if [[ -n $OPENROUTER_API_KEY ]]; then
  echo "Pinging OpenRouter with anthropic/claude-haiku-5.5..."
  curl -sS https://openrouter.ai/api/v1/chat/completions \
    -H "Authorization: Bearer $OPENROUTER_API_KEY" -H "Content-Type: application/json" \
    -d '{"model":"anthropic/claude-haiku-5.5","max_tokens":5,"messages":[{"role":"user","content":"ping"}]}' \
    | jq '{model, reply: .choices[0].message.content, cost: .usage.cost, error: .error.message}'
  curl -sS https://openrouter.ai/api/v1/key -H "Authorization: Bearer $OPENROUTER_API_KEY" \
    | jq '{label: .data.label, limit: .data.limit, usage: .data.usage, limit_remaining: .data.limit_remaining}'
fi
