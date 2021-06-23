/**
 * @jest-environment jsdom
 */


import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import * as actions from '../src/jsx/actions/actions';
require('isomorphic-fetch');

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('recalculate route', () => {

    it('recalculate route and updates state', async () => {
        const dir = process.cwd();

        const expectedActions = require(`${dir}/__test__/expectedRecalcActions.json`);

        const initialState = require(`${dir}/__test__/recalcRouteState.json`);

        let store = mockStore(initialState);

        await(store.dispatch(actions.recalcRoute()));
        expect(store.getActions()).toEqual(expectedActions);

        })
});

