import { z } from 'zod';

export const requiredString = (min = 1) =>
  z.string().min(min, 'This field is required');

export const optionalString = z.string().optional();

export const emailSchema = z.string().email('Invalid email');

export const dateSchema = z.coerce.date();

export const dateRangeSchema = z
  .object({
    from: dateSchema,
    to: dateSchema,
  })
  .refine((data) => data.from <= data.to, {
    message: 'End date must be after start date',
    path: ['to'],
  });

export const idSchema = z.string().uuid().optional().or(z.literal(''));

export type DateRange = z.infer<typeof dateRangeSchema>;
