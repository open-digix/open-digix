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

import { useEffect, useCallback } from "react";

let globalIsDirty = false;
let globalPromptMessage =
  "Bạn có thay đổi chưa lưu. Bạn có chắc muốn rời đi không?";

/**
 * Manually set the unsaved changes state.
 */
export function setUnsavedChanges(dirty: boolean, message?: string): void {
  globalIsDirty = dirty;
  if (message) {
    globalPromptMessage = message;
  }
}

/**
 * Check if there are currently unsaved changes.
 */
export function hasUnsavedChanges(): boolean {
  return globalIsDirty;
}

/**
 * Prompt confirmation if there are unsaved changes.
 * Returns true if safe to proceed (not dirty, or user confirmed).
 */
export function confirmDiscardChanges(customMessage?: string): boolean {
  if (!globalIsDirty) return true;
  const message = customMessage ?? globalPromptMessage;
  const confirmed =
    typeof window !== "undefined" && typeof window.confirm === "function"
      ? window.confirm(message)
      : true;

  if (confirmed) {
    globalIsDirty = false;
  }
  return confirmed;
}

/**
 * Resets unsaved changes state (e.g. for testing or after tenant switch).
 */
export function resetUnsavedChanges(): void {
  globalIsDirty = false;
  globalPromptMessage =
    "Bạn có thay đổi chưa lưu. Bạn có chắc muốn rời đi không?";
}

/**
 * React hook to register unsaved changes for a form or view.
 * Also attaches window beforeunload handler to prevent accidental browser tab close/reload.
 */
export function useUnsavedChangesGuard(options?: {
  isDirty?: boolean;
  message?: string;
}) {
  const isDirty = options?.isDirty;
  const message = options?.message;

  useEffect(() => {
    if (isDirty !== undefined) {
      setUnsavedChanges(isDirty, message);
    }
    return () => {
      if (isDirty !== undefined) {
        setUnsavedChanges(false);
      }
    };
  }, [isDirty, message]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (globalIsDirty) {
        event.preventDefault();
        event.returnValue = message ?? globalPromptMessage;
        return event.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [message]);

  const confirmDiscard = useCallback(
    (customMsg?: string) => confirmDiscardChanges(customMsg ?? message),
    [message],
  );

  return {
    confirmDiscard,
    setDirty: setUnsavedChanges,
    hasUnsavedChanges,
  };
}
