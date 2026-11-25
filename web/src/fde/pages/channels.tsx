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
import { useEffect, useState } from 'react'
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
import {
  EmptyRow,
  ErrorNotice,
  PageHeader,
  Pagination,
  Panel,
  StatusDot,
} from '@/fde/components/bits'
import { channelStatusInfo } from '@/fde/lib/format'
import {
  createChannel,
  deleteChannel,
  getChannelDefaultBaseURLs,
  getChannels,
  searchChannels,
  testChannel,
  updateChannel,
  updateChannelStatus,
} from '@/features/channels/api'
import {
  CHANNEL_TYPE_OPTIONS,
  CHANNEL_TYPES,
} from '@/features/channels/constants'
import type { Channel } from '@/features/channels/types'

const PAGE_SIZE = 20

const STATUS_LABELS: Record<string, string> = {
  all: '全部状态',
  enabled: '已启用',
  disabled: '已禁用',
}

const TYPE_BASE_URL_HINTS: Record<number, string> = {
  1: 'https://api.openai.com',
  3: 'https://your-resource.openai.azure.com',
  4: 'http://localhost:11434',
  14: 'https://api.anthropic.com',
  24: 'https://generativelanguage.googleapis.com',
  25: 'https://api.moonshot.cn',
  40: 'https://api.siliconflow.cn',
}

function channelTypeLabel(type: number): string {
  return (CHANNEL_TYPES as Record<number, string>)[type] ?? `类型 ${type}`
}

type ChannelForm = {
  type: number
  name: string
  base_url: string
  key: string
  models: string
  group: string
  priority: string
  weight: string
  remark: string
}

function toForm(channel: Channel | null): ChannelForm {
  return {
    type: channel?.type ?? 1,
    name: channel?.name ?? '',
    base_url: channel?.base_url ?? '',
    key: channel?.key ?? '',
    models: channel?.models ?? '',
    group: channel?.group ?? 'default',
    priority: String(channel?.priority ?? 0),
    weight: String(channel?.weight ?? 0),
    remark: channel?.remark ?? '',
  }
}

const fieldClassName = 'mt-1.5'

