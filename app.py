from flask import Flask, request, jsonify,session
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import random
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import timedelta
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity,get_jwt
from flask_bcrypt import Bcrypt


# Set session duration

app = Flask(__name__)
bcrypt = Bcrypt(app)  # Initialize Bcrypt with your Flask app
app.permanent_session_lifetime = timedelta(days=7)
app.config['SECRET_KEY'] = '66b38a31ae6691c6bd780fdfefcbb0d6b290f1d807e6e5ac'  
CORS(app, supports_credentials=True, resources={r"/*": {"origins": "http://localhost:3000"}}, methods=["GET", "POST", "OPTIONS","PUT"], allow_headers=["Content-Type", "Authorization"])
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///D:/m/database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)
# Database Models
class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)

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

class PasswordReset(db.Model):
    __tablename__ = 'password_resets'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), db.ForeignKey('users.email'), nullable=False)
    otp = db.Column(db.String(6), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_verified = db.Column(db.Boolean, default=False)

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
    youtube_link = db.Column(db.String(255), nullable=False)


class Enrollment(db.Model):
    __tablename__ = 'enrollments'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    progress = db.Column(db.Float, default=0.0)
    user = db.relationship('User', backref=db.backref('enrollments', lazy=True))
    course = db.relationship('Course', backref=db.backref('enrollments', lazy=True))




# Helper Functions
def validate_password(password):
    if len(password) < 8:
        return False
    if not any(char.isdigit() for char in password):
        return False
    if not any(char.isupper() for char in password):
        return False
    if not any(char in '!@#$%^&*()_+-=[]{}|;:,.<>?/' for char in password):
        return False
    return True

def send_otp_email(to_email, otp):
    smtp_server = "smtp.office365.com"
    port = 587
    sender_email = "bl.en.u4cse22276@bl.students.amrita.edu"
    password = "ogeodhti"

    subject = "Your OTP for Password Reset"
    body = f"Your OTP for password reset is: {otp}"

    message = MIMEMultipart()
    message["From"] = sender_email
    message["To"] = to_email
    message["Subject"] = subject
    message.attach(MIMEText(body, "plain"))

    try:
        server = smtplib.SMTP(smtp_server, port)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, to_email, message.as_string())
    except Exception as e:
        print(f"Error: {e}")
    finally:
        server.quit()

def send_email_notification(instructor, team_emails, title, start_date, end_date):
    smtp_server = "smtp.office365.com"
    port = 587
    sender_email = "bl.en.u4cse22276@bl.students.amrita.edu"
    password = "ogeodhti"

    subject = f"New Course Created: {title}"
    body = (f"Hello,\n\nA new course titled '{title}' has been created.\n\n"
            f"Instructor: {instructor}\n"
            f"Start Date: {start_date}\n"
            f"End Date: {end_date}\n\n"
            f"Regards,\nCourse Management Team")

    message = MIMEMultipart()
    message["From"] = sender_email
    message["Subject"] = subject
    message.attach(MIMEText(body, "plain"))

    try:
        server = smtplib.SMTP(smtp_server, port)
        server.starttls()
        server.login(sender_email, password)
        for email in team_emails:
            message["To"] = email
            server.sendmail(sender_email, email, message.as_string())
    except Exception as e:
        print(f"Error: {e}")
    finally:
        server.quit()

def send_approval_email_notification(recipient_email, user_name):
    smtp_server = "smtp.office365.com"
    port = 587
    sender_email = "bl.en.u4cse22276@bl.students.amrita.edu"
    password = "ogeodhti"

    subject = "Account Approved"
    body = (f"Hello {user_name},\n\n"
            "Congratulations! Your account has been successfully approved. You now have full access to the system.\n\n"
            "Thank you for being a part of our platform.\n\n"
            "Best regards,\nThe Team")

    message = MIMEMultipart()
    message["From"] = sender_email
    message["Subject"] = subject
    message.attach(MIMEText(body, "plain"))

    try:
        server = smtplib.SMTP(smtp_server, port)
        server.starttls()
        server.login(sender_email, password)

        message["To"] = recipient_email
        server.sendmail(sender_email, recipient_email, message.as_string())
    except Exception as e:
        print(f"Error: {e}")
    finally:
        server.quit()

