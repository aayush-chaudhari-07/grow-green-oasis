import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User as UserIcon, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, authMode, setAuthMode, login, register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (authMode === 'login') {
      await login(email, password);
    } else {
      await register(name, email, password);
    }

    setIsSubmitting(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md bg-popover rounded-3xl p-8 shadow-2xl border border-border"
        >
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="absolute top-5 right-5 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors"
          >
            <X size={20} />
          </button>

          <div className="text-center mb-6">
            <h3 className="font-display text-2xl font-bold text-foreground">
              {authMode === 'login' ? 'Welcome Back' : 'Join Grow Green'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {authMode === 'login' ? 'Sign in to access your green oasis' : 'Create an account to track your orders'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1">Full Name</label>
                <div className="relative flex items-center">
                  <UserIcon className="absolute left-3 text-muted-foreground" size={18} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full pl-10 pr-4 py-2.5 bg-secondary text-foreground text-sm rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1">Email Address</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 text-muted-foreground" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-secondary text-foreground text-sm rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1">Password</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 text-muted-foreground" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-secondary text-foreground text-sm rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
              type="submit"
              className="w-full mt-2 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-full font-semibold text-sm shadow-plant hover:shadow-lg transition-all disabled:opacity-50"
            >
              {authMode === 'login' ? (
                <>
                  <LogIn size={18} />
                  {isSubmitting ? 'Signing In...' : 'Sign In'}
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            {authMode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button
                  onClick={() => setAuthMode('register')}
                  className="text-primary font-semibold hover:underline"
                >
                  Sign Up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => setAuthMode('login')}
                  className="text-primary font-semibold hover:underline"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AuthModal;
