const app = require('./index.js');
const port = process.env.PORT || 8080;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`API Version: ${process.env.API_VERSION}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
});
