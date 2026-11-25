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

import {
  EmptyRow,
  PageHeader,
  Panel,
  StatCard,
} from '@/fde/components/bits'
import {
  formatCompact,
  formatLogType,
  formatQuota,
  formatTimestamp,
  logTypeTone,
} from '@/fde/lib/format'
import { getChannels } from '@/features/channels/api'
import { getApiKeys } from '@/features/keys/api'
import {
  getAllLogs,
  getLogStats,
  getUserLogs,
  getUserLogStats,
} from '@/features/usage-logs/api'
import type { UsageLog } from '@/features/usage-logs/data/schema'
import { ROLE } from '@/lib/roles'
import { statusQueryOptions } from '@/lib/status-query'
import { useAuthStore } from '@/stores/auth-store'

function startOfToday(): number {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return Math.floor(date.getTime() / 1000)
}

export function OverviewPage() {
  const role = useAuthStore((state) => state.auth.user?.role ?? 0)
  const isAdmin = role >= ROLE.ADMIN

  const now = Math.floor(Date.now() / 1000)
  const todayStart = startOfToday()

  const statusQuery = useQuery(statusQueryOptions)

  const statsQuery = useQuery({
    queryKey: ['fde-overview-stats', isAdmin, todayStart],
    queryFn: () =>
      isAdmin
        ? getLogStats({
            start_timestamp: todayStart,
            end_timestamp: now,
          })
        : getUserLogStats({
            start_timestamp: todayStart,
            end_timestamp: now,
          }),
    refetchInterval: 60_000,
  })

  const channelsQuery = useQuery({
    queryKey: ['fde-overview-channels'],
    queryFn: () => getChannels({ p: 1, page_size: 1 }),
    enabled: isAdmin,
  })

  const tokensQuery = useQuery({
    queryKey: ['fde-overview-tokens'],
    queryFn: () => getApiKeys({ p: 1, size: 1 }),
  })

  const recentQuery = useQuery({
    queryKey: ['fde-overview-recent', isAdmin],
    queryFn: () =>
      isAdmin
        ? getAllLogs({ p: 1, page_size: 6 })
        : getUserLogs({ p: 1, page_size: 6 }),
    refetchInterval: 60_000,
  })

  const stats = statsQuery.data?.data
  const recent = (recentQuery.data?.data?.items ?? []) as UsageLog[]
  const version =
    typeof statusQuery.data?.version === 'string'
      ? statusQuery.data.version
      : '—'

  return (
    <div className='space-y-6'>
      <PageHeader
        description='只保留网关转发核心能力的极简控制台'
        title='概览'
      />

      <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
        <StatCard
          hint='自今日 00:00 起'
          label='今日消费'
          value={formatQuota(stats?.quota)}
        />
        <StatCard
          hint='requests / min'
          label='今日 RPM'
          value={formatCompact(stats?.rpm)}
        />
        <StatCard
          hint={isAdmin ? '全部渠道' : '需管理员权限'}
          label='渠道'
          value={isAdmin ? (channelsQuery.data?.data?.total ?? '—') : '—'}
        />
        <StatCard
          hint='当前账号'
          label='令牌'
          value={tokensQuery.data?.data?.total ?? '—'}
        />
      </div>

      <div className='grid gap-3 lg:grid-cols-3'>
        <Panel className='space-y-3 p-5 lg:col-span-1'>
          <div className='text-sm font-medium'>服务状态</div>
          <dl className='space-y-2 text-xs'>
            <div className='flex justify-between gap-4'>
              <dt className='text-muted-foreground'>版本</dt>
              <dd className='font-mono'>{version}</dd>
            </div>
            <div className='flex justify-between gap-4'>
              <dt className='text-muted-foreground'>今日 TPM</dt>
              <dd className='tabular-nums'>{formatCompact(stats?.tpm)}</dd>
            </div>
            <div className='flex justify-between gap-4'>
              <dt className='text-muted-foreground'>当前账号</dt>
              <dd>{isAdmin ? '管理员' : '普通用户'}</dd>
            </div>
          </dl>
        </Panel>

        <Panel className='lg:col-span-2'>
          <div className='border-b border-border/60 px-4 py-3 text-sm font-medium'>
            最近请求
          </div>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b border-border/60 text-left text-xs text-muted-foreground'>
                <th className='px-4 py-2 font-medium'>时间</th>
                <th className='px-4 py-2 font-medium'>类型</th>
                <th className='px-4 py-2 font-medium'>模型</th>
                <th className='px-4 py-2 text-right font-medium'>金额</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <EmptyRow colSpan={4} />
              ) : (
                recent.map((log) => (
                  <tr
                    className='border-b border-border/40 last:border-0'
                    key={log.id}
                  >
                    <td className='px-4 py-2 text-xs text-muted-foreground'>
                      {formatTimestamp(log.created_at)}
                    </td>
                    <td
                      className={`px-4 py-2 text-xs ${logTypeTone(log.type)}`}
                    >
                      {formatLogType(log.type)}
                    </td>
                    <td className='max-w-48 truncate px-4 py-2 text-xs'>
                      {log.model_name || '—'}
                    </td>
                    <td className='px-4 py-2 text-right text-xs tabular-nums'>
                      {formatQuota(log.quota)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  )
}