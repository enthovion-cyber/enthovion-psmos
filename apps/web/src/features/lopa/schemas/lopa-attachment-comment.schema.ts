import { z } from 'zod'; export const lopaAttachmentCommentSchema=z.object({commentText:z.string().trim().min(1),commentType:z.string().optional(),status:z.string().optional()});
