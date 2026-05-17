import { AnimatePresence, motion } from "framer-motion";
import { steppedEase } from "../../lib/animationUtils";

interface GuildChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const messages = [
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
];

export function GuildChatOverlay({ isOpen, onClose }: GuildChatOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          key="guild-chat-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: steppedEase(5) }}
          aria-labelledby="guild-chat-overlay-title"
          style={{
            position: "fixed",
            top: "calc(env(safe-area-inset-top, 0px) + clamp(136px, 12vw, 164px))",
            right: "clamp(16px, 2.4vw, 32px)",
            zIndex: 4,
            width: "min(calc(100vw - 32px), 360px)",
            minHeight: "420px",
            display: "grid",
            gridTemplateRows: "auto minmax(0, 1fr) auto",
            gap: "12px",
            border: "2px solid rgba(0, 245, 255, 0.74)",
            borderLeftColor: "rgba(0, 245, 255, 0.92)",
            background:
              "linear-gradient(180deg, rgba(3, 10, 24, 0.76), rgba(1, 8, 22, 0.88)), repeating-linear-gradient(180deg, rgba(130,234,255,0.05), rgba(130,234,255,0.05) 1px, transparent 1px, transparent 4px)",
            boxShadow:
              "-5px 0 15px rgba(0,243,255,0.3), 0 0 0 2px rgba(0,0,0,0.64), inset 0 0 24px rgba(0,245,255,0.09)",
            color: "#f4ecd0",
            backdropFilter: "blur(10px)",
            padding: "16px",
            overflow: "hidden",
          }}
        >
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "start",
              gap: "12px",
              borderBottom: "1px solid rgba(0, 245, 255, 0.2)",
              paddingBottom: "12px",
            }}
          >
            <div>
              <span
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "rgba(155, 231, 255, 0.72)",
                  fontFamily: '"DotGothic16", monospace',
                  fontSize: "0.64rem",
                  lineHeight: 1.4,
                }}
              >
                COMM RELAY
              </span>
              <h2
                id="guild-chat-overlay-title"
                style={{
                  margin: 0,
                  color: "#d9fbff",
                  fontSize: "clamp(0.82rem, 1.25vw, 0.98rem)",
                  lineHeight: 1.45,
                  textShadow: "0 0 12px rgba(0,245,255,0.4)",
                }}
              >
                GUILD CHAT
              </h2>
            </div>

            <motion.button
              type="button"
              whileHover={{ y: -1, scale: 1.03 }}
              whileTap={{ y: 1, scale: 0.98 }}
              onClick={onClose}
              aria-label="Close guild chat"
              style={{
                minWidth: "40px",
                minHeight: "40px",
                border: "2px solid rgba(0, 245, 255, 0.68)",
                borderBottomColor: "rgba(2, 54, 72, 0.96)",
                borderRightColor: "rgba(2, 54, 72, 0.96)",
                background: "rgba(3, 12, 24, 0.84)",
                color: "#d9fbff",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "1rem",
                lineHeight: 1,
              }}
            >
              ×
            </motion.button>
          </header>

          <div
            style={{
              minHeight: 0,
              display: "grid",
              alignContent: "start",
              gap: "10px",
              overflow: "auto",
              paddingRight: "4px",
            }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  justifySelf: message.isSelf ? "end" : "start",
                  maxWidth: "88%",
                  border: `1px solid ${message.isSelf ? "rgba(255,217,102,0.46)" : "rgba(0,245,255,0.28)"}`,
                  background: message.isSelf
                    ? "linear-gradient(180deg, rgba(44,34,12,0.84), rgba(21,14,4,0.74))"
                    : "linear-gradient(180deg, rgba(8,25,42,0.82), rgba(1,9,22,0.72))",
                  boxShadow: "inset 0 0 14px rgba(0,245,255,0.08)",
                  padding: "10px 12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "10px",
                    color: message.tone,
                    fontFamily: '"DotGothic16", monospace',
                    fontSize: "0.62rem",
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
                    fontSize: "0.82rem",
                    lineHeight: 1.7,
                  }}
                >
                  {message.body}
                </p>
              </div>
            ))}
          </div>

          <form
            onSubmit={(event) => event.preventDefault()}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) auto",
              gap: "10px",
              borderTop: "1px solid rgba(0, 245, 255, 0.18)",
              paddingTop: "12px",
            }}
          >
            <input
              type="text"
              name="guild-chat"
              placeholder="broadcast your next move..."
              autoComplete="off"
              style={{
                width: "100%",
                minHeight: "42px",
                border: "1px solid rgba(0, 245, 255, 0.34)",
                background: "rgba(0, 8, 20, 0.72)",
                color: "#f4ecd0",
                fontFamily: '"DotGothic16", monospace',
                fontSize: "0.76rem",
                padding: "0 12px",
              }}
            />
            <motion.button
              type="submit"
              whileHover={{ y: -1, scale: 1.02 }}
              whileTap={{ y: 1, scale: 0.98 }}
              style={{
                minHeight: "42px",
                border: "2px solid rgba(0, 245, 255, 0.68)",
                borderBottomColor: "rgba(2, 54, 72, 0.96)",
                borderRightColor: "rgba(2, 54, 72, 0.96)",
                background: "rgba(3, 12, 24, 0.84)",
                color: "#d9fbff",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "0.58rem",
                lineHeight: 1,
                padding: "0 12px",
              }}
            >
              SEND
            </motion.button>
          </form>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
