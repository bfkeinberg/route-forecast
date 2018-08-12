import React from 'react';
import {Provider} from 'react-redux';
import configureStore from './configureStore';
import RouteWeatherUI from './main';
import ErrorBoundary from './errorBoundary';
import {hot} from "react-hot-loader";
import { setConfig } from 'react-hot-loader'
setConfig({ logLevel: 'debug' });

const script = document.scripts.namedItem('routeui');
const store = configureStore(undefined,script.getAttribute('mode'));

const TopLevel = () => {
    return (
        <ErrorBoundary>
            <Provider store={store}>
                <RouteWeatherUI />
            </Provider>
        </ErrorBoundary>
    )
};

export default hot(module)(TopLevel);