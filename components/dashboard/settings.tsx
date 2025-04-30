"use client";
import { Label } from "../ui/label";
import { Plus } from "lucide-react";
import { Input } from "../ui/input";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import ThemeSwitch from "../ThemeSwitch";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Toaster } from "../ui/sonner";
import { User } from "@/types/userDataType";

export default function Settings() {
  const [data, setData] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const audio = new Audio("/sounds/success.mp3");

  const fetchData = async () => {
    try {
      const res = await fetch("/api/users/fetch");
      const json = await res.json();
      if (res.ok) {
        setData(json.data);
      } else {
        console.error("API error:", json.error);
      }
    } catch (error) {
      toast.error("Fetch failed");
      console.error(error);
    }
  };

  const clear = () => {
    setEmail("");
    setPassword("");
  };

  const addUser = async () => {
    if (!email || !password) {
      toast.warning("Input fields are empty");
      return;
    }

    const response = await fetch("/api/users/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      toast.success("Added user");
      audio.play();
      clear();
      fetchData();
    } else {
      console.error("Error:", data.error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="relative flex flex-col justify-center items-center gap-4 border sm:max-w-4xl m-auto sm:mt-5 pt-5 dark:bg-black bg-slate-200 ">
      <Toaster position="top-center" richColors closeButton />
      <h1 className="text-3xl">Manage users</h1>

      <div className="w-full p-5">
        <div className="flex flex-col sm:flex-row items-center gap-2 border-b py-2 w-full text-sm">
          <Input
            placeholder="Email"
            className="flex-1 w-full sm:w-auto"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            className="sm:hidden block order-1 p-2 bg-slate-500 rounded hover:bg-slate-600 text-white"
            onClick={addUser}
          >
            Add user
          </button>

          <Input
            placeholder="Password"
            className="flex-1 w-full sm:w-auto"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            className="sm:block hidden order-1 p-2 bg-slate-500 rounded hover:bg-slate-600 text-white"
            onClick={addUser}
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <Table className="w-full border-none">
          <TableBody>
            {data.map((user: User, index: number) => (
              <TableRow key={index}>
                <TableCell className="border">{user.user_email}</TableCell>
                <TableCell className="border">{user.user_password}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center gap-2 sm:hidden">
        <Label>Switch theme</Label>
        <ThemeSwitch />
      </div>
    </div>
  );
}