def send1_email_notification(instructor, team_emails, title, start_date, end_date):
    smtp_server = "smtp.office365.com"
    port = 587
    sender_email = "bl.en.u4cse22276@bl.students.amrita.edu"
    password = "ogeodhti"

    subject = f"Course Updated: {title}"
    body = (f"Hello,\n\nThe course titled '{title}' has been updated.\n\n"
            f"Instructor: {instructor}\n"
            f"Start Date: {start_date}\n"
            f"End Date: {end_date}\n\n"
            f"Regards,\nCourse Management Team")

    message = MIMEMultipart()
    message["From"] = sender_email
    message["Subject"] = subject
    message.attach(MIMEText(body, "plain"))

    try:
        server = smtplib.SMTP(smtp_server, port)
        server.starttls()
        server.login(sender_email, password)
        for email in team_emails:
            message["To"] = email
            server.sendmail(sender_email, email, message.as_string())
    except Exception as e:
        print(f"Error: {e}")
    finally:
        server.quit()


# Routes
#default_manager
def create_default_hr():
    hr_role = Role.query.filter_by(name='HR').first()
    if not hr_role:
        hr_role = Role(name='HR')
        db.session.add(hr_role)
        db.session.commit()

    default_hr = User.query.filter_by(email='vertambi4@gmail.com').first()
    if not default_hr:
        hashed_password = generate_password_hash('DefaultHR@123')
        default_hr = User(
            full_name='HR',
            email='vertambi4@gmail.com',
            password=hashed_password,
            phone_number='7412547890',
            country='India',
            role_id=hr_role.id,
            is_approved=True  # Default HR is approved by default
        )
        db.session.add(default_hr)
        db.session.commit()

#session-lasts for more time
@app.before_request
def make_session_permanent():
    session.permanent = True


# Add this setup function to ensure the default HR is created
@app.before_request
def setup():
    create_default_hr()
#singup
@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    required_fields = ['full_name', 'email', 'password', 'confirm_password', 'phone_number', 'country', 'role']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({"error": f"{field.replace('_', ' ').capitalize()} is required."}), 400

    password = data['password']
    confirm_password = data['confirm_password']
    if password != confirm_password:
        return jsonify({"error": "Passwords do not match!"}), 400

    if not validate_password(password):
        return jsonify({
            "error": "Password must be at least 8 characters long, contain a digit, a special character, and an uppercase letter."
        }), 400

    phone_number = data['phone_number']
    if len(phone_number) != 10 or not phone_number.isdigit():
        return jsonify({"error": "Phone number must be exactly 10 digits."}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "Email is already registered."}), 400

    hashed_password = generate_password_hash(password, method='scrypt')

    role_name = data.get('role', 'Learner')
    role = Role.query.filter_by(name=role_name).first()
    if not role:
        return jsonify({"error": f"Role '{role_name}' not found!"}), 400

    new_user = User(
        full_name=data['full_name'],
        email=data['email'],
        password=hashed_password,
        phone_number=data['phone_number'],
        country=data['country'],
        role_id=role.id,
        is_approved=False
    )

    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "Signup successful, waiting for HR approval..."}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

#login
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    print(data)  # To log incoming data

    email = data.get('email')
    password = data.get('password')
    role_id = data.get('role_id') 

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({"error": "Invalid email or password."}), 400

    if not user.is_approved:
        return jsonify({"error": "Your account is pending approval. Please wait for HR to approve your account."}), 403

    if user.role_id != role_id:
        return jsonify({"error": "Role mismatch. Please select the correct role."}), 400
    # Fetch role ID and check if it matches the selected role
    role = Role.query.filter_by(id=role_id).first()
    if not role: 
        return jsonify({"error": "Role not found."}), 400

    access_token = create_access_token(
        identity=str(user.id),  # Identity must be a string
        additional_claims={
            "email": user.email,
            "role": Role.query.get(role_id).name
        }
    )
    session['role'] = Role.query.get(role_id).name
    session['email'] = email

    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "role_name": session['role'],
        "redirect": f"/{role.name.lower()}dashboard"
    }), 200
