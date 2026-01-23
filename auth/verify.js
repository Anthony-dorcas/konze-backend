// routes/auth/verify.js
import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  const { token, type } = req.query;

  if (type !== 'signup' || !token) {
    return res.status(400).json({ error: 'Invalid verification request' });
  }

  // Most common: redirect to frontend
  const frontendUrl = `${process.env.FRONTEND_URL}/verify-success?token=${token}`;
  return res.redirect(frontendUrl);
});

export default router;