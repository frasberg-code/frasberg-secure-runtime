// Documentation Routes
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { generateDoc, getAllDocs, updateDocSection } from '../services/docs';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.get(
  '/section/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const content = await generateDoc(req.params.id);
    res.type('text/markdown').send(content);
  })
);

router.get(
  '/all',
  requireAuth,
  asyncHandler(async (req, res) => {
    const docs = await getAllDocs();
    res.json(docs);
  })
);

router.post(
  '/section/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const updated = await updateDocSection(req.params.id, req.body.content);
    res.json(updated);
  })
);

export default router;
