import React from 'react'
import { configure, shallow, mount } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16';
import {RouteWeatherUI} from '../src/jsx/main';
configure({ adapter: new Adapter() });

describe.skip('<RouteWeatherUI />', () => {
    it('renders without crashing', () => {
        const wrapper = shallow(<RouteWeatherUI />);
        console.log(wrapper.debug());
    });
});

//setActionUrl={} setApiKeys={} updateControls={} formVisible={} showForm={} showPacePerTme={} setFetchAfterLoad={} toggleStravaAnalysis={} loadFromRideWithGps={} rwgpsRouteIsTrip={} reset={} firstUse={} newUserMode={}
