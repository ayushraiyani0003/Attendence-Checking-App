// hooks/useVerticalNavigation.js - With tab navigation support
import { useRef, useEffect, useCallback } from "react";

export const useVerticalNavigation = (filteredData) => {
  // Keep refs of inputs indexed by sequential index
  const inputRefs = useRef({});
  
  // Register input ref from child components
  const registerInputRef = useCallback((rowIndex, employeeId, cellKey, ref) => {
    // Store by sequential index
    if (!inputRefs.current[`index-${rowIndex}`]) {
      inputRefs.current[`index-${rowIndex}`] = {};
    }
    inputRefs.current[`index-${rowIndex}`][cellKey] = ref;
  }, []);
  
  // Handle keydown events for vertical navigation
  const handleKeyDown = useCallback((e, rowIndex, employeeId, cellKey) => {
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
  }, []);
  
  // Navigate using the sequential index in filtered data
  const navigateBySequentialIndex = useCallback((currentRowIndex, currentEmployeeId, direction, field, index) => {
    try {
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
        
        // IMPORTANT: Don't fire saveEditableCell event since this is already handled
        // in the component's onKeyDown handler before navigating.
        // This prevents double-saving and potential race conditions.
        
        // Clear the current row's editable state
        const clearEvent = new CustomEvent('clearEditableCell', {
          detail: {
            rowIndex: currentRowIndex,
            employeeId: currentEmployeeId
          },
          bubbles: true
        });
        document.dispatchEvent(clearEvent);
        
        // Tell the target row to set its editable state
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
            }
          } catch (err) {
            console.error("Error scrolling to row:", err);
          }
        }, 10);
      }
    } catch (err) {
      console.error("Error during navigation:", err);
    }
  }, [filteredData]);
  
  // Handle tab navigation between rows
  useEffect(() => {
    const handleTabToNextRow = (event) => {
      try {
        const { currentRowIndex, currentEmployeeId } = event.detail;
        
        // Calculate the next row index
        const nextRowIndex = currentRowIndex + 1;
        
        // Check if we have a next row
        if (nextRowIndex >= 0 && nextRowIndex < filteredData.length) {
          const nextEmployeeId = filteredData[nextRowIndex]?.id;
          
          if (!nextEmployeeId) {
            console.error(`No employee ID found for row index ${nextRowIndex}`);
            return;
          }
          
          // Target the first cell in the next row (netHR-0)
          const targetCellKey = "netHR-0";
          
          // Clear the current row's editable state
          const clearEvent = new CustomEvent('clearEditableCell', {
            detail: {
              rowIndex: currentRowIndex,
              employeeId: currentEmployeeId
            },
            bubbles: true
          });
          document.dispatchEvent(clearEvent);
          
          // Tell the target row to set its editable state
          const navigationEvent = new CustomEvent('verticalNavigate', {
            detail: {
              rowIndex: nextRowIndex,
              employeeId: nextEmployeeId,
              cellKey: targetCellKey
            },
            bubbles: true
          });
          document.dispatchEvent(navigationEvent);
          
          // Ensure the target row is visible in the viewport
          setTimeout(() => {
            try {
              // Try to find by data-sequential-index first
              let rowElement = document.querySelector(`[data-sequential-index="${nextRowIndex}"]`);
              
              if (rowElement) {
                rowElement.scrollIntoView({ block: 'nearest', behavior: 'auto' });
              }
            } catch (err) {
              console.error("Error scrolling to row:", err);
            }
          }, 10);
        }
      } catch (err) {
        console.error("Error handling tab to next row:", err);
      }
    };
    
    // Add listener for tab navigation between rows
    document.addEventListener('tabToNextRow', handleTabToNextRow);
    
    // Clean up refs and event listeners when component unmounts or filtered data changes
    return () => {
      document.removeEventListener('tabToNextRow', handleTabToNextRow);
      inputRefs.current = {};
    };
  }, [filteredData]);
  
  return {
    registerInputRef,
    handleKeyDown
  };
};