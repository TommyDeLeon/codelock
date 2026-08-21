'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import { useAuth } from '@/lib/auth-store';
import { ApiClientError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardBody, Field, Input } from '@/components/ui/primitives';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const router = useRouter();
  const { status, login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') router.replace('/dashboard');
  }, [status, router]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register({ email, password, displayName });
      router.replace('/dashboard');
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'Could not reach the server. Try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="main" className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-sm bg-fg text-bg">
            <Lock className="size-4" aria-hidden />
          </span>
          <div>
            <h1 className="text-[15px] font-semibold leading-none tracking-tight">CodeLock</h1>
            <p className="mt-1 text-[13px] text-muted">Earn your screen time.</p>
          </div>
        </div>

        <Card>
          <CardBody>
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              {mode === 'register' && (
                <Field label="Name" htmlFor="displayName">
                  <Input
                    id="displayName"
                    name="name"
                    autoComplete="name"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </Field>
              )}

              <Field label="Email" htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>

              <Field
                label="Password"
                htmlFor="password"
                hint={mode === 'register' ? 'At least 12 characters.' : undefined}
              >
                <Input
                  id="password"
                  type="password"
                  name="password"
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  required
                  minLength={mode === 'register' ? 12 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>

              {error && (
                <p role="alert" className="rounded-sm bg-danger-soft px-3 py-2 text-[13px] text-danger">
                  {error}
                </p>
              )}

              <Button type="submit" size="lg" loading={busy} className="w-full">
                {mode === 'login' ? 'Sign in' : 'Create account'}
              </Button>
            </form>
          </CardBody>
        </Card>

        <p className="mt-6 text-center text-[13px] text-faint">
          By continuing you agree to the{' '}
          <a href="/terms" className="underline underline-offset-4 hover:text-fg">terms</a>{' '}
          and{' '}
          <a href="/privacy" className="underline underline-offset-4 hover:text-fg">privacy policy</a>.
        </p>

        <p className="mt-4 text-center text-[13px] text-muted">
          {mode === 'login' ? 'No account yet?' : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError(null);
            }}
            className="font-medium text-fg underline underline-offset-4 hover:text-accent"
          >
            {mode === 'login' ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </div>
    </main>
  );
}
