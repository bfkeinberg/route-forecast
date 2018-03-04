import React from 'react';
import {render} from 'react-dom';
import {Provider} from 'react-redux';
import configureStore from './configureStore';
import RouteWeatherUI from './main';
import ErrorBoundary from './errorBoundary';

const store = configureStore();

render(
    <ErrorBoundary>
        <Provider store={store}>
            <RouteWeatherUI />
        </Provider>
    </ErrorBoundary>,
    document.getElementById('content')
);