import { Provider } from 'react-redux';
import { useContext, StrictMode, lazy, Suspense } from "react";
import LocationContext from '../locationContext';
// import * as Sentry from "@sentry/react"
import { ErrorBoundary } from '@sentry/react';
const RouteWeatherUI = lazy(() => import("./main"));
import { store } from '../../redux/store';
import ChunkErrorBoundary from './ChunkErrorBoundary';

const TopLevel = ({ action, maps_api_key, timezone_api_key, bitly_token, preloaded_state }:
    { action: string, maps_api_key: string, timezone_api_key: string, bitly_token: string, preloaded_state?: object }) => {
        const locationContext = useContext(LocationContext);
        const {href, search, origin} = locationContext;        
    return (
        <ErrorBoundary fallback={<h2>Something went wrong.</h2>}>
            <ChunkErrorBoundary>
                <Provider store={store}>
                    <StrictMode>
                        <Suspense fallback={<div>Loading main UI</div>}>
                            <RouteWeatherUI search={search} href={href} action={action} maps_api_key={maps_api_key}
                                timezone_api_key={timezone_api_key} bitly_token={bitly_token} origin={origin} />
                        </Suspense>
                    </StrictMode>
                </Provider>
            </ChunkErrorBoundary>
        </ErrorBoundary>
    )
};

export default TopLevel;