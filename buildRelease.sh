#!/bin/sh
# do checkins, possibly resolving issues in github or sentry in the checkin comment
# optionally create github release tag
# create new pending release, then add commits to it
VERSION=$(sentry-cli releases propose-version)
sentry-cli releases new $VERSION
sentry-cli releases set-commits --auto $VERSION
# run prod build, which will also publish artifacts to Sentry and finalize the release
./node_modules/.bin/webpack --mode production --config webpack.prod.js
# deploy build to GAE
gcloud app deploy --project route-forecast
# mark Sentry release as deployed
sentry-cli releases deploys new "$VERSION" --env production
