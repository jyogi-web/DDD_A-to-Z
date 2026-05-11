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
      // 本来の画像は 6コマ で縦長（1コマの比率が1:2）です。
      // 高さを100%（128px）に合わせると、全体の幅は384pxになり、1コマは64pxになります。
      animate={{ backgroundPositionX: ["0px", "-384px"] }}
      transition={{
        duration: 0.8,
        repeat: Infinity,
        ease: steppedEase(6),
      }}
      style={{
        width: "64px", // 1コマの幅に合わせることで、2人表示されるのを防ぎます
        height: "128px",
        backgroundImage: `url(${SPRITE_ASSETS.RUST_SAMURAI})`,
        backgroundSize: "auto 100%", // 高さを基準にアスペクト比を維持（潰れないようにする）
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated", // ドット絵がぼやけないようにする
        ...style,
      }}
    />
  );
}
