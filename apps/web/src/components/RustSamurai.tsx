import { motion } from "framer-motion";
import { SPRITE_ASSETS } from "../constants/assets";

interface RustSamuraiProps {
  className?: string;
  style?: React.CSSProperties;
}

const steppedEase = (steps: number) => (t: number) => Math.floor(t * steps) / steps;

export function RustSamurai({ className = "", style }: RustSamuraiProps) {
  
  return (
    <motion.div
      className={className}
      // 6コマすべてを等間隔で表示するためには、移動距離を「1コマ幅 × 全コマ数」にし、ステップ数を全コマ数に合わせます
      animate={{ backgroundPositionX: ["0px", "-768px"] }}
      transition={{
        duration: 0.8,
        repeat: Infinity,
        // CSS文字列の "steps()" だとFramer Motionが解釈できずスライド補完される場合があるため、JS側で強制的にステップ化する
        ease: steppedEase(6),
      }}
      style={{
        width: "128px", // 親から上書き可能なデフォルトサイズ
        height: "128px",
        backgroundImage: `url(${SPRITE_ASSETS.RUST_SAMURAI})`,
        backgroundSize: "768px 128px", // 128px * 6コマ
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated", // ドット絵がぼやけないようにする
        ...style,
      }}
    />
  );
}
