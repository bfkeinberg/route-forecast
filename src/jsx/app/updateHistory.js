import * as Sentry from '@sentry/react';

export const updateHistory = (url, query) => {
    Sentry.addBreadcrumb({
        category: 'history',
        level: "info",
        data: query,
        message: url
    });
    if (typeof window !== 'undefined' && !(/HeadlessChrome/).test(window.navigator.userAgent) && query !== null) {
        let oldState = history.state;
        if (oldState && query && oldState.rwgpsRoute === query.rwgpsRoute) {
            history.replaceState(query, 'nothing', url);
        } else {
            history.pushState(query, 'nothing', url);
        }
    }
};
