import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";  // Import axios
import "./hrdashboard.css";

const InstructorDashboard = () => {
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
    modules: [], 
  });
  const navigate = useNavigate(); 
  const [editingCourseId, setEditingCourseId] = useState(null);
    const [modules, setModules] = useState([
      {
        title: "",
        introduction: "",
        points: "",
        youtubeLink: "",
        pdfLink: "",
        quizzes: [
          {
            title: "",
            pass_score:"",
            questions: [
              {
                text: "",
                options: ["", "", "", ""],
                correct_answer: "",
              },
            ],
          },
        ],
      },
    ]);
    useEffect(() => {
      fetchCourses();
    }, []);
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

  const handleAddModule = () => {
    setModules([
      ...modules,
      {
        title: "",
        introduction: "",
        points: "",
        youtubeLink: "",
        pdfLink: "",
        quizzes: [
          {
            title: "",
            pass_score:"",
            questions: [
              {
                text: "",
                options: ["", "", "", ""],
                correct_answer: "",
              },
            ],
          },
        ],
      },
    ]);
  };

  const handleModuleChange = (index, e) => {
    const updatedModules = [...modules];
    updatedModules[index][e.target.name] = e.target.value;
    setModules(updatedModules);
  };

  const handleAddQuiz = (moduleIndex) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex].quizzes.push({
      title: "",
      pass_score:"",
      questions: [{ text: "", options: ["", "", "", ""], correct_answer: "" }],
    });
    setModules(updatedModules);
  };

  const handleQuizChange = (moduleIndex, quizIndex, e) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex].quizzes[quizIndex][e.target.name]  = e.target.value;
    setModules(updatedModules);
  };
  const handleAddQuizQuestion = (moduleIndex, quizIndex) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex].quizzes[quizIndex].questions.push({
      text: "",
      options: ["", "", "", ""],
      correct_answer: "",
    });
    setModules(updatedModules);
  };

  const handleQuizQuestionChange = (
    moduleIndex,
    quizIndex,
    questionIndex,
    e
  ) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex].quizzes[quizIndex].questions[questionIndex][
      e.target.name
    ] = e.target.value;
    setModules(updatedModules);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("jwtToken");
    const payload = {
      ...courseData,
      modules,
    };

    axios
      .post("http://localhost:5000/add-course", payload,{
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
            modules: course.modules.map(module => ({
              ...module, // Mapping all necessary module fields
              quizzes: module.quizzes.map(quiz => ({
                ...quiz,
                questions: quiz.questions.map(question => ({
                  ...question,
                  correct_answer: question.correct_answer || "N/A", // Ensure correct_answer is mapped
                })),
              })),
            })),
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

  const toggleCourseDetails = (courseId) => {
    setExpandedCourse(expandedCourse === courseId ? null : courseId);
  };
  const handleEditCourse = (course) => {
    setEditingCourseId(course.id);
    setCourseData({
      ...course,
      
    });
    setModules(course.modules || [{
      title: "",
      introduction: "",
      points: "",
      youtubeLink: "",
      pdfLink: "",
      quizzes: [
        {
          title: "",
          pass_score: "",
          questions: [
            {
              text: "",
              options: ["", "", "", ""],
              correct_answer: "",
            },
          ],
        },
      ],
    },]);
  };
  const handleUpdateCourse = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("jwtToken");
    const payload = {
      ...courseData,
      startDate: courseData.startDate, 
      modules,
    };
    console.log("Payload:", payload); 
    axios
      .put(`http://localhost:5000/edit-course`, 
        payload,
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
          <h1>Welcome, Instructor</h1>
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
                <h3>Manage Courses</h3>
                <p>Manage available courses.</p>
              </div>
              <button onClick={fetchCourses}>MANAGE</button>
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
 {/* Modules */}
 {course.modules && course.modules.length > 0 ? (
                    <div>
                      <h4>Modules:</h4>
                      {course.modules.map((module, moduleIndex) => (
                        <div key={moduleIndex} className="module">
                          <p>
                            <strong>Title:</strong> {module.title || "N/A"}
                          </p>
                          <p>
                            <strong>Introduction:</strong> {module.introduction || "N/A"}
                          </p>
                          <p>
                            <strong>Points:</strong> {module.points || "N/A"}
                          </p>
                          {module.youtubeLink && (
                            <p>
                              <strong>YouTube Link:</strong>{" "}
                              <a href={module.youtubeLink} target="_blank" rel="noopener noreferrer">
                                {module.youtubeLink}
                              </a>
                            </p>
                          )}
                          {module.pdfLink && (
                            <p>
                              <strong>PDF Link:</strong>{" "}
                              <a href={module.pdfLink} target="_blank" rel="noopener noreferrer">
                                {module.pdfLink}
                              </a>
                            </p>
                          )}
                          {module.quizzes && module.quizzes.length > 0 && (
                            <div>
                              <h5>Quizzes:</h5>
                              {module.quizzes.map((quiz, quizIndex) => (
                                <div key={quizIndex} className="quiz">
                                  <p>
                                    <strong>Quiz Title:</strong> {quiz.title || "N/A"}
                                  </p>
                                  {quiz.questions.map((question, questionIndex) => (
                                    <div key={questionIndex} className="question">
                                      <p>
                                        <strong>Question {questionIndex + 1}:</strong> {question.text || "N/A"}
                                      </p>
                                      <p>
                                        <strong>Options:</strong> {question.options.join(", ")}
                                      </p>
                                      <p>
                                        <strong>Correct Answer:</strong> {question.correct_answer || "N/A"}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No modules available.</p>
                  )}

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
              <div className="form-group">
                <label>Modules</label>
                {modules.map((module, moduleIndex) => (
                  <div key={moduleIndex}>
                    <input
                      type="text"
                      name="title"
                      placeholder="Module Title"
                      value={module.title}
                      onChange={(e) => handleModuleChange(moduleIndex, e)}
                    />
                    <input
      type="text"
      name="introduction"
      placeholder="Introduction"
      value={module.introduction}
      onChange={(e) => handleModuleChange(moduleIndex, e)}
    />              
    <input
      type="text"
      name="points"
      placeholder="Learning Points"
      value={module.points}
      onChange={(e) => handleModuleChange(moduleIndex, e)}
    />
    <input
      type="url"
      name="youtubeLink"
      placeholder="Videolink"
      value={module.youtubeLink}
      onChange={(e) => handleModuleChange(moduleIndex, e)}
    />
    <input
      type="url"
      name="pdfLink"
      placeholder="pdflink"
      value={module.pdfLink}
      onChange={(e) => handleModuleChange(moduleIndex, e)}
    />
    
                    <button
                      type="button"
                      onClick={() => handleAddQuiz(moduleIndex)}
                    >
                      Add Quiz
                    </button>
                    {module.quizzes.map((quiz, quizIndex) => (
        <div key={quizIndex}>
          <input
            type="text"
            name="title"
            placeholder="Quiz Title"
            value={quiz.title}
            onChange={(e) =>
              handleQuizChange(moduleIndex, quizIndex, e)
            }
          />
          <input
                      type="number"
                      name="pass_score" // New input for pass score
                      placeholder="Passing Score"
                      value={quiz.pass_score||""}
                      onChange={(e) =>
                        handleQuizChange(moduleIndex, quizIndex, e)
                      }
                    />
          {quiz.questions.map((question, questionIndex) => (
            <div key={questionIndex}>
              <input
                type="text"
                name="text"
                placeholder="Question Text"
                value={question.text}
                onChange={(e) =>
                  handleQuizQuestionChange(
                    moduleIndex,
                    quizIndex,
                    questionIndex,
                    e
                  )
                }
              />
              {question.options.map((_, optionIndex) => (
                <input
                  key={optionIndex}
                  type="text"
                  name={`option${optionIndex}`}
                  placeholder={`Option ${optionIndex + 1}`}
                  value={question.options[optionIndex]}
                  onChange={(e) => {
                    const updatedModules = [...modules];
                    updatedModules[moduleIndex].quizzes[quizIndex].questions[
                      questionIndex
                    ].options[optionIndex] = e.target.value;
                    setModules(updatedModules);
                  }}
                />
              ))}
              <input
                type="text"
                name="correct_answer"
                placeholder="Correct Answer"
                value={question.correct_answer}
                onChange={(e) =>
                  handleQuizQuestionChange(
                    moduleIndex,
                    quizIndex,
                    questionIndex,
                    e
                  )
                }
              />
              <button
                type="button"
                onClick={() =>
                  handleAddQuizQuestion(moduleIndex, quizIndex)
                }
              >
                Add Question
              </button>
            </div>
          ))}
        </div>
      ))}
                  </div>
                ))}
                <button type="button" onClick={handleAddModule}>
                  Add Module
                </button>
              </div>
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
              <div className="form-group">
                <label>Modules</label>
                {modules.map((module, moduleIndex) => (
                  <div key={moduleIndex}>
                    <input
                      type="text"
                      name="title"
                      placeholder="Module Title"
                      value={module.title}
                      onChange={(e) => handleModuleChange(moduleIndex, e)}
                    />
                    <input
                type="text"
                name="introduction"
                placeholder="Introduction"
                value={module.introduction}
                onChange={(e) => handleModuleChange(moduleIndex, e)}
              />
              <input
                type="text"
                name="points"
                placeholder="Learning Points"
                value={module.points}
                onChange={(e) => handleModuleChange(moduleIndex, e)}
              />
              <input
                type="url"
                name="youtubeLink"
                placeholder="Video Link"
                value={module.youtubeLink}
                onChange={(e) => handleModuleChange(moduleIndex, e)}
              />
              <input
                type="url"
                name="pdfLink"
                placeholder="PDF Link"
                value={module.pdfLink}
                onChange={(e) => handleModuleChange(moduleIndex, e)}
              />
                    <button
                      type="button"
                      onClick={() => handleAddQuiz(moduleIndex)}
                    >
                      Add Quiz
                    </button>
                    {module.quizzes.map((quiz, quizIndex) => (
        <div key={quizIndex}>
          <input
            type="text"
            name="title"
            placeholder="Quiz Title"
            value={quiz.title}
            onChange={(e) =>
              handleQuizChange(moduleIndex, quizIndex, e)
            }
          />
          {quiz.questions.map((question, questionIndex) => (
            <div key={questionIndex}>
              <input
                type="text"
                name="text"
                placeholder="Question Text"
                value={question.text}
                onChange={(e) =>
                  handleQuizQuestionChange(
                    moduleIndex,
                    quizIndex,
                    questionIndex,
                    e
                  )
                }
              />
              {question.options.map((_, optionIndex) => (
                <input
                  key={optionIndex}
                  type="text"
                  name={`option${optionIndex}`}
                  placeholder={`Option ${optionIndex + 1}`}
                  value={question.options[optionIndex]}
                  onChange={(e) => {
                    const updatedModules = [...modules];
                    updatedModules[moduleIndex].quizzes[quizIndex].questions[
                      questionIndex
                    ].options[optionIndex] = e.target.value;
                    setModules(updatedModules);
                  }}
                />
              ))}
              <input
                type="text"
                name="correct_answer"
                placeholder="Correct Answer"
                value={question.correct_answer}
                onChange={(e) =>
                  handleQuizQuestionChange(
                    moduleIndex,
                    quizIndex,
                    questionIndex,
                    e
                  )
                }
              />
              <button
                type="button"
                onClick={() =>
                  handleAddQuizQuestion(moduleIndex, quizIndex)
                }
              >
                Add Question
              </button>
            </div>
          ))}
        </div>
      ))}
                  </div>
                ))}
                <button type="button" onClick={handleAddModule}>
                  Add Module
                </button>
              </div>
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

export default InstructorDashboard;
