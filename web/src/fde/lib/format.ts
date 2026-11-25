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
import dayjs from 'dayjs'

/** Internal quota unit: 1 USD = 500,000 quota. */
export const QUOTA_PER_USD = 500_000

const LOG_TYPE_LABELS: Record<number, string> = {
  0: '未知',
  1: '充值',
  2: '消费',
  3: '管理',
  4: '系统',
  5: '错误',
  6: '退款',
  7: '登录',
}

export function formatQuota(quota?: number | null): string {
  return `$${((quota ?? 0) / QUOTA_PER_USD).toFixed(4)}`
}

export function formatNumber(value?: number | null): string {
  return new Intl.NumberFormat('zh-CN').format(value ?? 0)
}

export function formatCompact(value?: number | null): string {
  const n = value ?? 0
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export function formatTimestamp(value?: number | null): string {
  if (!value) return '—'
  const ms = value > 1_000_000_000_000 ? value : value * 1000
  return dayjs(ms).format('YYYY-MM-DD HH:mm:ss')
}

export function formatLogType(type: number): string {
  return LOG_TYPE_LABELS[type] ?? `类型 ${type}`
}

export function logTypeTone(type: number): string {
  if (type === 2) return 'text-emerald-600 dark:text-emerald-400'
  if (type === 5) return 'text-red-600 dark:text-red-400'
  if (type === 1 || type === 6) return 'text-sky-600 dark:text-sky-400'
  return 'text-muted-foreground'
}

export type ChannelStatusInfo = {
  label: string
  dot: string
  text: string
}

export function channelStatusInfo(status: number): ChannelStatusInfo {
  if (status === 1) {
    return {
      label: '已启用',
      dot: 'bg-emerald-500',
      text: 'text-emerald-700 dark:text-emerald-400',
    }
  }
  if (status === 3) {
    return {
      label: '自动禁用',
      dot: 'bg-amber-500',
      text: 'text-amber-700 dark:text-amber-400',
    }
  }
  return {
    label: '已禁用',
    dot: 'bg-muted-foreground/50',
    text: 'text-muted-foreground',
  }
}

export type TokenStatusInfo = {
  label: string
  dot: string
  text: string
}

export function tokenStatusInfo(status: number): TokenStatusInfo {
  if (status === 1) {
    return {
      label: '启用',
      dot: 'bg-emerald-500',
      text: 'text-emerald-700 dark:text-emerald-400',
    }
  }
  if (status === 3) {
    return {
      label: '已过期',
      dot: 'bg-amber-500',
      text: 'text-amber-700 dark:text-amber-400',
    }
  }
  if (status === 4) {
    return {
      label: '额度耗尽',
      dot: 'bg-red-500',
      text: 'text-red-700 dark:text-red-400',
    }
  }
  return {
    label: '已禁用',
    dot: 'bg-muted-foreground/50',
    text: 'text-muted-foreground',
  }
}

export function maskKey(key?: string | null): string {
  if (!key) return '—'
  if (key.length <= 12) return key
  return `${key.slice(0, 7)}…${key.slice(-4)}`
}