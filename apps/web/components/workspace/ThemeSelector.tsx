/*
 * Copyright 2026 DigiX Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use client";

import { useEffect, useState, useRef, type KeyboardEvent } from "react";
import type { DigiXTheme } from "../../lib/theme";
import { parseTheme, setThemePreference } from "../../lib/theme";

interface ThemeOption {
  value: DigiXTheme;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    value: "light",
    label: "Sáng",
    icon: () => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
    ),
  },
  {
    value: "dark",
    label: "Tối",
    icon: () => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
    ),
  },
  {
    value: "system",
    label: "Hệ thống",
    icon: () => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect width="20" height="14" x="2" y="3" rx="2" />
        <line x1="8" x2="16" y1="21" y2="21" />
        <line x1="12" x2="12" y1="17" y2="21" />
      </svg>
    ),
  },
];

export default function ThemeSelector() {
  const [currentTheme, setCurrentTheme] = useState<DigiXTheme>("system");
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const activeAttr = document.documentElement.getAttribute("data-theme");
    if (activeAttr) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentTheme(parseTheme(activeAttr));
    }

    const observer = new MutationObserver(() => {
      const currentAttr = document.documentElement.getAttribute("data-theme");
      setCurrentTheme(parseTheme(currentAttr));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  const selectTheme = (theme: DigiXTheme) => {
    setCurrentTheme(theme);
    setThemePreference(theme);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      nextIndex = (index + 1) % THEME_OPTIONS.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      nextIndex = (index - 1 + THEME_OPTIONS.length) % THEME_OPTIONS.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      nextIndex = THEME_OPTIONS.length - 1;
    } else if (e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      selectTheme(THEME_OPTIONS[index].value);
      return;
    }

    if (nextIndex >= 0) {
      buttonRefs.current[nextIndex]?.focus();
      selectTheme(THEME_OPTIONS[nextIndex].value);
    }
  };

  return (
    <div style={{ marginTop: "10px", marginBottom: "4px" }}>
      <div
        id="theme-label"
        style={{
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: ".08em",
          color: "var(--ws-text-muted)",
          textTransform: "uppercase",
          marginBottom: "6px",
        }}
      >
        Giao diện
      </div>

      <div
        role="radiogroup"
        aria-labelledby="theme-label"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "4px",
          background: "var(--ws-bg-surface-2)",
          padding: "3px",
          borderRadius: "8px",
          border: "1px solid var(--ws-border)",
        }}
      >
        {THEME_OPTIONS.map((opt, i) => {
          const isSelected = currentTheme === opt.value;
          return (
            <button
              key={opt.value}
              ref={(el) => {
                buttonRefs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => selectTheme(opt.value)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                padding: "6px 4px",
                border: "0",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: isSelected ? 700 : 500,
                background: isSelected ? "var(--ws-bg-surface)" : "transparent",
                color: isSelected ? "var(--ws-accent)" : "var(--ws-text-muted)",
                boxShadow: isSelected ? "0 1px 3px rgba(0, 0, 0, 0.08)" : "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all var(--ws-dur-fast) var(--ws-ease)",
              }}
            >
              {opt.icon(isSelected)}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
