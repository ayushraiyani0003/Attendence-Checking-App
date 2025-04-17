// hooks/useVerticalNavigation.js - Using index-based updates
import { useRef, useEffect } from "react";

export const useVerticalNavigation = (filteredData) => {
  // Keep refs of inputs indexed by sequential index
  const inputRefs = useRef({});
  
  // Register input ref from child components
  const registerInputRef = (rowIndex, employeeId, cellKey, ref) => {
    // Store by sequential index
    if (!inputRefs.current[`index-${rowIndex}`]) {
      inputRefs.current[`index-${rowIndex}`] = {};
    }
    inputRefs.current[`index-${rowIndex}`][cellKey] = ref;
    
    // Log registration for debugging
    // console.log(`Registered input for sequential index ${rowIndex} (employee ID ${employeeId}), cell ${cellKey}`);
  };
  
  // Handle keydown events for vertical navigation
  const handleKeyDown = (e, rowIndex, employeeId, cellKey) => {
    try {
      // Parse cell key format
      const [field, index] = cellKey.split('-');
      
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const direction = e.key === 'ArrowDown' ? 1 : -1;
        navigateBySequentialIndex(rowIndex, employeeId, direction, field, index);
      }
    } catch (err) {
      console.error("Error in handleKeyDown:", err);
    }
  };
  
  // Navigate using the sequential index in filtered data
  const navigateBySequentialIndex = (currentRowIndex, currentEmployeeId, direction, field, index) => {
    try {
    //   console.log(`Navigate: direction=${direction}, field=${field}, index=${index}, currentRowIndex=${currentRowIndex}, currentEmployeeId=${currentEmployeeId}`);
      
      // Calculate target row index based on the sequential index
      const targetRowIndex = currentRowIndex + direction;
      
      // Check if target row exists
      if (targetRowIndex >= 0 && targetRowIndex < filteredData.length) {
        // Get the employee ID of the target row (for reference only)
        const targetEmployeeId = filteredData[targetRowIndex]?.id;
        
        if (!targetEmployeeId) {
          console.error(`No employee ID found for row index ${targetRowIndex}`);
          return;
        }
        
        // Build the same cell key for the target row
        const targetCellKey = `${field}-${index}`;
        
        // console.log(`🔄 Navigating from row ${currentRowIndex} (employee ${currentEmployeeId}) to row ${targetRowIndex} (employee ${targetEmployeeId}), cell ${targetCellKey}`);
        
        // First, save the current cell's value
        const saveEvent = new CustomEvent('saveEditableCell', {
          detail: {
            rowIndex: currentRowIndex,
            employeeId: currentEmployeeId,
            cellKey: `${field}-${index}`
          },
          bubbles: true
        });
        document.dispatchEvent(saveEvent);
        
        // Then, clear the current row's editable state
        const clearEvent = new CustomEvent('clearEditableCell', {
          detail: {
            rowIndex: currentRowIndex,
            employeeId: currentEmployeeId
          },
          bubbles: true
        });
        document.dispatchEvent(clearEvent);
        
        // Finally, tell the target row to set its editable state
        const navigationEvent = new CustomEvent('verticalNavigate', {
          detail: {
            rowIndex: targetRowIndex,
            employeeId: targetEmployeeId,
            cellKey: targetCellKey
          },
          bubbles: true
        });
        document.dispatchEvent(navigationEvent);
        
        // Ensure the target row is visible in the viewport
        setTimeout(() => {
          try {
            // Try to find by data-sequential-index first
            let rowElement = document.querySelector(`[data-sequential-index="${targetRowIndex}"]`);
            
            if (rowElement) {
              rowElement.scrollIntoView({ block: 'nearest', behavior: 'auto' });
            } else {
            //   console.log(`No element found for row ${targetRowIndex}`);
            }
          } catch (err) {
            console.error("Error scrolling to row:", err);
          }
        }, 10);
      } else {
        // console.log(`Target row index ${targetRowIndex} is out of bounds [0, ${filteredData.length - 1}]`);
      }
    } catch (err) {
      console.error("Error during navigation:", err);
    }
  };
  
  // Clean up refs when component unmounts or filtered data changes
  useEffect(() => {
    return () => {
      inputRefs.current = {};
    };
  }, [filteredData]);
  
  return {
    registerInputRef,
    handleKeyDown
  };
};