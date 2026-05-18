import { motion } from "framer-motion";

const CODE_SNIPPETS = [
  'fn main() {\n  println!("Hello, world!");\n}',
  'public static void main(String[] args) {\n  System.out.println("Hello World");\n}',
  'def hello():\n    print("Hello, world!")',
  'func main() {\n  fmt.Println("Hello, world!")\n}',
  "const sum = (a: number, b: number) => a + b;",
  "SELECT * FROM users WHERE id = 1;",
  'int main() {\n  printf("Hello, World!");\n  return 0;\n}',
];

export function CodeRain() {
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
