import { motion } from "framer-motion";

export function ReturnTitleDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <motion.div
      role="presentation"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10,
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background: "rgba(0, 0, 0, 0.62)",
        backdropFilter: "blur(2px)",
      }}
      onClick={onCancel}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="return-title-dialog-title"
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        style={{
          width: "min(100%, 420px)",
          border: "4px solid #ffd700",
          borderBottomColor: "#6f4f1c",
          borderRightColor: "#6f4f1c",
          background: "rgba(3, 10, 24, 0.96)",
          boxShadow: "0 0 0 3px rgba(0,0,0,0.9), 10px 10px 0 rgba(0,0,0,0.58)",
          color: "#fff8d7",
          padding: "22px",
          textAlign: "center",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          id="return-title-dialog-title"
          style={{
            color: "#ffd700",
            fontSize: "clamp(0.82rem, 3vw, 1.02rem)",
            lineHeight: 1.7,
            marginBottom: "14px",
          }}
        >
          RETURN TO TITLE?
        </div>
        <p
          style={{
            margin: "0 0 22px",
            color: "rgba(255, 248, 215, 0.78)",
            fontFamily: '"DotGothic16", monospace',
            fontSize: "1rem",
            lineHeight: 1.7,
            letterSpacing: "0.04em",
          }}
        >
          タイトル画面に戻りますか？
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "12px",
          }}
        >
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ y: 2, scale: 0.98 }}
            onClick={onCancel}
            style={{
              border: "2px solid rgba(255, 255, 255, 0.34)",
              borderBottomColor: "rgba(0,0,0,0.78)",
              borderRightColor: "rgba(0,0,0,0.78)",
              background: "rgba(255, 255, 255, 0.08)",
              boxShadow: "3px 3px 0 rgba(0,0,0,0.5)",
              color: "#fff8d7",
              cursor: "pointer",
              fontFamily: '"DotGothic16", monospace',
              fontSize: "0.9rem",
              fontWeight: "bold",
              lineHeight: 1.4,
              padding: "11px 12px",
            }}
          >
            CANCEL
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ y: 2, scale: 0.98 }}
            onClick={onConfirm}
            style={{
              border: "2px solid #fff3a6",
              borderBottomColor: "#6f4f1c",
              borderRightColor: "#6f4f1c",
              background: "#f0c040",
              boxShadow: "3px 3px 0 rgba(0,0,0,0.5)",
              color: "#1b1304",
              cursor: "pointer",
              fontFamily: '"DotGothic16", monospace',
              fontSize: "0.9rem",
              fontWeight: "bold",
              lineHeight: 1.4,
              padding: "11px 12px",
            }}
          >
            TITLE
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
