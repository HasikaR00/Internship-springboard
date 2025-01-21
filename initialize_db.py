import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)

# Define the directory for the database
db_dir = 'D:/m'

# If the directory doesn't exist, create it
if not os.path.exists(db_dir):
    os.makedirs(db_dir)

# Configure the SQLAlchemy URI
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(db_dir, 'database.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize the database
db = SQLAlchemy(app)

# Define the Role table
class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)

# Define the User table
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    phone_number = db.Column(db.String(15), nullable=False)
    country = db.Column(db.String(50), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=False)
    role = db.relationship('Role', backref=db.backref('users', lazy=True))
    is_approved = db.Column(db.Boolean, default=False) 

# Define the PasswordReset table to store OTPs
class PasswordReset(db.Model):
    __tablename__ = 'password_resets'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), db.ForeignKey('users.email'), nullable=False)
    otp = db.Column(db.String(6), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_verified = db.Column(db.Boolean, default=False)


    # Define the Courses table
class Course(db.Model):
    __tablename__ = 'courses'
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.String(50), unique=True, nullable=False)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255), nullable=False)
    instructor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)  # Foreign key for instructor
    instructor = db.relationship('User', backref=db.backref('courses', lazy=True)) 
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    duration = db.Column(db.Integer, nullable=False)
    progress = db.Column(db.Float, default=0.0) 

class Enrollment(db.Model):
    __tablename__ = 'enrollments'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    progress = db.Column(db.Float, default=0.0)
    module_progress = db.Column(db.JSON, default={})  # JSON to track progress per module
    feedback = db.Column(db.Text, nullable=True) 
    user = db.relationship('User', backref=db.backref('enrollments', lazy=True))
    course = db.relationship('Course', backref=db.backref('enrollments', lazy=True))

class Module(db.Model):
    __tablename__ = 'modules'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    introduction = db.Column(db.Text, nullable=True)
    points = db.Column(db.Text, nullable=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    youtube_link = db.Column(db.String(255), nullable=False)
    pdf_link = db.Column(db.String(255), nullable=False)
    course = db.relationship('Course', backref=db.backref('modules', lazy=True))
class Quiz(db.Model):
    __tablename__ = 'quizzes'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    module_id = db.Column(db.Integer, db.ForeignKey('modules.id'), nullable=False)
    pass_score = db.Column(db.Integer, nullable=False)  # Minimum score to pass
    module = db.relationship('Module', backref=db.backref('quizzes', lazy=True))
    questions = db.relationship('Question', backref='quiz', lazy=True)

class Question(db.Model):
    __tablename__ = 'questions'
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id'), nullable=False)
    text = db.Column(db.Text, nullable=False)
    options = db.Column(db.JSON, nullable=False)
    correct_answer = db.Column(db.String(100), nullable=False)

class QuizAttempt(db.Model):
    __tablename__ = 'quiz_attempts'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quizzes.id'), nullable=False)
    correct_answers = db.Column(db.Integer, default=0)
    incorrect_answers = db.Column(db.Integer, default=0)
    unanswered_questions = db.Column(db.Integer, default=0)
    total_score = db.Column(db.Float, default=0.0)  # Total score for the quiz
    pass_status = db.Column(db.Boolean, default=False)  # Pass/Fail status
    user = db.relationship('User', backref=db.backref('quiz_attempts', lazy=True))
    quiz = db.relationship('Quiz', backref=db.backref('attempts', lazy=True))




def initialize_database():
    """
    Initialize the database and pre-populate roles if they don't exist.
    """
    with app.app_context():
        # Create all tables in the database
        db.create_all()

        # Add default roles if not already present
        roles = ['Learner', 'HR', 'Manager', 'Instructor']
        for role_name in roles:
            if not Role.query.filter_by(name=role_name).first():
                db.session.add(Role(name=role_name))

        # Commit the session to save roles to the database
        try:
            db.session.commit()
            print("Database initialized successfully with roles and tables.")
        except Exception as e:
            db.session.rollback()
            print(f"An error occurred while initializing the database: {e}")

if __name__ == "__main__":
    initialize_database()
