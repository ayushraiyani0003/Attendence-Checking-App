import axios from "axios";
const API_URL = process.env.REACT_APP_API_URL;

// Fetch all settings
export const fetchSettings = async () => {
  try {
    // uncomment when need to debug for designation, department and report group
    // console.log('Fetching settings from:', `${API_URL}/setting`);
    const response = await axios.get(`${API_URL}/setting`);
    // console.log('Settings response:', response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching settings:", error);
    console.error(
      "Full error details:",
      error.response ? error.response.data : "No response data"
    );
    throw error;
  }
};

// Save all settings at once (replacing existing data)
// Changed from PUT to POST to match the server route
export const saveSettingsToServer = async (
  departments,
  designations,
  reportingGroups
) => {
  try {
    // console.log("Sending settings to server:", {
    //   departments,
    //   designations,
    //   reportingGroups,
    // });
    const response = await axios.post(`${API_URL}/setting`, {
      departments,
      designations,
      reportingGroups,
    });
    return response.data;
  } catch (error) {
    console.error("Error saving settings:", error);
    throw error;
  }
};