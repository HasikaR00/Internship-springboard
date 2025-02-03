import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Signup from "./signup";
import Home from "./home";
import ApprovalDashboard from "./approvaldashboard";
import Login from "./login";
import HRDashboard from "./hrdashboard";
import InstructorDashboard from "./instructordashboard";
import ForgetPassword from "./forgetpassword";
import "./styles.css";
import LearnerDashboard from "./learnerdashboard";
import ManagerDashboard from "./managerdashboard";
import QuizPage from "./quizpage.js";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/approvaldashboard" element={<ApprovalDashboard />} />
        <Route path="/forgetpassword" element={<ForgetPassword />} />
        <Route path="/hrdashboard" element={<HRDashboard />} /> 
        <Route path="/instructordashboard" element={<InstructorDashboard />} /> 
        <Route path="/learnerdashboard" element={<LearnerDashboard />} /> 
        <Route path="/managerdashboard" element={<ManagerDashboard />} /> 
        <Route path="/quiz/:quizId" element={<QuizPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;

