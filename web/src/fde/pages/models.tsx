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
  Panel,
} from '@/fde/components/bits'
import { getPricing } from '@/features/pricing/api'

export function ModelsPage() {
  const [keyword, setKeyword] = useState('')

  const pricingQuery = useQuery({
    queryKey: ['fde-pricing'],
    queryFn: getPricing,
    staleTime: 60_000,
  })

  const vendorNames = new Map(
    (pricingQuery.data?.vendors ?? []).map((vendor) => [vendor.id, vendor.name])
  )
  const models = pricingQuery.data?.data ?? []
  const filtered = keyword
    ? models.filter((model) =>
        model.model_name.toLowerCase().includes(keyword.toLowerCase())
      )
    : models

  return (
    <div className='space-y-4'>
      <PageHeader
        description='模型计费配置的只读视图，编辑请使用经典版'
        title='模型定价'
      />

      <Panel>
        <div className='flex items-center gap-2 border-b border-border/60 px-4 py-3'>
          <Input
            className='h-8 w-64'
            onChange={(event) => setKeyword(event.target.value)}
            placeholder='按模型名筛选'
            value={keyword}
          />
          <span className='text-xs text-muted-foreground'>
            {filtered.length} / {models.length} 个模型
          </span>
        </div>

        {pricingQuery.isError ? (
          <div className='p-4'>
            <ErrorNotice />
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b border-border/60 text-left text-xs text-muted-foreground'>
                  <th className='px-4 py-2.5 font-medium'>模型</th>
                  <th className='px-4 py-2.5 font-medium'>供应商</th>
                  <th className='px-4 py-2.5 font-medium'>计费方式</th>
                  <th className='px-4 py-2.5 text-right font-medium'>
                    输入倍率
                  </th>
                  <th className='px-4 py-2.5 text-right font-medium'>
                    补全倍率
                  </th>
                  <th className='px-4 py-2.5 text-right font-medium'>单价</th>
                  <th className='px-4 py-2.5 font-medium'>可用分组</th>
                </tr>
              </thead>
              <tbody>
                {pricingQuery.isLoading && (
                  <EmptyRow colSpan={7} text='加载中…' />
                )}
                {!pricingQuery.isLoading && filtered.length === 0 && (
                  <EmptyRow colSpan={7} />
                )}
                {!pricingQuery.isLoading &&
                  filtered.length > 0 &&
                  filtered.map((model) => (
                    <tr
                      className='border-b border-border/40 last:border-0 hover:bg-muted/30'
                      key={model.id}
                    >
                      <td className='px-4 py-2.5 font-mono text-xs'>
                        {model.model_name}
                      </td>
                      <td className='px-4 py-2.5 text-xs text-muted-foreground'>
                        {(model.vendor_id
                          ? vendorNames.get(model.vendor_id)
                          : undefined) ??
                          model.vendor_name ??
                          '—'}
                      </td>
                      <td className='px-4 py-2.5 text-xs'>
                        {model.quota_type === 1 ? '按次' : '按量'}
                      </td>
                      <td className='px-4 py-2.5 text-right text-xs tabular-nums'>
                        {model.model_ratio}×
                      </td>
                      <td className='px-4 py-2.5 text-right text-xs tabular-nums'>
                        {model.completion_ratio}×
                      </td>
                      <td className='px-4 py-2.5 text-right text-xs tabular-nums'>
                        {model.quota_type === 1
                          ? `$${(model.model_price ?? 0).toFixed(4)}`
                          : '—'}
                      </td>
                      <td className='max-w-48 truncate px-4 py-2.5 text-xs text-muted-foreground'>
                        {model.enable_groups?.join(', ') || '—'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}