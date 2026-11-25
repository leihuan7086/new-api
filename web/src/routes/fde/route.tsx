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
import {
  createFileRoute,
  Outlet,
  redirect,
  useLocation,
} from '@tanstack/react-router'

import { FdeShell } from '@/fde/components/shell'
import { isFdeUiEnabled } from '@/fde/lib/ui-mode'
import { resolveAuthentication } from '@/lib/auth-session'
import { useAuthStore } from '@/stores/auth-store'

const SIGN_IN_PATH = '/fde/sign-in'

export const Route = createFileRoute('/fde')({
  beforeLoad: async ({ location }) => {
    // The console is opt-in. Without the flag every /fde entry goes back to
    // the classic UI, so a stale bookmark can never strand a user here.
    if (!isFdeUiEnabled()) {
      throw redirect({ to: '/sign-in' })
    }

    // The new sign-in page lives under /fde but must stay public and
    // chrome-less; it guards itself.
    if (location.pathname === SIGN_IN_PATH) return

    await resolveAuthentication()

    const { auth } = useAuthStore.getState()

    if (!auth.user || !auth.accessToken) {
      throw redirect({
        to: SIGN_IN_PATH,
        search: { redirect: location.href },
      })
    }
  },
  component: FdeRoute,
})

function FdeRoute() {
  const { pathname } = useLocation()
  if (pathname === SIGN_IN_PATH) return <Outlet />
  return (
    <FdeShell>
      <Outlet />
    </FdeShell>
  )
}