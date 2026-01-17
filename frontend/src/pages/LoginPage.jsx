import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Trophy, Loader2, Sparkles, Shield, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

const LoginPage = () => {
  const { user, login, register, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.name, formData.email, formData.password);
      }
      showToast('Welcome to The Poll Winner!', 'success');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Trophy, title: 'Win Big', desc: 'Vote on polls and win real money' },
    { icon: Shield, title: 'Secure', desc: 'Your transactions are protected' },
    { icon: Zap, title: 'Instant', desc: 'Quick payouts to your wallet' },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] gradient-mesh flex">
      {/* Left Section - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 xl:px-24">
        <div className="animate-fade-in">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center glow-primary">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">The Poll Winner</h1>
              <p className="text-slate-400">Vote. Predict. Win.</p>
            </div>
          </div>
          
          <h2 className="text-5xl xl:text-6xl font-bold text-white leading-tight mb-6">
            Turn Your
            <span className="block bg-gradient-to-r from-sky-400 to-violet-500 bg-clip-text text-transparent">
              Predictions
            </span>
            Into Profits
          </h2>
          
          <p className="text-xl text-slate-400 mb-12 leading-relaxed">
            Join thousands of users who vote on exciting polls and win real money. 
            Your opinion matters - and pays!
          </p>
          
          <div className="grid gap-6">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-4 glass-card-light p-5 rounded-2xl" style={{animationDelay: `${idx * 0.1}s`}}>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500/20 to-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-sky-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                  <p className="text-slate-400 text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Right Section - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 glow-primary">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">The Poll Winner</h1>
            <p className="text-slate-400 mt-2">Vote. Predict. Win.</p>
          </div>
          
          <div className="glass-card p-8 sm:p-10">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-slate-400">
                {isLogin ? 'Sign in to continue winning' : 'Start your winning journey'}
              </p>
            </div>
            
            {/* Tabs */}
            <div className="flex bg-slate-800/50 rounded-xl p-1.5 mb-8">
              <button
                className={`flex-1 py-3 rounded-lg font-semibold transition-all duration-300 ${isLogin ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' : 'text-slate-400 hover:text-white'}`}
                onClick={() => setIsLogin(true)}
              >
                Sign In
              </button>
              <button
                className={`flex-1 py-3 rounded-lg font-semibold transition-all duration-300 ${!isLogin ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' : 'text-slate-400 hover:text-white'}`}
                onClick={() => setIsLogin(false)}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required={!isLogin}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full mt-8"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </>
                )}
              </button>
            </form>
            
            <p className="text-center text-slate-500 text-sm mt-8">
              By continuing, you agree to our Terms of Service
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
