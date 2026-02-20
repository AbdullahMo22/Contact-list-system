const ApiError = require("../utils/apiError");

const handleJWTInvalidSignature = () =>
  new ApiError(`invalid token, please login again...`, 401);

const handleTokenExpiredError = () =>
  new ApiError(`your token has expired! please login again..`, 401);

const globalErrorForDev = (err, res) => {
  res.status(err.statusCode || 500).json({
    status: err.status || "error",
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const globalErrorForProd = (err, res) => {
  // لو مشكلة في الـ JWT
  if (err.name === "JsonWebTokenError") err = handleJWTInvalidSignature();
  if (err.name === "TokenExpiredError") err = handleTokenExpiredError();

  res.status(err.statusCode || 500).json({
    status: err.status || "error",
    message: err.message || "حدث خطأ غير متوقع",
  });
};

const globalError = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
    res.locals.errorMessage = err.message; // <-- أضف ده


  if (process.env.NODE_ENV === "development") {
    globalErrorForDev(err, res);
  } else {
    // أي حاجة غير development اعتبرها production
    globalErrorForProd(err, res);
  }
};

module.exports = globalError;
