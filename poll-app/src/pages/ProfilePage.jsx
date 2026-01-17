import React, { useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
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
      showToast('Profile updated!', 'success');
    } catch (err) {
      showToast('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h1>

      <div className="card p-8 max-w-lg">
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
          <input
            type="text"
            value={user?.name || ''}
            readOnly
            className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-600"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={user?.email || ''}
            readOnly
            className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-600"
          />
        </div>

        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-2">UPI ID (for withdrawals)</label>
          <input
            type="text"
            value={upi}
            onChange={(e) => setUpi(e.target.value)}
            placeholder="yourname@upi"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="btn-primary flex items-center justify-center gap-2"
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
  );
};

export default ProfilePage;
