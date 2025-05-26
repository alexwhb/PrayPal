
import confetti from "canvas-confetti"
import { useEffect, useState } from "react"

interface ConfettiCelebrationProps {
	duration?: number
	onComplete?: () => void
}

export function ConfettiCelebration({ duration = 3000, onComplete }: ConfettiCelebrationProps) {
	const [isActive, setIsActive] = useState(true)

	useEffect(() => {
		if (!isActive) return

		// Create confetti burst
		const end = Date.now() + duration
		const colors = ["#5D8C7B", "#F2D091", "#F2A679", "#D9695F", "#8C5D7B"]

		const frame = () => {
			confetti({
				particleCount: 2,
				angle: 60,
				spread: 55,
				origin: { x: 0 },
				colors,
			})
			confetti({
				particleCount: 2,
				angle: 120,
				spread: 55,
				origin: { x: 1 },
				colors,
			})

			if (Date.now() < end) {
				requestAnimationFrame(frame)
			} else {
				setIsActive(false)
				onComplete?.()
			}
		}

		frame()

		// Initial bursts
		confetti({
			particleCount: 100,
			spread: 70,
			origin: { y: 0.6 },
			colors,
		})

		return () => {
			setIsActive(false)
		}
	}, [duration, isActive, onComplete])

	return null
}
