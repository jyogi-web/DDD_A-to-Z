# ============================================================
# main.tf — Terraform 自体の設定
# ============================================================
#
# Terraform を使うにあたって最初に必要な「土台」の設定。
# GCP のどのプロジェクトに対して操作するか、
# 状態ファイル（tfstate）をどこに保存するかを決める。
#
# ── tfstate とは ──────────────────────────────────────────
# Terraform は「現在 GCP 上に何が存在するか」を tfstate ファイルで
# 追跡している。このファイルがないと terraform apply を実行した時に
# 「何が既に作られていて何がまだか」を判断できない。
#
# tfstate をローカルに置くと git に混入したり複数人で共有できないため、
# GCS（Google Cloud Storage）バケットに保存する。
#
# ── 初回セットアップ手順 ──────────────────────────────────
# 1. tfstate 用の GCS バケットを手動で1回だけ作る
#      gcloud storage buckets create gs://PROJECT_ID-tfstate \
#        --location=asia-northeast1 --project=PROJECT_ID
#
# 2. tofu init でバケット名を渡して初期化する
#      tofu init -backend-config="bucket=PROJECT_ID-tfstate"
#
# 3. あとは tofu apply を叩くだけ
# ============================================================

terraform {
  required_version = ">= 1.9"

  required_providers {
    # hashicorp/google = Terraform 公式の GCP プロバイダー
    # これを入れることで google_cloud_run_service 等のリソースが使えるようになる
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }

  # tfstate の保存先（GCS バケット）
  # bucket は terraform init 時に -backend-config="bucket=..." で渡す
  # prefix は GCS 内のフォルダパス。lang-war/terraform.tfstate に保存される
  backend "gcs" {
    bucket = ""
    prefix = "lang-war"
  }
}

# GCP プロバイダーの設定
# ここで project と region を指定しておくと、各リソースで毎回書かなくて済む
provider "google" {
  project = var.project_id
  region  = var.region
}
