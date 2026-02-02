import { z } from 'zod';
import { requiredString, emailSchema, dateSchema } from '@shared/forms/schemas/common';

export const genderEnum = z.enum(['male', 'female', 'other']);

export const workerFormSchema = z
  .object({
    nameSurname: requiredString(2),
    idNumber: requiredString(1),
    email: emailSchema,
    mobileNo: z.string().optional(),
    workNo: z.string().optional(),
    employmentStartDate: dateSchema.optional(),
    employmentEndDate: dateSchema.optional(),
    dateOfBirth: dateSchema.optional(),
    gender: genderEnum.optional(),
    visaDate: dateSchema.optional(),
    jobTitle: z.string().optional(),
    companyId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.employmentStartDate || !data.employmentEndDate) return true;
      return data.employmentStartDate <= data.employmentEndDate;
    },
    { message: 'Employment end date must be after start date', path: ['employmentEndDate'] }
  );

export type WorkerFormValues = z.infer<typeof workerFormSchema>;