function ChannelDialog(props: {
  open: boolean
  channel: Channel | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  // The parent remounts this dialog per target (see `key` below), so a plain
  // initializer is enough to seed the form.
  const [form, setForm] = useState<ChannelForm>(() => toForm(props.channel))
  const [saving, setSaving] = useState(false)

  // Default Base URLs come from the backend so new channel types work
  // without a frontend change; a small local table keeps the common ones
  // usable while the request is in flight.
  const defaultsQuery = useQuery({
    queryKey: ['fde-channel-default-base-urls'],
    queryFn: getChannelDefaultBaseURLs,
    staleTime: 10 * 60_000,
  })

  function defaultBaseUrl(type: number): string {
    return (
      defaultsQuery.data?.[type] ?? TYPE_BASE_URL_HINTS[type] ?? ''
    )
  }

  function patch(next: Partial<ChannelForm>) {
    setForm((prev) => ({ ...prev, ...next }))
  }

  // Fill the Base URL for a fresh dialog once defaults arrive.
  useEffect(() => {
    if (props.channel || form.base_url.trim()) return
    const url = defaultBaseUrl(form.type)
    if (url) setForm((prev) => (prev.base_url ? prev : { ...prev, base_url: url }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultsQuery.data])

  function handleTypeChange(type: number) {
    const previousDefault = defaultBaseUrl(form.type)
    const nextDefault = defaultBaseUrl(type)
    const baseUrl =
      form.base_url.trim() && form.base_url.trim() !== previousDefault
        ? form.base_url
        : nextDefault
    patch({
      type,
      base_url: baseUrl,
      name: form.name.trim() ? form.name : channelTypeLabel(type),
    })
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.error('请填写渠道名称')
      return
    }
    setSaving(true)
    try {
      if (props.channel) {
        const payload: Partial<Channel> = {
          name: form.name.trim(),
          base_url: form.base_url.trim(),
          models: form.models.trim(),
          group: form.group.trim() || 'default',
          priority: Number(form.priority) || 0,
          weight: Number(form.weight) || 0,
          remark: form.remark,
        }
        // Never write a masked key back; only send it when edited.
        if (form.key !== props.channel.key) payload.key = form.key
        const res = await updateChannel(props.channel.id, payload)
        if (!res.success) throw new Error(res.message || '保存失败')
        toast.success('渠道已更新')
      } else {
        const res = await createChannel({
          mode: 'single',
          channel: {
            type: form.type,
            name: form.name.trim(),
            base_url: form.base_url.trim(),
            key: form.key,
            models: form.models.trim(),
            group: form.group.trim() || 'default',
            priority: Number(form.priority) || 0,
            weight: Number(form.weight) || 0,
            remark: form.remark,
            status: 1,
            auto_ban: 1,
          },
        })
        if (!res.success) throw new Error(res.message || '创建失败')
        toast.success('渠道已创建')
      }
      await queryClient.invalidateQueries({ queryKey: ['fde-channels'] })
      props.onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog onOpenChange={(open) => !open && props.onClose()} open={props.open}>
      <DialogContent className='sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle>{props.channel ? '编辑渠道' : '新建渠道'}</DialogTitle>
        </DialogHeader>
        <div className='grid gap-4 sm:grid-cols-2'>
          <div>
            <Label>类型</Label>
            {props.channel ? (
              <div className='mt-1.5 text-sm'>
                {channelTypeLabel(props.channel.type)}
              </div>
            ) : (
              <Select
                onValueChange={(value) => {
                  if (!value) return
                  handleTypeChange(Number(value))
                }}
                value={String(form.type)}
              >
                <SelectTrigger className={`${fieldClassName} w-full`}>
                  <span className='flex-1 text-left'>
                    {channelTypeLabel(form.type)}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {CHANNEL_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <Label>名称</Label>
            <Input
              className={fieldClassName}
              onChange={(event) => patch({ name: event.target.value })}
              placeholder='例如 local-ollama'
              value={form.name}
            />
          </div>
          <div className='sm:col-span-2'>
            <Label>Base URL</Label>
            <Input
              className={fieldClassName}
              onChange={(event) => patch({ base_url: event.target.value })}
              placeholder={
                TYPE_BASE_URL_HINTS[form.type] ?? 'https://upstream.example.com'
              }
              value={form.base_url}
            />
          </div>
          <div className='sm:col-span-2'>
            <Label>密钥</Label>
            <Input
              className={fieldClassName}
              onChange={(event) => patch({ key: event.target.value })}
              placeholder='上游 API Key（本地 Ollama 可留空）'
              value={form.key}
            />
          </div>
          <div className='sm:col-span-2'>
            <Label>模型列表</Label>
            <Input
              className={fieldClassName}
              onChange={(event) => patch({ models: event.target.value })}
              placeholder='逗号分隔，例如 qwen3.5-4b-64k,gpt-4o'
              value={form.models}
            />
          </div>
          <div>
            <Label>分组</Label>
            <Input
              className={fieldClassName}
              onChange={(event) => patch({ group: event.target.value })}
              value={form.group}
            />
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <div>
              <Label>优先级</Label>
              <Input
                className={fieldClassName}
                onChange={(event) => patch({ priority: event.target.value })}
                value={form.priority}
              />
            </div>
            <div>
              <Label>权重</Label>
              <Input
                className={fieldClassName}
                onChange={(event) => patch({ weight: event.target.value })}
                value={form.weight}
              />
            </div>
          </div>
          <div className='sm:col-span-2'>
            <Label>备注</Label>
            <Input
              className={fieldClassName}
              onChange={(event) => patch({ remark: event.target.value })}
              value={form.remark}
            />
          </div>
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

export function ChannelsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('all')
  const [searchDraft, setSearchDraft] = useState('')
  const [keyword, setKeyword] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Channel | null>(null)

  const listQuery = useQuery({
    queryKey: ['fde-channels', page, status, keyword],
    queryFn: () => {
      const statusParam = status === 'all' ? undefined : status
      return keyword
        ? searchChannels({
            keyword,
            p: page,
            page_size: PAGE_SIZE,
            status: statusParam,
          })
        : getChannels({ p: page, page_size: PAGE_SIZE, status: statusParam })
    },
  })

  const items = listQuery.data?.data?.items ?? []
  const total = listQuery.data?.data?.total ?? 0

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ['fde-channels'] })
  }

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(channel: Channel) {
    setEditing(channel)
    setDialogOpen(true)
  }

  async function handleToggle(channel: Channel) {
    try {
      const next = channel.status === 1 ? 2 : 1
      const res = await updateChannelStatus(channel.id, next)
      if (!res.success) throw new Error(res.message || '操作失败')
      toast.success(next === 1 ? '已启用' : '已禁用')
      refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败')
    }
  }

  async function handleTest(channel: Channel) {
    try {
      const model =
        channel.test_model ||
        channel.models.split(',').map((item) => item.trim())[0] ||
        undefined
      const res = await testChannel(channel.id, model ? { model } : undefined)
      if (res.success) toast.success(res.message || '测试通过')
      else toast.error(res.message || '测试失败')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '测试失败')
    }
  }

  async function handleDelete(channel: Channel) {
    if (!window.confirm(`确认删除渠道「${channel.name}」？此操作不可撤销。`)) {
      return
    }
    try {
      const res = await deleteChannel(channel.id)
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
        actions={<Button onClick={openCreate}>新建渠道</Button>}
        description='上游渠道的统一管理，启停、测试与编辑'
        title='渠道'
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
            placeholder='搜索名称 / 模型，回车确认'
            value={searchDraft}
          />
          <Select
            onValueChange={(value) => {
              if (!value) return
              setPage(1)
              setStatus(value)
            }}
            value={status}
          >
            <SelectTrigger className='h-8 w-32'>
              <span className='flex-1 text-left'>
                {STATUS_LABELS[status] ?? '全部状态'}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>全部状态</SelectItem>
              <SelectItem value='enabled'>已启用</SelectItem>
              <SelectItem value='disabled'>已禁用</SelectItem>
            </SelectContent>
          </Select>
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
                  <th className='px-4 py-2.5 font-medium'>ID</th>
                  <th className='px-4 py-2.5 font-medium'>名称</th>
                  <th className='px-4 py-2.5 font-medium'>类型</th>
                  <th className='px-4 py-2.5 font-medium'>状态</th>
                  <th className='px-4 py-2.5 font-medium'>模型</th>
                  <th className='px-4 py-2.5 font-medium'>分组</th>
                  <th className='px-4 py-2.5 text-right font-medium'>优先级</th>
                  <th className='px-4 py-2.5 text-right font-medium'>操作</th>
                </tr>
              </thead>
              <tbody>
                {listQuery.isLoading && (
                  <EmptyRow colSpan={8} text='加载中…' />
                )}
                {!listQuery.isLoading && items.length === 0 && (
                  <EmptyRow colSpan={8} text='还没有渠道，点击右上角新建' />
                )}
                {!listQuery.isLoading &&
                  items.length > 0 &&
                  items.map((channel) => {
                    const info = channelStatusInfo(channel.status)
                    return (
                      <tr
                        className='border-b border-border/40 last:border-0 hover:bg-muted/30'
                        key={channel.id}
                      >
                        <td className='px-4 py-2.5 text-xs tabular-nums text-muted-foreground'>
                          {channel.id}
                        </td>
                        <td className='max-w-40 truncate px-4 py-2.5'>
                          {channel.name}
                        </td>
                        <td className='px-4 py-2.5 text-xs text-muted-foreground'>
                          {channelTypeLabel(channel.type)}
                        </td>
                        <td className='px-4 py-2.5'>
                          <StatusDot {...info} />
                        </td>
                        <td
                          className='max-w-52 truncate px-4 py-2.5 text-xs text-muted-foreground'
                          title={channel.models}
                        >
                          {channel.models || '—'}
                        </td>
                        <td className='px-4 py-2.5 text-xs'>
                          {channel.group}
                        </td>
                        <td className='px-4 py-2.5 text-right text-xs tabular-nums'>
                          {channel.priority ?? 0}
                        </td>
                        <td className='px-4 py-2.5'>
                          <div className='flex justify-end gap-1 whitespace-nowrap'>
                            <Button
                              onClick={() => void handleTest(channel)}
                              size='sm'
                              variant='ghost'
                            >
                              测试
                            </Button>
                            <Button
                              onClick={() => void handleToggle(channel)}
                              size='sm'
                              variant='ghost'
                            >
                              {channel.status === 1 ? '禁用' : '启用'}
                            </Button>
                            <Button
                              onClick={() => openEdit(channel)}
                              size='sm'
                              variant='ghost'
                            >
                              编辑
                            </Button>
                            <Button
                              className='text-destructive'
                              onClick={() => void handleDelete(channel)}
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

      <ChannelDialog
        channel={editing}
        key={dialogOpen ? (editing?.id ?? 'new') : 'closed'}
        onClose={() => setDialogOpen(false)}
        open={dialogOpen}
      />
    </div>
  )
}