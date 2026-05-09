# アーキテクチャ設計書 — Lang War

## 方針

Lang War は、MVP ではシンプルな BFF 中心の構成で始める。将来的には A〜Z の各技術・言語を独立した Cloud Run サービスとして追加し、ゲーム内の言語勢力と実際のサービス構成が対応する形を目指す。

最初から汎用 API Gateway を作るのではなく、React フロントエンド専用の BFF を置く。BFF は画面表示に必要なデータ集約、認証、GitHub 連携、Webhook 受信を担当する。言語別サービスは、必要になった段階で非同期処理側から呼び出す。

## 全体構成

```text
[React Frontend]
  Vercel / Cloudflare Pages / Firebase Hosting
        |
        v
[Cloud Run: web-bff-go]
        |
        +--> [Cloud SQL: PostgreSQL]
        |
        +--> [Memorystore / Upstash: Valkey]
        |
        +--> [GitHub API]
        |
        +--> [Pub/Sub or Cloud Tasks]
                  |
                  +--> [Cloud Run: worker-go]
                  |
                  +--> [Cloud Run: lang-service-go]
                  +--> [Cloud Run: lang-service-python]
                  +--> [Cloud Run: lang-service-rust]
                  +--> ...
                  +--> [Cloud Run: lang-service-zig]
```

## コンポーネント

| コンポーネント | 役割 | スケール方針 |
|---|---|---|
| `frontend` | React/Vite の画面 | 静的ホスティング |
| `web-bff-go` | 画面 API、認証、GitHub 連携、表示用データ集約、Webhook 受信 | `min instances: 1` 推奨 |
| `worker-go` | Webhook 後処理、ランキング更新、シーズン処理 | `min instances: 0 or 1` |
| `postgres` | ユーザー、言語、シーズン、GitHub イベント履歴、ポイント履歴 | マネージド DB |
| `valkey` | ランキング、勢力値、画面表示キャッシュ | マネージド Redis 互換 |
| `pubsub/tasks` | 非同期処理キュー | マネージド |
| `lang-service-*` | 言語別の計算、評価、キャラクター能力値算出 | 多くは `min instances: 0` |

## リクエストフロー

### ユーザー画面

ユーザー向け画面では、言語別サービスを同期的に呼ばない。Cloud Run のコールドスタートがユーザー体験に出るため、画面表示は PostgreSQL と Valkey に保存済みの結果から返す。

```text
React
  -> web-bff-go
    -> Valkey からランキング・勢力値を取得
    -> PostgreSQL から詳細情報を取得
    -> 画面用レスポンスを返す
```

### GitHub Webhook

GitHub Webhook は BFF で受け、署名検証とイベント永続化だけを同期処理で行う。重い解析やランキング更新はキューに逃がす。

```text
GitHub Webhook
  -> web-bff-go
    -> 署名検証
    -> イベントを PostgreSQL に保存
    -> Pub/Sub or Cloud Tasks に投入

worker-go
  -> イベント解析
  -> 言語判定
  -> ポイント計算
  -> PostgreSQL 更新
  -> Valkey 更新
```

### 言語別サービス

言語別サービスは、原則として DB を直接触らない。入力を受け取り、計算結果を返すだけの副作用が小さいサービスにする。永続化は `worker-go` または `web-bff-go` に集約する。

```text
worker-go
  -> lang-service-rust
  -> lang-service-python
  -> lang-service-java
  -> 結果を集約
  -> PostgreSQL / Valkey に反映
```

## スケール方針

全サービスをゼロスケールにすると、初回アクセス時のコールドスタートがユーザー体験に出やすい。特に JVM 系、Scala、Haskell、Elixir、重い Python 依存を持つサービスは起動が遅くなる可能性がある。

そのため、ユーザー導線上のサービスと非同期処理用サービスでスケール方針を分ける。

| 対象 | 方針 |
|---|---|
| `web-bff-go` | `min instances: 1`。ユーザーリクエストの入口なので常時温める |
| `worker-go` | 処理頻度次第で `0 or 1`。Webhook 量が増えたら `1` を検討 |
| 人気言語サービス | 必要なら `min instances: 1` |
| 低頻度・重い言語サービス | `min instances: 0` |
| 管理用・集計用サービス | `min instances: 0` |

## MVP 構成

