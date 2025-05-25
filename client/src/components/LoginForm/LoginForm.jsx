import React, { useState } from "react";
import eyeShow from "../../assets/eyeshow.svg";
import eyeHide from "../../assets/eyehide.svg";
import sunchaserLogo from "../../assets/sunchaser original.png";
import "./LoginForm.css";

// Updated InputField component with show/hide password functionality
const InputField = ({
    label,
    type,
    value,
    onChange,
    showPasswordToggle = false,
}) => {
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="input-field">
            <label>{label}</label>
            <div className="input-wrapper">
                <input
                    className="input-field__input"
                    type={showPasswordToggle && showPassword ? "text" : type}
                    value={value}
                    onChange={onChange}
                />
                {showPasswordToggle && (
                    <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={togglePasswordVisibility}
                        aria-label={
                            showPassword ? "Hide password" : "Show password"
                        }
                    >
                        {showPassword ? (
                            <img
                                src={eyeHide}
                                alt="Hide password"
                                className="eye-icon"
                            />
                        ) : (
                            <img
                                src={eyeShow}
                                alt="Show password"
                                className="eye-icon"
                            />
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

const LoginForm = ({ onLogin, onForceLogin }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");
        setAlreadyLoggedIn(false);

        onLogin(username, password, false) // Regular login, not forced
            .then(() => {
                setUsername("");
                setPassword("");
            })
            .catch((error) => {
                // Check if error is because user is already logged in elsewhere
                if (
                    error.message &&
                    error.message.includes("already logged in")
                ) {
                    setAlreadyLoggedIn(true);
                    setError("You are already logged in on another device.");
                } else {
                    setError("Invalid username or password.");
                }
                console.error("Login failed:", error);
            });
    };

    const handleForceLogin = () => {
        onForceLogin(username, password, true) // Force login
            .then(() => {
                setUsername("");
                setPassword("");
                setError("");
                setAlreadyLoggedIn(false);
            })
            .catch((error) => {
                setError("Login failed. Please try again.");
                console.error("Force login failed:", error);
            });
    };

    return (
        <div className="login-form-container">
            <div className="login-form">
                <div className="login-logo">
                    <img src={sunchaserLogo} alt="Logo" className="logo" />
                </div>
                <h2>Login</h2>
                <form onSubmit={handleSubmit}>
                    <InputField
                        label="Username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <InputField
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        showPasswordToggle={true}
                    />
                    <button type="submit" className="login-button">
                        Login
                    </button>
                </form>

                {error && <div className="error-message">{error}</div>}

                {alreadyLoggedIn && (
                    <div className="already-logged-in">
                        <p>
                            You can only be logged in on one device at a time.
                        </p>
                        <button
                            onClick={handleForceLogin}
                            className="force-login-button"
                        >
                            Continue on this device
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginForm;
