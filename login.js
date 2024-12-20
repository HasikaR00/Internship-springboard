import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./styles.css";
import axios from "axios";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false); // Handle loading state
  const navigate = useNavigate();

  // Handle input field changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post("http://127.0.0.1:5000/login", formData);

      if (response.status === 200) {
        alert("Login Successful!");
        console.log(response.data);
        navigate(response.data.redirect); // Redirect based on role
      } else {
        alert(response.data.message || "Login failed!");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred during login. Please try again.");
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
        Welcome to Upskill-Vision Login
      </h2>

      <form onSubmit={handleSubmit}>
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
        <button type="submit" disabled={loading}>
          {loading ? "Logging In..." : "Login"}
        </button>
         {/* Forgot Password Navigation */}
        <p>
          <span
            onClick={() => navigate("/forgetpassword")}
            className="link"
          >
            Forget Password?
          </span>
        </p>
        {/* Signup Navigation */}
        <p>
          Don't have an account?{" "}
          <span onClick={() => navigate("/signup")} className="link">
            Signup here
          </span>
        </p>
      </form>
    </div>
  );
};

export default Login;
