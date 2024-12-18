import { Input } from "@/components/ui/input";
import React, { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { Search } from "lucide-react";

function SearchBar() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "/") {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem>Settings</CommandItem>
            <CommandItem>Stat</CommandItem>
            <CommandItem>Theme</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
      <div className="flex items-center w-full justify-end">
        <Search className="translate-x-6 size-4" />
        <Input
          placeholder="&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Search"
          className="max-w-md w-full focus-visible:ring-0"
          readOnly
          onClick={() => {
            setOpen(true);
          }}
        />
        <span className="absolute right-6 text-xs font-mono w-auto bg-secondary/95 px-2 py-1 hidden lg:block ">
          /
        </span>
      </div>
    </>
  );
}

export default SearchBar;
