import { motion } from "framer-motion";
import { steppedEase } from "../../lib/animationUtils";
import { GopherSprite } from "../shared/GopherSprite";

interface ProfileGopherStageProps {
  isConfirmingName: boolean;
  isGopherAngry: boolean;
  isSendingOff: boolean;
}

export function ProfileGopherStage({
  isConfirmingName,
  isGopherAngry,
  isSendingOff,
}: ProfileGopherStageProps) {
  const isGuidePose = isConfirmingName || isSendingOff;

  return (
    <div
      style={{
        position: "relative",
        width: "160px",
        height: "160px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <GopherHalo />

      <motion.div
        animate={getGopherMotion({ isConfirmingName, isGopherAngry, isSendingOff })}
        transition={{
          duration: isGopherAngry ? 0.32 : isGuidePose ? 0.9 : 1.5,
          repeat: isGopherAngry ? 1 : Infinity,
          ease: steppedEase(isGopherAngry ? 5 : 4),
        }}
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: "translateX(0px)",
        }}
      >
        <GopherSprite
          frameCount={isGopherAngry ? 8 : isGuidePose ? 4 : undefined}
          row={isGopherAngry ? 5 : isGuidePose ? 4 : 0}
        />
      </motion.div>

      {isGopherAngry && <AngryCallout />}
      <GopherShadow />
    </div>
  );
}

function getGopherMotion({
  isConfirmingName,
  isGopherAngry,
  isSendingOff,
}: ProfileGopherStageProps) {
  if (isGopherAngry) {
    return {
      x: [0, -4, 4, -3, 3, 0],
      y: [0, -3, 0],
      scaleY: [1, 1.03, 1],
    };
  }
  if (isConfirmingName) {
    return {
      y: [0, -3, 0],
      scaleY: [1, 1.04, 1],
    };
  }
  if (isSendingOff) {
    return {
      y: [0, -5, 0],
      scaleY: [1, 1.06, 1],
    };
  }
  return {
    scaleY: [1, 1.05, 1],
    y: [0, -4, 0],
  };
}

function GopherHalo() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      style={{
        position: "absolute",
        top: "-20%",
        left: "-20%",
        width: "140%",
        height: "140%",
        border: "2px dashed var(--color-gold)",
        borderRadius: "50%",
        opacity: 0.15,
        zIndex: 0,
      }}
    />
  );
}

function AngryCallout() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.9 }}
      animate={{ opacity: [0, 1, 1, 0], y: [6, 0, 0, -4], scale: [0.9, 1, 1, 1] }}
      transition={{ duration: 0.85, ease: steppedEase(5) }}
      style={{
        position: "absolute",
        top: "-20px",
        right: "-54px",
        padding: "0.45rem 0.6rem",
        border: "3px solid var(--color-gold)",
        background: "var(--color-navy)",
        color: "var(--color-gold)",
        fontFamily: "var(--font-press)",
        fontSize: "0.65rem",
        boxShadow: "5px 5px 0 rgba(0,0,0,0.8)",
        zIndex: 3,
      }}
    >
      おーい！
    </motion.div>
  );
}

function GopherShadow() {
  return (
    <motion.div
      animate={{ scale: [1, 0.9, 1], opacity: [0.5, 0.3, 0.5] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: steppedEase(4),
      }}
      style={{
        position: "absolute",
        bottom: "-25px",
        left: "calc(50% + 0px)",
        x: "-50%",
        width: "110px",
        height: "16px",
        background: "rgba(0,0,0,0.6)",
        borderRadius: "50%",
      }}
    />
  );
}
