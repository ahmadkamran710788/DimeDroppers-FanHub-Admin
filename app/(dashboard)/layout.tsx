"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { SetupProvider } from "@/context/setup";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SetupProvider>
      <div className="flex h-screen bg-black overflow-hidden">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="relative flex flex-col flex-1 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/hub-bg-3c75bf.png"
            alt=""
            aria-hidden="true"
            className="absolute pointer-events-none select-none"
            style={{
              top: 0,
              right: 0,
              width: "80%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top right",
              filter: "blur(72px)",
              opacity: 0.6,
              zIndex: 0,
            }}
          />
          <Header title="Schedule" onMenuClick={() => setSidebarOpen(true)} />
          <main className="relative z-10 flex-1 overflow-y-auto px-4 py-4 lg:px-10 lg:py-8">{children}</main>
        </div>
      </div>
    </SetupProvider>
  );
}
