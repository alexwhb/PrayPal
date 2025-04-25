

import { Form } from 'react-router'
import { TextareaField } from '#app/components/forms'
import { Button } from '#app/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '#app/components/ui/dialog'

type DeleteDialogProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
	additionalFormData?: Record<string, string>
	isModerator?: boolean
	title?: string
	description?: string
	confirmLabel?: string
}

export function DeleteDialog({
	open,
	onOpenChange,
	additionalFormData,
	isModerator = false,
	title = 'Confirm Delete',
	description = 'Are you sure you want to delete this item? This action cannot be undone.',
	confirmLabel = 'Delete',
}: DeleteDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<Form method="post">
					{Object.entries(additionalFormData ?? {}).map(([key, value]) => (
						<input
							key={key}
							type="hidden"
							name={key}
							value={value}
						/>
					))}
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
						<DialogDescription>{description}</DialogDescription>
					</DialogHeader>

					{isModerator && (
						<div className="py-4">
							<TextareaField
								labelProps={{
									children: 'Reason for action',
								}}
								textareaProps={{
									name: 'reason',
									placeholder: 'Please provide a reason for this action',
									required: true,
								}}
							/>
						</div>
					)}

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => onOpenChange(false)}
							type="button"
						>
							Cancel
						</Button>
						<Button
							variant={confirmLabel.toLowerCase().includes('delete') ? 'destructive' : 'default'}
							type="submit"
						>
							{confirmLabel}
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
