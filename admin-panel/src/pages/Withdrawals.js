import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../context/AuthContext';

const Withdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/withdrawals`);
      setWithdrawals(response.data);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (withdrawalId) => {
    if (!window.confirm('Are you sure you want to approve this withdrawal?')) {
      return;
    }

    try {
      await axios.put(`${API_URL}/admin/withdrawals/${withdrawalId}/approve`);
      alert('Withdrawal approved! Please send money to user\'s UPI.');
      fetchWithdrawals();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to approve withdrawal');
    }
  };

  const handleReject = async (withdrawalId) => {
    const notes = prompt('Reason for rejection:');
    if (!notes) return;

    try {
      await axios.put(`${API_URL}/admin/withdrawals/${withdrawalId}/reject?notes=${encodeURIComponent(notes)}`);
      alert('Withdrawal rejected');
      fetchWithdrawals();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to reject withdrawal');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'badge-warning';
      case 'approved':
        return 'badge-success';
      case 'rejected':
        return 'badge-danger';
      default:
        return 'badge-info';
    }
  };

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
  const processedWithdrawals = withdrawals.filter(w => w.status !== 'pending');

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '24px' }}>Withdrawal Management</h1>
      
      {pendingWithdrawals.length > 0 && (
        <>
          <h2 style={{ marginTop: '32px', marginBottom: '16px' }}>
            Pending Approvals ({pendingWithdrawals.length})
          </h2>
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Amount</th>
                  <th>Fee (10%)</th>
                  <th>Net Amount</th>
                  <th>UPI ID</th>
                  <th>Requested</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingWithdrawals.map((withdrawal) => (
                  <tr key={withdrawal.withdrawal_id}>
                    <td><code>{withdrawal.user_id}</code></td>
                    <td style={{ fontWeight: '600' }}>₹{withdrawal.amount.toFixed(2)}</td>
                    <td style={{ color: '#ef4444' }}>-₹{withdrawal.fee.toFixed(2)}</td>
                    <td style={{ color: '#10b981', fontWeight: '600' }}>₹{withdrawal.net_amount.toFixed(2)}</td>
                    <td><code>{withdrawal.upi_id}</code></td>
                    <td>{new Date(withdrawal.created_at).toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn btn-success"
                          onClick={() => handleApprove(withdrawal.withdrawal_id)}
                        >
                          Approve
                        </button>
                        <button 
                          className="btn btn-danger"
                          onClick={() => handleReject(withdrawal.withdrawal_id)}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h2 style={{ marginTop: '32px', marginBottom: '16px' }}>All Withdrawals</h2>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Withdrawal ID</th>
              <th>User ID</th>
              <th>Amount</th>
              <th>Net Amount</th>
              <th>UPI ID</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map((withdrawal) => (
              <tr key={withdrawal.withdrawal_id}>
                <td><code>{withdrawal.withdrawal_id}</code></td>
                <td><code>{withdrawal.user_id}</code></td>
                <td>₹{withdrawal.amount.toFixed(2)}</td>
                <td style={{ fontWeight: '600' }}>₹{withdrawal.net_amount.toFixed(2)}</td>
                <td><code>{withdrawal.upi_id}</code></td>
                <td>
                  <span className={`badge ${getStatusColor(withdrawal.status)}`}>
                    {withdrawal.status}
                  </span>
                </td>
                <td>{new Date(withdrawal.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Withdrawals;