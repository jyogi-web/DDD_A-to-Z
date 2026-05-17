# ============================================================
# artifact_registry.tf — Docker イメージの保存場所
# ============================================================
#
# Artifact Registry は GCP のコンテナレジストリ。
# Docker Hub のような「Docker イメージを保存・管理する場所」だが、
# GCP 内に閉じているため Artifact Registry から Cloud Run へのデプロイが速い。
#
# デプロイフロー:
#   GitHub Actions が docker build でイメージを作る
#     → このリポジトリに push する
#       → Cloud Run がここからイメージを pull して起動する
#
# イメージの URL 形式:
#   asia-northeast1-docker.pkg.dev/PROJECT_ID/lang-war/api:SHA
#   [リージョン]-docker.pkg.dev/[プロジェクトID]/[リポジトリ名]/[イメージ名]:[タグ]
# ============================================================

resource "google_artifact_registry_repository" "api" {
  project       = var.project_id
  location      = var.region
  repository_id = "lang-war" # リポジトリ名。URL の一部になる
  format        = "DOCKER"
  description   = "Lang War container images"

  depends_on = [google_project_service.apis]
}
