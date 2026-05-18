import type { GuildChatMessage } from "./chatData";

interface ChatMessageListProps {
  messages: GuildChatMessage[];
  dense?: boolean;
}

export function ChatMessageList({ messages, dense = false }: ChatMessageListProps) {
  return (
    <div
      style={{
        minHeight: 0,
        display: "grid",
        alignContent: "start",
        gap: dense ? "10px" : "12px",
        overflow: "auto",
        paddingRight: "4px",
      }}
    >
      {messages.map((message) => (
        <div
          key={message.id}
          style={{
            justifySelf: message.isSelf ? "end" : "start",
            maxWidth: dense ? "88%" : "82%",
            border: `1px solid ${message.isSelf ? "rgba(255,217,102,0.46)" : "rgba(0,245,255,0.28)"}`,
            background: message.isSelf
              ? "linear-gradient(180deg, rgba(44,34,12,0.84), rgba(21,14,4,0.74))"
              : "linear-gradient(180deg, rgba(8,25,42,0.82), rgba(1,9,22,0.72))",
            boxShadow: "inset 0 0 14px rgba(0,245,255,0.08)",
            padding: dense ? "10px 12px" : "12px 14px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "10px",
              color: message.tone,
              fontFamily: '"DotGothic16", monospace',
              fontSize: dense ? "0.62rem" : "0.68rem",
              lineHeight: 1.4,
            }}
          >
            <span>{message.author}</span>
            <span>{message.timestamp}</span>
          </div>
          <p
            style={{
              margin: "8px 0 0",
              fontFamily: '"DotGothic16", monospace',
              fontSize: dense ? "0.82rem" : "0.9rem",
              lineHeight: dense ? 1.7 : 1.85,
            }}
          >
            {message.body}
          </p>
        </div>
      ))}
    </div>
  );
}
