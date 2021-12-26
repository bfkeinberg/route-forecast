/**
 * @jest-environment jsdom
 */

import React from 'react'
import { configure } from 'enzyme'
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import {selectMiddleware, loggerMiddleware} from '../src/redux/configureStore';
import Raven from 'raven';
global.Raven = Raven;

configure({ adapter: new Adapter() });

describe('configure store dev vs prod', () => {
    it('redux store in dev', () => {
        let middlewareList = selectMiddleware('development', true);
        expect(middlewareList[1]).toEqual(loggerMiddleware);
        middlewareList = selectMiddleware('production', true);
        expect(middlewareList[1]).not.toEqual(loggerMiddleware);
    });
});

