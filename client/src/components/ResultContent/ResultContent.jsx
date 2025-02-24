import React from 'react';
import './ResultContent.css';

function ResultContent() {
  // Sample data structure:
  const data = [
    {
      punchCode: "P123",
      name: "John Doe",
      mistakes: [
        {
          date: "2024-12-15",
          network: {
            metric: "09:00",
            zoho: "09:05",
            diff: "5 min",
          },
          ot: {
            metric: "18:00",
            zoho: "18:10",
            diff: "10 min",
          },
        },
        {
          date: "2024-12-16",
          network: {
            metric: "08:45",
            zoho: "08:50",
            diff: "5 min",
          },
          ot: null,
        },
        {
          date: "2024-12-17",
          network: {
            metric: "09:15",
            zoho: "09:20",
            diff: "5 min",
          },
          ot: {
            metric: "17:45",
            zoho: "17:55",
            diff: "10 min",
          },
        },
      ],
    },
    {
      punchCode: "P456",
      name: "Jane Smith",
      mistakes: [
        {
          date: "2024-12-18",
          network: {
            metric: "08:40",
            zoho: "08:45",
            diff: "5 min",
          },
          ot: {
            metric: "17:30",
            zoho: "17:40",
            diff: "10 min",
          },
        },
      ],
    },
  ];

  return (
    <div className="result-content">
      <div className="result-content-header">
        <h4>Result</h4>
        <p>The process is completed. Displaying the results...</p>
      </div>
      <div className="result-content-body">
        <table className="result-table">
          <thead>
            <tr>
              <th>Punch Code</th>
              <th>Name</th>
              <th>Problem Date</th>
              <th>Network Metric</th>
              <th>Network Zoho</th>
              <th>Network Diff</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map((record, recIndex) => (
              <React.Fragment key={recIndex}>
                {record.mistakes.map((mistake, mIndex) => (
                  <React.Fragment key={mIndex}>
                    <tr>
                      <td>{record.punchCode}</td>
                      <td>{record.name}</td>
                      <td>{mistake.date}</td>
                      <td>{mistake.network.metric}</td>
                      <td>{mistake.network.zoho}</td>
                      <td>{mistake.network.diff}</td>
                      <td>
                      <input type="checkbox" className='correcting-checkBox' />
                      </td>
                    </tr>
                    {mistake.ot && (
                      <tr className="ot-row">
                        <td colSpan="3" className="ot-label">OT Difference</td>
                        <td>{mistake.ot.metric}</td>
                        <td>{mistake.ot.zoho}</td>
                        <td>{mistake.ot.diff}</td>
                        <td>
                          <input type="checkbox" className='correcting-checkBox' />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ResultContent;
