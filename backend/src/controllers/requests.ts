import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const createRequestSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  subject: z.string().min(1).max(300),
  message: z.string().min(10).max(5000),
  type: z.enum(['general', 'movie_request', 'feedback']).optional(),
});

export async function createRequest(req: Request, res: Response) {
  try {
    const body = createRequestSchema.parse(req.body);

    const userRequest = await prisma.userRequest.create({
      data: {
        name: body.name,
        email: body.email,
        subject: body.subject,
        message: body.message,
        type: body.type ?? 'general',
      },
    });

    res.status(201).json({ success: true, data: { id: userRequest.id }, message: 'Request submitted successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message,
      });
    }
    throw error;
  }
}
