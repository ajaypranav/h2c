import { z } from "zod";

export const cardSubmitSchema = z.object({
  cardId: z.string().uuid(),
  rating: z.number().int().min(0).max(5),
  responseTimeMs: z.number().int().positive().optional(),
});

export const cardCreateSchema = z.object({
  front: z.string().min(1, "Question is required").max(1000),
  back: z.string().min(1, "Answer is required").max(2000),
  hint: z.string().max(500).optional(),
  card_type: z.enum(["basic", "cloze", "mcq"]).default("basic"),
  mcq_options: z
    .array(
      z.object({
        text: z.string(),
        isCorrect: z.boolean(),
      })
    )
    .optional(),
});

export type CardSubmitInput = z.infer<typeof cardSubmitSchema>;
export type CardCreateInput = z.infer<typeof cardCreateSchema>;
