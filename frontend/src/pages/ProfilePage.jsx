import React, { useState } from 'react';
import { Save, Loader2, User, Mail, CreditCard, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateUPI } from '../api';
import { useToast } from '../components/Toast';

const ProfilePage = () => {
  const { user, checkAuth } = useAuth();
  const { showToast } = useToast();
  const [upi, setUpi] = useState(user?.upi_id || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateUPI(upi);
      await checkAuth();
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      showToast('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="glass-card p-8 sm:p-10 mb-8 gradient-mesh">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-2xl">{user?.name?.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{user?.name}</h1>
            <p className="text-slate-400">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="glass-card p-8">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          <Shield className="w-6 h-6 text-sky-400" />
          Account Settings
        </h2>

        <div className="space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
              <User className="w-4 h-4" />
              Full Name
            </label>
            <input
              type="text"
              value={user?.name || ''}
              readOnly
              className="input-field bg-slate-800/80 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
              <Mail className="w-4 h-4" />
              Email Address
            </label>
            <input
              type="email"
              value={user?.email || ''}
              readOnly
              className="input-field bg-slate-800/80 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
              <CreditCard className="w-4 h-4" />
              UPI ID (for withdrawals)
            </label>
            <input
              type="text"
              value={upi}
              onChange={(e) => setUpi(e.target.value)}
              placeholder="yourname@upi"
              className="input-field"
            />
            <p className="text-slate-500 text-sm mt-2">This UPI ID will be used for all withdrawal payouts</p>
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="btn btn-primary w-full mt-4"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
