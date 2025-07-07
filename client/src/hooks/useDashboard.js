import { useState, useEffect, useCallback } from "react";
import { getDashboardGraphs, getReports } from "../services/dashboardServices";
import { maxMonthOFCurrent } from "../utils/constants";

/**
 * Hook to manage report settings and generation
 * @param {string} currentMonth - The selected month in format 'MMM YYYY'
 * @returns {Object} Report settings and methods
 */
/**
 * Hook to manage report settings and generation
 * @param {string} currentMonth - The selected month in format 'MMM YYYY'
 * @returns {Object} Report settings and methods
 */
export const useReportSettings = (currentMonth) => {
    // Report type selection
    const [selectedReportType, setSelectedReportType] = useState("Net Hr");

    // Date range for filtering
    const [dateRange, setDateRange] = useState({
        startDate: null,
        endDate: null,
    });

    // Employee type filter
    const [employeeType, setEmployeeType] = useState("All Employees");

    // Available options based on report type
    const [availableReportOptions, setAvailableReportOptions] = useState([]);

    // Selected options state (key-value pairs for options)
    const [selectedOptions, setSelectedOptions] = useState({});

    // Loading state
    const [isLoading, setIsLoading] = useState(false);

    // Define available report types
    const reportTypes = [
        { name: "Net Hr", options: ["count", "hours", "remarks"] },
        { name: "OT Hr", options: ["count", "hours", "remarks"] },
        { name: "Site expence", options: ["count", "hours", "remarks"] },
        { name: "General Shift", options: ["count", "hours", "remarks"] },
        { name: "First Shift", options: ["count", "hours", "remarks"] },
        { name: "Second Shift", options: ["count", "hours", "remarks"] },
        { name: "Third Shift", options: ["count", "hours", "remarks"] },
        { name: "Absent", options: ["count"] },
        {
            name: "Detailed Group Report",
            options: ["master", "mistake date", "separate date", "net-ot"],
        },
    ];

    // Update available options when report type changes
    useEffect(() => {
        const reportType = reportTypes.find(
            (type) => type.name === selectedReportType
        );
        if (reportType) {
            setAvailableReportOptions(reportType.options);

            // Reset selected options when report type changes
            const initialOptions = {};
            reportType.options.forEach((option) => {
                initialOptions[option] = false;
            });
            setSelectedOptions(initialOptions);
        }
    }, [selectedReportType]);

    // Parse month and year from currentMonth string
    const parseMonthYear = useCallback(() => {
        if (!currentMonth) return { month: null, year: null };

        const parts = currentMonth.split(" ");
        if (parts.length !== 2) return { month: null, year: null };

        // Convert month name to number (1-12)
        const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ];
        const monthIndex = monthNames.findIndex((m) => m === parts[0]);

        return {
            month: monthIndex !== -1 ? monthIndex + 1 : null,
            year: parseInt(parts[1], 10),
        };
    }, [currentMonth]);

    // Toggle a specific option
    const toggleOption = useCallback((option) => {
        setSelectedOptions((prev) => ({
            ...prev,
            [option]: !prev[option],
        }));
    }, []);

    // Select all options
    const selectAllOptions = useCallback(() => {
        const allSelected = {};
        availableReportOptions.forEach((option) => {
            allSelected[option] = true;
        });
        setSelectedOptions(allSelected);
    }, [availableReportOptions]);

    // Deselect all options
    const deselectAllOptions = useCallback(() => {
        const allDeselected = {};
        availableReportOptions.forEach((option) => {
            allDeselected[option] = false;
        });
        setSelectedOptions(allDeselected);
    }, [availableReportOptions]);

    // Generate report function
    const generateReport = useCallback(async () => {
        setIsLoading(true);

        try {
            // Get selected options as array
            const selectedOptionsArray = Object.entries(selectedOptions)
                .filter(([_, selected]) => selected)
                .map(([option]) => option);

            // Format options as comma-separated string
            const options = selectedOptionsArray.join(",");
            console.log("options " + options);
            console.log(selectedOptionsArray);

            // Parse month and year
            const { month, year } = parseMonthYear();

            if (!month || !year) {
                console.error("[useReportSettings] Invalid month or year");
                setIsLoading(false);
                return;
            }
            // Create a copy of the date range with adjusted dates for the download
            // Create a copy of the date range array
            let adjustedDateRange = [...dateRange];

            // Adjust the start date (first element in array)
            if (adjustedDateRange[0]) {
                // Parse the date string and create a date object in UTC
                const parsedDate = new Date(adjustedDateRange[0]);
                // Create a new UTC date at 00:00:00 but add 1 day to fix the offset
                const utcDate = new Date(
                    Date.UTC(
                        parsedDate.getUTCFullYear(),
                        parsedDate.getUTCMonth(),
                        parsedDate.getUTCDate(), // Add 1 day to fix the date shift
                        0,
                        0,
                        0
                    )
                );
                adjustedDateRange[0] = utcDate.toISOString(); // Convert to ISO string format
            }

            // Adjust the end date (second element in array)
            if (adjustedDateRange[1]) {
                // Parse the date string and create a date object in UTC
                const parsedDate = new Date(adjustedDateRange[1]);
                // Create a new UTC date at 23:59:59 but add 1 day to fix the offset
                const utcDate = new Date(
                    Date.UTC(
                        parsedDate.getUTCFullYear(),
                        parsedDate.getUTCMonth(),
                        parsedDate.getUTCDate(), // Add 1 day to fix the date shift
                        23,
                        59,
                        59
                    )
                );
                adjustedDateRange[1] = utcDate.toISOString(); // Convert to ISO string format
            }

            console.log("Original date range:", dateRange);
            console.log("Adjusted date range:", adjustedDateRange);

            // Use adjustedDateRange for your API call to the server
            // Use adjustedDateRange for your API call to the server

            // Call the getReports service with the adjusted date range
            const result = await getReports(
                selectedReportType,
                options,
                month,
                year,
                adjustedDateRange, // Use the adjusted date range with +1 day
                employeeType
            );
        } catch (error) {
            console.error(
                "[useReportSettings] Error generating report:",
                error
            );
        } finally {
            setIsLoading(false);
        }
    }, [
        selectedReportType,
        selectedOptions,
        dateRange,
        employeeType,
        currentMonth,
        parseMonthYear,
    ]);

    return {
        selectedReportType,
        setSelectedReportType,
        dateRange,
        setDateRange,
        employeeType,
        setEmployeeType,
        reportTypes,
        availableReportOptions,
        selectedOptions,
        toggleOption,
        selectAllOptions,
        deselectAllOptions,
        isLoading,
        generateReport,
    };
};

