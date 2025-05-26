import { Form } from 'react-router'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '#app/components/ui/alert-dialog.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'

export default function DeleteDialog({
	displayTriggerButton = true,
	open = false,
	onOpenChange = () => {},
	additionalFormData = {},
}: {
	displayTriggerButton?: boolean
	open: boolean
	onOpenChange: (open: boolean) => void
	additionalFormData?: Record<string, string>
}) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			{displayTriggerButton && (
				<AlertDialogTrigger asChild>
					<Button variant="destructive">
						<Icon name="trash" />
					</Button>
				</AlertDialogTrigger>
			)}
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
					<AlertDialogDescription>
						This action cannot be undone. Are you sure you want to delete this?
					</AlertDialogDescription>
				</AlertDialogHeader>
				<Form method="post">
					<input type="hidden" name="_action" value="delete" />
					{Object.entries(additionalFormData).map(([name, value]) => (
						<input key={name} type="hidden" name={name} value={value} />
					))}
					<AlertDialogFooter>
						<AlertDialogCancel asChild>
							<Button variant="outline">Cancel</Button>
						</AlertDialogCancel>
						<AlertDialogAction type="submit">Delete</AlertDialogAction>
					</AlertDialogFooter>
				</Form>
			</AlertDialogContent>
		</AlertDialog>
	)
}