@app.route('/login', methods=['OPTIONS'])
def login_options():
    return '', 204

@app.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user_id = get_jwt_identity()  # Retrieve user ID from JWT
    user = User.query.get(current_user_id)
    return jsonify({"message": f"Welcome {user.full_name}!"}), 200


#get-pending-approvals
@app.route('/pending-approvals', methods=['GET'])
@jwt_required()
def pending_approvals():
    current_user = get_jwt_identity()  # Identity passed during token creation
    claims = get_jwt()  # This retrieves all the claims

    role = claims.get("role")  

    if not role:
        return jsonify({"error": "Role not found in session."}), 403

    # HR can view all pending users
    if role == 'HR':
        users = User.query.filter_by(is_approved=False).all()
    # Manager can only view pending HR approvals
    elif role == 'Manager':
        hr_role = Role.query.filter_by(name='HR').first()
        if not hr_role:
            return jsonify({"error": "HR role not found."}), 500
        users = User.query.filter_by(is_approved=False, role_id=hr_role.id).all()
    else:
        return jsonify({"error": "You do not have permission to view pending approvals."}), 403

    # Format pending user data
    pending_users = [
        {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone_number": user.phone_number,
            "country": user.country,
            "role": user.role.name
        }
        for user in users
    ]
    return jsonify({"pending_users": pending_users}), 200
 


@app.route('/approve-user', methods=['OPTIONS'])
def options_approve_user():
    return '', 204  # Respond with 204 No Content



#singup-approval
@app.route('/approve-user/<int:user_id>', methods=['POST'])
@jwt_required()
def approve_user(user_id):
    try:
        # Decode JWT claims
        claims = get_jwt()
        current_email = claims.get('email')
        current_role = claims.get('role')

        app.logger.info(f"Claims: email={current_email}, role={current_role}")

        if not current_role or not current_email:
            return jsonify({"error": "Invalid token data."}), 403

        if current_role == 'HR' or current_email == 'vertambi4@gmail.com':
            user = User.query.filter_by(id=user_id).first()
            app.logger.info(f"User query result: {user}")

            if not user:
                return jsonify({"error": "User not found."}), 404

            user.is_approved = True
            try:
                db.session.commit()
                send_approval_email_notification(user.email, user.full_name) 
                return jsonify({"message": "User approved successfully."}), 200
            except Exception as e:
                db.session.rollback()
                app.logger.error(f"Database commit error: {e}")
                return jsonify({"error": f"An error occurred: {str(e)}"}), 500
        else:
            app.logger.warning(f"Unauthorized access attempt by: email={current_email}, role={current_role}")
            return jsonify({"error": "You do not have permission to approve users."}), 403
    except RuntimeError as e:
        app.logger.error(f"JWT Runtime Error: {e}")
        return jsonify({"error": "Authorization required."}), 401
    except Exception as e:
        app.logger.error(f"Unexpected error: {e}")
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

