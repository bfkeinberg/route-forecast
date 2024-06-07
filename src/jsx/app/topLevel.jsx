import PropTypes from 'prop-types';
import React from 'react';
import {Provider} from 'react-redux';
import {OverlaysProvider, HotkeysProvider} from "@blueprintjs/core"

import configureReduxStore from '../../redux/configureStore';
import LocationContext from '../locationContext';
import ErrorBoundary from '../shared/ErrorBoundary';
import RouteWeatherUI from './main';

const TopLevel = ({mode, action, maps_api_key, timezone_api_key, bitly_token, preloaded_state, serverStore}) => {
    const store = serverStore !== undefined ? serverStore : configureReduxStore(preloaded_state,mode);
    return (
        <ErrorBoundary>
            <Provider store={store}>
                <OverlaysProvider>
                    <HotkeysProvider>
                    <LocationContext.Consumer>
                        {value => <RouteWeatherUI search={value.search} href={value.href} action={action} maps_api_key={maps_api_key}
                            timezone_api_key={timezone_api_key} bitly_token={bitly_token} origin={value.origin} />}
                    </LocationContext.Consumer>
                    </HotkeysProvider>
                </OverlaysProvider>
            </Provider>
        </ErrorBoundary>
    )
};

TopLevel.propTypes = {
    mode:PropTypes.string.isRequired,
    action:PropTypes.string.isRequired,
    maps_api_key:PropTypes.string.isRequired,
    timezone_api_key:PropTypes.string.isRequired,
    bitly_token:PropTypes.string.isRequired,
    preloaded_state:PropTypes.object,
    serverStore:PropTypes.object
}
export default TopLevel;