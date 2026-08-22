"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ShellTitleContextValue = {
  title: string | null;
  setTitle: (title: string | null) => void;
};

const ShellTitleContext = createContext<ShellTitleContextValue | null>(null);

export function ShellTitleProvider({ children }: { children: ReactNode }) {
  const [title, setTitleState] = useState<string | null>(null);
  const setTitle = useCallback((next: string | null) => {
    setTitleState(next);
  }, []);
  const value = useMemo(() => ({ title, setTitle }), [title, setTitle]);
  return <ShellTitleContext.Provider value={value}>{children}</ShellTitleContext.Provider>;
}

export function useShellTitle() {
  const ctx = useContext(ShellTitleContext);
  if (!ctx) {
    throw new Error("useShellTitle must be used within ShellTitleProvider");
  }
  return ctx;
}

/** Set the shell header title (and document title) for the current page. */
export function usePageShellTitle(title: string) {
  const { setTitle } = useShellTitle();

  useEffect(() => {
    setTitle(title);
    const previous = document.title;
    document.title = title;
    return () => {
      setTitle(null);
      document.title = previous;
    };
  }, [title, setTitle]);
}
