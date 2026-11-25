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
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import {
  EmptyRow,
  ErrorNotice,
  PageHeader,
  Pagination,
  Panel,
} from '@/fde/components/bits'
import {
  formatCompact,
  formatLogType,
  formatNumber,
  formatQuota,
  formatTimestamp,
  logTypeTone,
} from '@/fde/lib/format'
import {
  getAllLogs,
  getLogStats,
  getUserLogs,
  getUserLogStats,
} from '@/features/usage-logs/api'
import type { UsageLog } from '@/features/usage-logs/data/schema'
import { ROLE } from '@/lib/roles'
import { useAuthStore } from '@/stores/auth-store'

const PAGE_SIZE = 20

const TYPE_OPTIONS = [
  { value: '0', label: '全部类型' },
  { value: '2', label: '消费' },
  { value: '5', label: '错误' },
  { value: '1', label: '充值' },
  { value: '6', label: '退款' },
  { value: '3', label: '管理' },
  { value: '7', label: '登录' },
]

const RANGE_OPTIONS = [
  { value: '1', label: '近 24 小时' },
  { value: '7', label: '近 7 天' },
  { value: '14', label: '近 14 天' },
  { value: '30', label: '近 30 天' },
]

function buildFilters(input: {
  type: string
  range: string
  model: string
  username: string
}) {
  const end = Math.floor(Date.now() / 1000)
  return {
    type: input.type === '0' ? undefined : Number(input.type),
    model_name: input.model || undefined,
    username: input.username || undefined,
    start_timestamp: end - Number(input.range) * 86_400,
    end_timestamp: end,
  }
}

