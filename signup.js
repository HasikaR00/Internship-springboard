import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./styles.css";
import axios from "axios";

const Signup = () => {
  const [activeRole, setActiveRole] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    country: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false); // Handle loading state
  const navigate = useNavigate();

  // Handle input field changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Password validation function
  const validatePassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Password validation
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      setLoading(false);
      return;
    }

    if (!validatePassword(formData.password)) {
      alert(
        "Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and at least one special character."
      );
      setLoading(false);
      return;
    }

    try {
      // Send POST request to the backend for signup
      const response = await axios.post("http://127.0.0.1:5000/signup", {
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirmPassword,  // Note: Backend expects 'confirm_password'
        phone_number: formData.phone_number,
        country: formData.country,
        role: activeRole, // Add selected role
      });

      // Check if signup was successful
      if (response.status === 201) {
        alert("Signup Successful!");
        console.log(response.data);
        navigate("/login"); // Redirect to Login page after successful signup
      } else {
        alert(response.data.message || "Signup failed!");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred during signup. Please try again.");
    } finally {
      setLoading(false);
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
        Welcome to Upskill-Vision Signup
      </h2>

      {/* Role selection buttons */}
      <h3>Choose Your Role</h3>
      <div className="role-buttons">
        {["HR Admin", "Instructor", "Manager", "Learner"].map((role) => (
          <button
            key={role}
            className={`role-btn ${activeRole === role ? "active" : ""}`}
            onClick={() => setActiveRole(role)}
          >
            {role}
          </button>
        ))}
      </div>

      {/* Conditional rendering based on role selection */}
      {activeRole && (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="full_name"
            placeholder="Full Name"
            value={formData.full_name}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="phone_number"
            placeholder="Phone Number"
            value={formData.phone_number}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="country"
            placeholder="Country"
            value={formData.country}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Signing Up..." : "Signup"}
          </button>

          {/* Login Navigation */}
          <p>
            Already have an account?{" "}
            <span onClick={() => navigate("/login")} className="link">
              Login here
            </span>
          </p>
        </form>
      )}
    </div>
  );
};

export default Signup;
