import { z } from 'zod';
import { requiredString, emailSchema } from '@shared/forms/schemas/common';

export const customerGenderEnum = z.enum(['male', 'female']);

const tcIdNoSchema = z
  .string()
  .length(11, 'TC ID No must be exactly 11 digits')
  .regex(/^\d+$/, 'TC ID No must contain only digits');

export const customerFormSchema = z.object({
  nameSurname: requiredString(2),
  email: emailSchema,
  tcIdNo: tcIdNoSchema,
  gender: customerGenderEnum,
  companyId: requiredString(1),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;
