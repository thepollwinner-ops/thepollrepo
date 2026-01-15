import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../context/AuthContext';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/transactions`);
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'purchase':
        return 'badge-danger';
      case 'win':
        return 'badge-success';
      case 'withdrawal':
        return 'badge-warning';
      default:
        return 'badge-info';
    }
  };

  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(t => t.type === filter);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '24px' }}>Transactions</h1>
      
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className={`btn ${filter === 'all' ? 'btn-primary' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({transactions.length})
          </button>
          <button 
            className={`btn ${filter === 'purchase' ? 'btn-primary' : ''}`}
            onClick={() => setFilter('purchase')}
          >
            Purchases ({transactions.filter(t => t.type === 'purchase').length})
          </button>
          <button 
            className={`btn ${filter === 'win' ? 'btn-primary' : ''}`}
            onClick={() => setFilter('win')}
          >
            Winnings ({transactions.filter(t => t.type === 'win').length})
          </button>
          <button 
            className={`btn ${filter === 'withdrawal' ? 'btn-primary' : ''}`}
            onClick={() => setFilter('withdrawal')}
          >
            Withdrawals ({transactions.filter(t => t.type === 'withdrawal').length})
          </button>
        </div>
      </div>
      
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>User ID</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((txn) => (
              <tr key={txn.transaction_id}>
                <td><code>{txn.transaction_id}</code></td>
                <td><code>{txn.user_id}</code></td>
                <td>
                  <span className={`badge ${getTypeColor(txn.type)}`}>
                    {txn.type}
                  </span>
                </td>
                <td style={{ color: txn.amount >= 0 ? '#10b981' : '#ef4444', fontWeight: '600' }}>
                  {txn.amount >= 0 ? '+' : ''}₹{Math.abs(txn.amount).toFixed(2)}
                </td>
                <td>
                  <span className={`badge ${txn.status === 'success' ? 'badge-success' : 'badge-warning'}`}>
                    {txn.status}
                  </span>
                </td>
                <td>{new Date(txn.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Transactions;