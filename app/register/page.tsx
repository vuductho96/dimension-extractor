'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [pass,    setPass]    = useState('');
  const [pass2,   setPass2]   = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (pass !== pass2) { setError('Mật khẩu xác nhận không khớp.'); return; }
    if (pass.length < 6) { setError('Mật khẩu phải có ít nhất 6 ký tự.'); return; }

    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signUp({
      email,
      password: pass,
      options: { data: { full_name: name } },
    });

    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      // Supabase may require email confirmation — redirect to dashboard anyway
      // (middleware handles unauthenticated state)
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link href="/" className="auth-brand">
          <span style={{ color: '#1550ff', fontSize: 28, fontWeight: 800 }}>D</span>
          Dimension Extractor
        </Link>

        <h1>Tạo tài khoản</h1>
        <p className="subtitle">Miễn phí, không cần thẻ tín dụng.</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="reg-name">Họ và tên</label>
            <input
              id="reg-name"
              type="text"
              autoComplete="name"
              required
              placeholder="Nguyễn Văn A"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="reg-pass">Mật khẩu</label>
            <input
              id="reg-pass"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Ít nhất 6 ký tự"
              value={pass}
              onChange={e => setPass(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="reg-pass2">Xác nhận mật khẩu</label>
            <input
              id="reg-pass2"
              type="password"
              autoComplete="new-password"
              required
              placeholder="••••••••"
              value={pass2}
              onChange={e => setPass2(e.target.value)}
              className={pass2 && pass !== pass2 ? 'error' : ''}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit" style={{ marginTop: 20 }} disabled={loading}>
            {loading ? 'Đang tạo tài khoản…' : 'Tạo tài khoản'}
          </button>
        </form>

        <div className="auth-footer">
          Đã có tài khoản? <Link href="/login">Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}
