#!/usr/bin/env bash
# GCP Secret Manager にシークレットを登録するスクリプト
# terraform apply でリソースのセットアップが済んでいることが前提
#
# 設定値はプロジェクトルートの .env から読み込む。必須変数:
#   GCP_PROJECT_ID          — GCP プロジェクト ID
#   NEON_DATABASE_URL       — Neon DB 接続文字列
#   GITHUB_CLIENT_ID        — GitHub OAuth App Client ID
#   GITHUB_CLIENT_SECRET    — GitHub OAuth App Client Secret
#
# 省略可能な変数:
#   SESSION_SECRET          — 省略時は openssl rand -hex 32 で自動生成
#
# 使い方:
#   ./scripts/setup-secrets.sh
#
# 登録されるシークレット:
#   - lang-war-database-url
#   - lang-war-github-client-id
#   - lang-war-github-client-secret
#   - lang-war-session-secret
set -euo pipefail

# ── プロジェクトルートの .env を読み込む ──────────────────────
# スクリプトの場所（scripts/）から一つ上がりプロジェクトルートを特定する
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"

if [ ! -f "${ENV_FILE}" ]; then
  echo "Error: ${ENV_FILE} が見つかりません"
  echo ""
  echo ".env.example をコピーして値を埋めてください:"
  echo ""
  echo "  cp .env.example .env"
  exit 1
fi

set -a
# shellcheck source=/dev/null
. "${ENV_FILE}"
set +a

# ── 必須変数チェック ──────────────────────────────────────────
missing=""
[ -z "${GCP_PROJECT_ID:-}"       ] && missing="${missing}  GCP_PROJECT_ID\n"
[ -z "${NEON_DATABASE_URL:-}"    ] && missing="${missing}  NEON_DATABASE_URL\n"
[ -z "${GITHUB_CLIENT_ID:-}"     ] && missing="${missing}  GITHUB_CLIENT_ID\n"
[ -z "${GITHUB_CLIENT_SECRET:-}" ] && missing="${missing}  GITHUB_CLIENT_SECRET\n"

if [ -n "${missing}" ]; then
  echo "Error: ${ENV_FILE} に以下の変数が設定されていません:"
  printf "${missing}"
  exit 1
fi

PROJECT_ID="${GCP_PROJECT_ID}"

# SESSION_SECRET が未設定なら自動生成
if [ -z "${SESSION_SECRET:-}" ]; then
  SESSION_SECRET=$(openssl rand -hex 32)
  echo "Note: SESSION_SECRET が未設定のため自動生成しました。"
fi

# ── ヘルパー関数 ──────────────────────────────────────────────

ensure_secret() {
  local name="$1"
  if gcloud secrets describe "${name}" --project="${PROJECT_ID}" &>/dev/null; then
    echo "  (既存のシークレットをスキップ: ${name})"
  else
    gcloud secrets create "${name}" \
      --replication-policy=automatic \
      --project="${PROJECT_ID}"
    echo "  作成: ${name}"
  fi
}

add_secret_version() {
  local name="$1"
  local value="$2"
  echo -n "${value}" \
    | gcloud secrets versions add "${name}" \
        --data-file=- \
        --project="${PROJECT_ID}"
}

# ── 開始 ─────────────────────────────────────────────────────
echo "===================================="
echo " GCP Secret Manager セットアップ"
echo "===================================="
echo "  Project: ${PROJECT_ID}"
echo "===================================="
echo ""

echo "[1/4] lang-war-database-url"
ensure_secret "lang-war-database-url"
add_secret_version "lang-war-database-url" "${NEON_DATABASE_URL}"
echo "  登録しました。"
echo ""

echo "[2/4] lang-war-github-client-id"
ensure_secret "lang-war-github-client-id"
add_secret_version "lang-war-github-client-id" "${GITHUB_CLIENT_ID}"
echo "  登録しました。"
echo ""

echo "[3/4] lang-war-github-client-secret"
ensure_secret "lang-war-github-client-secret"
add_secret_version "lang-war-github-client-secret" "${GITHUB_CLIENT_SECRET}"
echo "  登録しました。"
echo ""

echo "[4/4] lang-war-session-secret"
ensure_secret "lang-war-session-secret"
add_secret_version "lang-war-session-secret" "${SESSION_SECRET}"
echo "  登録しました。"
echo ""

# ── 登録済みシークレット一覧を表示 ───────────────────────────
echo "===================================="
echo " 登録完了"
echo "===================================="
echo ""
gcloud secrets list --project="${PROJECT_ID}" --filter="name:lang-war-" --format="table(name,createTime)"
echo ""
echo "Cloud Run は --set-secrets フラグでこれらを参照します。"
echo "deploy.yml の設定は変更不要です。"
echo ""
