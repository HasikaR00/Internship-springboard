import React, { useState, useEffect,useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";  // Import axios
import "./hrdashboard.css";

const ManagerDashboard = () => {
  
  const [showManageCourses, setShowManageCourses] = useState(false);
  const [courses, setCourses] = useState([]);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [showTeamDetails, setShowTeamDetails] = useState(false);
  const [teamDetails, setTeamDetails] = useState({});
  const [expandedMember, setExpandedMember] = useState(null);
  const navigate = useNavigate(); 

  const handleLogout = () => {
    // Clear the local storage to remove user data
    localStorage.removeItem('jwtToken');
  localStorage.removeItem('roleName');
  localStorage.removeItem("user_id");
  // Optionally notify the backend (if required)
  axios.post('http://localhost:5000/logout')
    .then(response => {
      console.log(response.data.message); // Log backend response if needed
    })
    .catch(error => {
      console.error('There was an error logging out!', error);
    })
    .finally(() => {
      // Redirect to the login page
      navigate('/login', { replace: true });
    });
  };

  const fetchCourses =useCallback (() => {
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
  }, [navigate]);
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);
  const toggleCourseDetails = (courseId) => {
    setExpandedCourse(expandedCourse === courseId ? null : courseId);
  };
  
  const fetchTeamDetails = () => {
    const managerId = localStorage.getItem("user_id");
    if (!managerId) {
      alert("Manager ID not found. Please log in again.");
      navigate("/login", { replace: true });
      return;
    } // Store `managerId` in localStorage during login
    axios
      .get(`http://localhost:5000/manager-team/${managerId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
      })
      .then((response) => {
        setTeamDetails(response.data);
        setShowTeamDetails(true);
      })
      .catch((error) => {
        console.error("Error fetching team details:", error);
      });
  };

  const toggleMemberDetails = (memberName) => {
    setExpandedMember(expandedMember === memberName ? null : memberName);
  };

  const handleDashboardNavigation = () => {
    const userDetails = JSON.parse(localStorage.getItem("userDetails"));

    if (userDetails) {
      const { role_id } = userDetails;

      switch (role_id) {
        case 1: // Learner
          navigate("/learnerdashboard");
          break;
        case 2: // HR
          navigate("/hrdashboard");
          break;
        case 3: // Manager
          navigate("/managerdashboard");
          break;
        case 4: // Instructor
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
  <li onClick={() => navigate('/home')}>Home</li>
  <li onClick={handleDashboardNavigation}>Dashboard</li>
</ul>

      </div>

      {/* Main Content */}
      <div className="main-content">
        <img src="logo.jpg.png" alt="Logo" style={{ float: "left", width: "42px", height: "42px" }} />
        <h3>Learn More Do More</h3>

        <div className="top-bar">
          <button className="top-bar-item" onClick={handleLogout}>Logout</button>
          <button className="top-bar-item" onClick={() => navigate("/profile")}>Profile</button>
        </div>

        {/* Welcome and Actions */}
        <div className="actions-container">
          <h1>Welcome, Manager</h1>
          <div className="actions">
            
            <div className="action-item">
              <div>
                <h3>View Progress</h3>
                <p>View progress of the team.</p>
              </div>
              <button onClick={fetchTeamDetails}>VIEW</button>
            </div>
            
            <div className="action-item">
              <div>
                <h3>Manage Courses</h3>
                <p>Manage available courses.</p>
              </div>
              <button onClick={fetchCourses}>MANAGE</button>
            </div>
          </div>
        </div>
      </div>
      {showTeamDetails && (
        <div className="modal">
          <div className="modal-content">
            <h2>Team: {teamDetails.team_name}</h2>
            <div className="team-container">
              {teamDetails.members && teamDetails.members.length > 0 ? (
                teamDetails.members.map((member) => (
                  <div key={member.name} className="team-member">
                    <button
                      className="member-name"
                      onClick={() => toggleMemberDetails(member.name)}
                    >
                      {member.name}
                    </button>
                    {expandedMember === member.name && (
                      <div className="member-details">
                        <h3>Course Progress</h3>
                        {member.course_progress.length > 0 ? (
                          member.course_progress.map((course, index) => (
                            <div key={index}>
                              <p>
                                <strong>Course:</strong> {course.course_title}
                              </p>
                              <p>
                                <strong>Progress:</strong> {course.progress}%
                              </p>
                            </div>
                          ))
                        ) : (
                          <p>No course progress available.</p>
                        )}
                        <h3>Quiz Results</h3>
                        {member.quiz_results.length > 0 ? (
                          member.quiz_results.map((quiz, index) => (
                            <div key={index}>
                              <p>
                                <strong>Quiz Title:</strong> {quiz.quiz_title}
                              </p>
                              <p>
                                <strong>Total Score:</strong> {quiz.total_score}
                              </p>
                              <p>
                                <strong>Pass Status:</strong>{" "}
                                {quiz.pass_status ? "Passed" : "Failed"}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p>No quiz results available.</p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p>No team members found.</p>
              )}
            </div>
            <button
              type="button"
              className="cancel-btn"
              onClick={() => setShowTeamDetails(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

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
  );
};

export default ManagerDashboard;
