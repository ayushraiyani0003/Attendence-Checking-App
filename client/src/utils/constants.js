import dayjs from "dayjs";

// Define roles or any other constants you may need
export const ROLES = {
    ADMIN: "admin",
    USER: "user",
};

// List of available pages
export const pageRedirect = {
    dashbaord: "/dashboard",
    employee: "/employee",
    settings: "/settings",
    upload: "/upload",
    userList: "/user-list",
    session: "/sessions",
    notification: "/make-notification",
    logs: "/logs",
};

// Utility functions for week calculation
export const getCurrentWeekInMonth = (date = new Date()) => {
    const day = date.getDate();
    const daysInMonth = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0
    ).getDate();

    // Divide the month into exactly 5 chunks
    const daysPerWeek = Math.ceil(daysInMonth / 5);

    // Calculate which chunk the current day falls into
    return Math.min(Math.ceil(day / daysPerWeek), 5);
};

export const getTotalWeeksInMonth = (date = new Date()) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Calculate how many complete 7-day weeks fit in the month
    return Math.ceil(daysInMonth / 7);
};

export const getYesterday = () => {
    return dayjs().subtract(1, "day").startOf("day");
};

export const getCurrentMonthStartEndDate = () => {
    const startOfMonth = dayjs().startOf("month");
    const endOfMonth = dayjs().endOf("month");
    return {
        start: startOfMonth.format("YYYY-MM-DD"),
        end: endOfMonth.format("YYYY-MM-DD"),
    };
};

// Validation functions
export const exceedsThreshold = (value) => {
    if (!value) return false;
    const numericValue = parseFloat(value);
    return !isNaN(numericValue) && Math.abs(numericValue) > 0.25; // 0.25 hours = 15 minutes
};

export const validateNetHR = (value) => {
    const numValue = parseFloat(value);
    return !isNaN(numValue) && numValue <= 11;
};

export const validateOtHR = (value) => {
    const numValue = parseFloat(value);
    return !isNaN(numValue) && numValue <= 15;
};

// Format value for database update
export const formatValue = (value, column) => {
    if (column === "netHR" || column === "otHR") {
        const parsedFloat = parseFloat(value);
        if (isNaN(parsedFloat)) return 0;

        // Check if it's a whole number
        if (parsedFloat % 1 === 0) {
            return Math.floor(parsedFloat).toString(); // Return as integer
        } else {
            return parsedFloat.toString(); // Return with decimal intact
        }
    }
    return value;
};

// export const getShiftClass = (shift) => {
//     if (!shift) return "";
//     const upperShift = shift.toUpperCase();
//     if (upperShift === "D") return "dnShift-Day";
//     if (upperShift === "N") return "dnShift-Night";
//     if (upperShift === "E") return "dnShift-AfterNoon";
//     return "";
// };

export const getShiftClass = (shift) => {
    // console.log(shift);

    if (!shift) return "";

    const upperShift = shift.toUpperCase();

    // Handle numbered shifts (1S, 2S, 3S)
    if (upperShift === "1S") return "dnShift-1S";
    if (upperShift === "2S") return "dnShift-2S";
    if (upperShift === "3S") return "dnShift-3S";

    // Handle named shifts
    if (upperShift === "DS") return "dnShift-Day";
    if (upperShift === "ES") return "dnShift-Evening";
    if (upperShift === "NS") return "dnShift-Night";
    if (upperShift === "GS") return "dnShift-General";

    return "";
};

export const canEdit = (attendance, isAdmin, isShowDiffData) => {
    if (!attendance) return false;
    // Check if the record is unlocked
    const isUnlocked = attendance.lock_status === "unlocked";
    // Admin can edit if unlocked and not in metrix view
    if (isAdmin) {
        return isUnlocked && !isShowDiffData;
    }
    // Non-admin users can edit if the record is unlocked
    return isUnlocked;
};

// Function to create a custom password modal
export function createPasswordModal(callback) {
    // Create modal container
    const modalContainer = document.createElement("div");
    modalContainer.style.position = "fixed";
    modalContainer.style.left = "0";
    modalContainer.style.top = "0";
    modalContainer.style.width = "100%";
    modalContainer.style.height = "100%";
    modalContainer.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    modalContainer.style.display = "flex";
    modalContainer.style.justifyContent = "center";
    modalContainer.style.alignItems = "center";
    modalContainer.style.zIndex = "1000";

    // Create modal content
    const modalContent = document.createElement("div");
    modalContent.style.backgroundColor = "white";
    modalContent.style.padding = "20px";
    modalContent.style.borderRadius = "5px";
    modalContent.style.width = "300px";

    // Add header
    const header = document.createElement("h3");
    header.textContent = "Enter Admin Password";
    header.style.marginTop = "0";

    // Add password input
    const passwordInput = document.createElement("input");
    passwordInput.type = "password"; // This automatically masks input with asterisks
    passwordInput.placeholder = "Enter password";
    passwordInput.style.width = "100%";
    passwordInput.style.padding = "8px";
    passwordInput.style.marginTop = "10px";
    passwordInput.style.marginBottom = "15px";
    passwordInput.style.boxSizing = "border-box";

    // Add button container
    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.justifyContent = "space-between";

    // Add submit button
    const submitButton = document.createElement("button");
    submitButton.textContent = "Submit";
    submitButton.style.padding = "8px 15px";
    submitButton.style.backgroundColor = "#4CAF50";
    submitButton.style.color = "white";
    submitButton.style.border = "none";
    submitButton.style.borderRadius = "4px";
    submitButton.style.cursor = "pointer";

    // Add cancel button
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    cancelButton.style.padding = "8px 15px";
    cancelButton.style.backgroundColor = "#f44336";
    cancelButton.style.color = "white";
    cancelButton.style.border = "none";
    cancelButton.style.borderRadius = "4px";
    cancelButton.style.cursor = "pointer";

    // Add event listeners
    submitButton.addEventListener("click", () => {
        const enteredPassword = passwordInput.value;
        document.body.removeChild(modalContainer);
        callback(enteredPassword);
    });

    cancelButton.addEventListener("click", () => {
        document.body.removeChild(modalContainer);
        callback(null); // Pass null to indicate cancellation
    });

    // Allow Enter key to submit
    passwordInput.addEventListener("keyup", (event) => {
        if (event.key === "Enter") {
            submitButton.click();
        }
    });

    // Assemble modal
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(submitButton);

    modalContent.appendChild(header);
    modalContent.appendChild(passwordInput);
    modalContent.appendChild(buttonContainer);

    modalContainer.appendChild(modalContent);

    // Add to document and focus
    document.body.appendChild(modalContainer);
    passwordInput.focus();
}

export function maxMonthOFCurrent() {
    // Get the first day of the current month
    const firstDayOfMonth = dayjs().startOf("month").format("YYYY-MM-DD");

    // Get yesterday's date
    const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");

    return {
        startDate: firstDayOfMonth,
        endDate: yesterday,
    };
}
