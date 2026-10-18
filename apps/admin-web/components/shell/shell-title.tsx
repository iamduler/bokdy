"use client";

import { createPortal } from "react-dom";
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
  leadingSlot: HTMLElement | null;
  setLeadingSlot: (node: HTMLElement | null) => void;
  actionSlot: HTMLElement | null;
  setActionSlot: (node: HTMLElement | null) => void;
};

const ShellTitleContext = createContext<ShellTitleContextValue | null>(null);

export function ShellTitleProvider({ children }: { children: ReactNode }) {
  const [title, setTitleState] = useState<string | null>(null);
  const [leadingSlot, setLeadingSlot] = useState<HTMLElement | null>(null);
  const [actionSlot, setActionSlot] = useState<HTMLElement | null>(null);
  const setTitle = useCallback((next: string | null) => {
    setTitleState(next);
  }, []);
  const value = useMemo(
    () => ({ title, setTitle, leadingSlot, setLeadingSlot, actionSlot, setActionSlot }),
    [title, setTitle, leadingSlot, actionSlot],
  );
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

/** Render page actions into the fixed shell header. They leave with this component. */
export function usePageShellActions(actions: ReactNode) {
  const { actionSlot } = useShellTitle();
  if (!actionSlot) return null;
  return createPortal(actions, actionSlot);
}

/** Render a leading control, such as a back link, into the fixed shell header. */
export function usePageShellLeading(leading: ReactNode) {
  const { leadingSlot } = useShellTitle();
  if (!leadingSlot) return null;
  return createPortal(leading, leadingSlot);
}
