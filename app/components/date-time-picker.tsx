
import { format } from "date-fns";
import React from 'react'
import { ScrollArea, ScrollBar } from '#app/components/ui/scroll-area.tsx'
import { cn } from '#app/utils/misc.tsx'
import { Button } from './ui/button'
import { Calendar } from './ui/calendar'
import { Icon } from './ui/icon'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'


export function DateTimePicker({ date, setDate }: { date: Date; setDate: (date: Date) => void }) {
	// const [date, setDate] = React.useState<Date>();
	const [isOpen, setIsOpen] = React.useState(false);

	const hours = Array.from({ length: 12 }, (_, i) => i + 1);
	const handleDateSelect = (selectedDate: Date | undefined) => {
		if (selectedDate) {
			setDate(selectedDate);
		}
	};

	const handleTimeChange = (
		type: "hour" | "minute" | "ampm",
		value: string
	) => {
		if (date) {
			const newDate = new Date(date);
			if (type === "hour") {
				newDate.setHours(
					(parseInt(value) % 12) + (newDate.getHours() >= 12 ? 12 : 0)
				);
			} else if (type === "minute") {
				newDate.setMinutes(parseInt(value));
			} else if (type === "ampm") {
				const currentHours = newDate.getHours();
				newDate.setHours(
					value === "PM" ? currentHours + 12 : currentHours - 12
				);
			}
			setDate(newDate);
		}
	};

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className={cn(
						"w-full justify-start text-left font-normal",
						!date && "text-muted-foreground"
					)}
				>
					<Icon name="calendar" className="mr-2" size="sm" />
					{date ? (
						format(date, "MM/dd/yyyy hh:mm aa")
					) : (
						<span>MM/DD/YYYY hh:mm aa</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0">
				<div className="sm:flex">
					<Calendar
						mode="single"
						selected={date}
						fromDate={new Date()}
						onSelect={handleDateSelect}
						initialFocus
					/>
					<div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
						<ScrollArea className="w-64 sm:w-auto">
							<div className="flex sm:flex-col p-2">
								{hours.reverse().map((hour) => (
									<Button
										key={hour}
										size="icon"
										variant={
											date && date.getHours() % 12 === hour % 12
												? "default"
												: "ghost"
										}
										className="sm:w-full shrink-0 aspect-square"
										onClick={() => handleTimeChange("hour", hour.toString())}
									>
										{hour}
									</Button>
								))}
							</div>
							<ScrollBar orientation="horizontal" className="sm:hidden" />
						</ScrollArea>
						<ScrollArea className="w-64 sm:w-auto">
							<div className="flex sm:flex-col p-2">
								{Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
									<Button
										key={minute}
										size="icon"
										variant={
											date && date.getMinutes() === minute
												? "default"
												: "ghost"
										}
										className="sm:w-full shrink-0 aspect-square"
										onClick={() =>
											handleTimeChange("minute", minute.toString())
										}
									>
										{minute}
									</Button>
								))}
							</div>
							<ScrollBar orientation="horizontal" className="sm:hidden" />
						</ScrollArea>
						<ScrollArea className="">
							<div className="flex sm:flex-col p-2">
								{["AM", "PM"].map((ampm) => (
									<Button
										key={ampm}
										size="icon"
										variant={
											date &&
											((ampm === "AM" && date.getHours() < 12) ||
												(ampm === "PM" && date.getHours() >= 12))
												? "default"
												: "ghost"
										}
										className="sm:w-full shrink-0 aspect-square"
										onClick={() => handleTimeChange("ampm", ampm)}
									>
										{ampm}
									</Button>
								))}
							</div>
						</ScrollArea>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}