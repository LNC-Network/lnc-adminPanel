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
  const [data, setData] = useState<User[]>([]); // Use the User type

  //   useEffect(() => {
  //     const fetchData = async () => {
  //       const response = await fetch("/api");
  //       const result = await response.json();
  //       setData(result.reverse());
  //     };

  //     fetchData();
  //   }, []);

  return (
    <div className="">
      <div className="flex justify-center items-center h-16 text-3xl bg-slate-800 text-white">
        <h1>Production DataBase</h1>
      </div>
      <div className="overflow-x-auto">
        <table className="box-border w-full border border-gray-700">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-4 py-2">ID</th>
              <th className="border px-4 py-2">First Name</th>
              <th className="border px-4 py-2">Last Name</th>
              <th className="border px-4 py-2">Email</th>
              <th className="border px-4 py-2">Phone</th>
              <th className="border px-4 py-2">Role</th>
              <th className="border px-4 py-2">Status</th>
              <th className="border px-4 py-2">Institution</th>
              <th className="border px-4 py-2">Portfolio</th>
              <th className="border px-4 py-2">About</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={row._id.$oid || index}
                className="border-b hover:bg-gray-100"
              >
                <td className="border px-4 py-2">{index + 1}</td>{" "}
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
