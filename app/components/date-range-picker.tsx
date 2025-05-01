import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '#app/components/ui/button.tsx'
import { Calendar } from '#app/components/ui/calendar.tsx'
import { Popover, PopoverContent, PopoverTrigger } from '#app/components/ui/popover.tsx'
import { cn } from '#app/utils/misc.tsx'

type DateRangePickerProps = {
	startDate: Date
	endDate: Date
	onDateRangeChange: (startDate: Date, endDate: Date) => void
}

export function DateRangePicker({ startDate, endDate, onDateRangeChange }: