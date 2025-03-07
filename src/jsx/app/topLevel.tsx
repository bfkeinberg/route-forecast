import { HotkeysProvider, OverlaysProvider } from "@blueprintjs/core";
import { Provider } from 'react-redux';
import { useContext } from "react";
import configureReduxStore from '../../redux/configureStore';
import LocationContext from '../locationContext';
import * as Sentry from "@sentry/react"
import RouteWeatherUI from './main';

let script = document.scripts.namedItem('routeui')
const mode = script!.getAttribute('mode');

const store = configureReduxStore({ _preloadedState: {}, mode: mode?mode:"production" })
const TopLevel = ({ action, maps_api_key, timezone_api_key, bitly_token, preloaded_state }:
    { action: string, maps_api_key: string, timezone_api_key: string, bitly_token: string, preloaded_state?: object }) => {
        const locationContext = useContext(LocationContext);
        const {href, search, origin} = locationContext;        
    return (
        <Sentry.ErrorBoundary  fallback={<h2>Something went wrong.</h2>}>
            <Provider store={store}>
                <OverlaysProvider>
                    <HotkeysProvider>
                        {<RouteWeatherUI search={search} href={href} action={action} maps_api_key={maps_api_key}
                            timezone_api_key={timezone_api_key} bitly_token={bitly_token} origin={origin} />}
                    </HotkeysProvider>
                </OverlaysProvider>
            </Provider>
        </Sentry.ErrorBoundary>
    )
};

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch

export default TopLevel;