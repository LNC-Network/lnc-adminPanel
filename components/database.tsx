"use client";
import React, { useEffect, useState } from "react";

// Define the User interface
interface User {
  _id: {
    $oid: string; // or just string if you prefer
  };
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  institution: string;
  portfolio: string;
  about: string;
}

export default function DataBase() {
  const [data, setData] = useState<User[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch("/api/submit");
      const jsonData = await response.json();
      setData(jsonData);
    };

    fetchData();
  }, []);

  return (
    <div className="">
      <div className="overflow-x-auto">
        <table className="box-border w-full border border-gray-700">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-4 py-1">ID</th>
              <th className="border px-4 py-1">First Name</th>
              <th className="border px-4 py-1">Last Name</th>
              <th className="border px-4 py-1">Email</th>
              <th className="border px-4 py-1">Phone</th>
              <th className="border px-4 py-1">Role</th>
              <th className="border px-4 py-1">Status</th>
              <th className="border px-4 py-1">Institution</th>
              <th className="border px-4 py-1">Portfolio</th>
              <th className="border px-4 py-1">About</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className="border-b hover:bg-gray-100">
                <td className="border px-4 py-1">{index + 1}</td>{" "}
                <td className="border px-4 py-1">{row.firstName}</td>
                <td className="border px-4 py-1">{row.lastName}</td>
                <td className="border px-4 py-1">{row.email}</td>
                <td className="border px-4 py-1">{row.phone}</td>
                <td className="border px-4 py-1">{row.role}</td>
                <td className="border px-4 py-1">{row.status}</td>
                <td className="border px-4 py-1">{row.institution}</td>
                <td className="border px-4 py-1">
                  <a
                    href={row.portfolio}
                    className="text-blue-600 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {row.portfolio}
                  </a>
                </td>
                <td className="border px-4 py-1">{row.about}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
