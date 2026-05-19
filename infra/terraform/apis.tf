# ============================================================
# apis.tf — GCP API の有効化
# ============================================================
#
# GCP では機能ごとに API を有効化しないと使えない。
# 例えば Cloud Run を使うには run.googleapis.com を有効にする必要がある。
# GCP コンソールで手動でポチポチ有効化するのと同じことを Terraform でやっている。
#
# disable_on_destroy = false にしている理由:
#   terraform destroy を実行しても API を無効化しない。
#   API を無効化するとプロジェクト内の他のリソースに影響が出ることがあるため。
# ============================================================

locals {
  bootstrap_api = "serviceusage.googleapis.com"
  apis = [
    "serviceusage.googleapis.com",         # API 有効化操作自体で利用
    "iam.googleapis.com",                  # IAM (Service Account, ロール管理)
    "iamcredentials.googleapis.com",       # Workload Identity Federation で必要
    "cloudresourcemanager.googleapis.com", # プロジェクト情報の取得に必要
    "run.googleapis.com",                  # Cloud Run
    "artifactregistry.googleapis.com",     # Docker イメージの保存場所
    "secretmanager.googleapis.com",        # Secret Manager (DB パスワード等の管理)
  ]
}

# Service Usage API は他の API 有効化処理自体に必要なので先に有効化する
resource "google_project_service" "serviceusage" {
  project            = var.project_id
  service            = local.bootstrap_api
  disable_on_destroy = false
}

# for_each でリスト内の API をまとめて有効化している
# toset() でリストをセット（重複なし）に変換している
resource "google_project_service" "apis" {
  for_each = toset(setsubtract(local.apis, [local.bootstrap_api]))

  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
  depends_on         = [google_project_service.serviceusage]
}
