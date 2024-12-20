import React, { useState } from "react";
import axios from "axios";
import "./styles.css";
const ForgetPassword = () => {
  const [step, setStep] = useState(1); 
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSendOtp = async () => {
    setMessage("");
    setError("");

    try {
      const response = await axios.post("http://localhost:5000/forgetpassword", {
        email,
      });
      setMessage(response.data.message);
      setStep(2); 
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred.");
    }
  };

  const handleResetPassword = async () => {
    setMessage("");
    setError("");

    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/resetpassword", {
        email,
        otp,
        new_password: newPassword,
        confirm_new_password: confirmNewPassword,
      });
      setMessage(response.data.message);
      setStep(1); 
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred.");
    }
  };

  return (
    <div className="container">
      <h2>
        <img
          src="logo.jpg.png"
          alt="Logo"
          style={{ float: "left", width: "42px", height: "42px" }}
        />
        Forget Password
      </h2>

      {step === 1 && (
        <div className="step-1">
          <label>
            Enter your registered email:
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <button onClick={handleSendOtp}>Send OTP</button>
        </div>
      )}

      {step === 2 && (
        <div className="container">
          <label>
            Enter OTP:
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
          </label>
          <label>
            New Password:
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </label>
          <label>
            Confirm New Password:
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
            />
          </label>
          <button onClick={handleResetPassword}>Reset Password</button>
        </div>
      )}

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default ForgetPassword;
