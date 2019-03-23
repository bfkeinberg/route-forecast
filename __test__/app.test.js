import React from 'react'
import { configure, shallow } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16';
import {RouteWeatherUI} from '../src/jsx/main';
import ForecastTable from "../src/jsx/forecastTable";

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
    const setPace=jest.fn();
    const setInterval=jest.fn();
    const setMetric=jest.fn();
    const setStravaActivity=jest.fn();
    const setStravaError=jest.fn();
    it('renders without crashing', () => {
        const wrapper = shallow(<RouteWeatherUI action={'/forecast'} search={''} setActionUrl={setActionUrl} setApiKeys={setApiKeys} updateControls={updateControls}
                                                formVisible={true} showForm={showForm} showPacePerTme={false} setFetchAfterLoad={setFetchAfterLoad}
                                                toggleStravaAnalysis={toggleStravaAnalysis} loadFromRideWithGps={loadFromRideWithGps}
                                                rwgpsRouteIsTrip={false} reset={reset} newUserMode={newUserMode} firstUse={false}
                                                setRwgpsRoute={setRwgpsRoute} setStravaToken={setStravaToken} setStart={setStart}
                                                setInterval={setInterval} setPace={setPace} setMetric={setMetric} setStravaActivity={setStravaActivity} setStravaError={setStravaError}/>);
        expect(wrapper.find(ForecastTable).length).toEqual(1);
    });
});