#forget-password
@app.route('/forgetpassword', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "Email not found."}), 400

    otp = str(random.randint(100000, 999999))

    otp_record = PasswordReset.query.filter_by(email=email).first()
    if otp_record:
        otp_record.otp = otp
        otp_record.created_at = datetime.utcnow()
        otp_record.is_verified = False
    else:
        otp_record = PasswordReset(email=email, otp=otp)
        db.session.add(otp_record)

    try:
        db.session.commit()
        send_otp_email(email, otp)
        return jsonify({"message": "OTP sent to your email address."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

#reset-password
@app.route('/resetpassword', methods=['POST'])
def reset_password():
    data = request.get_json()
    email = data.get('email')
    otp = data.get('otp')
    new_password = data.get('new_password')
    confirm_new_password = data.get('confirm_new_password')

    if new_password != confirm_new_password:
        return jsonify({"error": "Passwords do not match!"}), 400

    if not validate_password(new_password):
        return jsonify({
            "error": "Password must be at least 8 characters long, contain a digit, a special character, and an uppercase letter."
        }), 400

    otp_record = PasswordReset.query.filter_by(email=email, otp=otp).first()
    if not otp_record or otp_record.is_verified:
        return jsonify({"error": "Invalid or expired OTP."}), 400

    if datetime.utcnow() > otp_record.created_at + timedelta(minutes=5):
        return jsonify({"error": "OTP has expired."}), 400

    otp_record.is_verified = True

    user = User.query.filter_by(email=email).first()
    user.password = generate_password_hash(new_password)

    try:
        db.session.commit()
        return jsonify({"message": "Password has been reset successfully!"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

    
#logout
@app.route('/logout', methods=['POST'])
def logout():
    session.clear()

    # Optionally, you can set the session lifetime to 0 to invalidate immediately
    app.permanent_session_lifetime = timedelta(days=0)
    return jsonify({"message": "Logged out successfully."}), 200


@app.route('/check-session', methods=['GET'])
def check_session():
    if 'user_id' in session:
        return jsonify({"message": "User is logged in", "user": session['email']}), 200
    else:
        return jsonify({"error": "No active session found."}), 400
#instructors
@app.route('/instructors', methods=['GET'])
def get_instructors():
    try:
        instructor_role = Role.query.filter_by(name='Instructor').first()
        if not instructor_role:
            return jsonify({"error": "Instructor role not found!"}), 404

        instructors = User.query.filter_by(role_id=instructor_role.id).all()
        instructor_list = [{"id": instructor.id, "name": instructor.full_name} for instructor in instructors]

        return jsonify({"instructors": instructor_list}), 200
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

#add-courses
@app.route('/add-course', methods=['POST'])
@jwt_required()
def add_course():
    claims = get_jwt()  # Retrieve claims from JWT
    role = claims.get("role")  # Extract user role from JWT
    print(f"Received role: {role}")
    if role not in ['HR', 'Instructor']:
        return jsonify({"error": "You do not have permission to add courses."}), 403
    data = request.get_json()

    required_fields = ['courseId', 'title', 'description', 'instructor', 'startDate', 'duration','youtubeLink']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({"error": f"{field} is required."}), 400

    course_id = data['courseId']
    title = data['title']
    description = data['description']
    instructor_id = data['instructor']
    start_date = data['startDate']
    duration = int(data['duration'])
    youtube_link = data['youtubeLink']

    instructor = User.query.filter_by(id=instructor_id).first()
    if not instructor or instructor.role.name != 'Instructor':
            return jsonify({"error": "Invalid instructor selected!"}), 400
    try:
        start_date_obj = datetime.strptime(start_date, "%Y-%m-%d")
        end_date_obj = start_date_obj + timedelta(days=duration * 7)

        new_course = Course(
            course_id=course_id,
            title=title,
            description=description,
            start_date=start_date_obj,
            end_date=end_date_obj,
            duration=duration,
            instructor_id=instructor_id,
            youtube_link=youtube_link
        )

        db.session.add(new_course)
        db.session.commit()

        # Fetch all users' emails
        all_users=User.query.all()
        user_emails=[user.email for user in all_users]
        # Send email notification to learners
        send_email_notification(instructor.full_name, user_emails, title, start_date, end_date_obj.strftime("%Y-%m-%d"))

        return jsonify({"message": "Course successfully added!"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

#fetch-courses   
@app.route('/fetch-course', methods=['GET'])
@jwt_required()
def fetch_courses():
    print("fetch_courses route triggered") 
    try:
        # Fetch all courses
        current_user_id = get_jwt_identity()
        enrolled_course_ids = [enrollment.course_id for enrollment in Enrollment.query.filter_by(user_id=current_user_id).all()]
        
        courses = Course.query.filter(Course.id.notin_(enrolled_course_ids)).all()

        if not courses:
            return jsonify({"message": "No courses found."}), 404

        # Organize courses by instructor
        courses_list = [
            {
                "id": course.id,
                "courseId": course.course_id,
                "title": course.title,
                "description": course.description,
                "instructor": course.instructor.full_name if course.instructor else "N/A",
                "startDate": course.start_date.strftime("%Y-%m-%d"),
                "endDate": course.end_date.strftime("%Y-%m-%d"),
                "duration": course.duration,
                "enrollButton": f"/enroll-course/{course.course_id}",
            }
            for course in courses
        ]
        return jsonify({"courses": courses_list}), 200
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500
    
@app.route('/fetch-enrolled-courses', methods=['GET'])
@jwt_required()
def fetch_enrolled_courses():
    try:
        current_user_id = get_jwt_identity()
        enrollments = Enrollment.query.filter_by(user_id=current_user_id).join(Course).all()

        if not enrollments:
            return jsonify({"message": "No enrolled courses found."}), 404

        courses_list = [
            {
                "id": enrollment.course.id,
                "courseId": enrollment.course.course_id,
                "title": enrollment.course.title,
                "description": enrollment.course.description,
                "instructor": enrollment.course.instructor.full_name,
                "startDate": enrollment.course.start_date.strftime("%Y-%m-%d"),
                "endDate": enrollment.course.end_date.strftime("%Y-%m-%d"),
                "duration": enrollment.course.duration,
                "youtubeLink": enrollment.course.youtube_link or "N/A",
                "progress": enrollment.progress,
            }
            for enrollment in enrollments
        ]

        return jsonify({"courses": courses_list}), 200

    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@app.route('/fetch-completed-courses', methods=['GET'])
@jwt_required()
def fetch_completed_courses():
    try:
        current_user_id = get_jwt_identity()
        enrollments = Enrollment.query.filter_by(user_id=current_user_id, progress=100).all()

        if not enrollments:
            return jsonify({"message": "No completed courses found."}), 404

        completed_courses = [
            {
                "id": enrollment.course.id,
                "courseId": enrollment.course.course_id,
                "title": enrollment.course.title,
                "description": enrollment.course.description,
                "instructor": enrollment.course.instructor.full_name if enrollment.course.instructor else "N/A",
                "startDate": enrollment.course.start_date.strftime("%Y-%m-%d"),
                "endDate": enrollment.course.end_date.strftime("%Y-%m-%d"),
                "duration": enrollment.course.duration,
                "youtubeLink": enrollment.course.youtube_link or"N/A",
            }
            for enrollment in enrollments
        ]
        return jsonify({"courses": completed_courses}), 200
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

    
@app.route('/enroll-course', methods=['POST'])

def enroll_course():
    try:
        
        # Get the user details (name and email) from the request body
        data = request.get_json()
          # Assuming the request body contains JSON data
        print("Received enrollment data:", data) 
        user_name = data.get('name')
        user_email = data.get('email')
        course_id = data.get('course_id')
        

        # Check if both name and email are provided
        if not user_name or not user_email:
            return jsonify({"error": "Name and email are required"}), 400

        # Check if the course exists
        course = Course.query.get(course_id)
        if not course:
            return jsonify({"error": "Course not found"}), 404

        # Check if the user already exists, or create a new user
        user = User.query.filter_by(email=user_email).first()
        if not user:
            return jsonify({"error": "User not found. Please register first."}), 404
            

        # Check if the user is already enrolled in this course
        existing_enrollment = Enrollment.query.filter_by(user_id=user.id, course_id=course.id).first()
        if existing_enrollment:
            return jsonify({"message": "User is already enrolled in this course"}), 400

        # Create the enrollment record
        enrollment = Enrollment(user_id=user.id, course_id=course.id)
        db.session.add(enrollment)
        db.session.commit()

        return jsonify({"message": f"Successfully enrolled in {course.title}"}), 201

    except Exception as e:
        # Handle errors and send appropriate response
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


@app.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user_id = get_jwt_identity()
    access_token = create_access_token(identity=current_user_id)
    return jsonify({"access_token": access_token}), 200

@app.route('/update-progress', methods=['POST'])
@jwt_required()
def update_progress():
    try:
        data = request.json
        user_id = get_jwt_identity()
        course_id = data.get('course_id')
        video_progress = data.get('video_progress')  # Progress sent by frontend in percentage
        
        if not course_id or video_progress is None:
            return jsonify({"error": "Invalid data"}), 400

        if video_progress >= 0 and video_progress < 33:
            video_progress = 25
        elif video_progress >= 33 and video_progress < 66:
            video_progress = 50
        elif video_progress >= 66:
            video_progress = 70
        
        # Ensure progress is capped at 70%
        capped_progress = min(video_progress, 70.0)
        
        enrollment = Enrollment.query.filter_by(user_id=user_id, course_id=course_id).first()
        if not enrollment:
            return jsonify({"error": "Enrollment not found"}), 404
        
        enrollment.progress = max(enrollment.progress, capped_progress)
        db.session.commit()

        return jsonify({"message": "Progress updated successfully", "progress": enrollment.progress}), 200
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500
#fetch-all-courses
@app.route('/fetch-all-courses', methods=['GET'])
@jwt_required()
def fetch_all_courses():
    try:
        courses = Course.query.all()

        if not courses:
            return jsonify({"message": "No courses found."}), 404

        courses_list = [
            {
                "id": course.id,
                "courseId": course.course_id,
                "title": course.title,
                "description": course.description,
                "instructor": course.instructor.full_name if course.instructor else "N/A",
                "startDate": course.start_date.strftime("%Y-%m-%d"),
                "endDate": course.end_date.strftime("%Y-%m-%d"),
                "duration": course.duration,
                "youtubeLink": course.youtube_link if course.youtube_link else "N/A",
            }
            for course in courses
        ]
        return jsonify({"courses": courses_list}), 200
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@app.route('/edit-course', methods=['PUT'])
@jwt_required()
def edit_course():
    """
    Endpoint to edit course details. Expects the course_id in the JSON body along with updated details.
    """
    claims = get_jwt()  # Retrieve claims from JWT
    role = claims.get("role")  # Extract user role from JWT

    if role not in ['HR', 'Instructor']:
        return jsonify({"error": "You do not have permission to edit courses."}), 403

    data = request.get_json()
    required_fields = ['courseId', 'title', 'description', 'instructor', 'start_date', 'duration', 'youtube_link']
    
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({"error": f"{field} is required."}), 400

    course_id = data['courseId']
    title = data['title']
    description = data['description']
    instructor_id = data['instructor']
    start_date = data['start_date']
    duration = int(data['duration'])
    youtube_link = data['youtube_link']

    try:
        # Check if the course exists
        course = Course.query.filter_by(course_id=course_id).first()
        if not course:
            return jsonify({"error": "Course not found!"}), 404

        # Check instructor validity
        instructor = User.query.filter_by(id=instructor_id).first()
        if not instructor or instructor.role.name != 'Instructor':
            return jsonify({"error": "Invalid instructor selected!"}), 400
        try:
            start_date_obj = datetime.strptime(start_date, "%Y-%m-%d")
                
        except ValueError:
            return jsonify({"error": "Start date must be in the format  'YYYY-MM-DD'."}), 400
        # Update course details
        course.title = title
        course.description = description
        course.instructor_id = instructor_id
        course.start_date = datetime.strptime(start_date, "%Y-%m-%d")
        course.duration = duration
        course.end_date = course.start_date + timedelta(days=duration * 7)
        course.youtube_link = youtube_link

        db.session.commit()
        updated_course = {
            "courseId": course.course_id,  # User-facing identifier
            "title": course.title,
            "description": course.description,
            "instructor": course.instructor.full_name if course.instructor else "N/A",
            "startDate": course.start_date.strftime("%Y-%m-%d"),
            "endDate": course.end_date.strftime("%Y-%m-%d"),
            "duration": course.duration,
        }

        # Fetch all users' emails
        all_users = User.query.all()
        user_emails = [user.email for user in all_users]

        # Send email notification to users
        send1_email_notification(
            instructor.full_name,
            user_emails,
            title,
            course.start_date.strftime("%Y-%m-%d"),
            course.end_date.strftime("%Y-%m-%d"),
        )

        return jsonify({"message": "Course successfully updated!", "course": updated_course}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


print(app.url_map)


if __name__ == '__main__':
    app.run(debug=True)
