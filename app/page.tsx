"use client";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import SearchBar from "@/components/ui/search";
import DbView from "@/components/db-view";

const Page = () => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex justify-between w-full items-center mx-2">
            <SidebarTrigger />
            <SearchBar />
          </div>
        </header>
        {/* main content */}
        <div className="flex flex-1 gap-4 p-1 bg-gradient-to-bl from-emerald-950 to-blue-950">
          <div className="border w-full bg-black">
            <DbView />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Page;
