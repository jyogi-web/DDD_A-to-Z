import { motion } from "framer-motion";
import { steppedEase } from "../../lib/animationUtils";
import { ParticleBackground } from "../shared/ParticleBackground";
import { CodeRain } from "./CodeRain";
import { JourneyStartOverlay } from "./JourneyStartOverlay";
import { ProfileActions } from "./ProfileActions";
import { ProfileGopherStage } from "./ProfileGopherStage";
import { useInitialProfileFlow } from "./useInitialProfileFlow";

interface InitialProfileProps {
  onComplete: (username: string) => void;
}

export function InitialProfile({ onComplete }: InitialProfileProps) {
  const {
    dialogueText,
    handleBeginJourney,
    handleConfirmNo,
    handleConfirmYes,
    handleUsernameChange,
    isConfirmingName,
    isGopherAngry,
    isSendingOff,
    isTransitioning,
    username,
  } = useInitialProfileFlow({ onComplete });

  return (
    <div
      className="flex flex-col items-center justify-center min-h-svh p-4 relative overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at 50% 120%, var(--color-navy-mid) 0%, var(--color-navy) 60%, #050510 100%)",
        fontFamily: "var(--font-dot)",
        color: "var(--color-pixel-white)",
      }}
    >
      <ParticleBackground />
      <CodeRain />
      <BottomGlow />
      <Scanlines />

      <motion.div
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{
          scaleY: 1,
          opacity: 1,
          y: isTransitioning ? [0, -6, 0] : 0,
          filter: isTransitioning
            ? [
                "brightness(1)",
                "brightness(1.6)",
                "brightness(0.85)",
                "brightness(1.5)",
                "brightness(1)",
              ]
            : "brightness(1)",
        }}
        transition={
          isTransitioning
            ? { duration: 0.55, ease: steppedEase(5) }
            : { duration: 0.4, ease: steppedEase(6) }
        }
        style={{
          position: "relative",
          zIndex: 2,
          border: "4px solid var(--color-gold)",
          background: "var(--color-navy-light)",
          boxShadow: "0 0 30px rgba(0, 245, 255, 0.15), 8px 8px 0 rgba(0,0,0,0.8)",
          maxWidth: "500px",
          width: "100%",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2rem",
        }}
      >
        <DialogueBox text={dialogueText} />
        <ProfileGopherStage
          isConfirmingName={isConfirmingName}
          isGopherAngry={isGopherAngry}
          isSendingOff={isSendingOff}
        />
        <NameInput
          disabled={isTransitioning || isConfirmingName || isSendingOff}
          onChange={handleUsernameChange}
          username={username}
        />
        <ProfileActions
          isConfirmingName={isConfirmingName}
          isSendingOff={isSendingOff}
          isTransitioning={isTransitioning}
          onBeginJourney={handleBeginJourney}
          onConfirmNo={handleConfirmNo}
          onConfirmYes={handleConfirmYes}
        />
      </motion.div>

      {isTransitioning && <JourneyStartOverlay />}
    </div>
  );
}

function BottomGlow() {
  return (
    <motion.div
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      style={{
        position: "absolute",
        bottom: "-20vh",
        left: "50%",
        transform: "translateX(-50%)",
        width: "150vw",
        height: "60vh",
        background:
          "radial-gradient(ellipse at center, rgba(0, 245, 255, 0.15) 0%, transparent 70%)",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}

function Scanlines() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)",
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  );
}

function DialogueBox({ text }: { text: string }) {
  return (
    <div
      style={{
        minHeight: "3.5rem",
        fontSize: "1.1rem",
        whiteSpace: "pre-wrap",
        lineHeight: "1.6",
        width: "100%",
      }}
    >
      {text}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: steppedEase(2) }}
      >
        _
      </motion.span>
    </div>
  );
}

function NameInput({
  disabled,
  onChange,
  username,
}: {
  disabled: boolean;
  onChange: (username: string) => void;
  username: string;
}) {
  return (
    <div style={{ width: "100%" }}>
      <label
        style={{
          display: "block",
          marginBottom: "0.5rem",
          fontSize: "0.8rem",
          color: "var(--color-gold)",
          letterSpacing: "0.1em",
        }}
      >
        ▶ ENTER YOUR NAME
      </label>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={username}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          style={{
            width: "100%",
            padding: "0.8rem",
            fontSize: "1.2rem",
            fontFamily: "var(--font-dot)",
            background: "rgba(0,0,0,0.5)",
            color: "var(--color-pixel-white)",
            border: "2px solid rgba(255,255,255,0.4)",
            outline: "none",
            textAlign: "center",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--color-gold)")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.4)")}
        />
      </div>
    </div>
  );
}
