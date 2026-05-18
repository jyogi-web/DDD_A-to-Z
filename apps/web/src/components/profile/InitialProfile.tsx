import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { AUDIO_ASSETS } from "../../features/audio/audioAssets";
import { ParticleBackground } from "../shared/ParticleBackground";
import { GopherSprite } from "../shared/GopherSprite";

interface InitialProfileProps {
  onComplete: (username: string) => void;
}

const JOURNEY_START_DELAY_MS = 1800;

// カクカクした動きを実現するためのカスタムイージング関数
const steppedEase = (steps: number) => (t: number) => Math.floor(t * steps) / steps;

// エンジニア要素を強調するソースコードの断片
const CODE_SNIPPETS = [
  'fn main() {\n  println!("Hello, world!");\n}',
  'public static void main(String[] args) {\n  System.out.println("Hello World");\n}',
  'def hello():\n    print("Hello, world!")',
  'func main() {\n  fmt.Println("Hello, world!")\n}',
  "const sum = (a: number, b: number) => a + b;",
  "SELECT * FROM users WHERE id = 1;",
  'int main() {\n  printf("Hello, World!");\n  return 0;\n}',
];

const PIXEL_WIPE_TILES = Array.from({ length: 48 }, (_, i) => ({
  col: i % 8,
  row: Math.floor(i / 8),
}));

function CodeRain() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {CODE_SNIPPETS.map((code, i) => (
        <motion.div
          key={i}
          initial={{ y: "110vh", opacity: 0 }}
          animate={{
            y: ["110vh", "-30vh"],
            opacity: [0, 0.15, 0.15, 0],
          }}
          transition={{
            duration: 25 + (i % 4) * 8,
            repeat: Infinity,
            delay: i * 3,
            ease: "linear",
          }}
          style={{
            position: "absolute",
            left: `${8 + ((i * 14) % 75)}%`,
            fontFamily: "var(--font-dot)",
            fontSize: "0.85rem",
            color: "var(--color-neon-cyan)",
            whiteSpace: "pre",
            filter: "blur(0.5px)",
            textAlign: "left",
          }}
        >
          {code}
        </motion.div>
      ))}
    </div>
  );
}

