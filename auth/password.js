// routes/auth/password.js
import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

router.post('/forgot', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
    });

    if (error) throw error;
    return res.json({ message: 'Password reset email sent' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to send reset email' });
  }
});

router.post('/reset', async (req, res) => {
  const { token, new_password } = req.body;

  if (!token || !new_password) {
    return res.status(400).json({ error: 'Token and new password required' });
  }

  try {
    const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { error } = await client.auth.updateUser({ password: new_password });

    if (error) throw error;

    return res.json({ message: 'Password successfully reset' });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: 'Invalid or expired reset token' });
  }
});

export default router;