"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./ui/pagination";

// Define the interface for a user object
interface User {
  name: string;
  email: string;
  status: "accepted" | "rejected" | "pending";
  about: string;
}

// Sample mock data for the table
const mockData: User[] = [
  {
    name: "Jit",
    email: "something@gmail.com",
    status: "accepted",
    about: "About Jit",
  },
  {
    name: "John",
    email: "john@example.com",
    status: "rejected",
    about: "About John",
  },
  {
    name: "Alice",
    email: "alice@example.com",
    status: "pending",
    about: "About Alice",
  },
  {
    name: "Bob",
    email: "bob@example.com",
    status: "accepted",
    about: "About Bob",
  },
  {
    name: "Eve",
    email: "eve@example.com",
    status: "pending",
    about: "About Eve",
  },
];

export default function DbView() {


  return (
    <div className="m-auto w-full h-full p-3 flex flex-col justify-between ">
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockData.map((user, index) => (
              <TableRow key={index}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <span
                    className={`${
                      user.status === "accepted"
                        ? "bg-green-500 text-white"
                        : user.status === "rejected"
                        ? "bg-red-500 text-white"
                        : "bg-yellow-500 text-white"
                    } px-2 py-1 rounded-full text-xs`}
                  >
                    {user.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* add pagination here */}
      <div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
