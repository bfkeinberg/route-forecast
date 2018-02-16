import React from 'react';
import {render} from 'react-dom';
import {Provider} from 'react-redux';
import configureStore from './configureStore';
import RouteWeatherUI from './main';

const store = configureStore();

render(
    <Provider store={store}>
        <RouteWeatherUI />
    </Provider>,
    document.getElementById('content')
);