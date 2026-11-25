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
import { useEffect } from 'react'

/**
 * Brand the browser tab and favicon while an FDE surface is mounted,
 * restoring the classic branding when it unmounts.
 *
 * The status bootstrap in main.tsx applies the backend `system_name` as
 * soon as it resolves, which may happen after mount; a head observer keeps
 * the FDE branding authoritative for as long as the surface is alive.
 */
export function useFdeBranding() {
  useEffect(() => {
    const previousTitle = document.title
    const icon = document.querySelector<HTMLLinkElement>("link[rel~='icon']")
    const previousIcon = icon?.href
    const metaTitle = document.querySelector<HTMLMetaElement>(
      'meta[name="title"]'
    )
    const previousMeta = metaTitle?.content

    const apply = () => {
      if (document.title !== 'FDE API') document.title = 'FDE API'
      if (icon && !icon.href.endsWith('/fde-icon.svg')) {
        icon.href = '/fde-icon.svg'
      }
      if (metaTitle && metaTitle.content !== 'FDE API') {
        metaTitle.setAttribute('content', 'FDE API')
      }
    }

    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
    })

    return () => {
      observer.disconnect()
      document.title = previousTitle
      if (metaTitle && previousMeta) {
        metaTitle.setAttribute('content', previousMeta)
      }
      if (icon && previousIcon) icon.href = previousIcon
    }
  }, [])
}