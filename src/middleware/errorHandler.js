const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV !== 'production') console.error(err);

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ success: false, message: `${field} already exists` });
  }

  // Mongoose validation
  if (err.name === 'ValidationError') {
    const msg = Object.values(err.errors).map(e => e.message).join(', ');
    return res.status(400).json({ success: false, message: msg });
  }

  res.status(status).json({ success: false, message });
};

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { errorHandler, asyncHandler };
