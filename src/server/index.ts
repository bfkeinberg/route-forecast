import app from "./server"

const port = process.env.PORT || 8080;
app.listen(port, () =>
    console.info(`Route forecast server v${process.env.npm_package_version} listening on port ${port}!`)
);