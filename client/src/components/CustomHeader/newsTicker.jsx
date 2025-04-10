import React, { useEffect, useRef, useState } from 'react';
import './NewsTicker.css';

const NewsTicker = ({ messages, speed = 40, pauseOnHover = true }) => {
  const [position, setPosition] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const animationRef = useRef(null);
  
  // If there are multiple messages, join them with a separator
  const tickerText = Array.isArray(messages) 
    ? messages.join(' • ') 
    : messages;

  useEffect(() => {
    // Reset position if message changes
    if (containerRef.current) {
      setPosition(containerRef.current.offsetWidth);
    }
  }, [tickerText]);

  useEffect(() => {
    if (!containerRef.current || !contentRef.current) return;
    
    // Set initial position if needed
    if (position === 0) {
      setPosition(containerRef.current.offsetWidth);
    }

    // Calculate total width
    const contentWidth = contentRef.current.offsetWidth;
    const containerWidth = containerRef.current.offsetWidth;
    
    let lastTimestamp = 0;
    
    const animate = (timestamp) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const elapsed = timestamp - lastTimestamp;
      
      if (!isPaused) {
        // Move position by speed (pixels per second)
        const pixelsToMove = (speed * elapsed) / 1000;
        setPosition(prevPosition => {
          // Reset to start when text has scrolled fully outside view
          if (prevPosition < -contentWidth) {
            return containerWidth;
          }
          return prevPosition - pixelsToMove;
        });
      }
      
      lastTimestamp = timestamp;
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [speed, isPaused, position === 0]); // Only depend on position initially

  // Handlers for pause on hover
  const handleMouseEnter = () => {
    if (pauseOnHover) setIsPaused(true);
  };
  
  const handleMouseLeave = () => {
    if (pauseOnHover) setIsPaused(false);
  };

  return (
    <div 
      className="news-ticker-container" 
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div 
        className="news-ticker-content" 
        ref={contentRef}
        style={{ transform: `translateX(${position}px)` }}
      >
        {tickerText}
      </div>
    </div>
  );
};

export default NewsTicker;