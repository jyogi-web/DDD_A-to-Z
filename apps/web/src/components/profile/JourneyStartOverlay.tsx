import { motion } from "framer-motion";
import { steppedEase } from "../../lib/animationUtils";

const PIXEL_WIPE_TILES = Array.from({ length: 48 }, (_, i) => ({
  col: i % 8,
  row: Math.floor(i / 8),
}));

export function JourneyStartOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.08 }}
      className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden"
      style={{
        background: "rgba(5, 5, 16, 0.72)",
        fontFamily: "var(--font-dot)",
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0, 1, 0] }}
        transition={{ duration: 0.48, ease: steppedEase(2) }}
        style={{
          position: "absolute",
          inset: 0,
          background: "#fff",
        }}
      />

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0 4px, transparent 4px 8px)",
          mixBlendMode: "screen",
        }}
      />

      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: [0, 1, 1, 0], scaleX: [0, 1, 1, 0] }}
        transition={{ duration: 0.72, ease: steppedEase(6) }}
        style={{
          position: "absolute",
          top: "50%",
          left: 0,
          right: 0,
          height: "18px",
          background: "var(--color-pixel-white)",
          boxShadow: "0 18px 0 var(--color-neon-cyan), 0 -18px 0 var(--color-gold)",
          transform: "translateY(-50%)",
          zIndex: 1,
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.92, x: "-50%", y: "-50%" }}
        animate={{
          opacity: [0, 1, 1, 0],
          scale: [0.92, 1, 1, 1.08],
          x: "-50%",
          y: "-50%",
        }}
        transition={{ duration: 1.18, ease: steppedEase(5) }}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "min(86vw, 540px)",
          padding: "1.2rem",
          border: "4px solid var(--color-pixel-white)",
          background: "var(--color-navy)",
          boxShadow: "8px 8px 0 rgba(0,0,0,0.85)",
          color: "var(--color-gold)",
          textAlign: "center",
          fontFamily: "var(--font-press)",
          fontSize: "clamp(1rem, 4.2vw, 1.55rem)",
          lineHeight: 1.7,
          zIndex: 2,
        }}
      >
        ADVENTURE START!
        <motion.div
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.24, repeat: 4, ease: steppedEase(2) }}
          style={{
            marginTop: "0.7rem",
            color: "var(--color-pixel-white)",
            fontFamily: "var(--font-dot)",
            fontSize: "clamp(0.85rem, 3vw, 1.1rem)",
            letterSpacing: "0.08em",
          }}
        >
          NOW LOADING...
        </motion.div>
      </motion.div>

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          gridTemplateColumns: "repeat(8, 1fr)",
          gridTemplateRows: "repeat(6, 1fr)",
          zIndex: 3,
        }}
      >
        {PIXEL_WIPE_TILES.map((tile, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              delay: 0.92 + (tile.row + Math.abs(tile.col - 3.5)) * 0.045,
              duration: 0.08,
              ease: steppedEase(1),
            }}
            style={{
              background: i % 3 === 0 ? "var(--color-neon-cyan)" : "var(--color-pixel-white)",
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1] }}
        transition={{ duration: 1.55, ease: steppedEase(6) }}
        className="absolute inset-0 bg-white"
        style={{ zIndex: 4 }}
      />
    </motion.div>
  );
}
