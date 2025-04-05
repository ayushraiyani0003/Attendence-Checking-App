import { useState, useEffect } from "react";

export default function CustomMaintenancePage() {
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "." : prev + "."));
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.pageContainer}>
      <div style={styles.maintenanceCard}>
        <div style={styles.logoSection}>
          <img
            src="https://sunchaser.in/wp-content/uploads/2021/09/Sunchaser-Structure-Logo-2.png"
            alt="Sunchaser Structure Logo"
            className="h-16"
          />
        </div>

        <div style={styles.mainContent}>
          <div style={styles.maintenanceBanner}>
            <div style={styles.iconContainer}>
              <ToolsIcon />
            </div>
            <h1 style={styles.maintenanceTitle}>System Maintenance</h1>
          </div>

          <p style={styles.loadingText}>Preparing for your return{dots}</p>

          <p style={styles.messageText}>
            We're enhancing our attendance platform with exciting new features.
            Thank you for your patience while we make these improvements.
          </p>

          <div style={styles.timelineContainer}>
            <div style={styles.timelineItem}>
              <div style={styles.iconSmall}>
                <CalendarIcon />
              </div>
              <p style={styles.timelineText}>Back online: 3:30 PM</p>
            </div>

            <div style={styles.timelineItem}>
              <div style={styles.iconSmall}>
                <ClockIcon />
              </div>
              <p style={styles.timelineText}>
                Our team is working around the clock
              </p>
            </div>
          </div>

          <div style={styles.thanksMessage}>
            <div style={styles.iconSmall}>
              <CheckIcon />
            </div>
            <p style={styles.thanksText}>We appreciate your understanding!</p>
          </div>
        </div>

        <div style={styles.footerBar}>
          <p style={styles.footerText}>
            Need assistance? Contact our Hr Team.
          </p>
        </div>
      </div>
    </div>
  );
}

// Custom icon components instead of using Lucide
const ToolsIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    style={styles.icon}
  >
    <path
      d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    style={styles.icon}
  >
    <rect
      x="3"
      y="4"
      width="18"
      height="18"
      rx="2"
      ry="2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="16"
      y1="2"
      x2="16"
      y2="6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="8"
      y1="2"
      x2="8"
      y2="6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="3"
      y1="10"
      x2="21"
      y2="10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ClockIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    style={styles.icon}
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <polyline
      points="12 6 12 12 16 14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CheckIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    style={styles.icon}
  >
    <path
      d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <polyline
      points="22 4 12 14.01 9 11.01"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Custom styles
const styles = {
  pageContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
    padding: "20px",
    fontFamily: "'Segoe UI', Roboto, -apple-system, sans-serif",
  },
  maintenanceCard: {
    width: "100%",
    maxWidth: "500px",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.12)",
    overflow: "hidden",
    position: "relative",
  },
  logoSection: {
    padding: "30px 0",
    display: "flex",
    justifyContent: "center",
    borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
  },
  logoPlaceholder: {
    height: "60px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontWeight: "700",
    fontSize: "22px",
    letterSpacing: "2px",
    color: "#345995",
  },
  mainContent: {
    padding: "30px",
    textAlign: "center",
  },
  maintenanceBanner: {
    backgroundColor: "rgba(52, 89, 149, 0.08)",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  maintenanceTitle: {
    fontSize: "22px",
    fontWeight: "600",
    color: "#345995",
    margin: "12px 0 0 0",
  },
  iconContainer: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    backgroundColor: "#345995",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
  },
  loadingText: {
    fontSize: "18px",
    fontWeight: "500",
    color: "#333",
    margin: "0 0 16px 0",
  },
  messageText: {
    fontSize: "15px",
    lineHeight: "1.6",
    color: "#555",
    marginBottom: "24px",
  },
  timelineContainer: {
    backgroundColor: "rgba(52, 89, 149, 0.05)",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "24px",
  },
  timelineItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "16px",
  },
  iconSmall: {
    marginRight: "12px",
    color: "#345995",
    display: "flex",
    alignItems: "center",
  },
  timelineText: {
    margin: "0",
    color: "#444",
  },
  thanksMessage: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#1e7e34",
    fontWeight: "500",
  },
  thanksText: {
    margin: "0",
  },
  footerBar: {
    backgroundColor: "#345995",
    padding: "16px",
    textAlign: "center",
  },
  footerText: {
    color: "white",
    margin: "0",
    fontSize: "14px",
  },
  icon: {
    strokeWidth: 2,
  },
};
