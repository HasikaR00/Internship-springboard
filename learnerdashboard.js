import React, { useState, useEffect,useCallback ,useRef} from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Bar } from "react-chartjs-2"; // Import Bar component
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";
import "./hrdashboard.css";
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);
const LearnerDashboard = () => {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");  // Determines the type of modal ('courses', 'enrolled', 'completed')
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [completedCourses, setCompletedCourses] = useState([]);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [enrollForm, setEnrollForm] = useState({ name: "", email: "" });
  const [courseToEnroll, setCourseToEnroll] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [watchedProgress, setWatchedProgress] = useState(0);
  const [quizCompletion, setQuizCompletion] = useState(0);
  const [coursePerformance, setCoursePerformance] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("jwtToken");
  const [progressOverview, setProgressOverview] = useState({
    completedCourses: 0,
    enrolledCourses: 0,
    inProgressCourses: 0,
  }); // State for bar graph data
  const youtubePlayerRef = useRef(null);
  const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('roleName');
    localStorage.removeItem("user_id");
    axios.post('http://localhost:5000/logout')
      .then(response => {
        console.log(response.data.message);
        alert("Logged out successfully");
      })
      .catch(error => {
        console.error('There was an error logging out!', error);
      })
      .finally(() => {
        navigate('/login', { replace: true });
      });
  };

  const fetchCourses =useCallback( () => {
    axios.get("http://localhost:5000/fetch-course", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        if (response.data.courses && Array.isArray(response.data.courses)) {
          console.log("Courses fetched:", response.data.courses);

          setCourses(response.data.courses);
        } else {
          alert("No courses found.");
        }
      })
      .catch((error) => {
        console.error("Error fetching courses:", error);
        alert("Error fetching courses.");
      });
  }, [token]);

  const fetchEnrolledCourses =useCallback( () => {
    axios.get("http://localhost:5000/fetch-enrolled-courses",{
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        if (response.data.courses && Array.isArray(response.data.courses)) {
          console.log("Courses fetched:", response.data.courses);

          setEnrolledCourses(response.data.courses.map(course => ({
            ...course,
            progress: course.progress || 0, 
          })));
        } else {
          alert("No enrolled courses found.");
        }
      })
      .catch((error) => {
        console.error("Error fetching enrolled courses:", error);
        alert("Error fetching enrolled courses.");
      });
  }, [token]);

  const fetchCompletedCourses = useCallback(() => {
    axios.get("http://localhost:5000/fetch-completed-courses",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
      .then((response) => {
        if (response.data.courses && Array.isArray(response.data.courses)) {
          setCompletedCourses(response.data.courses);
        } else {
          alert("No completed courses found.");
        }
      })
      .catch((error) => {
        console.error("Error fetching completed courses:", error);
        alert("Error fetching completed courses.");
      });
  }, [token]);
    // Update module progress
    const fetchProgressOverview = useCallback(() => {
      axios
        .get("http://localhost:5000/course-progress-overview", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          setProgressOverview(response.data);
        })
        .catch((error) => {
          console.error("Error fetching progress overview:", error);
        });
    }, [token]);
    const updateModuleProgress = useCallback(
      (moduleId, videoProgress, quizCompletion) => {
        axios
          .post(
            "http://localhost:5000/update-module-progress",
            {
              module_id: moduleId,
              video_progress: videoProgress,
              quiz_completion: quizCompletion,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          )
          .then((response) => {
            alert(response.data.message);
            fetchEnrolledCourses();
            fetchProgressOverview();  // Refresh courses after progress update
          })
          .catch((error) => {
            console.error("Error updating module progress:", error);
            alert("Error updating module progress.");
          });
      },
      [token, fetchEnrolledCourses,fetchProgressOverview]
    );
    
    const fetchFeedback = useCallback(() => {
      axios
        .get("http://localhost:5000/fetch-feedback", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          if (response.data && Array.isArray(response.data)) {
            setFeedback(response.data);
          } else {
            alert("No feedback found.");
          }
        })
        .catch((error) => {
          console.error("Error fetching feedback:", error);
          alert("Error fetching feedback.");
        });
    }, [token]);
    const fetchCoursePerformance = useCallback(() => {
      axios.get("http://localhost:5000/course-performance", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setCoursePerformance(response.data.coursePerformance);
      })
      .catch((error) => {
        console.error("Error fetching course performance:", error);
      });
    }, [token]);
    

  useEffect(() => {
    fetchCourses();
    fetchEnrolledCourses();
    fetchCompletedCourses();
    fetchFeedback();
    fetchProgressOverview();
    fetchCoursePerformance();
  }, [fetchCourses, fetchEnrolledCourses, fetchCompletedCourses,fetchFeedback,fetchProgressOverview, fetchCoursePerformance]);

  const toggleCourseDetails = (courseId) => {
    setExpandedCourse(expandedCourse === courseId ? null : courseId);
  };

  const openModal = (type, course = null) => {
    setModalType(type);
    if (type === 'enroll' && course) {
      setCourseToEnroll(course);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType("");
    
    setEnrollForm({ name: "", email: "" });
  };

  const handleEnrollSubmit = (e) => {
    e.preventDefault();
    // Fetch token from localStorage
    axios.post(`http://localhost:5000/enroll-course`, {
      name: enrollForm.name,
      email: enrollForm.email,
      course_id: courseToEnroll.id,
    }, {
      headers: {
        Authorization: `Bearer ${token}` // Include token in request headers
      }
    })
    .then((response) => {
      alert(response.data.message);
      alert(`Successfully enrolled in ${courseToEnroll.title}`);
      fetchEnrolledCourses(); // Refresh enrolled courses
      fetchCourses();   
      closeModal();
       // Refresh the enrolled courses list
    })
    .catch((error) => {
      console.error("Error enrolling in course:", error);
      alert("Error enrolling in course.");
    });
  };
  const handleYouTubeProgress = useCallback((event, moduleId) => {
    const progress = (event.target.getCurrentTime() / event.target.getDuration()) * 100;
    let updatedProgress = 0;

    if (progress >= 0 && progress < 33) updatedProgress = 25;
    else if (progress >= 33 && progress < 66) updatedProgress = 50;
    else if (progress >= 66 && progress <= 100) updatedProgress = 70;

    if (updatedProgress !== watchedProgress) {
      setWatchedProgress(updatedProgress);
      updateModuleProgress(moduleId, updatedProgress, quizCompletion);
    }
  }, [watchedProgress, quizCompletion, updateModuleProgress]);

  const handleQuizCompletion = (moduleId, completion) => {
    setQuizCompletion(completion);
    updateModuleProgress(moduleId, watchedProgress, completion);
  };

  useEffect(() => {
    if (modalType === "enrolled" && courseToEnroll?.modules) {
      courseToEnroll.modules.forEach((module) => {
        const videoId = module.youtubeLink.split("v=")[1];

        if (!window.YT) {
          // Load YouTube API
          const tag = document.createElement("script");
          tag.src = "https://www.youtube.com/iframe_api";
          document.body.appendChild(tag);
        } else if (!youtubePlayerRef.current) {
          // Initialize player
          youtubePlayerRef.current = new window.YT.Player("youtube-player", {
            videoId,
            events: {
              onStateChange: (event) => handleYouTubeProgress(event, module.id),
            },
          });
        }
      });
    }
  }, [modalType, courseToEnroll, handleYouTubeProgress]);
  const renderProgressBar = (progress) => (
    <div className="progress-bar-container">
      <div className="progress-bar" style={{ width: `${progress}%` }}>
        {progress}%
      </div>
    </div>
  );
  const renderCoursePerformance = () => (
    <div className="course-performance-container">
      <h3>Your Courses</h3>
      {coursePerformance.map((course) => (
        <div key={course.courseId} className="course-performance-item">
          <h4>{course.title}</h4>
          <p>Status: {course.status}</p>
          <p>Progress: {renderProgressBar(course.progress)}</p>
          <p>Modules: {course.completedModules}/{course.totalModules}</p>
          <p>Quiz Points: {course.achievedPoints}/{course.totalPoints}</p>
        </div>
      ))}
    </div>
  );
  
   const barData = {
    labels: [
      `Completed Courses (${progressOverview.completedCourses})`,
      `NotStarted Courses (${progressOverview.enrolledCourses})`,
      `In-Progress Courses (${progressOverview.inProgressCourses})`,
    ],
    datasets: [
      {
        label: "Course Progress Overview",
        data: [
          progressOverview.completedCourses,
          progressOverview.enrolledCourses,
          progressOverview.inProgressCourses,
        ],
        backgroundColor: ["#4CAF50", "#FFC107", "#2196F3"], // Different colors for bars
      },
    ],
  };

  // Options for the bar graph
  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Course Categories",
        },
      },
      y: {
        beginAtZero: true,
      },
    },
  };
 
  
  
  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <ul>
          <li onClick={() => navigate('/home')}>Home</li>
          <li onClick={() => navigate('/learnerdashboard')}>Dashboard</li>
        </ul>
      </div>

      <div className="main-content">
        <img src="logo.jpg.png" alt="Logo" style={{ float: "left", width: "42px", height: "42px" }} />
        <h3>Learn More Do More</h3>

        <div className="top-bar">
          <button className="top-bar-item" onClick={handleLogout}>Logout</button>
          <button className="top-bar-item">Profile</button>
        </div>

        <div className="actions-container">
          <h1>Welcome, Learner</h1>
          <div className="actions">
            <div className="action-item">
              <h3>View Courses</h3>
              <button onClick={() => openModal("courses")}>VIEW</button>
            </div>
            <div className="action-item">
              <h3>View Enrolled Courses</h3>
              <button onClick={() => openModal("enrolled")}>VIEW</button>
            </div>
            <div className="action-item">
              <h3>View Completed Courses</h3>
              <button onClick={() => openModal("completed")}>VIEW</button>
            </div>
            <div className="action-item">
              <h3>View Feedback</h3>
              <button onClick={() => openModal("feedback")}>VIEW</button>
            </div>
            <div className="action-item">
  <h3>View Progress & Scorecards</h3>
  <button onClick={fetchCoursePerformance}>VIEW</button>
