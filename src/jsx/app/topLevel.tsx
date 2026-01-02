import { Provider } from 'react-redux';
import { useContext, StrictMode } from "react";
import LocationContext from '../locationContext';
import * as Sentry from "@sentry/react"
import RouteWeatherUI from './main';
import { store } from '../../redux/store';
import ChunkErrorBoundary from './ChunkErrorBoundary';

const TopLevel = ({ action, maps_api_key, timezone_api_key, bitly_token, preloaded_state }:
    { action: string, maps_api_key: string, timezone_api_key: string, bitly_token: string, preloaded_state?: object }) => {
        const locationContext = useContext(LocationContext);
        const {href, search, origin} = locationContext;        
    return (
        <Sentry.ErrorBoundary fallback={<h2>Something went wrong.</h2>}>
            <ChunkErrorBoundary>
                <Provider store={store}>
                    <StrictMode>
                        <RouteWeatherUI search={search} href={href} action={action} maps_api_key={maps_api_key}
                            timezone_api_key={timezone_api_key} bitly_token={bitly_token} origin={origin} />
                    </StrictMode>
                </Provider>
            </ChunkErrorBoundary>
        </Sentry.ErrorBoundary>
    )
};

export default TopLevel;