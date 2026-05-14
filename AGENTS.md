# AGENTS.md

## 基本方針

- MVP の Go API は DDD と Clean Architecture を基本方針にする。
- 内側ほどビジネスルールに近く、外側ほど技術詳細に近い。
- 依存方向は常に以下にそろえる。

```text
interfaces -> application -> domain
infrastructure -> application/domain
cmd/server -> 全体の組み立て
```

- `domain` は GitHub API、PostgreSQL、HTTP、env を知らない。
- `application` は use case と port interface を持つ。
- `infrastructure` が application port を実装する。
- `interfaces/http` は HTTP request/response を use case 呼び出しへ変換する。

## バックエンド配置

```text
services/api/
├── cmd/
│   └── server/                       # DI、プロセス起動、ListenAndServe
└── internal/
    ├── domain/                       # Entity / Value Object / Domain Service
    │   ├── user/
    │   ├── repositoryanalysis/
    │   ├── contributionpoint/
    │   └── guild/
    ├── application/                  # Use Case / Port
    │   ├── auth/
    │   ├── user/
    │   ├── github/
    │   ├── repositoryanalysis/
    │   ├── contributionpoint/
    │   ├── guild/
    │   └── mypage/
    ├── infrastructure/               # 外部I/Oと技術詳細
    │   ├── config/
    │   ├── database/
    │   ├── github/
    │   ├── postgres/
    │   ├── memory/
    │   ├── security/
    │   └── logger/
    └── interfaces/
        └── http/
```

## 実装ルール

- `cmd/server` は組み立てだけを持つ。業務ロジックは置かない。
- Entity / Value Object / Domain Service は `domain` に置く。
- Use Case と Repository / Client の interface は `application` に置く。
- GitHub API、PostgreSQL、token生成、config、DB接続、logger などの技術詳細は `infrastructure` に置く。
- HTTP controller は `interfaces/http` に置き、use case を呼ぶだけにする。
- `platform` package は使わない。基盤系の置き場所は `infrastructure` に統一する。
- 後続 Issue では、GitHub ログイン実装を層分けのサンプルとして参照する。
- フォルダごとの詳しい説明は `docs/BackendStructure.md` を参照する。

## 検証

Go API を触ったら、可能な限り以下を実行する。

```bash
pnpm --filter @lang-war/api format
pnpm --filter @lang-war/api build
pnpm --filter @lang-war/api test
pnpm --filter @lang-war/api lint
```

## DB schema / migration

- DB schema は Go の起動処理ではなく Atlas で管理する。
- schema の source of truth は `db/schema.sql`。
- versioned migration は `db/migrations/` に置く。
- Atlas CLI は Nix devShell 経由で使う。
- DB schema を変更したら、以下を実行する。

```bash
pnpm db:migrate:diff <name>
pnpm db:migrate:validate
pnpm db:migrate:lint
```

- ローカル DB に反映する場合は `pnpm db:migrate:apply` を使う。
- Go API 起動時に `CREATE TABLE` や migration 実行を追加しない。
