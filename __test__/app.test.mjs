/**
 * @jest-environment jsdom
 */

import React from 'react'
import { configure, shallow } from 'enzyme'
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import {RouteWeatherUI} from '../src/jsx/app/main';
import fetchMock from 'fetch-mock';
import ForecastTable from '../src/jsx/resultsTables/ForecastTable';

configure({ adapter: new Adapter() });
beforeAll(() => {
    let currentscript = document.createElement('script');
    currentscript.setAttribute('action','/forecast');
    currentscript.setAttribute('maps_api_key', 'mapsKey');
    currentscript.setAttribute('timezome_api_key','timezoneKey');
    Object.defineProperty(document, 'currentScript', {
        value: currentscript,
    });
}
);

describe('<RouteWeatherUI />', () => {
    const setActionUrl=jest.fn();
    const setApiKeys=jest.fn();
    const updateControls=jest.fn();
    const showForm=jest.fn();
    const setRouteLoadingMode=jest.fn();
    const loadFromRideWithGps=jest.fn();
    const reset=jest.fn();
    const setRwgpsRoute=jest.fn();
    const setStravaToken=jest.fn();
    const setStart=jest.fn();
    const setInitialStart=jest.fn();
    const setPace=jest.fn();
    const setInterval=jest.fn();
    const setMetric=jest.fn();
    const setStravaActivity=jest.fn();
    const setStravaError=jest.fn();
    const setStravaRefreshToken=jest.fn();
    const setWeatherProvider=jest.fn();
    const setRwgpsToken=jest.fn();
    const setStartTimestamp=jest.fn();
    const setZoomToRange=jest.fn();
    const setUsePinnedRoutes=jest.fn();
    const setStopAfterLoad=jest.fn()

    it('renders without crashing', () => {

        const wrapper = shallow(<RouteWeatherUI action={'/forecast'} search={''} setActionUrl={setActionUrl} setApiKeys={setApiKeys} updateControls={updateControls}
                                                formVisible={true} showForm={showForm}
                                                setRouteLoadingMode={setRouteLoadingMode} loadFromRideWithGps={loadFromRideWithGps}
                                                rwgpsRouteIsTrip={false} reset={reset}
                                                setRwgpsRoute={setRwgpsRoute} setStravaToken={setStravaToken} setStart={setStart}
                                                setInterval={setInterval} setPace={setPace} setMetric={setMetric} setStravaActivity={setStravaActivity}setStravaError={setStravaError}
                                                setStartTimestamp={setStartTimestamp} setZoomToRange={setZoomToRange}
                                                setStravaRefreshToken={setStravaRefreshToken}
                                setInitialStart={setInitialStart} setWeatherProvider={setWeatherProvider} setRwgpsToken={setRwgpsToken}
                                setUsePinnedRoutes={setUsePinnedRoutes} setStopAfterLoad={setStopAfterLoad}
                                maps_api_key={'zzzz'} bitly_token={'ddd'} timezone_api_key={'lll'}/>);
        expect(wrapper.find(ForecastTable).length).toEqual(0);
    });
});