export function LogsPage() {
  const role = useAuthStore((state) => state.auth.user?.role ?? 0)
  const isAdmin = role >= ROLE.ADMIN

  const [page, setPage] = useState(1)
  const [type, setType] = useState('0')
  const [range, setRange] = useState('1')
  const [modelDraft, setModelDraft] = useState('')
  const [usernameDraft, setUsernameDraft] = useState('')
  const [applied, setApplied] = useState({ model: '', username: '' })

  const filterInput = {
    type,
    range,
    model: applied.model,
    username: isAdmin ? applied.username : '',
  }

  const listQuery = useQuery({
    queryKey: ['fde-logs', page, type, range, applied.model, applied.username, isAdmin],
    queryFn: () => {
      const filters = buildFilters(filterInput)
      if (isAdmin) {
        return getAllLogs({ ...filters, p: page, page_size: PAGE_SIZE })
      }
      const { username: _ignored, ...selfFilters } = filters
      return getUserLogs({ ...selfFilters, p: page, page_size: PAGE_SIZE })
    },
  })

  const statsQuery = useQuery({
    queryKey: ['fde-log-stats', type, range, applied.model, applied.username, isAdmin],
    queryFn: () => {
      const filters = buildFilters(filterInput)
      if (isAdmin) return getLogStats(filters)
      const { username: _ignored, ...selfFilters } = filters
      return getUserLogStats(selfFilters)
    },
  })

  const items = (listQuery.data?.data?.items ?? []) as UsageLog[]
  const total = listQuery.data?.data?.total ?? 0
  const stats = statsQuery.data?.data

  function applyFilters() {
    setPage(1)
    setApplied({ model: modelDraft.trim(), username: usernameDraft.trim() })
  }

  return (
    <div className='space-y-4'>
      <PageHeader
        description={isAdmin ? '全部用户的调用记录' : '当前账号的调用记录'}
        title='日志'
      />

      <div className='grid grid-cols-3 gap-3'>
        <Panel className='p-4'>
          <div className='text-xs text-muted-foreground'>消费合计</div>
          <div className='mt-1 text-lg font-semibold tabular-nums'>
            {formatQuota(stats?.quota)}
          </div>
        </Panel>
        <Panel className='p-4'>
          <div className='text-xs text-muted-foreground'>RPM</div>
          <div className='mt-1 text-lg font-semibold tabular-nums'>
            {formatCompact(stats?.rpm)}
          </div>
        </Panel>
        <Panel className='p-4'>
          <div className='text-xs text-muted-foreground'>TPM</div>
          <div className='mt-1 text-lg font-semibold tabular-nums'>
            {formatCompact(stats?.tpm)}
          </div>
        </Panel>
      </div>

      <Panel>
        <div className='flex flex-wrap items-center gap-2 border-b border-border/60 px-4 py-3'>
          <Select
            onValueChange={(value) => {
              if (!value) return
              setPage(1)
              setType(value)
            }}
            value={type}
          >
            <SelectTrigger className='h-8 w-32'>
              <span className='flex-1 text-left'>
                {TYPE_OPTIONS.find((option) => option.value === type)?.label ??
                  '全部类型'}
              </span>
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            onValueChange={(value) => {
              if (!value) return
              setPage(1)
              setRange(value)
            }}
            value={range}
          >
            <SelectTrigger className='h-8 w-32'>
              <span className='flex-1 text-left'>
                {RANGE_OPTIONS.find((option) => option.value === range)?.label ??
                  '近 24 小时'}
              </span>
            </SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            className='h-8 w-44'
            onChange={(event) => setModelDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') applyFilters()
            }}
            placeholder='模型名'
            value={modelDraft}
          />
          {isAdmin && (
            <Input
              className='h-8 w-36'
              onChange={(event) => setUsernameDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') applyFilters()
              }}
              placeholder='用户名'
              value={usernameDraft}
            />
          )}
          <Button onClick={applyFilters} size='sm' variant='outline'>
            查询
          </Button>
        </div>

        {listQuery.isError ? (
          <div className='p-4'>
            <ErrorNotice />
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b border-border/60 text-left text-xs text-muted-foreground'>
                  <th className='px-4 py-2.5 font-medium'>时间</th>
                  <th className='px-4 py-2.5 font-medium'>类型</th>
                  <th className='px-4 py-2.5 font-medium'>模型</th>
                  {isAdmin && (
                    <th className='px-4 py-2.5 font-medium'>用户</th>
                  )}
                  <th className='px-4 py-2.5 font-medium'>令牌</th>
                  <th className='px-4 py-2.5 font-medium'>渠道</th>
                  <th className='px-4 py-2.5 text-right font-medium'>
                    Tokens (入/出)
                  </th>
                  <th className='px-4 py-2.5 text-right font-medium'>金额</th>
                </tr>
              </thead>
              <tbody>
                {listQuery.isLoading && (
                  <EmptyRow colSpan={isAdmin ? 8 : 7} text='加载中…' />
                )}
                {!listQuery.isLoading && items.length === 0 && (
                  <EmptyRow colSpan={isAdmin ? 8 : 7} />
                )}
                {!listQuery.isLoading &&
                  items.length > 0 &&
                  items.map((log) => (
                    <tr
                      className='border-b border-border/40 last:border-0 hover:bg-muted/30'
                      key={log.id}
                    >
                      <td className='whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground'>
                        {formatTimestamp(log.created_at)}
                      </td>
                      <td
                        className={`px-4 py-2.5 text-xs ${logTypeTone(log.type)}`}
                      >
                        {formatLogType(log.type)}
                      </td>
                      <td className='max-w-44 truncate px-4 py-2.5 text-xs'>
                        {log.model_name || '—'}
                      </td>
                      {isAdmin && (
                        <td className='px-4 py-2.5 text-xs'>
                          {log.username || '—'}
                        </td>
                      )}
                      <td className='max-w-32 truncate px-4 py-2.5 text-xs text-muted-foreground'>
                        {log.token_name || '—'}
                      </td>
                      <td className='max-w-32 truncate px-4 py-2.5 text-xs text-muted-foreground'>
                        {log.channel_name || log.channel || '—'}
                      </td>
                      <td className='px-4 py-2.5 text-right text-xs tabular-nums text-muted-foreground'>
                        {formatNumber(log.prompt_tokens)} /{' '}
                        {formatNumber(log.completion_tokens)}
                      </td>
                      <td className='px-4 py-2.5 text-right text-xs tabular-nums'>
                        {formatQuota(log.quota)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          onPageChange={setPage}
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
        />
      </Panel>
    </div>
  )
}