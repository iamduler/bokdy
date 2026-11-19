"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { Button } from "./ui/button";

type PendingLeave = { href?: string; run?: () => void };

type FormLeaveGuardContextValue = {
  register: (id: string, dirty: boolean) => void;
  unregister: (id: string) => void;
  confirmLeave: (run: () => void) => void;
};

const FormLeaveGuardContext = createContext<FormLeaveGuardContextValue | null>(null);

// A modal sheet sets pointer-events:none on body. This layer must sit above it and accept clicks.
const guardLayerStyle = { pointerEvents: "auto" as const, zIndex: 80 };

function keepSheetOpen(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}

function isModifiedClick(event: MouseEvent) {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function internalPath(anchor: HTMLAnchorElement): string | null {
  const raw = anchor.getAttribute("href");
  if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:")) return null;
  if (anchor.target === "_blank" || anchor.hasAttribute("download")) return null;
  let url: URL;
  try {
    url = new URL(anchor.href, window.location.href);
  } catch {
    return null;
  }
  if (url.origin !== window.location.origin) return null;
  if (url.pathname === window.location.pathname) return null;
  return `${url.pathname}${url.search}${url.hash}`;
}

/** Blocks in-app link clicks and tab close while a registered form is dirty. */
export function FormLeaveGuardProvider({
  children,
  title,
  description,
  stayLabel,
  leaveLabel,
  onNavigate,
}: {
  children: ReactNode;
  title: string;
  description: string;
  stayLabel: string;
  leaveLabel: string;
  onNavigate: (href: string) => void;
}) {
  const dirtyIds = useRef(new Set<string>());
  const pending = useRef<PendingLeave | null>(null);
  const openRef = useRef(false);
  const handling = useRef(false);
  const ignoreClicksUntil = useRef(0);
  const stayRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [blocked, setBlocked] = useState(false);
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  openRef.current = open;

  const publish = useCallback(() => {
    setBlocked(dirtyIds.current.size > 0);
  }, []);

  const register = useCallback(
    (id: string, dirty: boolean) => {
      if (dirty) dirtyIds.current.add(id);
      else dirtyIds.current.delete(id);
      publish();
    },
    [publish],
  );

  const unregister = useCallback(
    (id: string) => {
      dirtyIds.current.delete(id);
      publish();
    },
    [publish],
  );

  const openGuard = useCallback((next: PendingLeave) => {
    pending.current = next;
    setOpen(true);
  }, []);

  const confirmLeave = useCallback(
    (run: () => void) => {
      if (dirtyIds.current.size === 0) {
        run();
        return;
      }
      openGuard({ run });
    },
    [openGuard],
  );

  const stay = useCallback(() => {
    if (handling.current) return;
    handling.current = true;
    pending.current = null;
    ignoreClicksUntil.current = performance.now() + 400;
    setOpen(false);
    queueMicrotask(() => {
      handling.current = false;
    });
  }, []);

  const leave = useCallback(() => {
    if (handling.current) return;
    handling.current = true;
    const next = pending.current;
    pending.current = null;
    ignoreClicksUntil.current = performance.now() + 400;
    setOpen(false);
    queueMicrotask(() => {
      handling.current = false;
    });
    if (next?.href) onNavigate(next.href);
    else next?.run?.();
  }, [onNavigate]);

  useEffect(() => {
    if (!blocked) return;
    function onClick(event: MouseEvent) {
      const target = event.target;
      const insideGuard = target instanceof Element && Boolean(target.closest("[data-form-leave-guard]"));
      if (openRef.current) {
        if (!insideGuard) {
          event.preventDefault();
          event.stopPropagation();
        }
        return;
      }
      if (performance.now() < ignoreClicksUntil.current) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (event.defaultPrevented || isModifiedClick(event)) return;
      if (!(target instanceof Element) || insideGuard) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      // Maximize keeps the sheet draft and opens the full page.
      if (anchor.hasAttribute("data-form-expand")) return;
      const href = internalPath(anchor);
      if (!href) return;
      event.preventDefault();
      event.stopPropagation();
      const next = { href };
      queueMicrotask(() => openGuard(next));
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [blocked, openGuard]);

  useEffect(() => {
    if (!blocked) return;
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [blocked]);

  useEffect(() => {
    if (!open) return;
    // A sheet focus trap pulls focus back into the last field. Focusing Ở lại
    // would land on Tiện ích and reopen its menu.
    const active = document.activeElement;
    const insideDialog = active instanceof Element && Boolean(active.closest('[role="dialog"]'));
    if (!insideDialog) stayRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        stay();
        return;
      }
      if (event.key !== "Tab") return;
      const root = panelRef.current;
      if (!root) return;
      const items = Array.from(root.querySelectorAll<HTMLButtonElement>("button"));
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      const active = document.activeElement;
      if (!(active instanceof Node) || !root.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, stay]);

  const value = useMemo(
    () => ({ register, unregister, confirmLeave }),
    [register, unregister, confirmLeave],
  );

  return (
    <FormLeaveGuardContext.Provider value={value}>
      {children}
      {open && typeof document !== "undefined"
        ? createPortal(
            <div data-form-leave-guard="" style={guardLayerStyle}>
              <div
                className="fixed inset-0 bg-foreground/40"
                style={guardLayerStyle}
                onPointerDown={keepSheetOpen}
                onClick={stay}
              />
              <div
                ref={panelRef}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                className="dialog-panel w-full max-w-md p-6"
                style={guardLayerStyle}
                onPointerDown={keepSheetOpen}
              >
                <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                  <h2 id={titleId} className="text-lg font-semibold leading-none tracking-tight">
                    {title}
                  </h2>
                  <p id={descriptionId} className="text-sm text-muted-foreground">
                    {description}
                  </p>
                </div>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button ref={stayRef} type="button" variant="outline" onClick={stay}>
                    {stayLabel}
                  </Button>
                  <Button type="button" onClick={leave}>
                    {leaveLabel}
                  </Button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </FormLeaveGuardContext.Provider>
  );
}

/** Register this form. Returns a leave function that confirms when the form is dirty. */
export function useFormLeaveGuard(dirty: boolean) {
  const guard = useContext(FormLeaveGuardContext);
  const id = useId();

  useEffect(() => {
    if (!guard) return;
    guard.register(id, dirty);
    return () => guard.unregister(id);
  }, [dirty, guard, id]);

  return useCallback(
    (run: () => void) => {
      if (!guard) {
        run();
        return;
      }
      guard.confirmLeave(run);
    },
    [guard],
  );
}
