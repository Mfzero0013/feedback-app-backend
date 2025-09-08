const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Erro Interno do Servidor';
    const code = err.code || 'INTERNAL_ERROR';

    res.status(statusCode).json({
        error: {
            message,
            code,
        }
    });
};

module.exports = errorHandler;
