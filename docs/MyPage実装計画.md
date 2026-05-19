# MyPage API 実装計画

## 現状

### バックエンド（`GET /api/mypage`）— 実装済み

| フィールド | 内容 | 状態 |
|-----------|------|------|
| `user` | id, github_id, username, avatar_url, created_at | ✅ |
| `contribution_points` | balance, total_earned, total_spent | ✅ |
| `repositories` | total_count, language_summary, recent[5] | ✅ |
| `guild` | 常に null | ⚠️ ギルド機能未実装 |

### フロントエンド（`MyPage.tsx`）— 全モック

6つのパネルがすべて `MOCK` オブジェクトのハードコード値で表示されている。API 呼び出しはゼロ。

## 6パネル データ対応表

| # | パネル | 表示項目 | バックエンド | 今回の対応 |
|---|-------|---------|-------------|-----------|
| 1 | **PROFILE** | 名前, 称号, ランク名, シーズン | username のみ | **username をAPIに置換**。称号・ランク・シーズンは backend 未実装のためモック維持 |
| 2 | **GUILD** | ギルド名, エンブレム, ランク, CP | guild 常に null | モック維持 |
| 3 | **GITHUB GRASS** | 52週×7日のコントリビューションヒートマップ, ストリーク | 日別コミットデータなし | モック維持 |
| 4 | **LANGUAGES** | 言語名, %, RPGステータス | language_summary（言語別リポジトリ数） | **言語一覧と割合をAPIに置換**。RPGステータスは削除 |
| 5 | **GOALS + TITLE** | コミット目標進捗, 称号 | 未実装 | モック維持 |
| 6 | **QUICK STATS** | Today/Week/TotalPRs/Issues/Streak | 集計ロジックなし | **CP残高など利用可能な値で代替** |

## スコープ（今回やること）

### 1. フロントエンド API クライアントの作成

`apps/web/src/features/mypage/api.ts` を新規作成。

### 2. MyPage.tsx の修正

以下の変更を行う：

- `MOCK` オブジェクトを縮小（使う部分だけ残す）
- `useEffect` + `fetchMyPage()` でデータ取得
- **PROFILE**: `MOCK.user.name` → `data.user.username`
- **LANGUAGES**: `MOCK.langs` → `data.repositories.language_summary` から動的生成（リポジトリ数の割合を計算、RPG stats 行は除去）
- **QUICK STATS**: `MOCK` → `data.contribution_points` の値を表示
- その他3パネル（GUILD / GRASS / GOALS）はモック維持
- loading / error 状態の追加

### 3. 非スコープ（今回やらないこと）

- Guild 機能の backend 実装
- GitHub 日別コントリビューションデータの取得・保存
- Goals / Titles の backend モデル追加
- Season 情報の backend 実装

## 期待される API レスポンス形式

```jsonc
{
  "user": {
    "id": "github_12345",
    "github_id": 12345,
    "username": "DevSamurai",
    "avatar_url": "https://avatars.githubusercontent.com/u/12345",
    "created_at": "2025-01-01T00:00:00Z"
  },
  "contribution_points": {
    "balance": 153,
    "total_earned": 200,
    "total_spent": 47
  },
  "repositories": {
    "total_count": 12,
    "language_summary": {
      "TypeScript": 5,
      "Rust": 3,
      "Python": 2,
      "Go": 1,
      "Shell": 1
    },
    "recent": [
      {
        "github_id": 987654,
        "full_name": "user/repo",
        "language": "TypeScript",
        "html_url": "https://github.com/user/repo",
        "pushed_at": "2026-05-18T10:38:38Z"
      }
    ]
  },
  "guild": null
}
```

## 変更ファイル一覧

| ファイル | 操作 |
|---------|------|
| `apps/web/src/features/mypage/api.ts` | 新規作成 |
| `apps/web/src/components/my-page/MyPage.tsx` | 修正 |
