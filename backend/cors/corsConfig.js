var corsOptions = {
  origin: [
    "http://localhost:5174", 
    "http://localhost:5173",
    "https://arogami.vercel.app",
    "https://*.vercel.app",
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
};
module.exports = corsOptions;
