"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// TanStack Query is for polling only: a status checked until it's final (a Sponsor AI search, the
// Exposure sync) or a list kept fresh on a timer (chat conversations, live games). Every other request
// stays on apiCall / backendFetch: see the web-api-patterns skill.
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } } })
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
