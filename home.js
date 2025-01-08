import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./hrdashboard.css"; // Reuse the same CSS styles

const Home = () => {
  const [courses, setCourses] = useState([]);
  const navigate = useNavigate();
  const [showManageCourses, setShowManageCourses] = useState(false);
  const [expandedCourse, setExpandedCourse] = useState(null);

  useEffect(() => {
    const jwtToken = localStorage.getItem("jwtToken");
    const roleName = localStorage.getItem("roleName");  
    if (jwtToken && roleName) {
      const validateToken = async (token) => {
        try {
          const response = await axios.get("http://127.0.0.1:5000/protected", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
  
        if (response.status !== 200) {
          alert("Session expired. Redirecting to login.");
          navigate("/login", { replace: true });
        }
      } catch (error) {
        console.error("Token validation error:", error);
        alert("Session expired or invalid token. Redirecting to login.");
        navigate("/login", { replace: true });
      }
    };
    
    
      validateToken(jwtToken);
    } else {
      alert("You are not logged in. Redirecting to login.");
      navigate("/login", { replace: true });
    }
  },[navigate]);

  

  const fetchCourses = () => {
    const jwtToken = localStorage.getItem("jwtToken");

    if (!jwtToken) {
      alert("You need to log in to view courses.");
      navigate("/login", { replace: true });
      return;
    }

    axios
      .get("http://localhost:5000/fetch-all-courses", {
        headers: {
          Authorization: `Bearer ${jwtToken}`, // Pass token for authorization
        },
      })
      .then((response) => {
        console.log("API Response:", response.data.courses); // Debugging

        if (response.data.courses && Array.isArray(response.data.courses)) {
          const formattedCourses = response.data.courses.map((course) => ({
            id: course.courseId || "N/A",
            title: course.title || "N/A",
            description: course.description || "N/A",
            instructor: course.instructor || "N/A",
            startDate: course.startDate || "N/A",
            duration: course.duration || "N/A",
            endDate: course.endDate || "N/A",
          }));
          setCourses(formattedCourses);
          setShowManageCourses(true);
        } else {
          alert("No courses found.");
        }
      })
      .catch((error) => {
        console.error("Error fetching courses:", error);
        alert("Unable to fetch courses. Please try again later.");
      });
  };

  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("roleName");
    alert("Logged out successfully!");
    navigate("/login", { replace: true });
  };

  const handleProfile = () => {
    alert("Redirecting to profile...");
    // Add profile redirection functionality here
  };

  const toggleCourseDetails = (courseId) => {
    setExpandedCourse(expandedCourse === courseId ? null : courseId);
  };

  const handleDashboardNavigation = () => {
    const roleName = localStorage.getItem("roleName");

    if (roleName) {
      switch (roleName.toLowerCase()) {
        case "learner":
          navigate("/learnerdashboard");
          break;
        case "hr":
          navigate("/hrdashboard");
          break;
        case "manager":
          navigate("/managerdashboard");
          break;
        case "instructor":
          navigate("/instructordashboard");
          break;
        default:
          alert("Invalid role. Redirecting to homepage.");
          navigate("/home");
      }
    } else {
      alert("No user details found. Redirecting to homepage.");
      navigate("/home");
    }
  };

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <ul>
          <li onClick={() => navigate("/home")}>Home</li>
          <li onClick={handleDashboardNavigation}>Dashboard</li>
        </ul>
      </div>

      <div className="main-content">
        <h3>Learn More Do More</h3>

        <div className="top-bar">
          <button className="top-bar-item" onClick={handleLogout}>
            Logout
          </button>
          <button className="top-bar-item" onClick={handleProfile}>
            Profile
          </button>
        </div>

        <div className="actions-container">
          <h1>Welcome to the Home Page</h1>
          <button onClick={fetchCourses}>View Courses</button>
          {/* Modal for managing courses */}
          {showManageCourses && (
            <div className="modal">
              <div className="modal-content">
                <h2>Manage Courses</h2>
                <div className="courses-container">
                  {courses.length > 0 ? (
                    courses.map((course) => (
                      <div key={course.id} className="course-dropdown">
                        <button
                          className="course-title"
                          onClick={() => toggleCourseDetails(course.id)}
                        >
                          {course.title}
                        </button>
                        {expandedCourse === course.id && (
                          <div className="course-details">
                            <p>
                              <strong>Description:</strong> {course.description}
                            </p>
                            <p>
                              <strong>Instructor:</strong> {course.instructor}
                            </p>
                            <p>
                              <strong>Start Date:</strong> {course.startDate}
                            </p>
                            <p>
                              <strong>Duration:</strong> {course.duration} weeks
                            </p>
                            {course.endDate && (
                              <p>
                                <strong>End Date:</strong> {course.endDate}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p>No courses available.</p>
                  )}
                </div>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowManageCourses(false)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
