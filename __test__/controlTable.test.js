import React from 'react'
import { configure, shallow, mount } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16';
import {ControlTable} from '../src/jsx/controlTable';
// import quixote from "quixote";

configure({ adapter: new Adapter() });

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
        const wrapper = shallow(<ControlTable displayBanked={false} compare={false} count={0} metric={false} updateControls={jest.fn()} controls={[]} calculatedValues={[]}/>);
        // let container = frame.add(wrapper.getText());
        expect(wrapper.find('AgGridReact').length).toBe(1);
        expect(wrapper.find('div#controlTable').length).toBe(1);
    });
});

