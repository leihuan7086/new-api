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
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState, type ReactNode } from 'react'

import { FdeLogo } from '@/fde/components/logo'
import { useFdeBranding } from '@/fde/lib/branding'
import { logout } from '@/features/auth/api'
import { ROLE } from '@/lib/roles'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

const NAV_ITEMS = [
  { to: '/fde', label: '概览' },
  { to: '/fde/channels', label: '渠道' },
  { to: '/fde/tokens', label: '令牌' },
  { to: '/fde/logs', label: '日志' },
  { to: '/fde/models', label: '模型定价' },
  { to: '/fde/users', label: '用户' },
] as const

const ROLE_LABELS: Record<number, string> = {
  [ROLE.SUPER_ADMIN]: '超级管理员',
  [ROLE.ADMIN]: '管理员',
  [ROLE.USER]: '普通用户',
  [ROLE.GUEST]: '访客',
}

function isActive(pathname: string, to: string): boolean {
  if (to === '/fde') return pathname === '/fde' || pathname === '/fde/'
  return pathname.startsWith(to)
}

function UserMenu(props: { compact?: boolean }) {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.auth.user)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const displayName = user?.display_name || user?.username || ''
  const roleLabel = ROLE_LABELS[user?.role ?? 0] ?? '用户'
  const avatarInitial = (displayName || '?').trim().charAt(0).toUpperCase()

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  async function handleLogout() {
    try {
      await logout()
    } catch {
      // The session cookie is cleared server-side; a full reload below
      // guarantees the client state is dropped either way.
    }
    window.location.replace('/sign-in')
  }

  function goSettings() {
    setOpen(false)
    void navigate({ to: '/fde/settings' })
  }

  return (
    <div className='relative' ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup='menu'
        className='flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/50'
        onClick={() => setOpen((value) => !value)}
        type='button'
      >
        <span className='flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-medium'>
          {avatarInitial}
        </span>
        <span className='min-w-0 flex-1'>
          <span className='block truncate text-xs font-medium'>
            {displayName}
          </span>
          {!props.compact && (
            <span className='mt-0.5 block truncate text-[11px] text-muted-foreground'>
              {roleLabel}
            </span>
          )}
        </span>
      </button>

      {open && (
        <div
          className={cn(
            'absolute z-30 w-52 rounded-md border border-border/70 bg-popover p-1 text-popover-foreground shadow-md',
            props.compact ? 'right-0 top-full mt-1' : 'bottom-full left-0 mb-1'
          )}
          role='menu'
        >
          <div className='px-2 py-1.5'>
            <div className='truncate text-sm font-medium'>{user?.username}</div>
            <div className='truncate text-xs text-muted-foreground'>
              {roleLabel}
            </div>
          </div>
          <div className='my-1 h-px bg-border/60' />
          <button
            className='w-full rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted'
            onClick={goSettings}
            role='menuitem'
            type='button'
          >
            设置
          </button>
          <button
            className='w-full rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted'
            onClick={() => void handleLogout()}
            role='menuitem'
            type='button'
          >
            退出登录
          </button>
        </div>
      )}
    </div>
  )
}

export function FdeShell({ children }: { children: ReactNode }) {
  const location = useLocation()
  useFdeBranding()

  return (
    <div className='flex min-h-screen bg-background text-foreground'>
      <aside className='sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-border/60 px-3 py-5 md:flex'>
        <Link className='mb-7 flex items-center gap-2.5 px-2' to='/fde'>
          <FdeLogo className='size-7' />
          <span className='flex flex-col leading-none'>
            <span className='text-sm font-semibold tracking-tight'>
              FDE API
            </span>
            <span className='mt-1 text-[11px] text-muted-foreground'>
              网关控制台
            </span>
          </span>
        </Link>

        <nav className='flex flex-col gap-0.5'>
          {NAV_ITEMS.map((item) => {
            const active = isActive(location.pathname, item.to)
            return (
              <Link
                className={cn(
                  'rounded-md px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-muted font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                )}
                key={item.to}
                to={item.to}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className='mt-auto border-t border-border/60 pt-3'>
          <UserMenu />
        </div>
      </aside>

      <div className='flex min-w-0 flex-1 flex-col'>
        <header className='sticky top-0 z-10 flex h-12 items-center justify-between border-b border-border/60 bg-background/85 px-4 backdrop-blur md:px-6'>
          <div className='flex items-center gap-2 md:hidden'>
            <FdeLogo className='size-5' />
            <span className='text-sm font-semibold tracking-tight'>
              FDE API
            </span>
          </div>
          <div className='hidden text-xs text-muted-foreground md:block'>
            Gateway Console
          </div>
          <div className='md:hidden'>
            <UserMenu compact />
          </div>
        </header>

        <nav className='flex gap-1 overflow-x-auto border-b border-border/60 px-3 py-2 md:hidden'>
          {NAV_ITEMS.map((item) => (
            <Link
              className={cn(
                'shrink-0 rounded-md px-3 py-1.5 text-xs',
                isActive(location.pathname, item.to)
                  ? 'bg-muted font-medium text-foreground'
                  : 'text-muted-foreground'
              )}
              key={item.to}
              to={item.to}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <main className='mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6 md:py-8'>
          {children}
        </main>

        <footer className='border-t border-border/60 py-4 text-center text-[11px] text-muted-foreground'>
          FDE API · built on new-api
        </footer>
      </div>
    </div>
  )
}