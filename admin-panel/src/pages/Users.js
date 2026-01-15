import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../context/AuthContext';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '24px' }}>Users Management</h1>
      
      <div className="card">
        <div style={{ marginBottom: '16px' }}>
          <p style={{ color: '#64748b' }}>Total Users: <strong>{users.length}</strong></p>
        </div>
        
        <table className="table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>UPI ID</th>
              <th>Registered</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.user_id}>
                <td><code>{user.user_id}</code></td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.upi_id || <span style={{ color: '#94a3b8' }}>Not set</span>}</td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;