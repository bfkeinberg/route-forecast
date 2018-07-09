import React from 'react'
import { configure, shallow, mount } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16';
import BugReportButton from '../src/jsx/ui/bugReportButton';

configure({ adapter: new Adapter() });

describe('<BugReportButton />', () => {
    it('should contain one Button', () => {
        const wrapper = shallow(<BugReportButton />);
        expect(wrapper.find('Button').length).toBe(1);
        expect(wrapper.find('img#bugImage').exists()).toBe(true)
    });
});

