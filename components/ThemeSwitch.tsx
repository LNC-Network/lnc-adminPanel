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
    <div className="flex items-center rounded-full border">
      <button
        onClick={() => setTheme("light")}
        className={`p-2 rounded-full ${theme === "light" ? "bg-gray-200" : ""}`}
        aria-label="Light Mode"
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`p-2 rounded-full ${
          theme === "dark" ? "bg-gray-800 text-white" : ""
        }`}
        aria-label="Dark Mode"
      >
        <Moon className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ThemeSwitch;
