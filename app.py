from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import random
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///D:/m/database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

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

class PasswordReset(db.Model):
    __tablename__ = 'password_resets'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), db.ForeignKey('users.email'), nullable=False)
    otp = db.Column(db.String(6), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_verified = db.Column(db.Boolean, default=False)


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

# Routes
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

    hashed_password = generate_password_hash(password)

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
        role_id=role.id
    )

    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "Signup successful, waiting for HR approval..."}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

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

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()
    if user and check_password_hash(user.password, password):
        role = user.role.name
        return jsonify({"message": "Login successful", "redirect": f"/{role.lower()}_dashboard"})
    else:
        return jsonify({"error": "Invalid email or password."}), 400

if __name__ == '__main__':
    app.run(debug=True)
