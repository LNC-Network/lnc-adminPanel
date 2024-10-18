"use client";
import React, { useState } from "react";

interface User {
  _id: { $oid: string };
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

  return (
    <div>
      <div className="flex justify-center items-center h-16 text-3xl bg-slate-800 text-white">
        <h1>Production DataBase</h1>
      </div>
      <div className="overflow-x-auto">
        <table className="box-border w-full border border-gray-700">
          <thead>
            <tr className="bg-gray-200">
              {[
                "ID",
                "First Name",
                "Last Name",
                "Email",
                "Phone",
                "Role",
                "Status",
                "Institution",
                "Portfolio",
                "About",
              ].map((heading, i) => (
                <th key={i} className="border px-4 py-2">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={row._id.$oid || index}
                className="border-b hover:bg-gray-100"
              >
                <td className="border px-4 py-2">{index + 1}</td>
                <td className="border px-4 py-2">{row.firstName}</td>
                <td className="border px-4 py-2">{row.lastName}</td>
                <td className="border px-4 py-2">{row.email}</td>
                <td className="border px-4 py-2">{row.phone}</td>
                <td className="border px-4 py-2">{row.role}</td>
                <td className="border px-4 py-2">{row.status}</td>
                <td className="border px-4 py-2">{row.institution}</td>
                <td className="border px-4 py-2">
                  <a
                    href={row.portfolio}
                    className="text-blue-600 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {row.portfolio}
                  </a>
                </td>
                <td className="border px-4 py-2">{row.about}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
