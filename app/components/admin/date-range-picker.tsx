import { format, subDays, subMonths, subYears, startOfDay, endOfDay } from 'date-fns'
// import { CalendarIcon, ChevronDownIcon } from 'lucide-react'
import { Button } from '#app/components/ui/button.tsx'
import {Icon} from '#app/components/ui/icon.tsx'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '#app/components/ui/dropdown-menu.tsx'
import { cn } from '#app/utils/misc.tsx'


type DateRangePickerProps = {
    startDate: Date
    endDate: Date
    onDateRangeChange: (start: Date, end: Date) => void
    className?: string
}

const DATE_RANGES = [
    {
        label: 'Last 24 Hours',
        getValue: () => [startOfDay(subDays(new Date(), 1)), endOfDay(new Date())]
    },
    {
        label: 'Last 7 Days',
        getValue: () => [startOfDay(subDays(new Date(), 6)), endOfDay(new Date())]
    },
    {
        label: 'Last 30 Days',
        getValue: () => [startOfDay(subDays(new Date(), 29)), endOfDay(new Date())]
    },
    {
        label: 'Last Month',
        getValue: () => [startOfDay(subMonths(new Date(), 1)), endOfDay(new Date())]
    },
    {
        label: 'Last Quarter',
        getValue: () => [startOfDay(subMonths(new Date(), 3)), endOfDay(new Date())]
    },
    {
        label: 'Last Year',
        getValue: () => [startOfDay(subYears(new Date(), 1)), endOfDay(new Date())]
    },
    {
        label: 'All Time',
        getValue: () => [startOfDay(new Date(2020, 0, 1)), endOfDay(new Date())]
    },
]

export function DateRangePicker({
                                    startDate,
                                    endDate,
                                    onDateRangeChange,
                                    className,
                                }: DateRangePickerProps) {
    const formatDateRange = (start: Date, end: Date) => {
        return `${format(start, "MMM d, yyyy")} - ${format(end, "MMM d, yyyy")}`
    }

    const handleSelectRange = (index: number) => {
        const [start, end] = DATE_RANGES[index].getValue()
        onDateRangeChange(start, end)
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className={cn("flex items-center gap-2 px-3 py-2", className)}>
                    <Icon name="calendar" size="sm"/>

                    <span className="hidden sm:inline">
            {formatDateRange(startDate, endDate)}
          </span>
                    <span className="sm:hidden">Date Range</span>
                    <Icon name="chevron-down" size="sm" opacity="50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                {DATE_RANGES.map((range, index) => (
                    <DropdownMenuItem
                        key={range.label}
                        onClick={() => handleSelectRange(index)}
                        className="cursor-pointer"
                    >
                        {range.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}