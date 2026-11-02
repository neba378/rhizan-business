import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Lock, Mail } from 'lucide-react';
import { toast } from 'sonner';

export function LoginPage() {
  const [email, setEmail] = useState('founder@rhizan.com');
  const [password, setPassword] = useState('rhizan2026');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      login('founder-1', 'RHIZAN Founder', email);
      toast.success('Welcome back to RHIZAN Workspace');
      navigate('/');
    }, 400);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-bg p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary text-white font-bold text-xl shadow-md">
            R
          </div>
          <h1 className="text-2xl font-bold text-content-primary tracking-tight">RHIZAN Technologies</h1>
          <p className="text-sm text-content-secondary">Business Growth & Operations Workspace</p>
        </div>

        <Card className="border-border shadow-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg">Founder Sign In</CardTitle>
            <CardDescription>Enter your credentials to access your private workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" required>Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="founder@rhizan.com"
                  icon={<Mail className="h-4 w-4" />}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" required>Password</Label>
                  <span className="text-xs text-brand-primary hover:underline cursor-pointer">
                    Forgot password?
                  </span>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock className="h-4 w-4" />}
                  required
                />
              </div>

              <div className="rounded-lg bg-surface-bg p-3 border border-border flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-state-success shrink-0 mt-0.5" />
                <p className="text-xs text-content-secondary leading-relaxed">
                  Local-first offline encryption active. Your financial records and client CRM data remain safely stored on this device.
                </p>
              </div>

              <Button type="submit" className="w-full" loading={loading}>
                Access Workspace
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-content-tertiary">
          RHIZAN Technologies · Addis Ababa, Ethiopia · Version 1.0.0 PWA
        </p>
      </div>
    </div>
  );
}
