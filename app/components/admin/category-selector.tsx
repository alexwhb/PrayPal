import { Button } from '#app/components/ui/button.tsx'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '#app/components/ui/dropdown-menu.tsx'
import { cn } from '#app/utils/misc.tsx'
import {Icon} from '#app/components/ui/icon.tsx'


type CategorySelectorProps = {
    value: string
    onChange: (value: string) => void
    className?: string
}

const CATEGORIES = [
    { value: 'all', label: 'All Categories' },
    { value: 'prayer', label: 'Prayer' },
    { value: 'need', label: 'Need' },
    { value: 'share', label: 'Share' },
]

export function CategorySelector({ value, onChange, className }: CategorySelectorProps) {
    const selectedCategory = CATEGORIES.find(cat => cat.value === value) || CATEGORIES[0]

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className={cn("flex items-center gap-2 px-3 py-2", className)}>
                    <span>{selectedCategory.label}</span>
                    <Icon name="chevron-down" size="sm" opacity="50"/>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
                {CATEGORIES.map((category) => (
                    <DropdownMenuItem
                        key={category.value}
                        onClick={() => onChange(category.value)}
                        className="cursor-pointer"
                    >
                        {category.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}