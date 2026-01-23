// routes/auth/register.js   or   routes/auth/signup.js

import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

router.post('/', async (req, res) => {
  const { email, password, full_name, phone } = req.body; // you can add more fields

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {                    // ← custom user metadata
          full_name: full_name || null,
          phone: phone || null,
        },
      },
    });

    if (error) {
      // Common errors
      if (error.message.includes('duplicate key')) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      return res.status(400).json({ error: error.message });
    }

    // Optional: You can check if email confirmation is required
    if (!data.session) {
      return res.status(200).json({
        message: 'User created successfully. Please check your email to verify.',
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
      });
    }

    // Rare case - auto-confirmed signup (if disabled confirmation)
    return res.status(201).json({
      message: 'Signup successful',
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
      session: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        expires_in: data.session?.expires_in,
      },
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;