import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";  // Import axios
import "./hrdashboard.css";

const HRDashboard = () => {
  const [showNewCourseForm, setShowNewCourseForm] = useState(false);
  const [instructors, setInstructors] = useState([]);
  const [showManageCourses, setShowManageCourses] = useState(false);
  const [courses, setCourses] = useState([]);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [courseData, setCourseData] = useState({
    courseId: "",
    title: "",
    description: "",
    instructor: "",
    startDate: "",
    duration: "",
    youtubeLink: "", 
  });
  const navigate = useNavigate(); 
  const [editingCourseId, setEditingCourseId] = useState(null);
  useEffect(() => {
    // Fetch instructors when the component mounts
    axios
      .get("http://localhost:5000/instructors")
      .then((response) => {
        if (response.data.instructors) {
          setInstructors(response.data.instructors);
        } else {
          alert("Failed to load instructors.");
        }
      })
      .catch((error) => console.error("Error fetching instructors:", error));
  }, []);

  const handleChange = (e) => {
  setCourseData({ ...courseData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("jwtToken");
    axios
      .post("http://localhost:5000/add-course", courseData,{
        headers: {
          Authorization: `Bearer ${token}`, // Include token in the request header
      },
      })
      .then((response) => {
        if (response.data.message) {
          alert(response.data.message);
          setShowNewCourseForm(false);
        } else {
          alert(response.data.error || "Failed to create course.");
        }
      })
      .catch((error) => console.error("Error adding course:", error));
  };

  const handleLogout = () => {
    // Clear the local storage to remove user data
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('roleName');

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

  const handleProfile = () => {
    alert("Redirecting to profile...");
    //  profile redirection functionality here
  };

  const fetchCourses = () => {
    const token = localStorage.getItem("jwtToken"); 
    axios
      .get("http://localhost:5000/fetch-all-courses", {
        headers: {
          Authorization: `Bearer ${token}`, // Include token in headers
        },
      })
      .then((response) => {
        console.log("API Response:", response.data.courses); // Debugging
        
        if (response.data.courses && Array.isArray(response.data.courses)) {
          // Map and format course data
          const formattedCourses = response.data.courses.map((course) => ({
            id: course.courseId || "N/A", // Ensure this matches the field for course ID
            title: course.title || "N/A",
            description: course.description || "N/A",
            instructor: course.instructor || "N/A", // Directly use the instructor field
            startDate: course.startDate || "N/A",
            duration: course.duration || "N/A",
            endDate: course.endDate || "N/A",
            youtubeLink: course.youtubeLink || "N/A", 
          }));
          setCourses(formattedCourses);
          setShowManageCourses(true);
        } else {
          alert("No courses found.");
        }
      })
      .catch((error) => {
        console.error("Error fetching courses:", error);
        alert("Failed to fetch courses.");
      });
  };
  useEffect(() => {
    fetchCourses();
  }, []);
  const toggleCourseDetails = (courseId) => {
    setExpandedCourse(expandedCourse === courseId ? null : courseId);
  };
  const handleEditCourse = (course) => {
    setEditingCourseId(course.id);
    setCourseData({
      id: course.id, // Internal ID for backend use
      courseId: course.courseId, 
      title: course.title,
      description: course.description,
      instructor: course.instructor,
      startDate: course.startDate,
      duration: course.duration,
      youtubeLink: course.youtubeLink,
    });
  };

  const handleUpdateCourse = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("jwtToken");
    if (!courseData.title || !courseData.description || !courseData.instructor || !courseData.startDate || !courseData.duration || !courseData.youtubeLink) {
      alert("All fields are required!");
      return;
    }
    axios
      .put(`http://localhost:5000/edit-course`, 
        {
           // Internal ID for backend
          courseId: courseData.courseId,  // Ensure this matches the backend requirement
          title: courseData.title,
          description: courseData.description,
          instructor: courseData.instructor, // Use instructor ID
          start_date: courseData.startDate,
          duration: courseData.duration,
          youtube_link: courseData.youtubeLink,
        },
        {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        if (response.data.message) {
          alert(response.data.message);
          setEditingCourseId(null); // Close the form after successful update
          fetchCourses(); // Re-fetch the courses after update
        } else {
          alert(response.data.error || "Failed to update course.");
        }
      })
      .catch((error) => {
        console.error("Error updating course:", error);
      });
  };
  
  return (
    <div className="dashboard-container">
      <div className="sidebar">
      <ul>
  <li onClick={() => navigate('/home')}>Home</li>
  <li onClick={() => navigate('/hrdashboard')}>Dashboard</li>
  <li onClick={() => navigate('/approvaldashboard')}>Approval Dashboard</li>
</ul>

      </div>

      {/* Main Content */}
      <div className="main-content">
        <img src="logo.jpg.png" alt="Logo" style={{ float: "left", width: "42px", height: "42px" }} />
        <h3>Learn More Do More</h3>

        <div className="top-bar">
          <button className="top-bar-item" onClick={handleLogout}>Logout</button>
          <button className="top-bar-item" onClick={handleProfile}>Profile</button>
        </div>

        {/* Welcome and Actions */}
        <div className="actions-container">
          <h1>Welcome, HR</h1>
          <div className="actions">
            <div className="action-item">
              <div>
                <h3>Add New Courses</h3>
                <p>Add new courses for employees.</p>
              </div>
              <button onClick={() => setShowNewCourseForm(true)}>ADD</button>
            </div>
            <div className="action-item">
              <div>
                <h3>View Progress</h3>
                <p>View progress of the teams.</p>
              </div>
              <button>VIEW</button>
            </div>
            <div className="action-item">
              <div>
                <h3>Assign Members</h3>
                <p>Assign members to each team.</p>
              </div>
              <button>ASSIGN</button>
            </div>
            <div className="action-item">
              <div>
                <h3>Manage Courses</h3>
                <p>Manage available courses.</p>
              </div>
              <button onClick={fetchCourses}>MANAGE</button>
            </div>
            <div className="action-item">
              <div>
                <h3>View Teams</h3>
                <p>View team details.</p>
              </div>
              <button>VIEW</button>
            </div>
          </div>
        </div>
      </div>

        {/* Modal for managing courses */}
        {showManageCourses && (
        <div className="modal">
          <div className="modal-content">
            <h2>View Courses</h2>
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
                        <p><strong>Youtube Link:</strong> <a href={course.youtubeLink} target="_blank" rel="noopener noreferrer">{course.youtubeLink}</a></p>
                        <button onClick={() => handleEditCourse(course)}>
                          Edit
                        </button>
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

      {/* Add New Course Form */}
      {showNewCourseForm && (
        <div className="modal">
          <div className="modal-content">
            <h2>Add New Course</h2>
            <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Course ID</label>
              <input
                type="text"
                name="courseId"  // Adding the courseId input
                value={courseData.courseId}
                onChange={handleChange}
                placeholder="Enter Course ID"
                required  // Assuming courseId should be required
              />
            </div>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  name="title"
                  value={courseData.title}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  name="description"
                  value={courseData.description}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Instructor</label>
                <select
                  name="instructor"
                  value={courseData.instructor}
                  onChange={handleChange}
                >
                  <option value="">Select Instructor</option>
                  {instructors.map((instructor) => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={courseData.startDate}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Duration (weeks)</label>
                <input
                  type="number"
                  name="duration"
                  value={courseData.duration}
                  onChange={handleChange}
                />
              </div>
              <input type="url" name="youtubeLink" placeholder="YouTube Link" value={courseData.youtubeLink} onChange={handleChange} required />
              <button type="submit" className="submit-btn">Submit</button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowNewCourseForm(false)}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
            {/* Edit Course Form */}
            {editingCourseId && (
        <div className="modal">
          <div className="modal-content">
            <h2>Edit Course</h2>
            <form onSubmit={handleUpdateCourse}>
            <div className="form-group">
              <label>Course ID</label>
              <input
                type="text"
                name="courseId"  // Adding the courseId input
                value={courseData.courseId}
                onChange={handleChange}
                placeholder="Enter Course ID"
                required  // Assuming courseId should be required
              />
            </div>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  name="title"
                  value={courseData.title}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  name="description"
                  value={courseData.description}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Instructor</label>
                <select
                  name="instructor"
                  value={courseData.instructor}
                  onChange={handleChange}
                >
                  <option value="">Select Instructor</option>
                  {instructors.map((instructor) => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={courseData.startDate}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Duration (weeks)</label>
                <input
                  type="number"
                  name="duration"
                  value={courseData.duration}
                  onChange={handleChange}
                />
              </div>
              <input
                type="url"
                name="youtubeLink"
                placeholder="YouTube Link"
                value={courseData.youtubeLink}
                onChange={handleChange}
                required
              />
              <button type="submit" className="submit-btn">
                Update
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setEditingCourseId(null)}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRDashboard;
