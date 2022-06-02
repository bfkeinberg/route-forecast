import React, {Component} from 'react';
import { Tooltip2 } from "@blueprintjs/popover2";

import ErrorBoundary from "../shared/ErrorBoundary";
import darkSky from 'Images/darkSkySmall.png';
import climacell from 'Images/Powered_by_Tomorrow-Black.png';
//too large
// import visualcrossing from 'Images/visualCrossing.png';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {setWeatherRange, toggleWeatherRange, setTableViewed, toggleZoomToRange} from '../../redux/actions';
import MediaQuery from 'react-responsive';
import {finishTimeFormat} from '../../redux/reducer';
import { DateTime } from 'luxon';
import { Icon, HTMLTable } from '@blueprintjs/core';
import cookie from 'react-cookies';
import { ToggleButton } from '../shared/ToggleButton';
import { WeatherCorrections } from './WeatherCorrections';
import { milesToMeters } from '../../utils/util';
import { useForecastDependentValues, useFormatSpeed } from '../../utils/hooks';

export class ForecastTable extends Component {
    static propTypes = {
        forecast:PropTypes.arrayOf(PropTypes.object).isRequired,
        setWeatherRange:PropTypes.func.isRequired,
        toggleWeatherRange:PropTypes.func.isRequired,
        setTableViewed:PropTypes.func.isRequired,
        metric:PropTypes.bool.isRequired,
        provider: PropTypes.string.isRequired,
        toggleZoomToRange:PropTypes.func.isRequired,
        zoomToRange:PropTypes.bool.isRequired
    };

    constructor(props) {
        super(props);
        this.expandTable = this.expandTable.bind(this);
        this.state = {showGusts:false, showApparentTemp:false};
        props.setTableViewed();
    }

    toggleZoom = () => {
        this.props.toggleZoomToRange();
        cookie.save('zoomToRange', !this.props.zoomToRange, { path: '/' });
    };

    updateWeatherRange = (event) => {
        const start = parseInt(event.currentTarget.getAttribute('start'));
        this.props.setWeatherRange(start, parseInt(event.currentTarget.getAttribute('end')));
        this.setState({selectedRow:start});
    };

    toggleRange = (event) => {
        const start = parseInt(event.currentTarget.getAttribute('start'));
        this.props.toggleWeatherRange(start, parseInt(event.currentTarget.getAttribute('end')));
        if (this.state.selectedRow === start) {
            this.setState({selectedRow: null});
        } else {
            this.setState({selectedRow:start});
        }
    };

    static orangeText = {color: 'darkOrange'};

    static skyBlueText = {color: 'deepSkyBlue'};

    static redText = {color: 'red'};

    static windStyle(point) {
        if (point.relBearing <90) {
            if (Math.cos((Math.PI / 180) * point.relBearing) * parseInt(point.windSpeed) >= 10) {
                return ForecastTable.redText;
            } else {
                return ForecastTable.orangeText;
            }
        } else {
            return ForecastTable.skyBlueText;
        }
    }

    static fahrenheitToCelsius(degrees) {
        return (((degrees-32)*5)/9).toFixed(0);
    }

    static formatTemperature(temperature, isMetric) {
        return isMetric ? `${ForecastTable.fahrenheitToCelsius(temperature)}C` : `${temperature}F`;
    }

    toggleGustDisplay = () => this.setState({showGusts:!this.state.showGusts});

    toggleApparentDisplay = () => this.setState({showApparentTemp:!this.state.showApparentTemp});

    displayBacklink = (provider) => {
            switch (provider) {
                case 'darksky':
                    return <a tabIndex='-1' href="https://darksky.net/poweredby/"><img src={darkSky}/></a>;
                case 'climacell':
                    return <a tabIndex='-1' href="https://www.tomorrow.io/"><img src={climacell} width={166} height={19}/></a>;
                case 'weatherapi':
                    return <a href="https://www.weatherapi.com/" title="Free Weather API"><img src='//cdn.weatherapi.com/v4/images/weatherapi_logo.png' alt="Weather data by WeatherAPI.com" border="0"/></a>;
                // case 'visualcrossing':
                //    return <a href="https://www.visualcrossing.com/weather-data"><img src={visualcrossing}/></a>;
                    // return <div><a href="https://www.visualcrossing.com/weather-data">Powered by Visual Crossing Weather</a><p/></div>;
                case 'nws':
                    return <img src={"https://www.weather.gov/images/gjt/newsletter/NWSLogo.png"} width={100} height={100}/>;
                default: return <div/>;
            }
    }

