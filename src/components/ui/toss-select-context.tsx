"use client";

import { createContext, useState, type ReactNode } from "react";

export interface TossSelectOption {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
  chip?: {
    label: string;
    tone: "info" | "done";
  };
}

interface TossSelectContextValue {
  openId: string | null;
  setOpenId: (id: string | null) => void;
}

export const TossSelectContext = createContext<TossSelectContextValue | null>(null);

export function TossSelectProvider({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <TossSelectContext.Provider value={{ openId, setOpenId }}>
      {children}
    </TossSelectContext.Provider>
  );
}
