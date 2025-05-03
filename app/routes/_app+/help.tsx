import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { Form, useLoaderData, data, redirect  } from 'react-router'
import { z } from 'zod'
import { Field, TextareaField } from '#app/components/forms'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '#app/components/ui/accordion'
import { Button } from '#app/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '#app/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#app/components/ui/tabs'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server'
import { type Route } from './+types/help'

export const FeedbackSchema = z.object({
  type: z.enum(['BUG', 'QUESTION', 'FEATURE']),
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
})

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireUserId(request)
  
  const faqs = await prisma.helpFAQ.findMany({
    where: { active: true },
    orderBy: [{ category: 'asc' }, { order: 'asc' }],
  })
  
  const userFeedback = await prisma.feedback.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
  
  // Group FAQs by category
  const faqsByCategory = faqs.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = []
    }
    acc[faq.category].push(faq)
    return acc
  }, {} as Record<string, typeof faqs>)
  
  return data({ faqsByCategory, userFeedback })
}

export async function action({ request }: Route.ActionArgs) {
  const userId = await requireUserId(request)
  const formData = await request.formData()
  
  const submission = parseWithZod(formData, {
    schema: FeedbackSchema,
  })
  
  if (submission.status !== 'success') {
    return data(
      { result: submission.reply() },
      { status: submission.status === 'error' ? 400 : 200 },
    )
  }
  
  const { type, title, description } = submission.value
  
  await prisma.feedback.create({
    data: {
      type,
      title,
      description,
      userId,
    },
  })
  
  return redirect('/help?tab=feedback')
}

export default function HelpPage() {
  const { faqsByCategory, userFeedback } = useLoaderData<typeof loader>()
  
  const [form, fields] = useForm({
    id: 'feedback-form',
    constraint: getZodConstraint(FeedbackSchema),
    defaultValue: {
      type: 'QUESTION',
      title: '',
      description: '',
    },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: FeedbackSchema })
    },
  })
  
  return (
    <div className="container py-8">
      <h1 className="mb-8 text-center text-3xl font-bold">Help Center</h1>
      
      <Tabs defaultValue="faq" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>
        
        <TabsContent value="faq" className="mt-6">
          {Object.entries(faqsByCategory).map(([category, faqs]) => (
            <div key={category} className="mb-8">
              <h2 className="mb-4 text-xl font-semibold">{category}</h2>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map(faq => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        {faq.answer}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </TabsContent>
        
        <TabsContent value="feedback" className="mt-6">
          <div className="grid gap-8 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Submit Feedback</CardTitle>
                <CardDescription>
                  Report bugs, ask questions, or request new features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form method="post" {...getFormProps(form)}>
                  <div className="space-y-4">
                    <Field
                      labelProps={{
                        children: 'Feedback Type',
                      }}
                      inputProps={{
                        ...getInputProps(fields.type, { type: 'select' }),
                      }}
                    >
                      <select
                        {...getInputProps(fields.type, { type: 'select' })}
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                      >
                        <option value="BUG">Bug Report</option>
                        <option value="QUESTION">Question</option>
                        <option value="FEATURE">Feature Request</option>
                      </select>
                    </Field>
                    
                    <Field
                      labelProps={{
                        htmlFor: fields.title.id,
                        children: 'Title',
                      }}
                      inputProps={{
                        ...getInputProps(fields.title, { type: 'text' }),
                        placeholder: 'Brief summary of your feedback',
                      }}
                      errors={fields.title.errors}
                    />
                    
                    <TextareaField
                      labelProps={{
                        htmlFor: fields.description.id,
                        children: 'Description',
                      }}
                      textareaProps={{
                        ...getInputProps(fields.description, { type: 'textarea' }),
                        placeholder: 'Please provide details...',
                        rows: 5,
                      }}
                      errors={fields.description.errors}
                    />
                  </div>
                  
                  <Button type="submit" className="mt-4 w-full">
                    Submit Feedback
                  </Button>
                </Form>
              </CardContent>
            </Card>
            
            <div>
              <h3 className="mb-4 text-lg font-medium">Your Previous Feedback</h3>
              {userFeedback.length > 0 ? (
                <div className="space-y-4">
                  {userFeedback.map(feedback => (
                    <Card key={feedback.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{feedback.title}</CardTitle>
                          <span className={`rounded-full px-2 py-1 text-xs ${
                            feedback.status === 'OPEN' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                            feedback.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                            feedback.status === 'IMPLEMENTED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                          }`}>
                            {feedback.status.replace('_', ' ')}
                          </span>
                        </div>
                        <CardDescription className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs ${
                            feedback.type === 'BUG' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                            feedback.type === 'FEATURE' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
                            'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                          }`}>
                            {feedback.type}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(feedback.createdAt).toLocaleDateString()}
                          </span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {feedback.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  You haven't submitted any feedback yet.
                </p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}