function JourneyStartOverlay() {
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

export function InitialProfile({ onComplete }: InitialProfileProps) {
  const [username, setUsername] = useState("octocat"); // GitHubからの取得名を想定
  const [displayedText, setDisplayedText] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const fullText = "歓迎しよう、新たな挑戦者よ。\n君のコードネームを教えてくれ。";

  // Web Audio APIによるピコピコ音の準備
  const audioCtxRef = useRef<AudioContext | null>(null);
  const transitionTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const AudioContext =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof window.AudioContext })
          .webkitAudioContext;
      if (AudioContext) {
        audioCtxRef.current = new AudioContext();
      }
    } catch {
      // AudioContext not supported
    }

    return () => {
      void audioCtxRef.current?.close();
      audioCtxRef.current = null;
      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  const playBeep = useCallback(() => {
    void (async () => {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
      if (ctx.state !== "running") return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      // 少しランダムに周波数を揺らしてレトロな「喋り声」感を出す
      osc.frequency.setValueAtTime(700 + Math.random() * 100, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    })().catch(() => {
      // Browser autoplay restrictions may still block sound until the next user gesture.
    });
  }, []);

  // タイプライターエフェクト
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i <= fullText.length) {
        setDisplayedText(fullText.slice(0, i));

        // スペースや改行以外の文字が表示されるタイミングで音を鳴らす
        if (i < fullText.length && fullText[i] !== " " && fullText[i] !== "\n") {
          playBeep();
        }
        i++;
      } else {
        clearInterval(interval);
      }
    }, 90); // 1文字ずつ表示 (ピコピコ感を出すため少し遅めの90msに設定)
    return () => clearInterval(interval);
  }, [fullText, playBeep]);

  const handleBeginJourney = useCallback(() => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername || isTransitioning) return;

    setIsTransitioning(true);

    const titleStartAudio = new Audio(AUDIO_ASSETS.se.titleStart);
    void titleStartAudio.play().catch(() => {
      // Browser audio policies can still reject playback in some environments.
    });

    transitionTimeoutRef.current = window.setTimeout(() => {
      onComplete(trimmedUsername);
    }, JOURNEY_START_DELAY_MS);
  }, [isTransitioning, onComplete, username]);

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
      {/* 冒険の始まりを演出するパーティクルと光 */}
      <ParticleBackground />

      {/* エンジニア感を強調するソースコードの断片 */}
      <CodeRain />

      {/* 魔法陣のような光の演出（下部から） */}
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

      {/* 背景のスキャンライン（Appと共通） */}
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

      {/* ウィンドウ展開アニメーション */}
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
        {/* ガイドテキスト */}
        <div
          style={{
            minHeight: "3.5rem",
            fontSize: "1.1rem",
            whiteSpace: "pre-wrap",
            lineHeight: "1.6",
            width: "100%",
          }}
        >
          {displayedText}
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: steppedEase(2) }}
          >
            _
          </motion.span>
        </div>

        {/* アバター表示エリア */}
        <div
          style={{
            position: "relative",
            width: "160px", // キャラクターを大きくした分、表示エリアも広げる
            height: "160px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* 背後の回転魔法陣的な演出（レトロ風） */}
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

          {/* ガクガクと呼吸するアバター */}
          <motion.div
            animate={{
              scaleY: [1, 1.05, 1],
              y: [0, -4, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: steppedEase(4),
            }}
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              // キャラクターの左右の位置調整
              // 左にずらしたい場合はマイナスの値（例: "-10px"）、右はプラスの値（例: "10px"）を設定してください
              transform: "translateX(0px)",
            }}
          >
            <GopherSprite />
          </motion.div>
          {/* 影 */}
          <motion.div
            animate={{ scale: [1, 0.9, 1], opacity: [0.5, 0.3, 0.5] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: steppedEase(4),
            }}
            style={{
              position: "absolute",
              bottom: "-25px", // 上下（縦方向）の位置調整
              // 影の左右の位置調整
              // 基準位置から左右にずらしたい場合は "0px" の数値を変更してください（左はマイナス、右はプラス）
              left: "calc(50% + 0px)",
              x: "-50%", // 中央揃え用（Framer Motionの機能を利用）
              width: "110px", // キャラクターが2.0倍になったので影も大きくする
              height: "16px",
              background: "rgba(0,0,0,0.6)",
              borderRadius: "50%", // 影だけは少し丸みを持たせる（レトロゲームでよくある手法）
            }}
          />
        </div>

        {/* ユーザー名入力 */}
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
              onChange={(e) => setUsername(e.target.value)}
              disabled={isTransitioning}
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

        {/* 決定ボタン */}
        <motion.button
          whileHover={isTransitioning ? undefined : { scale: 1.02, filter: "brightness(1.1)" }}
          whileTap={
            isTransitioning
              ? undefined
              : { scale: 0.98, y: 4, boxShadow: "0px 0px 0 var(--color-gold-dark)" }
          }
          onClick={handleBeginJourney}
          disabled={isTransitioning || username.trim().length === 0}
          animate={
            isTransitioning
              ? {
                  backgroundColor: ["var(--color-gold)", "#ffffff", "var(--color-gold)", "#ffffff"],
                  boxShadow: [
                    "0px 4px 0 var(--color-gold-dark)",
                    "0px 0px 0 var(--color-gold-dark)",
                    "0px 4px 0 var(--color-gold-dark)",
                    "0px 0px 0 var(--color-gold-dark)",
                  ],
                }
              : undefined
          }
          transition={{ duration: 0.52, ease: steppedEase(4) }}
          style={{
            marginTop: "1rem",
            width: "100%",
            padding: "1rem",
            fontSize: "1.1rem",
            fontFamily: "var(--font-press)",
            background: "var(--color-gold)",
            color: "#000",
            border: "none",
            boxShadow: "0px 4px 0 var(--color-gold-dark)",
            cursor: isTransitioning || username.trim().length === 0 ? "not-allowed" : "pointer",
            letterSpacing: "0.05em",
            opacity: isTransitioning || username.trim().length === 0 ? 0.75 : 1,
          }}
        >
          {isTransitioning ? "START!" : "BEGIN JOURNEY"}
        </motion.button>
      </motion.div>

      {isTransitioning && <JourneyStartOverlay />}
    </div>
  );
}
