import React from 'react';
import {Provider} from 'react-redux';
import configureStore from '../configureStore';
import RouteWeatherUI from '../main';
import ErrorBoundary from '../errorBoundary';
import {hot} from "react-hot-loader/root";
import { setConfig } from 'react-hot-loader'
setConfig({ logLevel: 'debug' });
import LocationContext from '../locationContext';

const TopLevel = ({mode, action, maps_api_key, timezone_api_key, preloaded_state, serverStore}) => {
    const store = serverStore !== undefined ? serverStore : configureStore(preloaded_state,mode);
    return (
        <ErrorBoundary>
            <Provider store={store}>
                <LocationContext.Consumer>
                    {value => <RouteWeatherUI search={value.search} action={action} maps_api_key={maps_api_key}
                                              timezone_api_key={timezone_api_key}/>}
                </LocationContext.Consumer>
            </Provider>
        </ErrorBoundary>
    )
};

export default hot(TopLevel);