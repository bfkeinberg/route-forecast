/**
 * @jest-environment jsdom
 */

import React from 'react'
import { configure, shallow, mount } from 'enzyme'
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import {ControlTable} from '../src/jsx/ForecastSettings/ControlTable';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
const mockStore = configureMockStore([]);
// import quixote from "quixote";

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

configure({ adapter: new Adapter() });

const initialState = {routeInfo:{}, uiInfo:{
    "routeParams": {
    },
    "dialogParams": {
    }
}};

let store = mockStore(initialState);

describe('<ControlTable />', () => {
    let frame;
/*
    beforeAll(function(done) {
        frame = quixote.createFrame({
            stylesheet: "/dist/static/main.css"
        }, done);
    });

    afterAll(function() {
        frame.remove();
    });

*/
    it('should render the table of controls', () => {
        const wrapper = shallow(<Provider store={store}><ControlTable displayBanked={false} compare={false} metric={false} updateControls={jest.fn()} controls={[]} calculatedValues={[]}/></Provider>);
        // let container = frame.add(wrapper.getText());
        expect(wrapper.find('ControlTable').length).toBe(1);
    });
});

