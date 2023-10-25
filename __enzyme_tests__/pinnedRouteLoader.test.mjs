/**
 * @jest-environment jsdom
 */

 import React from 'react'
 import { configure, mount } from 'enzyme'
 import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
 import PinnedRouteLoader from '../src/jsx/RouteInfoForm/PinnedRouteLoader';
 configure({ adapter: new Adapter() });
 import configureMockStore from 'redux-mock-store';
 import thunk from 'redux-thunk';
 import { Provider } from 'react-redux';
 import { Button } from '@blueprintjs/core';

 const initialState = {
    rideWithGpsInfo:{
        token:"IAmAToken",
        pinnedRoutes:[],
        loadingRoutes:false,
        usePinnedRoutes:false
    },

 };
 const middlewares = [thunk];
 const mockStore = configureMockStore(middlewares);

 let store = mockStore(initialState);

 describe('<PinnedRouteLoader />', () => {
     const setShowPinnedRoutes = jest.fn();

     it('is rendered', () => {
        const wrapper = mount(<Provider store={store}><PinnedRouteLoader showPinnedRoutes={true} setShowPinnedRoutes={setShowPinnedRoutes}/></Provider>);
        expect(wrapper.find(Button).length).toBe(1);
     });

 });
