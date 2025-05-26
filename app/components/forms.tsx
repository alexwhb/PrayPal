import { type FieldMetadata, useInputControl, unstable_useControl } from '@conform-to/react'
import { REGEXP_ONLY_DIGITS_AND_CHARS, type OTPInputProps } from 'input-otp'
import React, { type ElementRef, useId, useRef } from 'react'
import { NumberInput } from '#app/components/ui/number-input.tsx'
import { Switch } from '#app/components/ui/switch.tsx'
import { useState } from 'react'
import { Checkbox, type CheckboxProps } from './ui/checkbox.tsx'
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSeparator,
	InputOTPSlot,
} from './ui/input-otp.tsx'
import { Input } from './ui/input.tsx'
import { Label } from './ui/label.tsx'
import { Textarea } from './ui/textarea.tsx'

export type ListOfErrors = Array<string | null | undefined> | null | undefined

export function ErrorList({
	id,
	errors,
}: {
	errors?: ListOfErrors
	id?: string
}) {
	const errorsToRender = errors?.filter(Boolean)
	if (!errorsToRender?.length) return null
	return (
		<ul id={id} className="flex flex-col gap-1">
			{errorsToRender.map((e) => (
				<li key={e} className="text-foreground-destructive text-[10px]">
					{e}
				</li>
			))}
		</ul>
	)
}

export function Field({
	labelProps,
	inputProps,
	errors,
	className,
}: {
	labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
	inputProps: React.InputHTMLAttributes<HTMLInputElement>
	errors?: ListOfErrors
	className?: string
}) {
	const fallbackId = useId()
	const id = inputProps.id ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined
	return (
		<div className={className}>
			<Label htmlFor={id} {...labelProps} />
			<Input
				id={id}
				aria-invalid={errorId ? true : undefined}
				aria-describedby={errorId}
				{...inputProps}
			/>
			<div className="min-h-[32px] px-4 pt-1 pb-3">
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}

export function OTPField({
	labelProps,
	inputProps,
	errors,
	className,
}: {
	labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
	inputProps: Partial<OTPInputProps & { render: never }>
	errors?: ListOfErrors
	className?: string
}) {
	const fallbackId = useId()
	const id = inputProps.id ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined
	return (
		<div className={className}>
			<Label htmlFor={id} {...labelProps} />
			<InputOTP
				pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
				maxLength={6}
				id={id}
				aria-invalid={errorId ? true : undefined}
				aria-describedby={errorId}
				{...inputProps}
			>
				<InputOTPGroup>
					<InputOTPSlot index={0} />
					<InputOTPSlot index={1} />
					<InputOTPSlot index={2} />
				</InputOTPGroup>
				<InputOTPSeparator />
				<InputOTPGroup>
					<InputOTPSlot index={3} />
					<InputOTPSlot index={4} />
					<InputOTPSlot index={5} />
				</InputOTPGroup>
			</InputOTP>
			<div className="min-h-[32px] px-4 pt-1 pb-3">
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}

export function TextareaField({
	labelProps,
	textareaProps,
	errors,
	className,
}: {
	labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
	textareaProps: React.TextareaHTMLAttributes<HTMLTextAreaElement>
	errors?: ListOfErrors
	className?: string
}) {
	const fallbackId = useId()
	const id = textareaProps.id ?? textareaProps.name ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined
	return (
		<div className={className}>
			<Label htmlFor={id} {...labelProps} />
			<Textarea
				id={id}
				aria-invalid={errorId ? true : undefined}
				aria-describedby={errorId}
				{...textareaProps}
			/>
			<div className="min-h-[32px] px-4 pt-1 pb-3">
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}

export function CheckboxField({
	labelProps,
	buttonProps,
	errors,
	className,
}: {
	labelProps: React.ComponentProps<'label'>
	buttonProps: CheckboxProps & {
		name: string
		form: string
		value?: string
	}
	errors?: ListOfErrors
	className?: string
}) {
	const { key, defaultChecked, ...checkboxProps } = buttonProps
	const fallbackId = useId()
	const checkedValue = buttonProps.value ?? 'on'
	const input = useInputControl({
		key,
		name: buttonProps.name,
		formId: buttonProps.form,
		initialValue: defaultChecked ? checkedValue : undefined,
	})
	const id = buttonProps.id ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined

	return (
		<div className={className}>
			<div className="flex gap-2">
				<Checkbox
					{...checkboxProps}
					id={id}
					aria-invalid={errorId ? true : undefined}
					aria-describedby={errorId}
					checked={input.value === checkedValue}
					onCheckedChange={(state) => {
						input.change(state.valueOf() ? checkedValue : '')
						buttonProps.onCheckedChange?.(state)
					}}
					onFocus={(event) => {
						input.focus()
						buttonProps.onFocus?.(event)
					}}
					onBlur={(event) => {
						input.blur()
						buttonProps.onBlur?.(event)
					}}
					type="button"
				/>
				<label
					htmlFor={id}
					{...labelProps}
					className="text-body-xs text-muted-foreground self-center"
				/>
			</div>
			<div className="px-4 pt-1 pb-3">
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}

export function NumberField({
															labelProps,
															inputProps,
															value,
															onChange,
															errors,
															className,
															min,
															max,
															step,
															controls = true,
															// Add these new props for Conform compatibility
															name,
															defaultValue,
														}: {
	labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
	inputProps?: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type' | 'min' | 'max' | 'step'>
	value?: number | null
	onChange?: (value: number | null) => void
	min?: number
	max?: number
	step?: number
	controls?: boolean
	errors?: ListOfErrors
	className?: string
	// New props for Conform compatibility
	name?: string
	defaultValue?: string | number
}) {
	const fallbackId = useId()
	const id = inputProps?.id ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined

	// Handle both controlled (value/onChange) and uncontrolled (name/defaultValue) modes
	const isControlled = value !== undefined && onChange !== undefined
	const initialValue = isControlled
		? value
		: (defaultValue ? Number(defaultValue) : null)

	const [internalValue, setInternalValue] = useState<number | null>(initialValue)

	const currentValue = isControlled ? value : internalValue
	const handleChange = isControlled ? onChange : setInternalValue

	return (
		<div className={className}>
			<Label htmlFor={id} {...labelProps} />
			<NumberInput
				id={id}
				value={currentValue}
				onChange={handleChange}
				min={min}
				max={max}
				step={step}
				controls={controls}
				aria-invalid={errorId ? true : undefined}
				aria-describedby={errorId}
				{...inputProps}
				// Pass through the name for form submission
				name={name}
			/>
			<div className="min-h-[12px] px-4 pb-3 pt-1">
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}

export function SwitchConform({ meta }: { meta: FieldMetadata<boolean> }) {
	const switchRef = useRef<ElementRef<typeof Switch>>(null);
	const control = unstable_useControl(meta);

	return (
		<>
			<input
				name={meta.name}
				ref={control.register}
				defaultValue={meta.initialValue}
				className="sr-only"
				tabIndex={-1}
				onFocus={() => {
					switchRef.current?.focus();
				}}
			/>
			<Switch
				ref={switchRef}
				checked={control.value === 'on'}
				onCheckedChange={(checked) => {
					control.change(checked ? 'on' : '');
				}}
				onBlur={control.blur}
				className="focus:ring-stone-950 focus:ring-2 focus:ring-offset-2"
			></Switch>
		</>
	);
}