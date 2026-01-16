// routes/auth/index.js
import { Router } from 'express';

import loginRouter from './login.js';
import passwordRouter from './password.js';
import verifyRouter from './verify.js';
import googleRouter from './google.js';

const router = Router();

// You can decide on prefix style:
// Option A: everything under /auth
router.use('/login', loginRouter);
router.use('/password', passwordRouter);
router.use('/verify', verifyRouter);
router.use('/google', googleRouter);

// Option B: some people prefer flatter structure
// router.post('/login', ...from login.js)
// router.post('/forgot-password', ...)
// etc.

export default router;