    expandTable(forecast, metric) {
        if (forecast.length > 0) {
            return (
                <tbody>
                {forecast.map((point,index) =>
                    /*<tr key={Math.random().toString(36).slice(2)}>*/
                    <tr key={point.time+Math.random().toString(10)}
                        start={point.distance*milesToMeters}
                        end={index!==forecast.length-1?forecast[index+1].distance*milesToMeters:null}
                        className={this.state.selectedRow===parseInt(point.distance*milesToMeters)?'highlighted':null}
                        onClick={this.toggleRange} onMouseEnter={this.updateWeatherRange}>
                        <td><Time time={index === forecast.length ? null : point.time}/></td>
                        <td>{metric ? ((point.distance*milesToMeters)/1000).toFixed(0) : point.distance}</td>
                        <td>{point.summary}</td>
                        <td>{this.state.showApparentTemp?
                            <i>{ForecastTable.formatTemperature(point.feel, this.props.metric)}</i>:
                            ForecastTable.formatTemperature(point.temp, this.props.metric)}</td>
                        <td>{point.precip}</td>
                        <MediaQuery minWidth={501}>
                            <td>{point.cloudCover}</td>
                        </MediaQuery>
                        <td>{point.aqi!==undefined?point.aqi:'N/A'}</td>
                        <td style={ForecastTable.windStyle(point)}>
                            <WindSpeed gust={point.gust} windSpeed={point.windSpeed} showGusts={this.state.showGusts}/>
                        </td>
                        <MediaQuery minWidth={501}>
                            <td>{point.windBearing}</td>
                        </MediaQuery>
                    </tr>
                )}
                </tbody>
            );
        }
    }

    render() {
        const windHeaderText = <span className={'clickableHeaderCell'}>{this.state.showGusts ? 'Wind gust' : 'Wind speed'}</span>;
        const windHeader = <Tooltip2 content={'Click to toggle between average wind speed and wind gusts'} placement={'top'}>{windHeaderText}</Tooltip2>

        const distHeaderText = this.props.metric ? 'KM' : 'Mile';
        const distHeader = <Tooltip2 content={'Distance at start of segment'} placement={'top'}>{distHeaderText}</Tooltip2>

        const temperatureHeaderText = <span className={'clickableHeaderCell'}>{this.state.showApparentTemp ? "Feels like" : <Icon icon="temperature"/>}</span>;
        const temperatureHeader = <Tooltip2 content={'Click to toggle between temperature and apparent temperature'} placement={'top'}>{temperatureHeaderText}</Tooltip2>

        return (
            <div className="animated slideInLeft">
                <ErrorBoundary>
                    <div style={{ display: 'flex', padding: '16px' }}>
                        <div style={{ flex: 1 }}>
                            {this.displayBacklink(this.props.provider)}
                        </div>
                        <div style={{ flex: 1 }}>
                            <WeatherCorrections />
                        </div>
                        <div style={{ flex: 1 }}>
                            <ToggleButton active={this.props.zoomToRange} onClick={this.toggleZoom}>Zoom to Segment</ToggleButton>
                        </div>
                    </div>
                    <HTMLTable bordered interactive striped style={{ fontSize: "12px"}}>
                        <thead>
                            <tr>
                                <th><span className={'headerCell'}>Time</span></th>
                                <th><span className={'headerCell'}>{distHeader}</span></th>
                                <th><span className={'headerCell'}>Summary</span></th>
                                <th id={'temp'} className={'clickableHeaderCell'} onClick={this.toggleApparentDisplay} style={{ cursor: "pointer" }}>{temperatureHeader}</th>
                                <th><span className={'headerCell'}>Chance of rain</span></th>
                                <MediaQuery minWidth={501}>
                                    <th><span className={'headerCell'}>Cloud cover</span></th>
                                </MediaQuery>
                                <th className={'headerCell'} id={'aqi'}>
                                    <Tooltip2 content={'Air quality shows current conditions, not forecasted'} placement={'top'}>
                                        AQI
                                    </Tooltip2>
                                </th>
                                <th id={'wind'} onClick={this.toggleGustDisplay} style={{ cursor: "pointer" }}>{windHeader}</th>
                                <MediaQuery minWidth={501}>
                                    <th><span className={'headerCell'}>Wind bearing</span></th>
                                </MediaQuery>
                            </tr>
                        </thead>
                        {this.expandTable(this.props.forecast, this.props.metric)}
                    </HTMLTable>
                </ErrorBoundary>
            </div>
        );
    }
}

const mapStateToProps = (state) =>
    ({
        forecast: state.forecast.forecast,
        provider: state.forecast.weatherProvider,

        metric: state.controls.metric,
        zoomToRange: state.forecast.zoomToRange
    });

const mapDispatchToProps = {
    setWeatherRange, setTableViewed, toggleWeatherRange, toggleZoomToRange
};

export const formatTemperature = ForecastTable.formatTemperature;
export default connect(mapStateToProps,mapDispatchToProps)(ForecastTable);

const WindSpeed = ({gust, windSpeed, showGusts}) => {
    const formatSpeed = useFormatSpeed()
    return (
        showGusts ?
            <i>{formatSpeed(parseInt(gust, 10))}</i> :
            formatSpeed(parseInt(windSpeed, 10))
    )
}

WindSpeed.propTypes = {
    gust:PropTypes.string.isRequired,
    windSpeed:PropTypes.string.isRequired,
    showGusts:PropTypes.bool.isRequired
};

const Time = ({time}) => {
    const { finishTime } = useForecastDependentValues()

    return (
        time || DateTime.fromFormat(finishTime, finishTimeFormat).toFormat('h:mma')
    )
}