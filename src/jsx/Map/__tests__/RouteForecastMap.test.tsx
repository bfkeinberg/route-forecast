import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import RouteForecastMap from '../RouteForecastMap';
import '@testing-library/jest-dom';

// Mock the Google Maps API
jest.mock('@vis.gl/react-google-maps', () => {
  return {
    APIProvider: ({ children }) => <div data-testid="api-provider">{children}</div>,
    Map: ({ children }) => <div data-testid="google-map">{children}</div>,
    InfoWindow: ({ children }) => <div data-testid="info-window">{children}</div>,
    useMap: () => null,
    useApiIsLoaded: () => false,
    CollisionBehavior: {
      OPTIONAL_AND_HIDES_LOWER_PRIORITY: 'optional_and_hides_lower_priority',
      REQUIRED_AND_HIDES_OPTIONAL: 'required_and_hides_optional'
    }
  };
});

// Mock polyline component
jest.mock('../polyline', () => ({
  Polyline: () => <div data-testid="polyline"></div>
}));

// Mock hooks
jest.mock('../../../utils/hooks', () => ({
  useForecastDependentValues: () => ({ calculatedControlPointValues: null }),
  usePointsAndBounds: () => ({ 
    points: [{ lat: 37.7749, lng: -122.4194 }], 
    bounds: { min_latitude: 37.7, min_longitude: -122.5, max_latitude: 37.8, max_longitude: -122.3 } 
  }),
  useAppSelector: (selector) => {
    // Return different values based on the selector
    return [];
  },
  useAppDispatch: () => jest.fn()
}));

// Mock translations
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key, i18n: { language: 'en' } })
}));

// Setup mock store
const mockStore = configureStore([]);

describe('RouteForecastMap', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      controls: {
        userControlPoints: [],
        metric: false,
        celsius: false
      },
      forecast: {
        forecast: [],
        range: [],
        zoomToRange: false
      },
      strava: {
        activityData: null,
        subrange: []
      },
      uiInfo: {
        routeParams: {
          routeLoadingMode: 'rwgps',
          segment: [0, 0]
        }
      }
    });
  });

  test('renders initialization message when API is not loaded', () => {
    render(
      <Provider store={store}>
        <RouteForecastMap maps_api_key="test-api-key" />
      </Provider>
    );

    expect(screen.getByText('Initializing map...')).toBeInTheDocument();
  });

  test('handles missing API key gracefully', () => {
    // Mock useApiIsLoaded to simulate API loading error
    jest.mock('@vis.gl/react-google-maps', () => ({
      ...jest.requireActual('@vis.gl/react-google-maps'),
      useApiIsLoaded: () => false
    }));

    render(
      <Provider store={store}>
        <RouteForecastMap maps_api_key="" />
      </Provider>
    );

    // Verify we don't try to render the map with invalid key
    expect(screen.queryByTestId('google-map')).not.toBeInTheDocument();
  });
});