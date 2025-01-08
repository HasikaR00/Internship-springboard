import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./hrdashboard.css";

const ApprovalDashboard = () => {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [expandedApproval, setExpandedApproval] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch pending approvals when the component mounts
    const token = localStorage.getItem("jwtToken"); // Get the token from localStorage
    if (!token) {
      alert("You are not authorized. Redirecting to login.");
      navigate("/login"); // Redirect to login if no token is found
      return;
    }
    axios
      .get("http://localhost:5000/pending-approvals", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        if (response.data.pending_users) {
          setPendingApprovals(response.data.pending_users);
        } else {
          alert("Failed to load pending approvals.");
        }
      })
      .catch((error) => {
        console.error("Error fetching pending approvals:", error);
        alert("Error fetching pending approvals. Please try again.");
      });
  }, [navigate]);

  const handleApprove = (approvalId) => {
    const token = localStorage.getItem("jwtToken"); // Get the token from localStorage
    if (!token) {
      alert("You are not authorized. Redirecting to login.");
      navigate("/login"); // Redirect to login if no token is found
      return;
    }

    axios
      .post(
        `http://localhost:5000/approve-user/${approvalId}`,
        {user_id: approvalId},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((response) => {
        if (response.data.message) {
          alert(response.data.message);
          // Remove the approved user from the list
          setPendingApprovals(pendingApprovals.filter((approval) => approval.id !== approvalId));
        } else {
          alert("Approval failed.");
        }
      })
      .catch((error) => {
        console.error("Full error:", error);
        alert(`Error approving user: ${error.message}`);
      });
      
  };
  const toggleApprovalDetails = (approvalId) => {
    setExpandedApproval(expandedApproval === approvalId ? null : approvalId);
  };

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <ul>
          <li onClick={() => navigate('/home')}>Home</li>
          <li onClick={() => navigate('/hrdashboard')}>HR Dashboard</li>
          <li onClick={() => navigate('/approvaldashboard')}>Approval Dashboard</li>
        </ul>
      </div>

      <div className="main-content">
        <img src="logo.jpg.png" alt="Logo" style={{ float: "left", width: "42px", height: "42px" }} />
        <h3>Learn More Do More</h3>

        <div className="top-bar">
          <button className="top-bar-item" onClick={() => {
            localStorage.removeItem("jwtToken");
            localStorage.removeItem("roleName");
            alert("Logged out successfully!");
            navigate("/login", { replace: true });
          }}>Logout</button>
          <button className="top-bar-item" onClick={() => alert("Redirecting to profile...")}>Profile</button>
        </div>

        <div className="actions-container">
          <h1>Pending Approvals</h1>
          <div className="approvals-container">
            {pendingApprovals.length > 0 ? (
              pendingApprovals.map((approval) => (
                <div key={approval.id} className="approval-item">
                  <button
                    className="approval-title"
                    onClick={() => toggleApprovalDetails(approval.id)}
                  >
                    {approval.name}
                  </button>
                  {expandedApproval === approval.id && (
                    <div className="approval-details">
                      <p><strong>Email:</strong> {approval.email}</p>
                      <p><strong>Role:</strong> {approval.role}</p>
                      <p><strong>Phone Number:</strong> {approval.phone_number}</p>
                      <p><strong>Country:</strong> {approval.country}</p>
                      <button onClick={() => handleApprove(approval.id)}>Approve</button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p>No pending approvals.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalDashboard;