MVP では、言語別サービスを最初から 26 個作らない。まずは Go の BFF と worker の中にドメインロジックを置き、外に出したくなった処理から `services/lang-*` に分離する。

```text
frontend
web-bff-go
worker-go
postgres
valkey
pubsub/tasks
```

## 拡張後の構成

主要言語から順に Cloud Run サービスとして追加する。

```text
web-bff-go
worker-go
lang-service-go
lang-service-python
lang-service-rust
lang-service-java
...
```

最終的には、A〜Z の 26 言語・技術サービスに BFF と worker を加えて、Cloud Run サービスが 30 個弱立つ構成を想定する。

## ファイル構成

MVP は monorepo とし、フロントエンド、BFF、worker、proto、DB、infra を同じリポジトリで管理する。

```text
DDD_A-to-Z/
├── README.md
├── docs/
│   ├── ProductOverview.md
│   ├── Tech.md
│   ├── Architecture.md
│   └── Deployment.md
│
├── proto/
│   ├── langwar/
│   │   └── v1/
│   │       ├── faction.proto
│   │       ├── github_event.proto
│   │       └── lang_service.proto
│   ├── buf.yaml
│   └── buf.gen.yaml
│
├── apps/
│   └── web/
│       ├── package.json
│       ├── vite.config.ts
│       ├── src/
│       │   ├── main.tsx
│       │   ├── app/
│       │   ├── pages/
│       │   ├── features/
│       │   ├── components/
│       │   └── lib/
│       └── Dockerfile
│
├── services/
│   ├── web-bff/
│   │   ├── cmd/
│   │   │   └── server/
│   │   │       └── main.go
│   │   ├── internal/
│   │   │   ├── auth/
│   │   │   ├── config/
│   │   │   ├── http/
│   │   │   ├── application/
│   │   │   ├── domain/
│   │   │   ├── github/
│   │   │   ├── postgres/
│   │   │   ├── valkey/
│   │   │   └── queue/
│   │   ├── go.mod
│   │   └── Dockerfile
│   │
│   ├── worker/
│   │   ├── cmd/
│   │   │   └── worker/
│   │   │       └── main.go
│   │   ├── internal/
│   │   │   ├── application/
│   │   │   ├── domain/
│   │   │   ├── github/
│   │   │   ├── postgres/
│   │   │   ├── valkey/
│   │   │   ├── queue/
│   │   │   └── langclient/
│   │   ├── go.mod
│   │   └── Dockerfile
│   │
│   └── lang-go/
│       ├── cmd/
│       │   └── server/
│       │       └── main.go
│       ├── internal/
│       │   ├── service/
│       │   └── scoring/
│       ├── go.mod
│       └── Dockerfile
│
├── packages/
│   ├── proto-go/
│   │   └── gen/
│   ├── proto-ts/
│   │   └── src/gen/
│   └── shared-types/
│
├── db/
│   ├── migrations/
│   └── seed/
│
├── infra/
│   ├── docker-compose.yml
│   ├── cloudrun/
│   └── terraform/
│
├── scripts/
│   ├── dev.sh
│   ├── gen-proto.sh
│   ├── migrate.sh
│   └── deploy.sh
│
└── .github/
    └── workflows/
        ├── ci.yml
        └── deploy.yml
```

## 将来のサービス追加イメージ

A〜Z の各技術を増やす場合は、`services/` 配下にサービスを追加する。

```text
services/
├── web-bff/
├── worker/
├── lang-astro/
├── lang-bun/
├── lang-cpp/
├── lang-deno/
├── lang-elixir/
├── lang-fsharp/
├── lang-go/
├── lang-haskell/
├── lang-java/
├── lang-kotlin/
├── lang-python/
├── lang-rust/
├── lang-typescript/
└── lang-zig/
```

## 設計上の注意点

- `proto/` は全サービス共通の契約として独立させる。
- 画面表示は `web-bff-go` が担当し、フロントエンドは言語別サービスを直接呼ばない。
- `lang-service-*` は DB に直接書き込まない。
- ユーザー導線上で 26 サービスを同期呼び出ししない。
- MVP では Go 内部でモジュール分割し、外部サービス化が必要になった処理から切り出す。
- Cloud Run のゼロスケールは、ユーザー導線から外れた非同期サービスを中心に使う。

## DDD 方針

