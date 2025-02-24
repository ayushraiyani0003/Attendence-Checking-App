// server.js
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
// Avoid body parsers for multipart/form-data; use them where appropriate for JSON routes.
app.use(express.json());


const PORT = process.env.PORT || 5003;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
