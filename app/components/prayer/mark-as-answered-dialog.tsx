import { z } from 'zod'
import { useMemo } from 'react'
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '#app/components/ui/dialog.tsx'
import { Form } from 'react-router'
import { TextareaField } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'

export const AnsweredPrayerSchema = z.object({
	testimony: z.string().max(500),
})

export default function MarkAsAnsweredDialog({
																actionData,
																open = false,
																onOpenChange,
																prayerId
															}: {
	actionData: any
	open: boolean
	onOpenChange: (open: boolean) => void
	prayerId: string
}) {
	const defaultValues = useMemo(
		() => ({
			id: 'new-prayer',
			testimony: '',
		}),
		[],
	)

	const [form, fields] = useForm({
		id: 'prayer-response',
		constraint: getZodConstraint(AnsweredPrayerSchema),
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: AnsweredPrayerSchema })
		},
		lastResult: actionData?.result,
		defaultValue: defaultValues,
		shouldRevalidate: 'onBlur',
	})

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Share Your Testimony</DialogTitle>
					<DialogDescription>
						Share how this prayer was answered to encourage others in the
						community. Note: this is entirely optional.
						Feel free to leave this blank.
					</DialogDescription>
				</DialogHeader>
				<Form method="post" {...getFormProps(form)} onSubmit={() => onOpenChange(false)}>
					<input type="hidden" name="_action" value="markAsAnswered" />
					<input type="hidden" name="prayerId" value={prayerId} />
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<TextareaField
								labelProps={{
									htmlFor: 'testimony',
									children: 'How was your prayer answered?',
								}}
								textareaProps={{
									...getInputProps(fields.testimony, { type: 'text' }),
									maxLength: 500, // Set maximum characters allowed
								}}
								errors={fields?.testimony?.errors}
								className="relative"
							>
								<div className="absolute bottom-4 right-4 text-xs text-muted-foreground">
									{fields.testimony.value?.length ?? 0} / 500
								</div>
							</TextareaField>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit">Share Testimony</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	)
}