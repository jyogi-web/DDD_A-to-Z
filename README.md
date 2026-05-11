# DDD_A-to-Z

DDDハッカソン用プロジェクト「Lang War」のリポジトリです。

## Quick Start

推奨環境は Nix + direnv です。

```bash
direnv allow
pnpm install
cp .env.example .env
pnpm db:up
pnpm dev
```

direnv を使わない場合は、以下でも同じ開発環境に入れます。

```bash
nix develop
pnpm install
cp .env.example .env
pnpm db:up
pnpm dev
```

初回の `pnpm install` 後に Lefthook が Git hooks を設定します。手動で入れ直す場合は以下を実行してください。

```bash
pnpm prepare
```

起動後の URL は以下です。

- Web: http://localhost:5173
- API health check: http://localhost:8080/healthz

5173 が使用中の場合、Vite が表示する代替ポートを使ってください。

## Local Database

ローカル開発用の PostgreSQL は Docker Compose で起動します。初回は `.env.example` をコピーしてから起動してください。

```bash
cp .env.example .env
pnpm db:up
```

デフォルトの接続情報は以下です。

- DB: `lang_war`
- User: `lang_war`
- Password: `lang_war_password`
- Port: `5432`
- DATABASE_URL: `postgres://lang_war:lang_war_password@localhost:5432/lang_war?sslmode=disable`

アプリケーションからは `.env` の `DATABASE_URL` を使って接続します。別コンテナから接続する場合は host を `postgres` にしてください。

起動確認:

```bash
pnpm db:status
docker compose exec postgres pg_isready -U lang_war -d lang_war
```

停止:

```bash
pnpm db:down
```

DB データは `postgres_data` volume に永続化されます。データも含めて削除して作り直したい場合は `pnpm db:reset` を実行してください。

## Commands

```bash
pnpm dev
pnpm db:up
pnpm db:down
pnpm db:status
pnpm db:reset
pnpm lint
pnpm test
pnpm build
pnpm format
```

ルートのコマンドは各言語・各 workspace の検証を呼び出すための入口です。TypeScript の検証は `apps/web` の Oxlint / Oxfmt、Go の lint は `golangci-lint`、Go の整形は `gofmt` が担当します。
monorepo のタスク実行は Turbo で管理します。

## Requirements

Nix を使う場合、Node.js / pnpm / Go は `flake.nix` で提供されます。
Nix を使わない場合は、以下をローカルに用意してください。

- Node.js 22
- pnpm 10
- Go 1.26

## Project Layout

```text
apps/
  web/          React + Vite の最小フロントエンド
services/
  api/          Go の最小 HTTP API
docs/           企画・技術・アーキテクチャ資料
```

現時点ではプロジェクト本体の機能は実装していません。新規メンバーが同じ環境で開発を始められるようにするための基盤だけを置いています。

## Docs

- [ゲーム企画書](docs/ProductOverview.md)
- [技術設計書](docs/Tech.md)
- [アーキテクチャ設計書](docs/Architecture.md)
- [Turbo 運用ガイド](docs/Turbo.md)
