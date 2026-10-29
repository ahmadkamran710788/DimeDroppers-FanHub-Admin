"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// TanStack Query is for polling only (a status checked every few seconds until it's final, e.g. a
// Sponsor AI search). Every other request stays on apiCall / backendFetch: see the web-api-patterns skill.
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } } })
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
