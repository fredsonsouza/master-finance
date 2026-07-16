'use client'

import { Input } from '@/components/ui/input'
import { ptBR } from 'date-fns/locale'
import dayjs from 'dayjs'
import { Calendar } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { DayPicker } from 'react-day-picker'

interface DatePickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  outputFormat?: 'YYYY-MM-DD' | 'DD/MM/YYYY'
  className?: string
  required?: boolean
  disabled?: boolean
  name?: string
  id?: string
}

export function DatePicker({
  value = '',
  onChange,
  placeholder = 'dd/mm/aaaa',
  outputFormat = 'YYYY-MM-DD',
  className = '',
  required = false,
  disabled = false,
  name,
  id,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Parse input value (could be YYYY-MM-DD or DD/MM/YYYY)
  const parseValue = (val: string): Date | undefined => {
    if (!val) return undefined
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      const d = dayjs(val)
      return d.isValid() ? d.toDate() : undefined
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
      const [dd, mm, yyyy] = val.split('/')
      const d = dayjs(`${yyyy}-${mm}-${dd}`)
      return d.isValid() ? d.toDate() : undefined
    }
    const d = dayjs(val)
    return d.isValid() ? d.toDate() : undefined
  }

  const selectedDate = parseValue(value)

  // Display value in input is always DD/MM/YYYY
  const displayValue = selectedDate
    ? dayjs(selectedDate).format('DD/MM/YYYY')
    : ''

  const handleSelect = (date: Date | undefined) => {
    setIsOpen(false)
    if (!onChange) return

    if (!date) {
      onChange('')
      return
    }

    const formatted = dayjs(date).format(outputFormat)
    onChange(formatted)
  }

  // Handle click outside to close popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      <div className="relative">
        <Input
          id={id}
          type="text"
          placeholder={placeholder}
          value={displayValue}
          readOnly
          required={required}
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className="cursor-pointer pr-10"
        />
        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant pointer-events-none" />
      </div>

      {/* Hidden input to submit formatted value if inside a standard HTML form */}
      {name && <input type="hidden" name={name} value={value} />}

      {isOpen && (
        <div className="absolute z-50 mt-1 rounded-lg border border-surface-container bg-surface-container-lowest p-3 shadow-lg left-0 top-full">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            locale={ptBR}
          />
        </div>
      )}
    </div>
  )
}
