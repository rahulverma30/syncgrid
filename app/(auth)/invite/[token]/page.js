'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, Loader2, User, Lock, CheckCircle2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Input, Button } from '@/components/ui';

export default function InvitePage({ params }) {
  const unwrappedParams = use(params);
  const token = unwrappedParams.token;
  const router = useRouter();

  const [verifying, setVerifying] = useState(true);
  const [inviteData, setInviteData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Verify token validity on load
  useEffect(() => {
    async function verifyToken() {
      try {
        const res = await fetch(`/api/auth/invite/verify?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (data.success) {
          setInviteData(data.data);
        } else {
          setErrorMsg(data.message || 'The invitation link is invalid or has expired.');
        }
      } catch (err) {
        setErrorMsg('Network error verifying invitation. Please reload.');
      } finally {
        setVerifying(false);
      }
    }

    if (token) {
      verifyToken();
    }
  }, [token]);

  // 2. Submit form and perform auto-login
  async function handleSubmit(event) {
    event.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Validation error', { description: 'Passwords do not match.' });
      return;
    }

    if (password.length < 8) {
      toast.error('Validation error', {
        description: 'Password must be at least 8 characters long.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/invite/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name,
          password,
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Account successfully provisioned!', {
          description: 'Authenticating your session...',
        });

        // Auto-login after creation
        const loginResult = await signIn('credentials', {
          email: inviteData.email,
          password: password,
          redirect: false,
        });

        setIsSubmitting(false);

        if (loginResult?.error) {
          toast.info('Onboarding Complete', {
            description: 'Please sign in manually with your password.',
          });
          router.push('/login');
        } else {
          toast.success('Welcome aboard!');
          router.push('/dashboard');
          router.refresh();
        }
      } else {
        toast.error('Registration failed', { description: data.message });
        setIsSubmitting(false);
      }
    } catch (err) {
      toast.error('Error during onboarding registration.');
      setIsSubmitting(false);
    }
  }

  if (verifying) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-slate-400 italic text-sm">Verifying invitation credentials...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <Card className="border-red-500/20 bg-slate-950/20">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <ShieldAlert className="w-12 h-12 text-red-500 animate-pulse" />
          </div>
          <CardTitle className="text-red-400">Invitation Invalid</CardTitle>
          <CardDescription className="text-slate-400 leading-normal">{errorMsg}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button
            onClick={() => router.push('/login')}
            className="bg-slate-900 border border-slate-800 hover:bg-slate-850 px-6 py-2.5 text-xs text-white"
          >
            Go to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-md">
      <CardHeader>
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
            Invitation Valid
          </span>
        </div>
        <CardTitle>Welcome to {inviteData?.companyName}</CardTitle>
        <CardDescription>
          Complete your credentials below to active your corporate account as{' '}
          <strong className="text-white">{inviteData?.email}</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Full Corporate Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="w-full bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-xl text-xs text-white outline-none focus:border-blue-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Choose Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full bg-slate-950/80 border border-slate-800 px-4 py-2.5 pr-10 rounded-xl text-xs text-white outline-none focus:border-blue-500/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Confirm Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              className="w-full bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-xl text-xs text-white outline-none focus:border-blue-500/50"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 mt-2"
            isLoading={isSubmitting}
          >
            Accept & Launch Dashboard
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
