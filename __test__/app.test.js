/**
 * @jest-environment jsdom
 */

import React from 'react'
import { configure, shallow } from 'enzyme'
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import {RouteWeatherUI} from '../src/jsx/main';
import ForecastTable from "../src/jsx/forecastTable";
import fetchMock from 'fetch-mock';

configure({ adapter: new Adapter() });

describe('<RouteWeatherUI />', () => {
    const setActionUrl=jest.fn();
    const setApiKeys=jest.fn();
    const updateControls=jest.fn();
    const showForm=jest.fn();
    const setFetchAfterLoad=jest.fn();
    const toggleStravaAnalysis=jest.fn();
    const loadFromRideWithGps=jest.fn();
    const reset=jest.fn();
    const newUserMode=jest.fn();
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
    const setRwgpsCredentials=jest.fn();
    const setStartTimestamp=jest.fn()
    it('renders without crashing', () => {

        const wrapper = shallow(<RouteWeatherUI action={'/forecast'} search={''} setActionUrl={setActionUrl} setApiKeys={setApiKeys} updateControls={updateControls}
                                                formVisible={true} showForm={showForm} showPacePerTme={false} setFetchAfterLoad={setFetchAfterLoad}
                                                toggleStravaAnalysis={toggleStravaAnalysis} loadFromRideWithGps={loadFromRideWithGps}
                                                rwgpsRouteIsTrip={false} reset={reset} newUserMode={newUserMode} firstUse={false}
                                                setRwgpsRoute={setRwgpsRoute} setStravaToken={setStravaToken} setStart={setStart}
                                                setInterval={setInterval} setPace={setPace} setMetric={setMetric} setStravaActivity={setStravaActivity}setStravaError={setStravaError}
                                                setStartTimestamp={setStartTimestamp}
                                                setStravaRefreshToken={setStravaRefreshToken}
                                setInitialStart={setInitialStart} setWeatherProvider={setWeatherProvider} setRwgpsCredentials={setRwgpsCredentials}
                                maps_api_key={'zzzz'} bitly_token={'ddd'} timezone_api_key={'lll'}/>);
        expect(wrapper.find(ForecastTable).length).toEqual(0);
    });
});
