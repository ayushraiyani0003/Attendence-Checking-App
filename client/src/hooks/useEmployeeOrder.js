import { useState, useEffect, useCallback, useRef } from 'react';
import { useEmployeeContext } from '../context/EmployeeContext';
import { arrayMoveImmutable } from 'array-move';

const useEmployeeOrder = (userReportingGroup) => {
  const { employees, loading, fetchEmployeesByGroup } = useEmployeeContext();
  const [orderedEmployees, setOrderedEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);
  const [originalOrder, setOriginalOrder] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const initialLoadRef = useRef(true);
  const dataProcessedRef = useRef(false);

  // Local storage key for order data
  const getStorageKey = useCallback(() => 
    `employee_order_${userReportingGroup || 'default'}`, 
    [userReportingGroup]
  );

  // Fetch employees when the hook mounts or reporting group changes
  useEffect(() => {
    const loadEmployees = async () => {
      if (userReportingGroup) {
        await fetchEmployeesByGroup(userReportingGroup);
      }
    };
    
    loadEmployees();
    // Reset the data processed flag when reporting group changes
    dataProcessedRef.current = false;
    initialLoadRef.current = true;
  }, [userReportingGroup, fetchEmployeesByGroup]);

  // Apply saved order to employees
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
      
      // Assign saved order if available, otherwise put at the end
      const withSavedOrder = employeeList.map(emp => {
        return {
          ...emp,
          displayOrder: orderMap.has(emp.employee_id) 
            ? orderMap.get(emp.employee_id) 
            : Number.MAX_SAFE_INTEGER  // Put new employees at the end
        };
      });
      
      // Sort by display order
      const sorted = [...withSavedOrder].sort((a, b) => a.displayOrder - b.displayOrder);
      
      // Normalize display orders (1, 2, 3...) to fix gaps from missing employees
      const normalized = sorted.map((emp, index) => ({
        ...emp,
        displayOrder: index + 1
      }));
      
      return normalized;
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
        displayOrder: emp.displayOrder || index + 1
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
      setOriginalOrder(orderedList);
      
      // Mark data as processed to prevent infinite loops
      dataProcessedRef.current = true;
      
      // Reset hasChanges on initial data load
      setHasChanges(false);
    }
  }, [employees, applySavedOrder]);

  // Update filtered employees when search changes or order changes
  useEffect(() => {
    // Only update if we have a search filter active
    if (isFiltering && searchText.trim() !== '') {
      const filtered = orderedEmployees.filter(
        (emp) => 
          emp.name?.toLowerCase().includes(searchText.toLowerCase()) ||
          emp.punch_code?.toLowerCase().includes(searchText.toLowerCase()) ||
          emp.department?.toLowerCase().includes(searchText.toLowerCase()) ||
          emp.designation?.toLowerCase().includes(searchText.toLowerCase()) ||
          emp.reportingGroup?.toLowerCase().includes(searchText.toLowerCase())
      );
      
      setFilteredEmployees(filtered);
    }
  }, [orderedEmployees, searchText, isFiltering]);

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
          emp.reportingGroup?.toLowerCase().includes(text.toLowerCase())
      );
      
      setFilteredEmployees(filtered);
    }
  }, [orderedEmployees]);

  // Handle reordering of employees
  const reorderEmployees = useCallback((oldIndex, newIndex) => {
    if (isFiltering) return; // Don't allow reordering during filtering
    
    const newOrderedEmployees = arrayMoveImmutable(
      orderedEmployees,
      oldIndex,
      newIndex
    );
    
    // Update display order values
    const updatedEmployees = newOrderedEmployees.map((emp, index) => ({
      ...emp,
      displayOrder: index + 1
    }));
    
    setOrderedEmployees(updatedEmployees);
    setFilteredEmployees(updatedEmployees);
    setHasChanges(true);
  }, [orderedEmployees, isFiltering]);

  // Save the current order to localStorage
  const saveOrder = useCallback(() => {
    // Create the order data format with only employeeId and displayOrder
    const orderData = orderedEmployees.map((emp, index) => ({
      employeeId: emp.employee_id,
      displayOrder: index + 1
    }));
    
    // Save to localStorage
    localStorage.setItem(getStorageKey(), JSON.stringify(orderData));
    setHasChanges(false);
    
    return orderData;
  }, [orderedEmployees, getStorageKey]);

  // Reset to original order
  const resetOrder = useCallback(() => {
    setOrderedEmployees(originalOrder);
    setFilteredEmployees(originalOrder);
    setHasChanges(true);
  }, [originalOrder]);

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
  };
};

export default useEmployeeOrder;