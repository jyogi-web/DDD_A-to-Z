import { motion } from "framer-motion";

interface ChatComposerProps {
  placeholder?: string;
}

export function ChatComposer({ placeholder = "broadcast your next move..." }: ChatComposerProps) {
  return (
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
        placeholder={placeholder}
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
  );
}
