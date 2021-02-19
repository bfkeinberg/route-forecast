#!/bin/sh
# do checkins, possibly resolving issues in github or sentry in the checkin comment
# optionally create github release tag
# create new pending release, then add commits to it
VERSION=$(sentry-cli releases propose-version)
sentry-cli releases new $VERSION
sentry-cli releases set-commits --auto $VERSION
# run prod build, which will also publish artifacts to Sentry and finalize the release
./node_modules/.bin/webpack --mode production --config webpack.prod.js --env.sentryRelease=$VERSION
# deploy build to GAE
RELEASE=${1:-current}
if ["$RELEASE" != 'current' ]
gcloud app deploy --quiet --project route-forecast -v $RELEASE --no-promote nodejs.yaml
else
gcloud app deploy --quiet --project route-forecast -v $RELEASE nodejs.yaml
fi
# mark Sentry release as deployed
sentry-cli releases deploys "$VERSION" new --env production --name latest
