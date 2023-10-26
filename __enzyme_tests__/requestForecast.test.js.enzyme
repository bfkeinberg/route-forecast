/**
 * @jest-environment jsdom
 */

import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock from 'fetch-mock';
import * as actions from '../src/redux/actions';
import rootReducer from "../src/redux/reducer";
import { calculatedControls, forecast, initialState, timezoneData } from './requestForecastMockedData';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);
import * as Sentry from "@sentry/react";
jest.mock('@sentry/react');
Sentry.startTransaction = jest.fn().mockImplementation(() => {
    return {
        startChild: () => {return {
            finish: () => {return null}
        }},
        finish: () => {return null}
    }
    });

describe('request forecast', () => {

    afterEach(() => {
        fetchMock.reset();
        fetchMock.restore();
    });

    it('sends forecast request and updates state', async () => {

        fetchMock.get('https://maps.googleapis.com/maps/api/timezone/json',
                      {body: {dstOffset:0, rawOffset:0, timeZoneId:'America/Los_Angeles'} });
        fetchMock
            .post('/forecast', { body: {
                    "forecast": forecast
                },
                headers: { 'content-type': 'application/json' } });

        fetchMock
            .get("https://maps.googleapis.com/maps/api/timezone/json?location=37.80605,-122.45043&timestamp=1640876400&key=undefined", {
                body: timezoneData
            })

        const expectedActions = [
            { type: actions.BEGIN_FETCHING_FORECAST, abortMethod:expect.any(Function) },
            { type: actions.FORECAST_FETCH_SUCCESS, forecastInfo: {forecast:forecast}, timeZoneId: "America/Los_Angeles"}
        ];

        let store = mockStore(initialState);
        let v = await (store.dispatch(actions.requestForecast(initialState.routeInfo)));
        let actual = store.getActions();
        expect(store.getActions()).toEqual(expectedActions);

        let newState = expectedActions.reduce((previousValue, currentValue) => rootReducer(previousValue,currentValue),initialState);
        expect(newState.forecast.forecast).toEqual(forecast);

        store = mockStore(newState);
        await (store.dispatch(actions.requestForecast(initialState.routeInfo)));
        expect(store.getActions()).toEqual(expectedActions);

    })
});

