/**
 * @jest-environment jsdom
 */

import React from 'react'
import { configure, shallow } from 'enzyme'
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { DateTime } from 'luxon';
import { useRecalcRoute } from '../src/utils/hooks';

configure({ adapter: new Adapter() });

// tests will need to function fundamentally differently now, probably require mocking dispatch since
// useRecalcRoute doesn't take recalcRoute() as an input anymore

describe('<Recalculate />', () => {
    it('verify recalc is called', () => {
        const recalc = jest.fn();
        const wrapper = shallow(
            <Recalculate start={DateTime.fromISO("2018-07-31T14:00:00.981Z")} pace={'D'} interval={1}
                recalcRoute={recalc} metric={false} controls={[]} gpxRouteData={null}
                rwgpsRoute={102766} />
        );

        expect(recalc.mock.calls.length).toEqual(1);
    });

    it('no recalc when key data is missing', () => {
        const recalc = jest.fn();
        const wrapper = shallow(<Recalculate start={null} pace={'D'} interval={1}
                                             recalcRoute={recalc} metric={false} controls={[]} gpxRouteData={null}
                                             rwgpsRoute={102766}
        />);

        expect(recalc.mock.calls.length).toEqual(0);
    });
});

