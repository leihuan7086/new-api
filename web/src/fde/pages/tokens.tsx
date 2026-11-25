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
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  EmptyRow,
  ErrorNotice,
  PageHeader,
  Pagination,
  Panel,
  StatusDot,
} from '@/fde/components/bits'
import {
  QUOTA_PER_USD,
  formatQuota,
  formatTimestamp,
  maskKey,
  tokenStatusInfo,
} from '@/fde/lib/format'
import {
  createApiKey,
  deleteApiKey,
  fetchTokenKey,
  getApiKeys,
  searchApiKeys,
  updateApiKey,
  updateApiKeyStatus,
} from '@/features/keys/api'
import type { ApiKey } from '@/features/keys/types'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

const EXPIRE_LABELS: Record<string, string> = {
  never: '永久有效',
  '7': '7 天',
  '30': '30 天',
  '90': '90 天',
}

type TokenForm = {
  name: string
  unlimited: boolean
  remainUsd: string
  expire: string
}

function TokenDialog(props: {
  open: boolean
  token: ApiKey | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<TokenForm>(() => ({
    name: props.token?.name ?? '',
    unlimited: props.token?.unlimited_quota ?? true,
    remainUsd: props.token
      ? (props.token.remain_quota / QUOTA_PER_USD).toFixed(2)
      : '10',
    expire: 'never',
  }))
  const [saving, setSaving] = useState(false)

  function patch(next: Partial<TokenForm>) {
    setForm((prev) => ({ ...prev, ...next }))
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.error('请填写令牌名称')
      return
    }
    const now = Math.floor(Date.now() / 1000)
    let expiredTime = props.token?.expired_time ?? -1
    if (!props.token && form.expire !== 'never') {
      expiredTime = now + Number(form.expire) * 86_400
    }
    const remainQuota = form.unlimited
      ? 0
      : Math.round((Number(form.remainUsd) || 0) * QUOTA_PER_USD)

    setSaving(true)
    try {
      if (props.token) {
        const res = await updateApiKey({
          id: props.token.id,
          name: form.name.trim(),
          remain_quota: remainQuota,
          expired_time: expiredTime,
          unlimited_quota: form.unlimited,
          model_limits_enabled: props.token.model_limits_enabled,
          model_limits: props.token.model_limits ?? '',
          allow_ips: props.token.allow_ips ?? '',
          allow_user_quota_query: props.token.allow_user_quota_query ?? false,
          group: props.token.group ?? '',
          auto_groups: props.token.auto_groups ?? [],
          cross_group_retry: props.token.cross_group_retry ?? false,
        })
        if (!res.success) throw new Error(res.message || '保存失败')
        toast.success('令牌已更新')
      } else {
        const res = await createApiKey({
          name: form.name.trim(),
          remain_quota: remainQuota,
          expired_time: expiredTime,
          unlimited_quota: form.unlimited,
          model_limits_enabled: false,
          model_limits: '',
          allow_ips: '',
          allow_user_quota_query: false,
          group: 'default',
          auto_groups: [],
          cross_group_retry: false,
        })
        if (!res.success) throw new Error(res.message || '创建失败')
        toast.success('令牌已创建，可在列表中显示并复制 Key')
      }
      await queryClient.invalidateQueries({ queryKey: ['fde-tokens'] })
      props.onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog onOpenChange={(open) => !open && props.onClose()} open={props.open}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{props.token ? '编辑令牌' : '新建令牌'}</DialogTitle>
        </DialogHeader>
        <div className='space-y-4'>
          <div>
            <Label>名称</Label>
            <Input
              className='mt-1.5'
              onChange={(event) => patch({ name: event.target.value })}
              placeholder='例如 fde-bot'
              value={form.name}
            />
          </div>
          <div className='flex items-center justify-between rounded-md border border-border/70 px-3 py-2.5'>
            <div>
              <div className='text-sm'>无限额度</div>
              <div className='text-xs text-muted-foreground'>
                关闭后按下方金额限制
              </div>
            </div>
            <Switch
              checked={form.unlimited}
              onCheckedChange={(checked) => patch({ unlimited: checked })}
            />
          </div>
          <div>
            <Label>额度（美元）</Label>
            <Input
              className='mt-1.5'
              disabled={form.unlimited}
              onChange={(event) => patch({ remainUsd: event.target.value })}
              value={form.remainUsd}
            />
          </div>
          {!props.token && (
            <div>
              <Label>有效期</Label>
              <Select
                onValueChange={(value) => {
                  if (value) patch({ expire: value })
                }}
                value={form.expire}
              >
                <SelectTrigger className='mt-1.5 w-full'>
                  <span className='flex-1 text-left'>
                    {EXPIRE_LABELS[form.expire] ?? '永久有效'}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='never'>永久有效</SelectItem>
                  <SelectItem value='7'>7 天</SelectItem>
                  <SelectItem value='30'>30 天</SelectItem>
                  <SelectItem value='90'>90 天</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={props.onClose} variant='ghost'>
            取消
          </Button>
          <Button disabled={saving} onClick={() => void handleSubmit()}>
            {saving ? '保存中…' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function TokensPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [searchDraft, setSearchDraft] = useState('')
  const [keyword, setKeyword] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ApiKey | null>(null)
  const [revealed, setRevealed] = useState<Record<number, string>>({})

  const listQuery = useQuery({
    queryKey: ['fde-tokens', page, keyword],
    queryFn: () =>
      keyword
        ? searchApiKeys({ keyword, p: page, size: PAGE_SIZE })
        : getApiKeys({ p: page, size: PAGE_SIZE }),
  })

  const items = listQuery.data?.data?.items ?? []
  const total = listQuery.data?.data?.total ?? 0

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ['fde-tokens'] })
  }

  async function handleReveal(token: ApiKey) {
    try {
      const res = await fetchTokenKey(token.id)
      const key = res.data?.key
      if (!res.success || !key) {
        throw new Error(res.message || '无法读取 Key')
      }
      setRevealed((prev) => ({ ...prev, [token.id]: key }))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '无法读取 Key')
    }
  }

  async function handleCopy(token: ApiKey) {
    try {
      let key = revealed[token.id]
      if (!key) {
        const res = await fetchTokenKey(token.id)
        if (!res.success || !res.data?.key) {
          throw new Error(res.message || '无法读取 Key')
        }
        key = res.data.key
        setRevealed((prev) => ({ ...prev, [token.id]: key as string }))
      }
      await navigator.clipboard.writeText(key)
      toast.success('已复制到剪贴板')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '复制失败')
    }
  }

  async function handleToggle(token: ApiKey) {
    try {
      const next = token.status === 1 ? 2 : 1
      const res = await updateApiKeyStatus(token.id, next)
      if (!res.success) throw new Error(res.message || '操作失败')
      toast.success(next === 1 ? '已启用' : '已禁用')
      refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败')
    }
  }

  async function handleDelete(token: ApiKey) {
    if (!window.confirm(`确认删除令牌「${token.name}」？`)) return
    try {
      const res = await deleteApiKey(token.id)
      if (!res.success) throw new Error(res.message || '删除失败')
      toast.success('已删除')
      refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '删除失败')
    }
  }

  return (
    <div className='space-y-4'>
      <PageHeader
        actions={
          <Button
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
          >
            新建令牌
          </Button>
        }
        description='调用网关使用的 API Key，可随时禁用与轮换'
        title='令牌'
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
            placeholder='搜索名称，回车确认'
            value={searchDraft}
          />
          {keyword && (
            <Button
              onClick={() => {
                setKeyword('')
                setSearchDraft('')
                setPage(1)
              }}
              size='sm'
              variant='ghost'
            >
              清除搜索
            </Button>
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
                  <th className='px-4 py-2.5 font-medium'>名称</th>
                  <th className='px-4 py-2.5 font-medium'>Key</th>
                  <th className='px-4 py-2.5 font-medium'>状态</th>
                  <th className='px-4 py-2.5 text-right font-medium'>剩余</th>
                  <th className='px-4 py-2.5 text-right font-medium'>已用</th>
                  <th className='px-4 py-2.5 font-medium'>过期时间</th>
                  <th className='px-4 py-2.5 text-right font-medium'>操作</th>
                </tr>
              </thead>
              <tbody>
                {listQuery.isLoading && (
                  <EmptyRow colSpan={7} text='加载中…' />
                )}
                {!listQuery.isLoading && items.length === 0 && (
                  <EmptyRow colSpan={7} text='还没有令牌，点击右上角新建' />
                )}
                {!listQuery.isLoading &&
                  items.length > 0 &&
                  items.map((token) => {
                    const shown = revealed[token.id]
                    const info = tokenStatusInfo(token.status)
                    return (
                      <tr
                        className='border-b border-border/40 last:border-0 hover:bg-muted/30'
                        key={token.id}
                      >
                        <td className='max-w-36 truncate px-4 py-2.5'>
                          {token.name}
                        </td>
                        <td className='px-4 py-2.5 font-mono text-xs'>
                          <span className={cn(shown && 'select-all')}>
                            {shown ?? maskKey(token.key)}
                          </span>
                          <button
                            className='ml-2 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline'
                            onClick={() =>
                              shown
                                ? void handleCopy(token)
                                : void handleReveal(token)
                            }
                            type='button'
                          >
                            {shown ? '复制' : '显示'}
                          </button>
                        </td>
                        <td className='px-4 py-2.5'>
                          <StatusDot {...info} />
                        </td>
                        <td className='px-4 py-2.5 text-right text-xs tabular-nums'>
                          {token.unlimited_quota
                            ? '不限'
                            : formatQuota(token.remain_quota)}
                        </td>
                        <td className='px-4 py-2.5 text-right text-xs tabular-nums text-muted-foreground'>
                          {formatQuota(token.used_quota)}
                        </td>
                        <td className='px-4 py-2.5 text-xs text-muted-foreground'>
                          {token.expired_time === -1
                            ? '永久'
                            : formatTimestamp(token.expired_time)}
                        </td>
                        <td className='px-4 py-2.5'>
                          <div className='flex justify-end gap-1 whitespace-nowrap'>
                            <Button
                              onClick={() => void handleToggle(token)}
                              size='sm'
                              variant='ghost'
                            >
                              {token.status === 1 ? '禁用' : '启用'}
                            </Button>
                            <Button
                              onClick={() => {
                                setEditing(token)
                                setDialogOpen(true)
                              }}
                              size='sm'
                              variant='ghost'
                            >
                              编辑
                            </Button>
                            <Button
                              className='text-destructive'
                              onClick={() => void handleDelete(token)}
                              size='sm'
                              variant='ghost'
                            >
                              删除
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
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

      <TokenDialog
        key={dialogOpen ? (editing?.id ?? 'new') : 'closed'}
        onClose={() => setDialogOpen(false)}
        open={dialogOpen}
        token={editing}
      />
    </div>
  )
}