import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
  } from "chart.js";
  ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
const QuizPage = () => {
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("jwtToken");

  useEffect(() => {
    axios
      .get(`http://localhost:5000/fetch-quiz-for-module/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        console.log("Quiz data fetched successfully:", response);
        if (response.data.quizzes && response.data.quizzes.length > 0) {
          setQuiz(response.data.quizzes[0]); // Assuming a single quiz for the module
        } else {
          alert("No quizzes found for this module.");
        }
      })
      .catch((error) => {
        console.error("Error fetching quiz:", error.response || error);  // Log full error
        alert(`Error fetching quiz: ${error.message || 'Unknown error'}`);
      });
  }, [quizId, token]);

  const handleOptionChange = (questionId, selectedOption) => {
    setAnswers((prev) => ({ ...prev, [questionId]: selectedOption }));
  };

  const submitQuiz = () => {
    axios
      .post(
        `http://localhost:5000/submit-quiz/${quiz.quizId}`,
        { answers },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((response) => {
        alert(response.data.message);
        setResults(response.data);
        setShowResults(true);
      })
      .catch((error) => {
        console.error("Error submitting quiz:", error);
        alert("Error submitting quiz.");
      });
  };

  const viewResults = () => {
    axios
      .get(`http://localhost:5000/view-quiz-results/${quiz.quizId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setResults(response.data);
      })
      .catch((error) => {
        console.error("Error fetching results:", error);
        alert("Error fetching results.");
      });
  };

  return (
    <div className="quiz-container">
      <style>{`
        .quiz-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
          color: #333;
          background-color: #f9f9f9;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          
        }

        h1 {
          text-align: center;
          color: #4caf50;
          margin-bottom: 20px;
        }

        h2 {
          color: #333;
          margin-bottom: 15px;
        }

        .question-wrapper {
          margin-bottom: 20px;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 5px;
          background-color: #fff;
        }

        .question-number {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #333;
        }

        .question-text {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 10px;
          text-align: left;
        }

        .option-container {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-start;
          gap: 8px;
        }

        .option {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        input[type="radio"], input[type="checkbox"] {
          margin: 0;
          width: 18px;
          height: 18px;
        }

        label {
          font-size: 16px;
          cursor: pointer;
        }
        .question-divider {
          height: 5px;
          background-color: #0c002b;
          margin: 20px 0;
        }
        button {
          display: block;
          width: 100%;
          padding: 10px;
          font-size: 16px;
          font-weight: bold;
          color: #fff;
          background-color: #4caf50;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          margin-top: 20px;
        }

        button:hover {
          background-color: #45a049;
        }

        .results-container {
          text-align: center;
          margin-top: 20px;
        }
      `}</style>
      <h1>Quiz Page</h1>
      {!showResults ? (
        quiz ? (
          <div className="quiz-container">
            <h2>{quiz.title}</h2>
            {quiz.questions && quiz.questions.length > 0 ? (
              quiz.questions.map((question,index) => (
                <div key={question.id} className="question-wrapper">
                  <p className="question-number">Q{index + 1} of {quiz.questions.length}</p>
                  <p className="question-text">{question.text}</p>
                  <div className="option-container">
                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="option">
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={option}
                          checked={answers[question.id] === option}
                          onChange={() => handleOptionChange(question.id, option)}
                        />
                        <label>{option}</label>
                      </div>
                    ))}
                  </div>

                  <div className="question-divider"></div>
                </div>
              ))
            ) : (
              <p>No questions available for this quiz.</p>
            )}
            <button onClick={submitQuiz}>Submit Quiz</button>
          </div>
        ) : (
          <p>Loading quiz...</p>
        )
      ) : (
        <div className="results-container">
          <h2>Quiz Results</h2>
          {results ? (
            <div>
                <button onClick={viewResults}>View Results</button>
              <p>Total Score: {results.totalScore}%</p>
              <p>{results.passStatus ? "You Passed!" : "You Failed."}</p> {/* Display pass/fail status */}
              <Bar
                data={{
                  labels: ["Correct", "Incorrect", "Unanswered"],
                  datasets: [
                    {
                      label: "Quiz Results",
                      data: [
                        results.correctAnswers,
                        results.incorrectAnswers,
                        results.unansweredQuestions,
                      ],
                      backgroundColor: ["#4caf50", "#f44336", "#ffeb3b"],
                    },
                  ],
                }}
                options={{
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
              <button onClick={() => navigate(-1)}>Back to Dashboard</button>
            </div>
          ) : (
            <p>Loading results...</p>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizPage;