Lang War では、技術を増やすこと自体を目的にせず、ゲームの中核ルールをドメインモデルとして明確に保つ。MVP では単一の Go サービス内に実装してよいが、コード上はドメイン、ユースケース、インフラを分ける。

### 境界づけられたコンテキスト

初期段階では、以下のコンテキストを意識する。

| コンテキスト | 役割 |
|---|---|
| Game / Faction | 言語勢力、ポイント、ランキング、シーズンの中核ルール |
| GitHub Integration | GitHub OAuth、Webhook、GitHub API、イベント正規化 |
| User / Account | ユーザー、GitHub アカウント連携、認証状態 |
| Presentation / BFF | 画面向け API、表示用集約、レスポンス整形 |
| Language Runtime | 言語別サービスによる計算、評価、キャラクター能力値算出 |

最初からこれらを物理サービスとして分割しない。まずは同一 Go プロセス内の package 境界として分け、負荷・変更頻度・チーム分担が見えてから外部サービス化する。

### レイヤー

Go サービス内では、以下の依存方向を守る。

```text
cmd
  -> http / queue handlers
    -> application
      -> domain
    -> infra
```

`domain` は GitHub API、PostgreSQL、Valkey、Cloud Tasks などを直接知らない。外部 I/O は `application` から interface 経由で呼び、実装は `infra` 側に置く。

### 集約候補

MVP で中心になる集約は以下。

| 集約 | 説明 |
|---|---|
| `Season` | シーズン期間、状態、開始・終了ルール |
| `Faction` | 言語勢力。現在ポイント、順位、キャラクター状態を持つ |
| `GitHubEvent` | GitHub から受け取った活動イベント。重複排除と処理状態を持つ |
| `Contribution` | ユーザー活動をゲーム上のポイントに変換した結果 |
| `UserAccount` | ユーザーと GitHub アカウント連携 |

ポイント計算やシーズン締めなど、ゲームルールとして重要な処理は `domain` に寄せる。DB の都合や GitHub の payload 形式をそのままドメインモデルに持ち込まない。

### ユースケース候補

`application` 層には、画面や worker から呼ばれるユースケースを置く。

| ユースケース | 呼び出し元 | 概要 |
|---|---|---|
| `GetMapView` | BFF | マップ表示に必要な勢力情報を取得する |
| `GetRanking` | BFF | Valkey / PostgreSQL からランキングを取得する |
| `ReceiveGitHubWebhook` | BFF | 署名検証後のイベントを保存し、非同期ジョブを投入する |
| `ProcessGitHubEvent` | worker | GitHub イベントをポイントに変換し、ランキングを更新する |
| `CloseSeason` | worker / admin | シーズンを締め、結果を確定する |
| `EvaluateLanguageRuntime` | worker | 言語別サービスを呼び出し、能力値や補正値を得る |

### Repository と外部サービス

ドメインから永続化や外部 API を直接呼ばない。`application` 層が必要とする interface を定義し、実装を `postgres`、`valkey`、`github`、`queue`、`langclient` に分ける。

```text
application
  -> FactionRepository
  -> SeasonRepository
  -> GitHubEventRepository
  -> RankingCache
  -> JobQueue
  -> LanguageRuntimeClient

infra
  -> postgres
  -> valkey
  -> github
  -> queue
  -> langclient
```

### パッケージ構成イメージ

`services/web-bff` と `services/worker` は別プロセスでも、当面は似たドメインモデルを共有する。重複がつらくなったら `services/internal` や `packages/domain-go` のような共有 package を検討する。ただし、早すぎる共有化は避ける。

```text
services/web-bff/internal/
├── http/
├── application/
│   ├── get_map_view.go
│   ├── get_ranking.go
│   └── receive_github_webhook.go
├── domain/
│   ├── faction.go
│   ├── season.go
│   ├── contribution.go
│   └── github_event.go
├── postgres/
├── valkey/
├── github/
└── queue/

services/worker/internal/
├── queue/
├── application/
│   ├── process_github_event.go
│   ├── close_season.go
│   └── evaluate_language_runtime.go
├── domain/
├── postgres/
├── valkey/
└── langclient/
```

### マイクロサービス化の基準

DDD の境界を、そのまま最初から Cloud Run サービス境界にしない。外部サービス化は、次の条件が出てから行う。

- 起動・ランタイム・依存関係が明確に違う。
- 負荷特性が BFF / worker と違う。
- 変更頻度や担当者が分かれる。
- 失敗しても本体のユーザー導線に影響させたくない。
- 言語別サービスとして独立させること自体がゲーム体験になる。

