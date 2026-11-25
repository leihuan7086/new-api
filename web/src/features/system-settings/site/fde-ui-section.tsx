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
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { Switch } from '@/components/ui/switch'
import { isFdeUiEnabled, setFdeUiEnabled } from '@/fde/lib/ui-mode'

import { SettingsSection } from '../components/settings-section'

/**
 * Opt-in switch for the rebuilt FDE console.
 *
 * The flag is stored in localStorage (no backend changes), so it only
 * affects the browser it is flipped in. Turning it on immediately jumps
 * to /fde; turning it off leaves the classic UI untouched.
 */
export function FdeUiSection() {
  const navigate = useNavigate()
  const [enabled, setEnabled] = useState(() => isFdeUiEnabled())

  function handleChange(checked: boolean) {
    setFdeUiEnabled(checked)
    setEnabled(checked)
    if (checked) {
      toast.success('已切换到新版界面')
      void navigate({ to: '/fde' })
    } else {
      toast.success('已回到经典版界面')
    }
  }

  return (
    <SettingsSection title='新版界面（FDE API）'>
      <div className='rounded-lg border border-border/70 p-5'>
        <div className='flex items-start justify-between gap-6'>
          <div>
            <div className='text-sm font-medium'>启用新版控制台</div>
            <p className='mt-1 max-w-xl text-xs text-muted-foreground'>
              极简风格，只保留网关转发核心功能（渠道 / 令牌 / 日志 /
              模型定价 / 用户）。开关保存在当前浏览器，可随时切回经典版；不影响后端与数据。
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={handleChange} />
        </div>
      </div>
    </SettingsSection>
  )
}