// quickFunction.js
function convertMonthToYearMonthFormat(monthString) {
  const months = {
    'Jan': 1,
    'Feb': 2,
    'Mar': 3,
    'Apr': 4,
    'May': 5,
    'Jun': 6,
    'Jul': 7,
    'Aug': 8,
    'Sep': 9,
    'Oct': 10,
    'Nov': 11,
    'Dec': 12
  };

  // Split the monthString into month abbreviation and year
  const [monthAbbr, year] = monthString.split(' ');

  // Convert month abbreviation to number
  const month = months[monthAbbr];

  // Return an object with year and month separately
  return { year, month };
}

// Export the function to be used in other files
module.exports = {
convertMonthToYearMonthFormat
};