</div>

          </div>

        {/* Render Bar Graph */}
        <div className="bar-graph-container">
          <h3>Your Course Progress</h3>
          <Bar data={barData} options={barOptions} />
        </div> 
        {renderCoursePerformance()} 
        </div>
      </div>

      {/* Modal for managing courses */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{modalType === 'courses' ? 'Available Courses' : modalType === 'enrolled' ? 'Enrolled Courses' : 'Completed Courses'}</h2>
            <div className="courses-container">
              {(modalType === 'courses' ? courses : modalType === 'enrolled' ? enrolledCourses : completedCourses).length > 0 ? (
                (modalType === 'courses' ? courses : modalType === 'enrolled' ? enrolledCourses : completedCourses).map((course) => (
                  <div key={course.id} className="course-dropdown">
      <button className="course-title" onClick={() => toggleCourseDetails(course.id)}>
        {course.title}
      </button>
      {expandedCourse === course.id && (
        <div className="course-details">
          <p><strong>Description:</strong> {course.description}</p>
          <p><strong>Instructor:</strong> {course.instructor}</p>
          <p><strong>Start Date:</strong> {course.startDate}</p>
          <p><strong>Duration:</strong> {course.duration} weeks</p>
          {course.endDate && <p><strong>End Date:</strong> {course.endDate}</p>}
          <p><strong>Progress:</strong> {course.progress}%</p>
    <div className="progress-bar-container">
      <div className="progress-bar" style={{ width: `${course.progress}%` }}>
        {course.progress}%
      </div>
    </div>
          {modalType === "courses" &&
                        !enrolledCourses.some((e) => e.id === course.id) && (
                          <button
                            onClick={() => openModal("enroll", course)}
                            className="enroll-button"
                          >
                            Enroll
                          </button>
                        )}
                            {/* Displaying modules */}
                            {course.modules?.map((module) => (
                    <div key={module.moduleId} className="module-details">
                      <h4>{module.title}</h4>
                      <p><strong>Introduction:</strong> {module.introduction}</p>
                      <p><strong>Learning Points:</strong> {module.points}</p>
                      <p><strong>Progress:</strong> {module.progress}%</p>
                      <div>
                        {module.pdfLink && (
                          <p>
                            <strong>Material:</strong>{" "}
                            <a href={module.pdfLink} target="_blank" rel="noopener noreferrer">
                              Download PDF
                            </a>
                          </p>
                        )}
                      </div>
                      {/* YouTube Video Player */}
                      {module.youtubeLink && (
                        <div>
                          <div id="youtube-player"></div>
                          <p>
                            <a href={module.youtubeLink} target="_blank" rel="noopener noreferrer">
                              Watch on YouTube
                            </a>
                          </p>
                        </div>
                      )}
                       {/* "Take Quiz" Button */}
                       {module.quizId && enrolledCourses.some((e) => e.id === course.id) && (
      <button 
        onClick={() => {
          navigate(`/quiz/${module.quizId}`);
          handleQuizCompletion(module.moduleId, 50);
        }} 
        className="take-quiz-button"
      >
        TAKE QUIZ
      </button>
    )}

                    </div>
                  ))}
                </div>
              )}
            </div>
                ))
              ) : (
                <p>No courses available.</p>
              )}
            </div>
            <button className="cancel-btn" onClick={closeModal}>Close</button>
          </div>
        </div>
      )}

      {/* Enrollment Form Modal */}
      {modalType === 'enroll' && (
        <div className="modal">
          <div className="modal-content">

            <h2>Enroll in {courseToEnroll?.title}</h2>
            <form onSubmit={handleEnrollSubmit}>
              <input
                type="text"
                placeholder="Enter your name"
                value={enrollForm.name}
                onChange={(e) => setEnrollForm({ ...enrollForm, name: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="Enter your email"
                value={enrollForm.email}
                onChange={(e) => setEnrollForm({ ...enrollForm, email: e.target.value })}
                required
              />
              <button type="submit">Enroll</button>
            </form>
            <button className="cancel-btn" onClick={closeModal}>Close</button>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {modalType === "feedback" && (
        <div className="modal">
          <div className="modal-content">
            <h2>Course Feedback</h2>
            <div className="feedback-container">
              {feedback.length > 0 ? (
                feedback.map((item, index) => (
                  <div key={index} className="feedback-item">
                    <h3>{item.courseName}</h3>
                    <p><strong>Feedback:</strong> {item.feedback}</p>
                  </div>
                ))
              ) : (
                <p>No feedback available.</p>
              )}
            </div>
            <button className="cancel-btn" onClick={closeModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearnerDashboard;
