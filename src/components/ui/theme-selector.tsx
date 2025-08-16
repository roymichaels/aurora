import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useThemeStore, Dimension } from "@/state/theme";

const themes: { id: Dimension; label: string }[] = [
  { id: "ethereal", label: "Ethereal" },
  { id: "alienTemple", label: "Alien Temple" },
  { id: "cyberJungle", label: "Cyber Jungle" },
];

export function ThemeSelector() {
  const { dimension, setTheme } = useThemeStore();

  return (
    <div className="flex gap-2">
      {themes.map(({ id, label }) => (
        <Button
          key={id}
          variant={dimension === id ? "default" : "outline"}
          onClick={() => setTheme(id)}
          className="relative overflow-hidden"
        >
          {dimension === id && (
            <motion.span
              layoutId="theme-indicator"
              className="absolute inset-0 bg-primary opacity-20"
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            />
          )}
          <motion.span
            initial={false}
            animate={{ opacity: dimension === id ? 1 : 0.6 }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            {label}
          </motion.span>
        </Button>
      ))}
    </div>
  );
}

export default ThemeSelector;
