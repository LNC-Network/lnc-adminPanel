"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Modal from "react-modal";

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
        className={`h-screen flex items-center justify-center ${
          isDesktop ? "w-1/2" : "w-full"
        }`}
      >
        <div className="bg-slate-200 backdrop-blur-2xl flex flex-col items-center justify-evenly py-12 px-8">
          <h1 className="text-3xl">Login</h1>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col space-y-4 px-4 py-8"
            autoComplete="off"
          >
            <input
              type="text"
              placeholder="Name Code"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="p-2 outline-blue-500"
            />
            <input
              type="password"
              placeholder="Pass Code"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="p-2 outline-blue-500"
            />
            <button type="submit" className="p-2 bg-blue-500 text-white">
              Login
            </button>
          </form>
        </div>

        {error &&
          (() => {
            alert("Wrong Credentials");
            return null;
          })()}
      </div>
    </div>
  );
}
