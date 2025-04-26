import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '#app/components/ui/button'

export function CTASection() {
    return (
        <section className="bg-primary py-16 text-primary-foreground md:py-24">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                            Join Our Community Today
                        </h2>
                        <p className="mx-auto max-w-[700px]">
                            Be part of a movement that's bringing neighbors together to
                            create stronger, more connected communities.
                        </p>
                    </div>
                    <div className="flex flex-col gap-4 sm:flex-row">
                        <Link to="/signup" prefetch="intent">
                            <Button variant="secondary" size="lg">
                                Sign Up Now <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                        <Link to="/login" prefetch="intent">
                            <Button variant="outline" size="lg">
                                Log In
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    )
}