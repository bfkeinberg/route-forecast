import { HotkeysProvider, OverlaysProvider } from "@blueprintjs/core";
import { Provider } from 'react-redux';
import { useContext } from "react";
import configureReduxStore from '../../redux/configureStore';
import LocationContext from '../locationContext';
import ErrorBoundary from '../shared/ErrorBoundary';
import RouteWeatherUI from './main';

let script = document.scripts.namedItem('routeui')
const mode = script!.getAttribute('mode');

const store = configureReduxStore({ _preloadedState: {}, mode: mode! })
const TopLevel = ({ mode, action, maps_api_key, timezone_api_key, bitly_token, preloaded_state }:
    { mode: string, action: string, maps_api_key: string, timezone_api_key: string, bitly_token: string, preloaded_state: object }) => {
        const {href, search, origin} = useContext(LocationContext)
    return (
        <ErrorBoundary>
            <Provider store={store}>
                <OverlaysProvider>
                    <HotkeysProvider>
                        {<RouteWeatherUI search={search} href={href} action={action} maps_api_key={maps_api_key}
                            timezone_api_key={timezone_api_key} bitly_token={bitly_token} origin={origin} />}
                    </HotkeysProvider>
                </OverlaysProvider>
            </Provider>
        </ErrorBoundary>
    )
};

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch

export default TopLevel;