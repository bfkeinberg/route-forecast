/**
 * @jest-environment jsdom
 */

 import React from 'react'
 import { configure } from 'enzyme'
 import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
 import {saveRwgpsCredentials} from '../src/jsx/RouteInfoForm/PinnedRouteLoader';
 import { DateTime } from 'luxon';
 import PasswordCredential from '../__mocks__/PasswordCredential';
 
 jest.mock('../__mocks__/PasswordCredential');

 configure({ adapter: new Adapter() });
 
 const credentials = {
    store: jest.fn()
  };
  
  global.navigator.credentials = credentials;

 describe('<PinnedRouteLoader />', () => {
     it('save password', () => {
         expect(saveRwgpsCredentials("user","password")).toEqual(undefined);
     });
 
 });
 
 