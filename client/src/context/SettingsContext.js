// SettingsContext.js
import { createContext, useState, useEffect, useContext } from "react";
import {
    fetchSettings,
    saveSettingsToServer,
} from "../services/settingsService";

// Create the context
const SettingsContext = createContext();

// Create provider component
export const SettingsProvider = ({ children }) => {
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [reportingGroups, setReportingGroups] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load settings on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const settings = await fetchSettings();
                setDepartments(settings.departments || []);
                setDesignations(settings.designations || []);
                setReportingGroups(settings.reportingGroups || []);
                setDivisions(settings.divisions || []);
            } catch (err) {
                setError("Failed to fetch settings");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Function to update all settings at once
    const submitSettings = async () => {
        try {
            setLoading(true);
            console.log(
                "thius is in the context",
                departments,
                designations,
                reportingGroups,
                divisions
            );

            await saveSettingsToServer(
                departments,
                designations,
                reportingGroups,
                divisions
            );
            console.log("this called");

            return true;
        } catch (err) {
            setError("Failed to save settings");
            console.error(err);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Reset error state
    const clearError = () => setError(null);

    const value = {
        departments,
        designations,
        reportingGroups,
        divisions,
        loading,
        error,
        clearError,
        submitSettings,
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

// Custom hook for using this context
export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }
    return context;
};
