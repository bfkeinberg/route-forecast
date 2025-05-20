import configureReduxStore from './configureStore';


// Get mode from script element if available, otherwise default to production
let mode = "production";
if (typeof document !== 'undefined') {
    const script = document.scripts.namedItem('routeui');
    if (script) {
        const scriptMode = script.getAttribute('mode');
        if (scriptMode) {
            mode = scriptMode;
        }
    }
}
// Create the store with default empty preloaded state
export const store = configureReduxStore({ _preloadedState: {}, mode: mode });
// Export types derived from the store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;