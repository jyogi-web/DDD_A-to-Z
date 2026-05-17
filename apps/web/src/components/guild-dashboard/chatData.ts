export interface GuildChatMessage {
  id: string;
  author: string;
  body: string;
  timestamp: string;
  tone: string;
  isSelf?: boolean;
}

export const GUILD_CHAT_MESSAGES: GuildChatMessage[] = [
  {
    id: "guild-msg-1",
    author: "NullMage",
    body: "西門ルートの監視、こっちで継続中。",
    timestamp: "22:14",
    tone: "#9be7ff",
  },
  {
    id: "guild-msg-2",
    author: "PixelNinja",
    body: "次の演出差し替え、3 分で反映いける。",
    timestamp: "22:15",
    tone: "#74f7a1",
  },
  {
    id: "guild-msg-3",
    author: "TypeSmith",
    body: "了解、UI の更新後に activity log と同期する。",
    timestamp: "22:16",
    tone: "#ffd966",
    isSelf: true,
  },
  {
    id: "guild-msg-4",
    author: "LoopKnight",
    body: "南側ルートに review 待ちが残ってる。終わり次第こっち戻る。",
    timestamp: "22:18",
    tone: "#ffb8b8",
  },
  {
    id: "guild-msg-5",
    author: "AkiByte",
    body: "最新の CI ログ、警告だけだった。デプロイ進めてよさそう。",
    timestamp: "22:21",
    tone: "#9be7ff",
  },
  {
    id: "guild-msg-6",
    author: "TypeSmith",
    body: "ありがとう。次は guild details 側の導線もまとめて見る。",
    timestamp: "22:23",
    tone: "#ffd966",
    isSelf: true,
  },
];
