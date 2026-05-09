# 技術設計書 — Lang War

## 技術スタック（MVP）

| レイヤー | 技術 | 選定理由 |
|---|---|---|
| フロントエンド | React + Vite | 決定済み |
| 通信 | Protobuf + Connect | 将来の多言語対応の基盤 |
| バックエンド (MVP) | Go | Protobuf周りの成熟度・Webhook処理のシンプルさ |
| DB | PostgreSQL | 勢力データの永続化 |
| キャッシュ | Valkey | リアルタイムランキング集計 |
| GitHub連携 | Webhook + REST API | リアルタイム受信 + 初期データ取り込み |
| スキーマ管理 | buf CLI | .protoの単一ソース管理 |

## A〜Z 技術割り当て（たたき台）

| | 技術 | 役割 |
|---|---|---|
| A | Astro | 静的ランディングページ |
| B | Bun | ツールチェーン / スクリプト実行 |
| C | C++ | コアロジック（WASM経由） |
| D | Deno | 補助CLIツール |
| E | Elixir | リアルタイムWebSocket通知 |
| F | F# | 関数型バックエンドサービス |
| G | Go | MVPバックエンド / BFF・worker |
| H | Haskell | 勢力計算ロジックサービス |
| I | 未定 | Infra定義系（Terraform / Nix） |
| J | Java | バックエンドサービスの一つ |
| K | Kotlin | JVM系サービス |
| L | Lua | キャラ行動スクリプティング |
| M | Mojo | ML・数値計算サービス |
| N | Nim | 軽量高速サービス |
| O | OCaml | 型安全データパイプライン |
| P | Python | データ分析・グラフ生成 |
| Q | 未定 | Queue系ミドルウェア（RabbitMQ等） |
| R | Rust | 高パフォーマンスコアサービス / Wasm |
| S | Scala | ストリーム処理（Akka Streams） |
| T | TypeScript | フロントエンド本体（React） |
| U | 未定 | 難所。Unison / uv等 要検討 |
| V | Valkey | キャッシュ・リアルタイムランキング |
| W | WebAssembly | C++ / Rustのブラウザ実行 |
| X | 未定 | 最難所。xk6（負荷テスト）案あり |
| Y | Yew | RustベースのWasm UIフレームワーク |
| Z | Zig | 最低レイヤーサービス（概念上のラスボス） |

I・Q・U・Xの4つが未確定。

## フェーズ計画

**MVP** — React + Go + PostgreSQL + GitHub連携。Protobufスキーマだけは最初から丁寧に設計する。ここが後続の全言語実装の契約になるため手を抜かない。

**拡張期** — MVPのGoサービスを動かしながら、Java・Python・Rustを順次バックエンドサービスとして追加していく。各サービスは同じ `.proto` を実装するだけで接続できる構成にする。`web-bff-go` が画面向けの集約を担い、`worker-go` が必要に応じて言語別サービスを呼び出す。

**最終形** — A〜Z 26技術すべてが実際にプロダクションで動いている状態。各言語のサービスがそのままゲーム内のキャラクター強度に影響する自己言及構造が完成する。

## 設計上の最重要判断

`.proto` スキーマを最初にきちんと作ること。バックエンドが何言語に増えても全員が同じインターフェース契約を実装する構成なので、ここが崩れると全言語を直す羽目になる。MVPの段階で `FactionService` と `GitHubEventService` の2つのサービス定義は確定させておきたい。
