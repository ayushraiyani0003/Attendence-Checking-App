require("dotenv").config();

const apiMiddleware = (req, res, next) => {
  const { apiKey, secret } = req.params;

  if (
    apiKey === process.env.API_KEY &&
    secret === process.env.API_SECRET
  ) {
    next(); // proceed to controller
  } else {
    res.status(403).json({ message: "Forbidden: Invalid API credentials" });
  }
};

module.exports = apiMiddleware;
