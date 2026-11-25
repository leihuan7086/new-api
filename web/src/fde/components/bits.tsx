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
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function PageHeader(props: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className='flex flex-wrap items-start justify-between gap-3'>
      <div className='space-y-1'>
        <h1 className='text-xl font-semibold tracking-tight'>{props.title}</h1>
        {props.description && (
          <p className='text-sm text-muted-foreground'>{props.description}</p>
        )}
      </div>
      {props.actions && (
        <div className='flex items-center gap-2'>{props.actions}</div>
      )}
    </div>
  )
}

export function Panel(props: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border/70 bg-card text-card-foreground',
        props.className
      )}
    >
      {props.children}
    </div>
  )
}

export function StatCard(props: {
  label: string
  value: ReactNode
  hint?: string
}) {
  return (
    <Panel className='p-5'>
      <div className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>
        {props.label}
      </div>
      <div className='mt-2 text-2xl font-semibold tabular-nums'>
        {props.value}
      </div>
      {props.hint && (
        <div className='mt-1 text-xs text-muted-foreground'>{props.hint}</div>
      )}
    </Panel>
  )
}

export function StatusDot(props: {
  dot: string
  text: string
  label: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs', props.text)}>
      <span className={cn('size-1.5 rounded-full', props.dot)} />
      {props.label}
    </span>
  )
}

export function Pagination(props: {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}) {
  const pages = Math.max(1, Math.ceil(props.total / props.pageSize))
  return (
    <div className='flex items-center justify-between border-t border-border/60 px-4 py-3 text-xs text-muted-foreground'>
      <span>
        共 {props.total} 条 · 第 {props.page} / {pages} 页
      </span>
      <div className='flex gap-2'>
        <Button
          disabled={props.page <= 1}
          onClick={() => props.onPageChange(props.page - 1)}
          size='sm'
          variant='outline'
        >
          上一页
        </Button>
        <Button
          disabled={props.page >= pages}
          onClick={() => props.onPageChange(props.page + 1)}
          size='sm'
          variant='outline'
        >
          下一页
        </Button>
      </div>
    </div>
  )
}

export function EmptyRow(props: { colSpan: number; text?: string }) {
  return (
    <tr>
      <td
        className='px-4 py-12 text-center text-sm text-muted-foreground'
        colSpan={props.colSpan}
      >
        {props.text ?? '暂无数据'}
      </td>
    </tr>
  )
}

export function ErrorNotice(props: { text?: string }) {
  return (
    <Panel className='p-6 text-sm text-destructive'>
      {props.text ?? '加载失败，请稍后重试'}
    </Panel>
  )
}