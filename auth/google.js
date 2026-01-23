// routes/auth/google.js
import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.FRONTEND_URL}/auth/callback`,
      },
    });

    if (error) throw error;
    return res.redirect(data.url);
  } catch (err) {
    console.error('Google OAuth init error:', err);
    return res.status(500).json({ error: 'Failed to initialize Google login' });
  }
});

router.get('/callback', (req, res) => {
  // Usually just redirect — session handling on frontend
  return res.redirect(`${process.env.FRONTEND_URL}/dashboard?login=success`);
});

export default router;