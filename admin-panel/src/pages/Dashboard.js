import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/analytics`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const chartData = [
    { name: 'Users', value: analytics?.total_users || 0 },
    { name: 'Polls', value: analytics?.total_polls || 0 },
    { name: 'Active Polls', value: analytics?.active_polls || 0 },
    { name: 'Pending Withdrawals', value: analytics?.pending_withdrawals || 0 },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: '24px' }}>Dashboard</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <h3 style={{ marginBottom: '8px' }}>Total Users</h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold' }}>{analytics?.total_users || 0}</p>
        </div>
        
        <div className="card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
          <h3 style={{ marginBottom: '8px' }}>Total Polls</h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold' }}>{analytics?.total_polls || 0}</p>
        </div>
        
        <div className="card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
          <h3 style={{ marginBottom: '8px' }}>Active Polls</h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold' }}>{analytics?.active_polls || 0}</p>
        </div>
        
        <div className="card" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
          <h3 style={{ marginBottom: '8px' }}>Total Revenue</h3>
          <p style={{ fontSize: '36px', fontWeight: 'bold' }}>₹{analytics?.total_revenue?.toFixed(2) || 0}</p>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '20px' }}>Platform Statistics</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3>Pending Actions</h3>
        <p style={{ color: '#ef4444', fontSize: '18px', fontWeight: '600' }}>
          {analytics?.pending_withdrawals || 0} withdrawal requests pending approval
        </p>
      </div>
    </div>
  );
};

export default Dashboard;