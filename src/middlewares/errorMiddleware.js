const errorMiddleware = (err, req, res, next) => {
    console.error(err.stack);

    const statusCode = err.statusCode || 500;  
    const message = err.message || 'Algo deu errado no servidor'; 
   
    res.status(statusCode).json({
      success: false,
      message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : null,  
    });
  };
  
  module.exports = errorMiddleware;
  