const {validationResult}=require('express-validator');

const validatorMiddleware=(req,res,next)=>{
 const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map(err => ({
      field: err.param,
      message: err.msg
    }));

    return res.status(422).json({
      status: 'fail',
      errors: extractedErrors
    });
  }

  next();
};


module.exports=validatorMiddleware;