import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

const DropdownContainer = styled.div`
  margin: 10px;
  position: relative;
  width: 250px;
`;

const DropdownHeader = styled.div`
  padding: 8px 12px;
  font-size: 14px;
  border-radius: 4px;
  border: 1px solid #ccc;
  cursor: pointer;
  background-color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const DropdownListContainer = styled.div`
  position: absolute;
  width: 100%;
  z-index: 100;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-top: 4px;
  background-color: #fff;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
`;

const DropdownItem = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    color: #fff;
    background-color: rgb(70, 70, 70); /* Gray background with white text on hover */
  }
`;

const Arrow = styled.span`
  border: solid #888;
  border-width: 0 2px 2px 0;
  display: inline-block;
  padding: 3px;
  transform: ${props => props.isOpen ? 'rotate(-135deg)' : 'rotate(45deg)'};
  margin-left: 5px;
`;

const WeekPicker = ({ displayWeeks, onWeekChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState({ weekNum: 0, dateRange: "All Weeks" });
  const dropdownRef = useRef(null);

  const generateWeeks = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalWeeks = 5;
    const daysPerWeek = Math.ceil(daysInMonth / totalWeeks);
    let weeks = [{ weekNum: 0, dateRange: "All Weeks" }]; // Default option
    
    for (let i = 0; i < totalWeeks; i++) {
      const startDay = i * daysPerWeek + 1;
      const endDay = Math.min((i + 1) * daysPerWeek, daysInMonth);
      const startDate = new Date(year, month, startDay);
      const endDate = new Date(year, month, endDay);
      
      const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      };
      
      weeks.push({
        weekNum: i + 1,
        dateRange: `Week ${i + 1} (${formatDate(startDate)} - ${formatDate(endDate)})`,
      });
    }
    return weeks;
  };

  const weeks = generateWeeks();

  // Find the selected week based on displayWeeks prop
  useEffect(() => {
    const selected = weeks.find(week => week.weekNum === displayWeeks) || weeks[0];
    setSelectedOption(selected);
  }, [displayWeeks]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleItemClick = (week) => {
    setSelectedOption(week);
    onWeekChange(week.weekNum);
    setIsOpen(false);
  };

  return (
    <DropdownContainer ref={dropdownRef}>
      <DropdownHeader onClick={() => setIsOpen(!isOpen)}>
        {selectedOption.dateRange}
        <Arrow isOpen={isOpen} />
      </DropdownHeader>
      
      {isOpen && (
        <DropdownListContainer>
          {weeks.map((week) => (
            <DropdownItem
              key={week.weekNum}
              onClick={() => handleItemClick(week)}
            >
              {week.dateRange}
            </DropdownItem>
          ))}
        </DropdownListContainer>
      )}
    </DropdownContainer>
  );
};

export default WeekPicker;