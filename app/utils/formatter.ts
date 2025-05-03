import { format, formatDistanceToNow as fDistanceToNow } from 'date-fns'

export function formatDate(date: string | Date) {
	return format(new Date(date), 'MMM d, yyyy')
}

export function formatTime(date: string | Date) {
	return format(new Date(date), 'h:mm a')
}

export function formatDateTime(date: string | Date) {
	return format(new Date(date), 'MMM d, yyyy h:mm a')
}

export function formatDistanceToNow(date: string | Date) {
	return fDistanceToNow(new Date(date), { addSuffix: true })
}