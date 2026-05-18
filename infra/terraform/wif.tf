# ============================================================
# wif.tf — GitHub Actions → GCP 認証の設定
# ============================================================
#
# 「GitHub Actions が GCP を操作するための信頼関係」を構築する。
#
# ── なぜ必要か ────────────────────────────────────────────
# GitHub Actions から GCP を操作するには「お前は誰か」を証明する必要がある。
# 昔は Service Account のキーファイル（JSON）を GitHub Secrets に入れていたが、
# キーが漏洩するとリスクが高い。
#
# Workload Identity Federation（WIF）を使うと：
#   - キーファイル不要
#   - GitHub Actions が発行する一時トークンで GCP に認証できる
#   - トークンは自動で失効するので漏洩リスクが低い
#
# ── 仕組みの概要 ──────────────────────────────────────────
#
#   GitHub Actions
#     ↓ 「自分は jyogi-web/DDD_A-to-Z の GitHub Actions だ」という JWT を発行
#   Workload Identity Pool（信頼の窓口）
#     ↓ JWT を検証して「確かに本物の GitHub Actions だ」と確認
#   Workload Identity Provider（JWT の解釈ルール）
#     ↓ 「このリポジトリからのアクセスだけ許可」と絞り込む
#   Service Account（lang-war-deploy）
#     ↓ なりすまして GCP リソースを操作
#   Cloud Run / Artifact Registry / Secret Manager
#
# ── このファイルで作るリソース ────────────────────────────
#   1. Workload Identity Pool    — 信頼の窓口（GitHub からのアクセスを受け付ける箱）
#   2. Workload Identity Provider — JWT の解釈ルール（どのリポジトリを信頼するか）
#   3. Service Account           — GCP 側の実行ユーザー
#   4. IAM バインディング        — SA に何ができるか（権限）を設定
# ============================================================

# ── 1. Workload Identity Pool ─────────────────────────────
# GitHub からの認証リクエストを受け付ける「窓口」。
# この Pool の中に Provider（後述）を追加して、
# 「どこからのトークンを信頼するか」を定義する。

resource "google_iam_workload_identity_pool" "github" {
  project                   = var.project_id
  workload_identity_pool_id = "github-actions"
  display_name              = "GitHub Actions Pool"

  depends_on = [google_project_service.apis]
}

# ── 2. Workload Identity Provider ────────────────────────
# 「GitHub Actions の OIDC トークンをどう解釈するか」のルール定義。
#
# issuer_uri: GitHub Actions のトークン発行元。これが本物の GitHub であることを保証する。
#
# attribute_mapping: GitHub の JWT に含まれるフィールドを GCP の属性に変換するマッピング。
#   例) assertion.repository → attribute.repository に変換
#   これにより attribute_condition でリポジトリ名を使った絞り込みができる。
#
# attribute_condition: このリポジトリからのトークンだけ受け付ける条件。
#   main ブランチの deploy workflow だけに絞り、
#   他のリポジトリや別 workflow からこの GCP プロジェクトを操作されないようにするための安全弁。

resource "google_iam_workload_identity_pool_provider" "github" {
  project                            = var.project_id
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-actions-provider"
  display_name                       = "GitHub Actions Provider"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }

  attribute_mapping = {
    "google.subject"       = "assertion.sub"          # トークンの一意識別子
    "attribute.repository" = "assertion.repository"   # リポジトリ名 (owner/repo)
    "attribute.actor"      = "assertion.actor"        # ワークフローを実行したユーザー
    "attribute.ref"        = "assertion.ref"          # ブランチ名 (refs/heads/main 等)
    "attribute.workflow"   = "assertion.workflow_ref" # workflow ファイルと ref
  }

  # main ブランチの deploy workflow からのトークンのみ受け付ける
  attribute_condition = "assertion.repository == '${var.github_repo}' && assertion.ref == 'refs/heads/main' && assertion.workflow_ref == '${var.github_repo}/.github/workflows/deploy.yml@refs/heads/main'"
}

# ── 3. Service Account ────────────────────────────────────
# GCP 側の「実行ユーザー」。
# GitHub Actions 用と Cloud Run 実行用を分けることで、権限を最小限に絞る。

resource "google_service_account" "deploy" {
  project      = var.project_id
  account_id   = "lang-war-deploy"
  display_name = "Lang War GitHub Actions Deploy"

  depends_on = [google_project_service.apis]
}

resource "google_service_account" "cloud_run" {
  project      = var.project_id
  account_id   = "lang-war-cloud-run"
  display_name = "Lang War Cloud Run Runtime"

  depends_on = [google_project_service.apis]
}

# ── 4-a. WIF → SA の紐づけ ───────────────────────────────
# 「WIF Pool を通ってきたこのリポジトリからのアクセス」に対して
# lang-war-deploy SA へのなりすまし（workloadIdentityUser）を許可する。
# これがないと WIF で認証できても SA を使えない。

resource "google_service_account_iam_member" "wif_binding" {
  service_account_id = google_service_account.deploy.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_repo}"
}

# ── 4-b. SA の IAM ロール ─────────────────────────────────
# SA が実際に何を操作できるかを定義する。
# 最小権限の原則に従い、デプロイに必要なロールだけを付与する。

# Cloud Run サービスの作成・更新・設定変更
resource "google_project_iam_member" "deploy_run_admin" {
  project = var.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${google_service_account.deploy.email}"
}

# Artifact Registry への Docker イメージ push
resource "google_project_iam_member" "deploy_ar_writer" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.deploy.email}"
}

# ── 4-c. act-as 権限 ──────────────────────────────────────
# Cloud Run のデプロイ時、gcloud は「Cloud Run サービスがどの SA として動くか」も指定する。
# deploy SA が Cloud Run 実行 SA に "act as"（代理実行）できるように許可が必要。
# これがないと gcloud run deploy が「権限がない」と失敗する。

resource "google_service_account_iam_member" "deploy_act_as_cloud_run" {
  service_account_id = google_service_account.cloud_run.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.deploy.email}"
}

# Cloud Run の実行 SA が、実際に参照する Secret Manager シークレットだけを読めるようにする。
resource "google_secret_manager_secret_iam_member" "cloud_run_secret_accessor" {
  for_each = google_secret_manager_secret.secrets

  project   = var.project_id
  secret_id = each.value.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run.email}"
}

# CI は gcloud run deploy --set-secrets で同じシークレットを参照するため、プロジェクト全体ではなく対象シークレットだけに絞る。
resource "google_secret_manager_secret_iam_member" "deploy_secret_accessor" {
  for_each = google_secret_manager_secret.secrets

  project   = var.project_id
  secret_id = each.value.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.deploy.email}"
}
