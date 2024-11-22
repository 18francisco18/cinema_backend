// Routes that don't require authentication
const publicRoutes = [
    '/api/v1/password/forgot-password',
    '/api/v1/auth/login',
    '/api/v1/auth/register'
];

function isPublicRoute(path) {
    return publicRoutes.some(route => path.includes(route));
}

module.exports = {
    isPublicRoute,
    publicRoutes
};