/**
 * Hook to manage data fetching for the dashboard
 * @param {string} currentMonth - The selected month in format 'MMM YYYY'
 * @returns {Object} Data fetching methods and state
 */
export const useViewToggle = (currentMonth) => {
    // Chart data state
    const [chartData, setChartData] = useState([]);

    // Loading state
    const [isLoading, setIsLoading] = useState(false);

    // Parse month and year from currentMonth string
    const parseMonthYear = useCallback(() => {
        if (!currentMonth) return { month: null, year: null };

        const parts = currentMonth.split(" ");
        if (parts.length !== 2) return { month: null, year: null };

        // Convert month name to number (1-12)
        const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ];
        const monthIndex = monthNames.findIndex((m) => m === parts[0]);

        return {
            month: monthIndex !== -1 ? monthIndex + 1 : null,
            year: parseInt(parts[1], 10),
        };
    }, [currentMonth]);

    // Fetch dashboard data
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        // console.log('[useViewToggle] Fetching data for', currentMonth);

        try {
            // Parse month and year
            const { month, year } = parseMonthYear();

            if (!month || !year) {
                console.error(
                    "[useViewToggle] Invalid month format:",
                    currentMonth
                );
                setChartData([]);
                return;
            }

            // console.log(`[useViewToggle] Fetching data for month: ${month}, year: ${year}`);

            // Fetch graph data from API
            const response = await getDashboardGraphs(month, year);
            // console.log('[useViewToggle] API response:', response);

            // Handle both formats:
            // 1. Array response directly: [{ group: '...', mismatchCount: ... }, ...]
            // 2. Object response: { success: true, data: [...] }
            let dataArray = [];

            if (Array.isArray(response)) {
                // Direct array response
                dataArray = response;
                // console.log('[useViewToggle] Received direct array response');
            } else if (
                response &&
                response.success &&
                Array.isArray(response.data)
            ) {
                // Object with success and data properties
                dataArray = response.data;
                // console.log('[useViewToggle] Received object with data array');
            } else {
                console.error(
                    "[useViewToggle] Invalid response format:",
                    response
                );
                setChartData([]);
                return;
            }

            // Transform data for the chart
            if (dataArray.length > 0) {
                const transformedData = dataArray.map((item) => ({
                    name: item.group || "Unknown",
                    mistakes: item.mismatchCount || 0,
                }));

                // Sort data by mistake count descending
                transformedData.sort((a, b) => b.mistakes - a.mistakes);

                // console.log('[useViewToggle] Transformed data:', transformedData);
                setChartData(transformedData);
            } else {
                // console.log('[useViewToggle] Empty data array received');
                setChartData([]);
            }
        } catch (error) {
            console.error(
                "[useViewToggle] Error fetching dashboard data:",
                error
            );
            setChartData([]);
        } finally {
            setIsLoading(false);
        }
    }, [currentMonth, parseMonthYear]);

    // Fetch data when month changes
    useEffect(() => {
        if (currentMonth) {
            // console.log('[useViewToggle] Month changed, fetching data for:', currentMonth);
            fetchData();
        }
    }, [currentMonth, fetchData]);

    // Get data function - return a copy of the array to ensure references change
    const getData = useCallback(() => {
        // console.log('[useViewToggle] getData called, returning data:', chartData);
        return [...chartData];
    }, [chartData]);

    // Refresh data function
    const refreshData = useCallback(() => {
        // console.log('[useViewToggle] Manually refreshing data');
        fetchData();
    }, [fetchData]);

    // For backwards compatibility
    const [viewType, setViewType] = useState("Group");

    return {
        viewType,
        setViewType,
        getData,
        isLoading,
        refreshData,
    };
};
