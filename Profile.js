import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem("jwtToken");

            if (!token) {
                setError("User not authenticated.");
                return;
            }

            try {
                const response = await axios.get("http://127.0.0.1:5000/fetch-profile", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                console.log("Fetched Profile Data:", response.data);

                if (response.data.profile) {
                    setProfile(response.data.profile);
                } else {
                    setProfile(response.data);
                }
            } catch (err) {
                setError("Failed to fetch profile. Please try again.");
                console.error("Error fetching profile:", err);
            }
        };

        fetchProfile();
    }, []);

    useEffect(() => {
        console.log("Updated Profile State:", profile);
    }, [profile]);

    if (error) {
        return <p style={styles.errorMessage}>{error}</p>;
    }

    if (!profile) {
        return <p style={styles.loading}>Loading profile...</p>;
    }

    return (
        <div style={styles.profileContainer}>
            <div style={styles.profileCard}>
                <h2 style={styles.heading}>Profile</h2>
                <div style={styles.profileDetails}>
                    <p style={styles.detail}><strong style={styles.label}>Full Name:</strong> {profile.full_name}</p>
                    <p style={styles.detail}><strong style={styles.label}>Email:</strong> {profile.email}</p>
                    <p style={styles.detail}><strong style={styles.label}>Phone Number:</strong> {profile.phone_number}</p>
                    <p style={styles.detail}><strong style={styles.label}>Country:</strong> {profile.country}</p>
                    <p style={styles.detail}><strong style={styles.label}>Role:</strong> {profile.role}</p>
                </div>
                <button style={styles.backButton} onClick={() => navigate("/")}>
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
};

// ✅ Inline Styles Object
const styles = {
    profileContainer: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background:"#6EC6FF",
    },
    profileCard: {
        background: "rgba(255, 255, 255, 0.15)",
        padding: "30px",
        borderRadius: "20px",
        backdropFilter: "blur(10px)",
        boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)",
        width: "400px",
        textAlign: "center",
        color: "white",
        fontFamily: "'Poppins', sans-serif",
        transition: "transform 0.3s ease",
    },
    heading: {
        fontSize: "26px",
        fontWeight: "bold",
        marginBottom: "20px",
        color: "#fff",
    },
    profileDetails: {
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "15px",
        padding: "10px",
    },
    detail: {
        background: "rgba(255, 255, 255, 0.2)",
        padding: "10px",
        borderRadius: "8px",
        fontSize: "18px",
        fontWeight: "500",
        color: "#fff",
        textAlign: "left",
        paddingLeft: "15px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
    },
    label: {
        color: "#ffeb3b",
    },
    backButton: {
        background: "#ff4081",
        color: "white",
        padding: "12px 18px",
        border: "none",
        borderRadius: "10px",
        cursor: "pointer",
        fontSize: "16px",
        marginTop: "20px",
        transition: "all 0.3s ease",
        fontWeight: "bold",
    },
    errorMessage: {
        color: "red",
        textAlign: "center",
        fontSize: "18px",
        marginTop: "20px",
    },
    loading: {
        color: "white",
        textAlign: "center",
        fontSize: "18px",
        marginTop: "20px",
    },
};

// ✅ Export Component
export default Profile;
