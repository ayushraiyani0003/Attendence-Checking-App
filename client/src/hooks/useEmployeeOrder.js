import { useState, useEffect, useCallback, useRef } from 'react';
import { useEmployeeContext } from '../context/EmployeeContext';
import { arrayMoveImmutable } from 'array-move';

const useEmployeeOrder = (userReportingGroup) => {
  const { 
    employees, 
    loading, 
    fetchEmployeesByGroup, 
    fetchEmployeesData, 
    isAdmin 
  } = useEmployeeContext();
  
  const [orderedEmployees, setOrderedEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);
  const [originalOrder, setOriginalOrder] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const initialLoadRef = useRef(true);
  const dataProcessedRef = useRef(false);
  const changesMapRef = useRef(new Map()); // Track all changes by employee_id
  
  // Local storage key for order data
  const getStorageKey = useCallback(() => 
    `employee_order_default`, 
    [userReportingGroup]
  );

  // Fetch employees when the hook mounts or reporting group changes
  useEffect(() => {
    const loadEmployees = async () => {
      // If user is admin, they can see all employees
      if (isAdmin) {
        await fetchEmployeesData();
      } 
      // If user is not admin and has a reporting group, only show their group's employees
      else if (userReportingGroup) {
        await fetchEmployeesByGroup(userReportingGroup);
      }
    };
    
    loadEmployees();
    // Reset the data processed flag when reporting group changes
    dataProcessedRef.current = false;
    initialLoadRef.current = true;
    changesMapRef.current = new Map(); // Reset changes map
  }, [userReportingGroup, fetchEmployeesByGroup, fetchEmployeesData, isAdmin]);

  // Apply saved order to employees - IMPROVED VERSION
  const applySavedOrder = useCallback((employeeList) => {
    // Get saved order from localStorage
    const savedOrderJson = localStorage.getItem(getStorageKey());
    
    if (!savedOrderJson) {
      return employeeList.map((emp, index) => ({
        ...emp,
        displayOrder: index + 1
      }));
    }
    
    try {
      const savedOrder = JSON.parse(savedOrderJson);
      
      // Create a map of employee IDs to their saved positions
      const orderMap = new Map(savedOrder.map(item => [item.employeeId, item.displayOrder]));
      
      // First, assign exact saved order values if available
      const withSavedOrder = employeeList.map(emp => {
        return {
          ...emp,
          displayOrder: orderMap.has(emp.employee_id) 
            ? orderMap.get(emp.employee_id) 
            : Number.MAX_SAFE_INTEGER  // Put new employees at the end
        };
      });
      
      // Sort by display order while preserving the exact order values
      return [...withSavedOrder].sort((a, b) => a.displayOrder - b.displayOrder);
      
    } catch (error) {
      console.error('Error applying saved order:', error);
      return employeeList.map((emp, index) => ({
        ...emp,
        displayOrder: index + 1
      }));
    }
  }, [getStorageKey]);

  // Update ordered employees when the employee list changes
  useEffect(() => {
    if (employees.length > 0 && !dataProcessedRef.current) {
      // Add default display order if not present
      const employeesWithOrder = employees.map((emp, index) => ({
        ...emp,
        displayOrder: emp.displayOrder || index + 1,
        // Add a unique key to ensure proper rendering
        key: emp.employee_id || `emp-${index}`
      }));
      
      let orderedList;
      
      // Only apply saved order on initial load
      if (initialLoadRef.current) {
        orderedList = applySavedOrder(employeesWithOrder);
        initialLoadRef.current = false;
      } else {
        orderedList = employeesWithOrder;
      }
      
      setOrderedEmployees(orderedList);
      setFilteredEmployees(orderedList);
      setOriginalOrder([...orderedList]); // Make a deep copy for reset functionality
      
      // Mark data as processed to prevent infinite loops
      dataProcessedRef.current = true;
      
      // Reset hasChanges on initial data load
      setHasChanges(false);
      changesMapRef.current = new Map(); // Reset changes tracking
    }
  }, [employees, applySavedOrder]);

  // Deep equality check for arrays
  const areArraysEqual = useCallback((arr1, arr2) => {
    if (arr1.length !== arr2.length) return false;
    
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i].employee_id !== arr2[i].employee_id) {
        return false;
      }
    }
    
    return true;
  }, []);

  // Update filtered employees when search changes or order changes
  useEffect(() => {
    if (isFiltering && searchText.trim() !== '') {
      const filtered = orderedEmployees.filter(
        (emp) => 
          emp.name?.toLowerCase().includes(searchText.toLowerCase()) ||
          emp.punch_code?.toLowerCase().includes(searchText.toLowerCase()) ||
          emp.department?.toLowerCase().includes(searchText.toLowerCase()) ||
          emp.designation?.toLowerCase().includes(searchText.toLowerCase()) ||
          emp.reporting_group?.toLowerCase().includes(searchText.toLowerCase())
      );
      
      setFilteredEmployees(filtered);
    } else if (!isFiltering) {
      // If not filtering, filtered employees should match ordered employees
      if (!areArraysEqual(filteredEmployees, orderedEmployees)) {
        setFilteredEmployees(orderedEmployees);
      }
    }
  }, [orderedEmployees, searchText, isFiltering, areArraysEqual, filteredEmployees]);

  // Handle search text change
  const handleSearch = useCallback((text) => {
    setSearchText(text);
    
    if (text.trim() === '') {
      setFilteredEmployees(orderedEmployees);
      setIsFiltering(false);
    } else {
      setIsFiltering(true);
      
      const filtered = orderedEmployees.filter(
        (emp) => 
          emp.name?.toLowerCase().includes(text.toLowerCase()) ||
          emp.punch_code?.toLowerCase().includes(text.toLowerCase()) ||
          emp.department?.toLowerCase().includes(text.toLowerCase()) ||
          emp.designation?.toLowerCase().includes(text.toLowerCase()) ||
          emp.reporting_group?.toLowerCase().includes(text.toLowerCase())
      );
      
      setFilteredEmployees(filtered);
    }
  }, [orderedEmployees]);

  // Handle reordering of employees - COMPLETELY FIXED VERSION
  const reorderEmployees = useCallback((oldIndex, newIndex) => {
    if (isFiltering) return; // Don't allow reordering during filtering
    
    // Save the employee that is being moved
    const movingEmployee = orderedEmployees[oldIndex];
    
    // Move the employee in the ordered list
    const newOrderedEmployees = arrayMoveImmutable(
      [...orderedEmployees], // Create a new array to ensure React detects the change
      oldIndex,
      newIndex
    );
    
    // Record this change in our changes map
    changesMapRef.current.set(movingEmployee.employee_id, {
      fromIndex: oldIndex,
      toIndex: newIndex,
      newPosition: newIndex + 1  // 1-based position for display
    });
    
    // Update the display orders to reflect the new positions
    const updatedEmployees = newOrderedEmployees.map((emp, index) => ({
      ...emp,
      displayOrder: index + 1,  // Simple sequential numbering
    }));
    
    // Force new reference to trigger React updates
    const employeesWithForceUpdate = [...updatedEmployees];
    
    setOrderedEmployees(employeesWithForceUpdate);
    
    // Only update filtered employees if not filtering
    if (!isFiltering) {
      setFilteredEmployees(employeesWithForceUpdate);
    }
    
    setHasChanges(true);
    
    // Debug log to verify the change
    // console.log(`Moved employee ${movingEmployee.name} from position ${oldIndex + 1} to ${newIndex + 1}`);
    // console.log('Current changes:', Array.from(changesMapRef.current.entries()));
    
  }, [orderedEmployees, isFiltering]);

  // Save the current order to localStorage - FIXED VERSION
  const saveOrder = useCallback(() => {
    // Important: Use the most current ordered employees
    // Create order data that directly maps employee_id to their current position
    const orderData = orderedEmployees.map((emp, index) => ({
      employeeId: emp.employee_id,
      displayOrder: index + 1
    }));
    
    // Save to localStorage
    localStorage.setItem(getStorageKey(), JSON.stringify(orderData));
    
    // Log what we're saving
    // console.log('Saving employee order:', orderData);
    // console.log('Changes applied:', Array.from(changesMapRef.current.entries()));
    
    // Reset changes tracking
    changesMapRef.current = new Map();
    
    // Update the display orders in the current employees to match what we saved
    const updatedEmployees = orderedEmployees.map((emp, index) => ({
      ...emp,
      displayOrder: index + 1
    }));
    
    setOrderedEmployees([...updatedEmployees]); // Force new reference
    
    // Only update filtered employees if not filtering
    if (!isFiltering) {
      setFilteredEmployees([...updatedEmployees]);
    }
    
    setHasChanges(false);
    
    return orderData;
  }, [orderedEmployees, getStorageKey, isFiltering]);

  // Reset to original order
  const resetOrder = useCallback(() => {
    setOrderedEmployees([...originalOrder]);
    
    // Only update filtered employees if not filtering
    if (!isFiltering) {
      setFilteredEmployees([...originalOrder]);
    }
    
    setHasChanges(true);
    changesMapRef.current = new Map(); // Reset changes tracking
  }, [originalOrder, isFiltering]);

  // Prompt user to save changes when leaving the page
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges) {
        // Standard way to show a confirmation dialog when leaving the page
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  return {
    employees: orderedEmployees,
    filteredEmployees,
    loading,
    searchText,
    isFiltering,
    handleSearch,
    reorderEmployees,
    saveOrder,
    resetOrder,
    hasChanges,
    isAdmin,
    // Export for debugging if needed
    changesCount: changesMapRef.current.size
  };
};

export default useEmployeeOrder;