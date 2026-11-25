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
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { PageHeader, Panel } from '@/fde/components/bits'
import { setFdeUiEnabled } from '@/fde/lib/ui-mode'
import { logout } from '@/features/auth/api'
import { ROLE } from '@/lib/roles'
import { statusQueryOptions } from '@/lib/status-query'
import { useAuthStore } from '@/stores/auth-store'

const ROLE_LABELS: Record<number, string> = {
  [ROLE.SUPER_ADMIN]: '超级管理员',
  [ROLE.ADMIN]: '管理员',
  [ROLE.USER]: '普通用户',
  [ROLE.GUEST]: '访客',
}

export function SettingsPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.auth.user)
  const statusQuery = useQuery(statusQueryOptions)

  const version =
    typeof statusQuery.data?.version === 'string'
      ? statusQuery.data.version
      : '—'

  function switchToClassic() {
    setFdeUiEnabled(false)
    void navigate({ to: '/dashboard' })
  }

  async function handleLogout() {
    try {
      await logout()
    } catch {
      // Fall through to a full reload which drops client-side state.
    }
    window.location.replace('/sign-in')
  }

  return (
    <div className='space-y-4'>
      <PageHeader description='界面与账号设置' title='设置' />

      <Panel className='divide-y divide-border/60'>
        <div className='flex items-center justify-between gap-6 p-5'>
          <div>
            <div className='text-sm font-medium'>新版界面（FDE API）</div>
            <p className='mt-1 max-w-xl text-xs text-muted-foreground'>
              关闭后立即返回经典版界面。该开关保存在当前浏览器，不影响其他设备与任何数据。
            </p>
          </div>
          <Switch checked onCheckedChange={() => switchToClassic()} />
        </div>

        <div className='flex items-center justify-between gap-6 p-5'>
          <div>
            <div className='text-sm font-medium'>账号</div>
            <p className='mt-1 text-xs text-muted-foreground'>
              {user?.username}
              {user?.display_name ? ` · ${user.display_name}` : ''} ·{' '}
              {ROLE_LABELS[user?.role ?? 0] ?? '用户'}
            </p>
          </div>
          <Button
            onClick={() => void handleLogout()}
            size='sm'
            variant='outline'
          >
            退出登录
          </Button>
        </div>

        <div className='p-5'>
          <div className='text-sm font-medium'>系统</div>
          <dl className='mt-2 space-y-1.5 text-xs'>
            <div className='flex justify-between gap-4'>
              <dt className='text-muted-foreground'>版本</dt>
              <dd className='font-mono'>{version}</dd>
            </div>
            <div className='flex justify-between gap-4'>
              <dt className='text-muted-foreground'>地址</dt>
              <dd className='truncate font-mono'>
                {typeof window === 'undefined' ? '' : window.location.origin}
              </dd>
            </div>
          </dl>
        </div>

        </Panel>
    </div>
  )
}