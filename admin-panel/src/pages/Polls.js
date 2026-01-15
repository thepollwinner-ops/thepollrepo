import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../context/AuthContext';

const Polls = () => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState('');

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/polls`);
      setPolls(response.data);
    } catch (error) {
      console.error('Error fetching polls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetResult = async () => {
    if (!selectedOption) {
      alert('Please select a winning option');
      return;
    }

    if (!window.confirm('Are you sure? This will close the poll and distribute winnings!')) {
      return;
    }

    try {
      await axios.post(
        `${API_URL}/admin/polls/${selectedPoll.poll_id}/result`,
        { winning_option_id: selectedOption }
      );
      alert('Poll result set successfully! Winnings distributed.');
      setShowResultModal(false);
      fetchPolls();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to set result');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Polls Management</h1>
        <Link to="/polls/create" className="btn btn-primary">
          + Create New Poll
        </Link>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Options</th>
              <th>Price/Vote</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {polls.map((poll) => (
              <tr key={poll.poll_id}>
                <td>
                  <strong>{poll.title}</strong>
                  <br />
                  <small style={{ color: '#64748b' }}>{poll.description}</small>
                </td>
                <td>{poll.options.length} options</td>
                <td>₹{poll.price_per_vote}</td>
                <td>
                  <span className={`badge ${poll.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                    {poll.status}
                  </span>
                </td>
                <td>{new Date(poll.created_at).toLocaleDateString()}</td>
                <td>
                  {poll.status === 'active' ? (
                    <button
                      className="btn btn-success"
                      onClick={() => {
                        setSelectedPoll(poll);
                        setShowResultModal(true);
                      }}
                    >
                      Set Result
                    </button>
                  ) : (
                    <span className="badge badge-info">Closed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showResultModal && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.modal}>
            <h2>Set Poll Result</h2>
            <p><strong>{selectedPoll?.title}</strong></p>
            <div style={{ marginTop: '20px' }}>
              <label>Select Winning Option:</label>
              {selectedPoll?.options.map((option) => (
                <div key={option.option_id} style={{ marginTop: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="winner"
                      value={option.option_id}
                      onChange={(e) => setSelectedOption(e.target.value)}
                      style={{ marginRight: '8px' }}
                    />
                    {option.text}
                  </label>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
              <button className="btn btn-success" onClick={handleSetResult}>
                Confirm Result
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  setShowResultModal(false);
                  setSelectedOption('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    background: 'white',
    padding: '32px',
    borderRadius: '12px',
    maxWidth: '500px',
    width: '90%',
  },
};

export default Polls;