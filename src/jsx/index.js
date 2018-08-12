import React from 'react';
import ReactDOM from 'react-dom';
import TopLevel from './topLevel';
import { AppContainer } from 'react-hot-loader';

/*global Raven*/
Raven.config('https://ea4c472ff9054dab8c18d594b95d8da2@sentry.io/298059').install();

const render = Component => {
    ReactDOM.render(
        <AppContainer>
            <Component/>
        </AppContainer>,
    document.getElementById('content'))
};

render(TopLevel);

if (module.hot) {
    module.hot.accept('./topLevel.js', () => {
        render(TopLevel);
    });
}
