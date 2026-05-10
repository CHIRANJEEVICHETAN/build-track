import { z } from 'zod'

const nonNegativeNumberString = z.union([z.string(), z.number()]).transform(v => Number(v || 0)).refine(v => v >= 0, 'Must be non-negative')

export const expenseSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  phase: z.string().min(1, 'Phase is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  amount: nonNegativeNumberString,
  gst: nonNegativeNumberString,
  status: z.string().min(1),
})

export const timelineSchema = z.object({
  phase: z.string().min(1),
  plannedStart: z.string().optional(),
  plannedEnd: z.string().optional(),
  actualStart: z.string().optional(),
  actualEnd: z.string().optional(),
  status: z.string().min(1),
})

export const projectSchema = z.object({
  name: z.string().min(1),
  plannedBudget: nonNegativeNumberString,
  emergencyBuffer: nonNegativeNumberString,
})

export function validateOrThrow(schema, payload) {
  const parsed = schema.safeParse(payload)
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map(i => i.message).join(', '))
  }
  return parsed.data
}

