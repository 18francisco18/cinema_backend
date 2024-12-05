// Routes that don't require authentication
const publicRoutes = [
    '/api/v1/password/forgot-password',
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/sessions/by-date',
    '/api/v1/sessions/find-all',
    '/api/v1/sessions/movie'
];

function isPublicRoute(path) {
    return publicRoutes.some(route => path.includes(route));
}

module.exports = {
    isPublicRoute,
    publicRoutes
};
