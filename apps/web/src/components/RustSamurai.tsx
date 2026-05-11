import { motion } from "framer-motion";
import { SPRITE_ASSETS } from "../constants/assets";

interface RustSamuraiProps {
  className?: string;
  style?: React.CSSProperties;
}

export function RustSamurai({ className = "", style }: RustSamuraiProps) {
  return (
    <motion.div
      className={className}
      animate={{ backgroundPositionX: ["0%", "100%"] }}
      transition={{
        duration: 0.8,
        repeat: Infinity,
        // TypeScriptのエラーを回避するため `unknown` を経由して型キャストしつつ、指定の "steps(5)" を適用
        ease: "steps(5)" as unknown as NonNullable<import("framer-motion").Transition["ease"]>,
      }}
      style={{
        width: "128px", // 親から上書き可能なデフォルトサイズ
        height: "128px",
        backgroundImage: `url(${SPRITE_ASSETS.RUST_SAMURAI})`,
        backgroundSize: "600% 100%", // 6コマなので幅は600%
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated", // ドット絵がぼやけないようにする
        ...style,
      }}
    />
  );
}
