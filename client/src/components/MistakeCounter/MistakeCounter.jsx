// MistakeCounter.jsx
import React from 'react';

const MistakeCounter = ({ totalMistakes }) => {
  return (
      <div className="mistake-counter">
        <span className="mistake-label">Total Mistakes:</span>
        <span className="mistake-count">{totalMistakes || 0}</span>

      {/* CSS for the component */}
      <style jsx>{`
        .mistake-counter-container {
            margin: 10px 0;
            display: flex;
            justify-content: flex-end;
            }
            
            .mistake-counter {
                background-color: #ffebee;
                border: 1px solid rgb(255, 105, 94);
                border-radius: 8px;
                padding: 4px 16px;
                display: inline-flex;
                align-items: center;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                
                .mistake-label {
                    font-weight: bold;
                    margin-right: 8px;
                    color:rgb(238, 66, 66);
                    font-size: 14px;
                    }
                    
                    .mistake-count {
                        background-color:rgb(228, 69, 69);
                        color: white;
                        font-weight: bold;
                        font-size: 14px;
                        padding: 4px 10px;
                        border-radius: 20px;
                        min-width: 24px;
                        text-align: center;
                        }
                        `}</style>
                        </div>
  );
};

export default MistakeCounter;