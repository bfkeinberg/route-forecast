/**
 * @jest-environment jsdom
 */

import React from 'react'
import { configure, shallow } from 'enzyme'
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import BugReportButton from '../src/jsx/ui/bugReportButton';
import {Button} from '@blueprintjs/core';
configure({ adapter: new Adapter() });

describe('<BugReportButton />', () => {
    it('should contain one Button', () => {
        const wrapper = shallow(<BugReportButton />);
        expect(wrapper.find(Button).length).toBe(1);
        expect(wrapper.find('img#bugImage').exists()).toBe(true)
    });
});

