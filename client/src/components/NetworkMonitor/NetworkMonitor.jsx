import React, { useEffect } from "react";
import { toast } from 'react-toastify';

const NetworkMonitor = () => {
  useEffect(() => {
    // Function to handle online status
    const handleOnline = () => {
      toast.success("Network connection restored", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    };

    // Function to handle offline status
    const handleOffline = () => {
      toast.error("Network disconnected", {
        position: "top-right",
        autoClose: false, // Don't auto close this important message
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    if (!navigator.onLine) {
      handleOffline();
    }

    // Cleanup event listeners on component unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // This component doesn't render anything visible
  return null;
};

export default NetworkMonitor;