const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const parseCSVFile = (file) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(file.path)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => {
        resolve(results);
      })
      .on("error", (err) => reject(err));
  });
};

const parseOTFile = (file) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(file.path)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => {
        resolve(results);
      })
      .on("error", (err) => reject(err));
  });
};

module.exports = {
  parseCSVFile,
  parseOTFile,
};
