import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

const ThemeSwitch = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="relative flex items-center gap-0 rounded-full border p-1 dark:border-slate-700 w-14 h-8 bg-muted">
      {/* Sliding Background */}
      <div
        className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-300 ${
          theme === "dark" ? "translate-x-6" : "translate-x-0"
        }`}
      />

      {/* Light Button */}
      <button
        onClick={() => setTheme("light")}
        aria-label="Light Mode"
        className="flex items-center justify-center z-10 w-8 h-8 p-0"
      >
        <Sun
          className={`h-4 w-4 transition-colors ${
            theme === "light" ? "text-black" : "text-slate-400"
          }`}
        />
      </button>

      {/* Dark Button */}
      <button
        onClick={() => setTheme("dark")}
        aria-label="Dark Mode"
        className="flex items-center justify-center z-10 w-8 h-8 p-0"
      >
        <Moon
          className={`h-4 w-4 transition-colors ${
            theme === "dark" ? "text-black" : "text-slate-400"
          }`}
        />
      </button>
    </div>
  );
};

export default ThemeSwitch;
