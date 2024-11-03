// Classe AppError encapsulando todos os dados e métodos relacionados a erros
// Extende a classe Error do JavaScript, ou seja, AppError herda todas as funcionalidades
// de Error
class AppError extends Error {

    // Códigos de status HTTP
    static HttpCode = {
        CONTINUE: 100,
        SWITCHING_PROTOCOLS: 101,
        PROCESSING: 102,
        EARLY_HINTS: 103,
        OK: 200,
        CREATED: 201,
        ACCEPTED: 202,
        NON_AUTHORITATIVE_INFORMATION: 203,
        NO_CONTENT: 204,
        RESET_CONTENT: 205,
        PARTIAL_CONTENT: 206,
        MULTI_STATUS: 207,
        ALREADY_REPORTED: 208,
        IM_USED: 226,
        MULTIPLE_CHOICES: 300,
        MOVED_PERMANENTLY: 301,
        FOUND: 302,
        SEE_OTHER: 303,
        NOT_MODIFIED: 304,
        USE_PROXY: 305,
        TEMPORARY_REDIRECT: 307,
        PERMANENT_REDIRECT: 308,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        PAYMENT_REQUIRED: 402,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        METHOD_NOT_ALLOWED: 405,
        NOT_ACCEPTABLE: 406,
        PROXY_AUTHENTICATION_REQUIRED: 407,
        REQUEST_TIMEOUT: 408,
        CONFLICT: 409,
        GONE: 410,
        LENGTH_REQUIRED: 411,
        PRECONDITION_FAILED: 412,
        PAYLOAD_TOO_LARGE: 413,
        URI_TOO_LONG: 414,
        UNSUPPORTED_MEDIA_TYPE: 415,
        RANGE_NOT_SATISFIABLE: 416,
        EXPECTATION_FAILED: 417,
        IM_A_TEAPOT: 418,
        MISDIRECTED_REQUEST: 421,
        UNPROCESSABLE_ENTITY: 422,
        LOCKED: 423,
        FAILED_DEPENDENCY: 424,
        TOO_EARLY: 425,
        UPGRADE_REQUIRED: 426,
        PRECONDITION_REQUIRED: 428,
        TOO_MANY_REQUESTS: 429,
        REQUEST_HEADER_FIELDS_TOO_LARGE: 431,
        UNAVAILABLE_FOR_LEGAL_REASONS: 451,
        INTERNAL_SERVER_ERROR: 500,
        NOT_IMPLEMENTED: 501,
        BAD_GATEWAY: 502,
        SERVICE_UNAVAILABLE: 503,
        GATEWAY_TIMEOUT: 504,
        HTTP_VERSION_NOT_SUPPORTED: 505,
        VARIANT_ALSO_NEGOTIATES: 506,
        INSUFFICIENT_STORAGE: 507,
        LOOP_DETECTED: 508,
        NOT_EXTENDED: 510,
        NETWORK_AUTHENTICATION_REQUIRED: 511
    };


    // Construtor da classe, para criar uma instância de AppError com os
    // atributos name, httpCode, description e isOperational
    constructor(name, httpCode, description, isOperational) {
        // Invoca o construtor da classe pai (Error) e passa
        // description como argumento para a mensagem de erro
        // Assim, AppError armazena description como a mensagem de erro, herdada de Error.
        super(description);


        Object.setPrototypeOf(this, new.target.prototype); // Restaura a cadeia de protótipos

        this.name = name;
        this.httpCode = httpCode;
        this.isOperational = isOperational;

        // função que captura a "stack trace" (rastro da pilha de execução)
        // no momento em que o erro é criado.
        // Essa linha é especialmente útil para depuração, pois permite que a stack trace mostre exatamente onde o erro foi gerado,
        // facilitando o rastreamento da origem do problema.
        Error.captureStackTrace(this);
    }
}

    class ValidationError extends AppError {
    constructor(description = 'Invalid data provided') {
        super('ValidationError', AppError.HttpCode.BAD_REQUEST, description, true);
    }
}


class AuthenticationError extends AppError {
    constructor(description = 'Authentication failed') {
        super('AuthenticationError', AppError.HttpCode.UNAUTHORIZED, description, true);
    }
}

class AuthorizationError extends AppError {
    constructor(description = 'Access to this resource is forbidden') {
        super('AuthorizationError', AppError.HttpCode.FORBIDDEN, description, true);
    }
}

class NotFoundError extends AppError {
    constructor(description = 'Resource not found') {
        super('NotFoundError', AppError.HttpCode.NOT_FOUND, description, true);
    }
}

class ConflictError extends AppError {
    constructor(description = 'Conflict with current state of resource') {
        super('ConflictError', AppError.HttpCode.CONFLICT, description, true);
    }
}

class DatabaseError extends AppError {
    constructor(description = 'A database error occurred') {
        super('DatabaseError', AppError.HttpCode.INTERNAL_SERVER_ERROR, description, false);
    }
}

class ServiceUnavailableError extends AppError {
    constructor(description = 'Service temporarily unavailable') {
        super('ServiceUnavailableError', AppError.HttpCode.SERVICE_UNAVAILABLE, description);
    }

}

module.exports = {
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    DatabaseError,
    ServiceUnavailableError
}