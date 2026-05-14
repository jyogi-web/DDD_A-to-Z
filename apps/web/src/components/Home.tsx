import { useState } from "react";
import { HomeHud } from "./HomeHud";
import { HomeNav } from "./HomeNav";
import { ReturnTitleDialog } from "./ReturnTitleDialog";
import { WalkingGopher } from "./WalkingGopher";
import { useHomeAudio } from "../hooks/useHomeAudio";

interface HomeProps {
  onNavigate: (path: string) => void;
}

const player = {
  name: "DevSamurai",
  title: "Consistency Master",
  level: 18,
  totalCp: 24680,
  todayCp: 320,
};

const navItems = [
  { label: "WAR MAP", caption: "BATTLE FRONT", path: "/war", accent: "#ff5f56" },
  { label: "GUILD BASE", caption: "COMMUNITY HQ", path: "/guild", accent: "#00f5ff" },
  { label: "MY STATUS", caption: "PLAYER DATA", path: "/mypage", accent: "#ffd700" },
];

export function Home({ onNavigate }: HomeProps) {
  const [isReturnTitleDialogOpen, setIsReturnTitleDialogOpen] = useState(false);
  const {
    audioRefs,
    playGopherTalk,
    playModalCancel,
    playModalOpen,
    playReturnTitle,
  } = useHomeAudio(onNavigate);

  const cancelReturnTitle = () => {
    playModalCancel();
    setIsReturnTitleDialogOpen(false);
  };

  const openReturnTitleDialog = () => {
    playModalOpen();
    setIsReturnTitleDialogOpen(true);
  };

  return (
    <main
      style={{
        minHeight: "100svh",
        position: "relative",
        overflow: "hidden",
        backgroundImage:
          "linear-gradient(180deg, rgba(4, 8, 18, 0.25), rgba(4, 8, 18, 0.56)), url('/home_lunch.png')",
        backgroundSize: "cover",
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated",
        fontFamily: '"Press Start 2P", "DotGothic16", monospace',
        color: "#f4ecd0",
      }}
    >
      <audio
        ref={audioRefs.homeBgmRef}
        src="/bgm/home_bgm.ogg"
        loop
        preload="auto"
        aria-hidden="true"
      />
      <audio
        ref={audioRefs.confirmModalSeRef}
        src="/SE/confirm-modal.wav"
        preload="auto"
        aria-hidden="true"
      />
      <audio
        ref={audioRefs.modalCancelSeRef}
        src="/SE/modal-cancel.wav"
        preload="auto"
        aria-hidden="true"
      />
      <audio
        ref={audioRefs.returnTitleSeRef}
        src="/SE/return-title.wav"
        preload="auto"
        aria-hidden="true"
      />
      <audio
        ref={audioRefs.gopherTalkSeRef}
        src="/SE/gopher-talk.wav"
        preload="auto"
        aria-hidden="true"
      />

      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.1), rgba(0,0,0,0.1) 1px, transparent 1px, transparent 4px)",
          mixBlendMode: "multiply",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          boxShadow: "inset 0 0 90px rgba(0,0,0,0.7)",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 3,
          minHeight: "100svh",
          display: "grid",
          gridTemplateRows: "auto 1fr auto",
          padding: "clamp(16px, 3vw, 32px)",
          gap: "20px",
        }}
      >
        <HomeHud player={player} onReturnTitle={openReturnTitleDialog} />

        <section
          aria-label="Character placement area"
          style={{
            position: "relative",
            minHeight: "clamp(220px, 42vh, 520px)",
            overflow: "visible",
          }}
        >
          <WalkingGopher onTalk={playGopherTalk} />
        </section>

        <HomeNav items={navItems} onNavigate={onNavigate} />
      </div>

      {isReturnTitleDialogOpen && (
        <ReturnTitleDialog
          onCancel={cancelReturnTitle}
          onConfirm={playReturnTitle}
        />
      )}
    </main>
  );
}
