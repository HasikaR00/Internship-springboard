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
    modules: [],
  });
  const [showTeamsModal, setShowTeamsModal] = useState(false);
const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [learners, setLearners] = useState([]);
  const [managers, setManagers] = useState([]);
  const [showCreateTeamForm, setShowCreateTeamForm] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [selectedManager, setSelectedManager] = useState("");
  const [teams, setTeams] = useState([]);
  const [selectedLearners, setSelectedLearners] = useState([]);
  const [ selectedCourseForLearners,setSelectedCourseForLearners] = useState(null);
  const [insights, setInsights] = useState({ total_courses: 0, total_enrollments: 0, top_performers: [] });
  const [learnersProgress, setLearnersProgress] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

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
  const [expandedLearner, setExpandedLearner] = useState(null);
  useEffect(() => {
    fetchCourses();
    fetchLearnersProgress();
    fetch1Courses();
    fetchManagers();
    fetchTeams();
    fetchInsights();
  }, []);

const toggleLearnerDetails = (learnerId) => {
  setExpandedLearner(expandedLearner === learnerId ? null : learnerId);
};

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
  const fetch1Courses = () => {
    const token = localStorage.getItem("jwtToken");
    axios.get("http://localhost:5000/courses", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(response => setCourses(response.data.courses || []))
    .catch(error => console.error("Error fetching courses:", error));
  };

  const fetchManagers = () => {
    const token = localStorage.getItem("jwtToken");
    axios.get("http://localhost:5000/managers", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(response => setManagers(response.data.managers || []))
    .catch(error => console.error("Error fetching managers:", error));
  };

  const fetchTeams = () => {
    const token = localStorage.getItem("jwtToken");
    axios.get("http://localhost:5000/teams", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(response => setTeams(response.data || []))
    .catch(error => console.error("Error fetching teams:", error));
  };

  const fetchInsights = () => {
    const token = localStorage.getItem("jwtToken");
    axios.get("http://localhost:5000/insights", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(response => setInsights(response.data || {}))
    .catch(error => console.error("Error fetching insights:", error));
  };

  const handleCourseSelection = (selectedCourseId) => {
    setSelectedCourseForLearners(selectedCourseId);  // Use selectedCourseId instead of courseId
    console.log("Selected Course for Learners:", selectedCourseId);
    if (selectedCourseId) {
      fetchCourseLearners(selectedCourseId);  // Pass the selectedCourseId to fetchLearners
    }
};

const fetchCourseLearners = (selectedCourseId) => {
    const token = localStorage.getItem("jwtToken");

    if (!selectedCourseId) {
      alert("Invalid course selected.");
      return;
    }

    axios
      .get(`http://localhost:5000/course-learners/${selectedCourseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        console.log("Learners for the course:", response.data.learners);

        if (Array.isArray(response.data.learners) && response.data.learners.length > 0) {
          setLearners(response.data.learners); // Populate learners state
        } else {
          setLearners([]); // Reset learners if none are found
          alert("No learners found for the selected course.");
        }
      })
      .catch((error) => {
        console.error("Error fetching course learners:", error.response?.data || error.message);
        alert("Failed to fetch learners for the selected course.");
      });
};

  const handleCreateTeam = () => {
    const token = localStorage.getItem("jwtToken");
    if (!selectedCourseForLearners) {
      alert("Please select a course before creating a team.");
      return;
    }
    if (!teamName || !selectedManager || selectedLearners.length < 2) {
      alert("Please fill all fields and select at least 2 learners.");
      return;
    }

    const payload = { teamName, managerId: selectedManager, memberIds: selectedLearners };
    axios.post("http://localhost:5000/create-team", payload, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(response => {
      alert(response.data.message || "Team created successfully.");
      setShowCreateTeamForm(false);
      setTeamName("");
      setSelectedManager("");
      setSelectedLearners([]);
      fetchTeams(); // Refresh teams
    })
    .catch(error => alert("Error creating team:", error));
  };

  const toggleLearnerSelection = (learnerId) => {
    setSelectedLearners((prevSelected) => {
      if (prevSelected.includes(learnerId)) {
        // If already selected, remove from the array
        return prevSelected.filter((id) => id !== learnerId);
      } else if (prevSelected.length < 5) {
        // Limit selection to 5 learners
        return [...prevSelected, learnerId];
      } else {
        alert("You can select up to 5 learners only.");
        return prevSelected;
      }
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
  const fetchLearnersProgress = () => {
     
    const token = localStorage.getItem("jwtToken");
    axios
      .get("http://localhost:5000/fetch-learners-progress", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        console.log("Learners progress response:", response.data); 
        if (response.data) {
          const transformedData = Object.values(response.data).map((learner) => ({
            id: learner.id || null, // Provide a fallback if ID is missing
            name: learner.learnerName,
            email: learner.learnerEmail,
            courses: learner.enrolledCourses.map((course) => ({
              id: course.id || null, 
              title: course.courseName,
              progress: course.courseProgress,
              moduleProgress: course.moduleProgress,
              quizResults: course.quizResults,
              
            })),
          }));
          console.log("Transformed Data:", transformedData); 
          setLearnersProgress(transformedData);
          
        } else {
          alert("No learners' progress found.");
        }
      })
      .catch((error) => {
        console.error("Error fetching learners' progress:", error);
        alert("Failed to fetch learners' progress.");
      });
  };

  const handleProvideFeedback = () => {
    const token = localStorage.getItem("jwtToken");
    const payload = { feedback };
    console.log("Selected Learner:", selectedLearner);  // Log learner ID
    console.log("Selected Course:", selectedCourse);    // Log course ID
    if (!selectedLearner ) {
      alert("Invalid learner .");
      return;
    }
    if (!selectedCourse ) {
      alert("Invalid course .");
      return;
    }
  

    axios
      .post(`http://localhost:5000/provide-feedback/${selectedLearner}/${selectedCourse}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        alert(response.data.message || "Feedback provided successfully!");
        setShowFeedbackModal(false); // Close the modal after feedback submission
        setFeedback(""); 
      })
      .catch((error) => {
        console.error("Error providing feedback:", error);
        alert("Failed to provide feedback.");
      });
  };
  const handleViewTeams = () => {
    setShowTeamsModal(true); // Show the teams modal
  };
  const handleViewInsights = () => {
    setShowInsightsModal(true); // Show the insights modal
  };
  const handleShowCreateTeamForm = () => {
    setShowCreateTeamForm(true); // Show the create team form modal
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
              <button onClick= {() => {
        setShowProgressModal(true); // Show progress modal
        fetchLearnersProgress();   // Fetch progress data
      }} >
            
            View
          </button>
            </div>
            <div className="action-item">
  <h3>Insights</h3>
  <button onClick={handleViewInsights}>View Insights</button>
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
              <h3>Teams</h3>
              </div>
              <button onClick={handleViewTeams}>View Teams</button>
            </div>



              <div className="action-item">
                <div>
  <h3>Create Team</h3>
  </div>
  <button onClick={handleShowCreateTeamForm}>Create Team</button>
</div>

          {/* Modal for teams details*/}
{showTeamsModal && (
  <div className="popup-overlay">
    <div className="teams-popup">
      <h3>Teams</h3>
      {teams?.length > 0 ? (
        teams.map((team) => (
          <div key={team.id} className="team-details">
            <h4>{team.name}</h4>
            <p>Manager: {team.manager_name}</p>
            <h5>Members:</h5>
            <ul>
              {team.members?.length > 0 ? (
                team.members.map((member) => (
                  <li key={member.id}>{member.name}</li>
                ))
              ) : (
                <li>No members available.</li>
              )}
            </ul>
          </div>
        ))
      ) : (
        <p>No teams available.</p>
      )}
      <div className="popup-actions">
        <button onClick={() => setShowTeamsModal(false)}>Close</button>
      </div>
    </div>
  </div>
)}
           {/* Insights Section */}
           {showInsightsModal && (
  <div className="popup-overlay">
    <div className="insights-popup">
      <h3>Insights</h3>
      <p>Total Courses: {insights?.total_courses || 0}</p>
      <p>Total Enrollments: {insights?.total_enrollments || 0}</p>
      <h4>Top Performers:</h4>
      <ul>
        {insights?.top_performers?.length > 0 ? (
          insights.top_performers.map((performer, index) => (
            <li key={index}>{performer.name} (Score: {performer.score})</li>
          ))
        ) : (
          <li>No top performers available.</li>
        )}
      </ul>
      <div className="popup-actions">
        <button onClick={() => setShowInsightsModal(false)}>Close</button>
      </div>
    </div>
  </div>
)}


{/* Teams Section 
<div className="action-item">
  <h3>Teams</h3>
  {teams?.length > 0 ? (
    teams.map((team) => (
      <div key={team.id} className="team-card">
        <h4>{team.name}</h4>
        <p>Manager: {team.manager_name}</p>
        <h5>Members:</h5>
        <ul>
          {team.members?.length > 0 ? (
            team.members.map((member) => (
              <li key={member.id}>{member.name}</li>
            ))
          ) : (
            <li>No members available.</li>
          )}
        </ul>
      </div>
    ))
  ) : (
    <p>No teams available.</p>
  )}
</div>
*/}
            

          </div>
        </div>
      </div>


{/* Create Team Form */}
{showCreateTeamForm && (
  <div className="popup-overlay">
    <div className="create-team-popup">
      <h3>Create Team</h3>
      <div>
        <label>Select Course:</label>
        <select
          onChange={(e) => handleCourseSelection(e.target.value)}
          value={selectedCourseForLearners || ""}
        >
          <option value="" disabled>-- Select a course --</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>{course.title}</option>
          ))}
        </select>
      </div>

      {selectedCourseForLearners && learners.length > 0 && (
        <div>
          <label>Select Learners (2-5):</label>
          {learners.map((learner) => (
            <div key={learner.id}>
              <input
                type="checkbox"
                id={learner.id}
                checked={selectedLearners.includes(learner.id)}
                onChange={() => toggleLearnerSelection(learner.id)}
              />
              <label htmlFor={learner.id}>{learner.name}</label>
            </div>
          ))}
        </div>
      )}

      <div>
        <label>Team Name:</label>
        <input
          type="text"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
        />
      </div>

      <div>
        <label>Select Manager:</label>
        <select
          value={selectedManager}
          onChange={(e) => setSelectedManager(e.target.value)}
        >
          <option value="">-- Select Manager --</option>
          {managers.map((manager) => (
            <option key={manager.id} value={manager.id}>{manager.name}</option>
          ))}
        </select>
      </div>

      <div className="popup-actions">
        <button onClick={handleCreateTeam}>Create Team</button>
        <button onClick={() => setShowCreateTeamForm(false)}>Cancel</button>
      </div>
    </div>
  </div>
)}


{/* Display Learners' Progress */}
{showProgressModal && (
  <div className="modal">
    <div className="modal-content">
      <h2>View Learners' Progress</h2>
      
      <div className="courses-container">
        {learnersProgress.length > 0 ? (
          learnersProgress.map((learner) => (
            <div key={learner.id} className="course-dropdown">
              <button
                className="course-title"
                onClick={() => toggleLearnerDetails(learner.id)}
              >
                {learner.name}
              </button>
              {expandedLearner === learner.id && (
                <div className="course-details">
                  <p>
                    <strong>Email:</strong> {learner.email}
                  </p>
                  {learner.courses?.length > 0 ? (
                    learner.courses.map((course, index) => (
                      <div key={index} className="module">
                        <h4>{course.title}</h4>
                        <p>
                          <strong>Progress:</strong> {course.progress}%
                        </p>
                        <h5>Module Progress:</h5>
                        {course.moduleProgress ? (
                          <ul>
                            {Object.entries(course.moduleProgress).map(
                              ([moduleId, progress]) => (
                                <li key={moduleId}>
                                  Module {moduleId}: {progress}%
                                </li>
                              )
                            )}
                          </ul>
                        ) : (
                          <p>No module progress available</p>
                        )}
                        <h5>Quiz Results:</h5>
                        {course.quizResults?.length > 0 ? (
                          <ul>
                            {course.quizResults.map((quiz, quizIndex) => (
                              <li key={quizIndex}>
                                Quiz ID: {quiz.quizId}, Pass Status:{" "}
                                {quiz.passStatus ? "Passed" : "Failed"}, Total
                                Score: {quiz.totalScore}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>No quiz results available</p>
                        )}
                        <button
                          onClick={() => {
                            setSelectedLearner(learner.id);
                            setSelectedCourse(course.id);
                            setShowFeedbackModal(true);
                          }}
                        >
                          Provide Feedback
                        </button>
                      </div>
                    ))
                  ) : (
                    <p>No courses available for this learner.</p>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <p>No learners' progress available.</p>
        )}
      </div>
      <button
        type="button"
        className="cancel-btn"
        onClick={() => setShowProgressModal(false)}
      >
        Close
      </button>
    </div>
  </div>
)}

       {/* Feedback Modal */}
       {showFeedbackModal && (
        <div className="popup-overlay">
          <div className="feedback-popup">
            <h2>Provide Feedback</h2>
            <textarea
              placeholder="Enter your feedback here..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
            <div className="popup-actions">
              <button onClick={() => setShowFeedbackModal(false)}>Cancel</button>
              <button
                onClick={() => {
                  handleProvideFeedback(selectedLearner, selectedCourse); // Submit feedback
                }}
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}

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
                    <strong>Course ID:</strong> {course.id}
                  </p>
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

export default HRDashboard;
