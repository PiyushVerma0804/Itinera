const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Log the error internally for developers
  console.error(`[Error Handler] ${err.stack || err.message}`);

  // Return a clean, standardized error response
  res.status(statusCode).json({
    message: err.message || 'An internal server error occurred',
    // Expose stack trace only when NOT in production
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

export default errorHandler;
