import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { steppedEase } from "../lib/animationUtils";

interface PlayerSummary {
  name: string;
  title: string;
  level: number;
  totalCp: number;
  todayCp: number;
}

const panelVariants: Variants = {
  hidden: { opacity: 0, y: -14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: steppedEase(6) },
  },
};

function HudPanel({ align = "left", children }: { align?: "left" | "right"; children: ReactNode }) {
  return (
    <motion.section
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      style={{
        width: "min(100%, 360px)",
        border: "3px solid rgba(255, 215, 0, 0.72)",
        borderBottomColor: "rgba(111, 79, 28, 0.95)",
        borderRightColor: "rgba(111, 79, 28, 0.95)",
        background: "rgba(3, 10, 24, 0.72)",
        boxShadow: "0 0 0 2px rgba(0,0,0,0.78), 8px 8px 0 rgba(0,0,0,0.45)",
        color: "#f4ecd0",
        padding: "14px 16px",
        textAlign: align,
        backdropFilter: "blur(2px)",
      }}
    >
      {children}
    </motion.section>
  );
}

function LabelValue({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(78px, max-content) 1fr",
        gap: "12px",
        alignItems: "baseline",
        minHeight: "28px",
      }}
    >
      <span
        style={{
          color: "rgba(244, 236, 208, 0.62)",
          fontSize: "0.62rem",
          lineHeight: 1.5,
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: "#fff8d7",
          fontSize: "clamp(0.74rem, 1.6vw, 0.95rem)",
          lineHeight: 1.5,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function TitleButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      type="button"
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -2, scale: 1.03 }}
      whileTap={{ y: 2, scale: 0.98 }}
      onClick={onClick}
      style={{
        alignSelf: "flex-start",
        border: "2px solid rgba(244, 236, 208, 0.55)",
        borderBottomColor: "rgba(0,0,0,0.78)",
        borderRightColor: "rgba(0,0,0,0.78)",
        background: "rgba(3, 10, 24, 0.68)",
        boxShadow: "0 0 0 2px rgba(0,0,0,0.68), 5px 5px 0 rgba(0,0,0,0.38)",
        color: "#fff8d7",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: "clamp(0.56rem, 1.4vw, 0.74rem)",
        lineHeight: 1.5,
        padding: "10px 12px",
      }}
    >
      &lt; TITLE
    </motion.button>
  );
}

export function HomeHud({
  onReturnTitle,
  player,
}: {
  onReturnTitle: () => void;
  player: PlayerSummary;
}) {
  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "18px",
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          display: "grid",
          gap: "12px",
          width: "min(100%, 360px)",
        }}
      >
        <HudPanel>
          <div
            style={{
              color: "#ffd700",
              fontSize: "0.64rem",
              lineHeight: 1.6,
              marginBottom: "10px",
            }}
          >
            PLAYER INFO
          </div>
          <div style={{ display: "grid", gap: "6px" }}>
            <LabelValue label="NAME" value={player.name} />
            <LabelValue label="TITLE" value={player.title} />
            <LabelValue label="LEVEL" value={`LV.${player.level}`} />
          </div>
        </HudPanel>

        <TitleButton onClick={onReturnTitle} />
      </div>

      <HudPanel align="right">
        <div
          style={{
            color: "#00f5ff",
            fontSize: "0.64rem",
            lineHeight: 1.6,
            marginBottom: "10px",
          }}
        >
          CONTRIBUTION POINT
        </div>
        <div style={{ display: "grid", gap: "6px" }}>
          <LabelValue label="TOTAL CP" value={player.totalCp.toLocaleString()} />
          <LabelValue label="TODAY CP" value={`+${player.todayCp.toLocaleString()}`} />
        </div>
      </HudPanel>
    </header>
  );
}
