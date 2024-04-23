import * as Sentry from '@sentry/react';
import queryString from 'query-string';
export const updateHistory = (url, query, forceReplace=false) => {
    Sentry.addBreadcrumb({
        category: 'history',
        level: "info",
        message: query,
        data: {url:url}
    });
    if (typeof window !== 'undefined' && !(/HeadlessChrome/).test(window.navigator.userAgent) && query !== null) {
        let oldState = history.state;
        const queryParams = queryString.parse(query)
        if (forceReplace || (oldState && query && queryString.parse(oldState).rwgpsRoute === queryParams.rwgpsRoute)) {
            history.replaceState(query, '', url);
        } else {
            history.pushState(query, '', url);
        }
    }
};
