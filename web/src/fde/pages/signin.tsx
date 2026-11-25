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
import { useSearch } from '@tanstack/react-router'

import { FdeLogo } from '@/fde/components/logo'
import { useFdeBranding } from '@/fde/lib/branding'
import { UserAuthForm } from '@/features/auth/sign-in/components/user-auth-form'

export function FdeSignInPage() {
  const { redirect } = useSearch({ from: '/fde/sign-in' })
  useFdeBranding()

  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10 text-foreground'>
      <div className='w-full max-w-sm space-y-8'>
        <div className='flex flex-col items-center gap-3 text-center'>
          <FdeLogo className='size-12' />
          <div className='space-y-1'>
            <h1 className='text-lg font-semibold tracking-tight'>FDE API</h1>
            <p className='text-xs text-muted-foreground'>网关控制台登录</p>
          </div>
        </div>

        <div className='rounded-lg border border-border/70 bg-card p-6 text-card-foreground'>
          <UserAuthForm redirectTo={redirect} />
        </div>

        <p className='text-center text-[11px] text-muted-foreground'>
          FDE API · built on new-api
        </p>
      </div>
    </div>
  )
}