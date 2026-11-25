/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
/**
 * FDE UI mode flag.
 *
 * Kept in localStorage on purpose: the new console must be switchable
 * without touching the backend, and flipping the switch must never
 * affect stored data or sessions. The flag is per-browser.
 */
const FDE_UI_STORAGE_KEY = 'fde:ui:v1'

export const FDE_UI_EVENT = 'fde-ui-change'

export function isFdeUiEnabled(): boolean {
  try {
    return window.localStorage.getItem(FDE_UI_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function setFdeUiEnabled(enabled: boolean): void {
  try {
    if (enabled) {
      window.localStorage.setItem(FDE_UI_STORAGE_KEY, '1')
    } else {
      window.localStorage.removeItem(FDE_UI_STORAGE_KEY)
    }
  } catch {
    // Storage may be unavailable (private mode); the switch still works
    // for the current page via navigation.
  }
  window.dispatchEvent(new CustomEvent(FDE_UI_EVENT, { detail: enabled }))
}