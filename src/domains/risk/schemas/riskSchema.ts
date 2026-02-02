import { z } from 'zod';
import { requiredString, dateSchema } from '@shared/forms/schemas/common';

export const riskSeverityEnum = z.enum(['Low', 'Medium', 'High', 'Critical']);
export const riskStatusEnum = z.enum(['Open', 'InProgress', 'Closed']);

export const riskFormSchema = z.object({
  title: requiredString(2),
  description: z.string().optional(),
  severity: riskSeverityEnum,
  status: riskStatusEnum.default('Open'),
  dueDate: dateSchema.optional(),
  mitigation: z.string().optional(),
});

export type RiskFormValues = z.infer<typeof riskFormSchema>;
