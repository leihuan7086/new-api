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

import { Input } from '@/components/ui/input'
import {
  EmptyRow,
  ErrorNotice,
  PageHeader,
  Pagination,
  Panel,
  StatusDot,
} from '@/fde/components/bits'
import { formatQuota, formatTimestamp } from '@/fde/lib/format'
import { getUsers, searchUsers } from '@/features/users/api'
import { ROLE } from '@/lib/roles'
import { useAuthStore } from '@/stores/auth-store'

const PAGE_SIZE = 20

const ROLE_LABELS: Record<number, string> = {
  [ROLE.SUPER_ADMIN]: '超级管理员',
  [ROLE.ADMIN]: '管理员',
  [ROLE.USER]: '用户',
  [ROLE.GUEST]: '访客',
}

export function UsersPage() {
  const role = useAuthStore((state) => state.auth.user?.role ?? 0)
  const isAdmin = role >= ROLE.ADMIN

  const [page, setPage] = useState(1)
  const [searchDraft, setSearchDraft] = useState('')
  const [keyword, setKeyword] = useState('')

  const listQuery = useQuery({
    queryKey: ['fde-users', page, keyword],
    queryFn: () =>
      keyword
        ? searchUsers({ keyword, p: page, page_size: PAGE_SIZE })
        : getUsers({ p: page, page_size: PAGE_SIZE }),
    enabled: isAdmin,
  })

  if (!isAdmin) {
    return (
      <div className='space-y-4'>
        <PageHeader title='用户' />
        <Panel className='p-6 text-sm text-muted-foreground'>
          仅管理员可查看用户列表。
        </Panel>
      </div>
    )
  }

  const items = listQuery.data?.data?.items ?? []
  const total = listQuery.data?.data?.total ?? 0

  return (
    <div className='space-y-4'>
      <PageHeader
        description='只读用户列表，用户管理请使用经典版'
        title='用户'
      />

      <Panel>
        <div className='flex flex-wrap items-center gap-2 border-b border-border/60 px-4 py-3'>
          <Input
            className='h-8 w-56'
            onChange={(event) => setSearchDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                setPage(1)
                setKeyword(searchDraft.trim())
              }
            }}
            placeholder='搜索用户名，回车确认'
            value={searchDraft}
          />
          {keyword && (
            <button
              className='text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline'
              onClick={() => {
                setKeyword('')
                setSearchDraft('')
                setPage(1)
              }}
              type='button'
            >
              清除搜索
            </button>
          )}
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
                  <th className='px-4 py-2.5 font-medium'>用户</th>
                  <th className='px-4 py-2.5 font-medium'>角色</th>
                  <th className='px-4 py-2.5 font-medium'>状态</th>
                  <th className='px-4 py-2.5 font-medium'>分组</th>
                  <th className='px-4 py-2.5 text-right font-medium'>余额</th>
                  <th className='px-4 py-2.5 text-right font-medium'>已用</th>
                  <th className='px-4 py-2.5 text-right font-medium'>请求数</th>
                  <th className='px-4 py-2.5 font-medium'>注册时间</th>
                </tr>
              </thead>
              <tbody>
                {listQuery.isLoading && (
                  <EmptyRow colSpan={8} text='加载中…' />
                )}
                {!listQuery.isLoading && items.length === 0 && (
                  <EmptyRow colSpan={8} />
                )}
                {!listQuery.isLoading &&
                  items.length > 0 &&
                  items.map((user) => (
                    <tr
                      className='border-b border-border/40 last:border-0 hover:bg-muted/30'
                      key={user.id}
                    >
                      <td className='px-4 py-2.5'>
                        <div className='text-sm'>{user.username}</div>
                        <div className='text-xs text-muted-foreground'>
                          {user.display_name || `#${user.id}`}
                        </div>
                      </td>
                      <td className='px-4 py-2.5 text-xs'>
                        {ROLE_LABELS[user.role] ?? user.role}
                      </td>
                      <td className='px-4 py-2.5'>
                        <StatusDot
                          dot={
                            user.status === 1 ? 'bg-emerald-500' : 'bg-red-500'
                          }
                          label={user.status === 1 ? '正常' : '已禁用'}
                          text={
                            user.status === 1
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-red-700 dark:text-red-400'
                          }
                        />
                      </td>
                      <td className='px-4 py-2.5 text-xs'>{user.group}</td>
                      <td className='px-4 py-2.5 text-right text-xs tabular-nums'>
                        {formatQuota(user.quota)}
                      </td>
                      <td className='px-4 py-2.5 text-right text-xs tabular-nums text-muted-foreground'>
                        {formatQuota(user.used_quota)}
                      </td>
                      <td className='px-4 py-2.5 text-right text-xs tabular-nums text-muted-foreground'>
                        {user.request_count}
                      </td>
                      <td className='px-4 py-2.5 text-xs text-muted-foreground'>
                        {formatTimestamp(user.created_at)}
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