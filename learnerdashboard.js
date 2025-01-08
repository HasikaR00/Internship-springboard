import React, { useState, useEffect,useCallback ,useRef} from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./hrdashboard.css";

const LearnerDashboard = () => {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");  // Determines the type of modal ('courses', 'enrolled', 'completed')
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [completedCourses, setCompletedCourses] = useState([]);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [enrollForm, setEnrollForm] = useState({ name: "", email: "" });
  const [courseToEnroll, setCourseToEnroll] = useState(null);
  
  const [watchedProgress, setWatchedProgress] = useState(0);
  const navigate = useNavigate();
  const token = localStorage.getItem("jwtToken");
  const youtubePlayerRef = useRef(null);
  const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('roleName');
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
          setEnrolledCourses(response.data.courses.map(course => ({
            ...course,
            progress: `${course.progress}%`,
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
  const handleProgressUpdate = useCallback((courseId, progress) => {
    axios.post(
      `http://localhost:5000/update-progress`,
      { course_id: courseId,   // match backend expected field
        video_progress: progress },
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then((response) => {
        alert(response.data.message);
        fetchEnrolledCourses();
      })
      .catch((error) => {
        console.error("Error updating progress:", error);
        alert("Error updating progress.");
      });
  }, [token, fetchEnrolledCourses]);

  useEffect(() => {
    fetchCourses();
    fetchEnrolledCourses();
    fetchCompletedCourses();
  }, [fetchCourses, fetchEnrolledCourses, fetchCompletedCourses]);

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
  const handleYouTubeProgress = useCallback((event, courseId) => {
    const progress = (event.target.getCurrentTime() / event.target.getDuration()) * 100;
    let updatedProgress = 0;
  
    if (progress >= 0 && progress < 33) updatedProgress = 25;
    else if (progress >= 33 && progress < 66) updatedProgress = 50;
    else if (progress >= 66 && progress <= 100) updatedProgress = 70;
  
    if (updatedProgress !== watchedProgress) {
      setWatchedProgress(updatedProgress);
      handleProgressUpdate(courseId, updatedProgress);
    }
  }, [watchedProgress, handleProgressUpdate]);
  
  useEffect(() => {
    if (modalType === "enrolled" && courseToEnroll?.youtubeLink) {
      const videoId = courseToEnroll.youtubeLink.split("v=")[1];
  
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
            onStateChange: (event) =>
              handleYouTubeProgress(event, courseToEnroll.id),
          },
        });
      }
    }
  }, [modalType, courseToEnroll, handleYouTubeProgress]);
  
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
          </div>
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
          {course.youtubeLink &&   (
                        <div>
                          <strong>Video:</strong>
                          <div id="youtube-player"></div>
                          <p><a href={course.youtubeLink} target="_blank" rel="noopener noreferrer">Watch on YouTube</a></p>
                        </div>
                      )}
      
          {modalType === 'enrolled' ? (
            <>
              <p><strong>Progress:</strong> {course.progress}</p>
              <button onClick={() => handleProgressUpdate(course.id, watchedProgress)}>
                Update Progress
              </button>
            </>
          ) : (
            <button onClick={() => openModal("enroll", course)}>Enroll</button>
          )}
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
    </div>
  );
};

export default LearnerDashboard;
