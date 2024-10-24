"use client";
import React from "react";

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

const data: User[] = [
  {
    _id: { $oid: "1234567890" },
    firstName: "John",
    lastName: "Doe",
    email: "johndoe@example.com",
    phone: "1234567890",
    role: "Admin",
    status: "Active",
    institution: "ABC University",
    portfolio: "https://example.com/portfolio",
    about: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  },
];

export default function DataBase() {
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