この方針により、MVP では DDD のコード境界を保ちつつ、運用上のマイクロサービス分割は後回しにする。

## 開発環境の方針

開発中のツール管理は、`pnpm`、Nix flakes、Docker Compose、buf を役割ごとに分ける。

```text
pnpm           JS/TS workspace、root scripts、frontend、proto-ts 生成
Go tooling     services/web-bff、services/worker のビルド・テスト
Nix flakes     Node、pnpm、Go、buf、Docker 系 CLI などの開発ツール固定
Docker Compose ローカルの PostgreSQL / Valkey
buf            Protobuf スキーマ管理・コード生成
```

`pnpm` は全体のコマンド入口として使う。ただし Go サービス自体を無理に pnpm workspace package にしない。root の `package.json` から `go run` や `go test` を呼び出す形にする。

Nix flakes は、まずは開発ツールのバージョン固定に用途を絞る。production build や各サービスのコンテナ生成まで Nix に寄せるのは、必要になってから検討する。

## 開発用ファイル構成

開発ツールを入れた root の構成は以下を想定する。

```text
DDD_A-to-Z/
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── flake.nix
├── flake.lock
├── .env.example
├── apps/
│   └── web/
├── services/
│   ├── web-bff/
│   └── worker/
├── proto/
├── db/
└── infra/
    └── docker-compose.yml
```

`pnpm-workspace.yaml` は、まず JS/TS の package だけを対象にする。

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

将来 `services/lang-typescript` や `services/lang-bun` のような JS/TS 系サービスを追加した場合は、そのサービスだけ workspace 対象に加える。

## root scripts

root の `package.json` は、開発中によく使う操作の入口にする。

```json
{
  "scripts": {
    "dev:web": "pnpm --filter web dev",
    "dev:bff": "go run ./services/web-bff/cmd/server",
    "dev:worker": "go run ./services/worker/cmd/worker",
    "dev:infra": "docker compose -f infra/docker-compose.yml up",
    "proto": "buf generate",
    "test": "pnpm -r test && go test ./services/...",
    "lint": "pnpm -r lint"
  }
}
```

MVP 初期は `dev:all` を無理に作らなくてもよい。フロントエンド、BFF、worker、infra を個別ターミナルで起動する方が挙動を追いやすい。必要になった段階で、複数プロセスをまとめて起動する `dev` script を追加する。

## flake.nix

`flake.nix` は最初は dev shell だけを定義する。

```nix
{
  description = "Lang War development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      systems = [ "aarch64-darwin" "x86_64-darwin" "x86_64-linux" "aarch64-linux" ];
      forAllSystems = f:
        nixpkgs.lib.genAttrs systems (system:
          f nixpkgs.legacyPackages.${system}
        );
    in
    {
      devShells = forAllSystems (pkgs: {
        default = pkgs.mkShell {
          packages = [
            pkgs.nodejs
            pkgs.corepack
            pkgs.go
            pkgs.buf
            pkgs.docker
            pkgs.docker-compose
            pkgs.git
            pkgs.ripgrep
          ];

          shellHook = ''
            corepack enable
          '';
        };
      });
    };
}
```

Nix flakes は実務ではよく使われるが、Nix 公式上は experimental 機能として扱われている。そのため、初期段階では「開発環境の固定」に限定して使う。

## ローカル開発フロー

基本の流れは以下。

```bash
nix develop
pnpm install
pnpm dev:infra
pnpm proto
pnpm dev:web
pnpm dev:bff
pnpm dev:worker
```

ローカルの PostgreSQL と Valkey は Docker Compose で起動する。アプリケーションはホスト側で起動し、ホットリロードやデバッガを使いやすくする。

## まだ入れないもの

初期段階では、開発基盤を重くしすぎない。

| ツール | 判断 |
|---|---|
| Turbo | package が増えて build/test キャッシュが必要になってから導入 |
| Nx | 今の規模では重い |
| devenv | 強力だが、Nix flakes + pnpm + Docker Compose で足りる間は入れない |
| production build の Nix 化 | Cloud Run 用 Dockerfile が安定してから検討 |

当面の採用方針は、`pnpm workspace`、`flake.nix`、Docker Compose、buf、Go 標準 tooling とする。
