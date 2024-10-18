"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isDesktop, setIsDesktop] = useState(false);
  const router = useRouter();

  const handleResize = () => {
    setIsDesktop(window.innerWidth >= 768); // Set breakpoint to 772px
  };

  useEffect(() => {
    handleResize(); // Set initial value
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize); // Cleanup
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (data.success) {
      document.cookie = `auth-token=${data.token}; path=/`; // Simple cookie-based session
      router.push("/dashboard/page");
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="flex flex-row">
      {isDesktop && (
        <div className="relative w-1/2 h-screen">
          <Image
            src="/bg-Image.jpg"
            alt="background image"
            layout="fill"
            objectFit="cover"
          />
        </div>
      )}

      <div
        className={`flex flex-col items-center justify-center h-screen ${
          isDesktop ? "w-1/2" : "w-full"
        }`}
      >
        <h1 className="text-3xl mb-6">Login</h1>
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-2 border"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-2 border"
          />
          <button type="submit" className="p-2 bg-blue-500 text-white">
            Login
          </button>
        </form>
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>
    </div>
  );
}
