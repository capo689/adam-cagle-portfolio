"use client";

import { useEffect, useRef } from "react";

const dialogs: HTMLElement[] = [];
const backgroundLocks = new Map<HTMLElement, { count: number; ariaHidden: string | null; inert: boolean }>();
const backgroundSelector = ".site-header, .content-window, .voice-rail, .face-portal, .ace-rail-title";

function lockBackground(dialog: HTMLElement) {
  const elements = Array.from(document.querySelectorAll<HTMLElement>(backgroundSelector));
  for (const element of elements) {
    if (element.contains(dialog)) continue;
    const existing = backgroundLocks.get(element);
    if (existing) {
      existing.count += 1;
      continue;
    }
    backgroundLocks.set(element, {
      count: 1,
      ariaHidden: element.getAttribute("aria-hidden"),
      inert: element.inert,
    });
    element.setAttribute("aria-hidden", "true");
    element.inert = true;
  }
  return elements;
}

function unlockBackground(elements: HTMLElement[]) {
  for (const element of elements) {
    const state = backgroundLocks.get(element);
    if (!state) continue;
    state.count -= 1;
    if (state.count > 0) continue;
    if (state.ariaHidden === null) element.removeAttribute("aria-hidden");
    else element.setAttribute("aria-hidden", state.ariaHidden);
    element.inert = state.inert;
    backgroundLocks.delete(element);
  }
}

export function useModalAccessibility<T extends HTMLElement>(active: boolean, onClose: () => void) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!active || !dialog) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogs.push(dialog);
    const background = lockBackground(dialog);
    const focusableSelector = "button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";
    const focusables = () => Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector)).filter((element) => !element.hidden);
    window.requestAnimationFrame(() => (focusables()[0] || dialog).focus());

    const onKeyDown = (event: KeyboardEvent) => {
      if (dialogs.at(-1) !== dialog) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (!items.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = items[0];
      const last = items.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      const index = dialogs.lastIndexOf(dialog);
      if (index >= 0) dialogs.splice(index, 1);
      unlockBackground(background);
      previousFocus?.focus();
    };
  }, [active, onClose]);

  return ref;
}
