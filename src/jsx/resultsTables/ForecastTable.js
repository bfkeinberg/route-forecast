import React, {Component} from 'react';

import ErrorBoundary from "../shared/ErrorBoundary";
import darkSky from 'Images/darkSkySmall.png';
import climacell from 'Images/Powered_by_Tomorrow-Black.png';
const meteomatics = <svg viewBox="20 0 115 38" fill="none" xmlns="http://www.w3.org/2000/svg" alt="meteomatics Logo" className="w-14 h-12"><path className="meteomatics-logo_svg__logo-claim" d="M29.38 2.731h3.652v1.352c1.227-1.26 2.852-1.749 4.141-1.749 1.902 0 3.467.89 4.418 2.36 1.196-1.5 3.19-2.36 5.277-2.36 3.404 0 5.614 2.33 5.614 6.043v9.357h-3.406V9.176c0-2.27-1.134-3.682-3.068-3.682-1.687 0-3.374 1.164-3.374 3.712v8.528h-3.405V9.176c0-2.303-1.197-3.682-3.191-3.682-1.688 0-3.251 1.226-3.251 3.957v8.283H29.38V2.73ZM54.49 10.402c0-4.6 3.651-8.068 7.854-8.068 4.171 0 7.331 3.19 7.331 7.269 0 .37-.03.86-.122 1.536h-11.72c.338 2.516 2.24 4.08 4.602 4.08 1.78 0 3.284-.89 3.682-2.241h3.375c-.737 2.945-3.498 5.155-7.27 5.155-4.48 0-7.732-3.437-7.732-7.73Zm11.688-2.055c-.122-1.719-1.717-3.098-3.834-3.098-1.934 0-3.59 1.194-4.264 3.098h8.098ZM81.872 10.402c0-4.6 3.652-8.068 7.854-8.068 4.171 0 7.331 3.19 7.331 7.269 0 .37-.03.86-.122 1.536H85.217c.337 2.516 2.238 4.08 4.601 4.08 1.779 0 3.282-.89 3.682-2.241h3.375c-.737 2.945-3.497 5.155-7.272 5.155-4.479 0-7.73-3.437-7.73-7.73ZM93.56 8.347c-.123-1.719-1.716-3.098-3.834-3.098-1.934 0-3.59 1.194-4.264 3.098h8.098ZM98.651 10.248c0-4.417 3.498-7.914 7.914-7.914a7.877 7.877 0 0 1 7.916 7.914c0 4.418-3.53 7.885-7.916 7.885-4.416 0-7.914-3.467-7.914-7.885Zm7.914 4.726c2.548 0 4.571-2.056 4.571-4.726 0-2.698-2.023-4.754-4.571-4.754-2.608 0-4.571 2.056-4.571 4.754 0 2.67 1.963 4.726 4.571 4.726ZM29.38 22.597h3.652v1.352c1.227-1.26 2.852-1.749 4.141-1.749 1.902 0 3.467.89 4.418 2.36 1.196-1.5 3.19-2.36 5.277-2.36 3.404 0 5.614 2.33 5.614 6.043V37.6h-3.406v-8.558c0-2.27-1.134-3.682-3.068-3.682-1.687 0-3.374 1.164-3.374 3.712V37.6h-3.405v-8.558c0-2.303-1.197-3.682-3.191-3.682-1.688 0-3.251 1.227-3.251 3.957V37.6H29.38V22.597ZM54.464 33.396c0-2.945 2.454-4.998 7.055-4.998h2.7v-.37c0-1.871-1.135-3.038-3.067-3.038-1.657 0-3.037 1.045-3.16 2.578h-3.406c.154-3.16 2.884-5.368 6.627-5.368 3.988 0 6.443 2.423 6.443 6.135V37.6H64.31v-1.564C63.329 37.2 61.673 38 60.047 38c-3.375 0-5.583-1.811-5.583-4.604Zm5.859 1.933c2.24 0 3.988-1.808 3.988-4.171v-.245h-2.7c-2.485 0-3.804.827-3.804 2.393 0 1.197.89 2.023 2.516 2.023ZM68.432 22.598h2.852v-2.732h3.405v2.732h4.018v2.977h-4.018v6.75c0 1.534.766 2.3 2.21 2.3h1.808V37.6h-2.238c-3.436 0-5.185-1.596-5.185-5.03v-6.995h-2.852v-2.977ZM84.04 22.598v15.003h-3.405V22.598h3.404ZM86.071 30.114c0-4.51 3.465-7.914 7.854-7.914 3.62 0 6.687 2.453 7.146 5.768h-3.467c-.337-1.444-1.93-2.578-3.742-2.578-2.515 0-4.448 1.993-4.448 4.724 0 2.7 1.933 4.693 4.448 4.693 1.811 0 3.405-1.104 3.775-2.698h3.434c-.397 3.498-3.497 5.89-7.146 5.89-4.39 0-7.854-3.374-7.854-7.885ZM102.478 32.999h3.252c.122 1.379 1.259 2.33 2.977 2.33 1.687 0 2.668-.827 2.668-1.933 0-3.19-8.62-.95-8.62-6.532 0-2.823 2.363-4.664 5.613-4.664 3.285 0 5.738 1.594 6.045 4.601h-3.345c-.182-1.134-1.256-2.025-2.73-2.025-1.257 0-2.393.554-2.393 1.748 0 2.978 8.743.645 8.743 6.475 0 2.945-2.453 5-5.981 5-3.529 0-5.982-1.84-6.229-5ZM70.24 2.732h2.852V0h3.405v2.732h4.017v2.977h-4.017v6.75c0 1.533.765 2.3 2.209 2.3h1.808v2.975h-2.238c-3.436 0-5.184-1.596-5.184-5.03V5.708h-2.853V2.732Z" fill="#003652"></path><path d="M12.74 20.483H8.874v3.868h3.868v-3.868ZM3.868 11.609H0v3.868h3.868v-3.868Z" fill="#003652"></path><path d="M21.615 2.735H8.873v3.868h8.874v8.874h3.868V2.735Z" fill="#40E0D0"></path><path d="m17.083 17.083-2.735 2.735 2.735 2.735 2.735-2.735-2.735-2.735ZM4.534 4.534 1.799 7.269l2.735 2.735 2.735-2.735-2.735-2.735ZM4.534 17.083l-2.735 2.735 2.735 2.735 2.735-2.735-2.735-2.735Z" fill="#003652"></path></svg>;
const weatherKitImage = "https://weatherkit.apple.com/assets/branding/square-mark.png";
//too large
// import visualcrossing from 'Images/visualCrossing.png';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import MediaQuery from 'react-responsive';
import {finishTimeFormat,fetchAqiToggled,tableViewedSet,zoomToRangeToggled, weatherRangeToggled,weatherRangeSet} from '../../redux/reducer';
import { DateTime } from 'luxon';
import { Icon, HTMLTable, Tooltip } from '@blueprintjs/core';
import cookie from 'react-cookies';
import { ToggleButton } from '../shared/ToggleButton';
import { WeatherCorrections } from './WeatherCorrections';
import { milesToMeters } from '../../utils/util';
import { useForecastDependentValues, useFormatSpeed } from '../../utils/hooks';
import { InstallExtensionButton } from "../InstallExtensionButton";
import { AppToaster } from '../shared/toast';

export class ForecastTable extends Component {
    static propTypes = {
        forecast:PropTypes.arrayOf(PropTypes.object).isRequired,
        weatherRangeSet:PropTypes.func.isRequired,
        weatherRangeToggled:PropTypes.func.isRequired,
        tableViewedSet:PropTypes.func.isRequired,
        metric:PropTypes.bool.isRequired,
        provider: PropTypes.string.isRequired,
        zoomToRangeToggled:PropTypes.func.isRequired,
        zoomToRange:PropTypes.bool.isRequired,
        routeName:PropTypes.string,
        fetchAqiToggled:PropTypes.func,
        fetchAqi:PropTypes.bool.isRequired,
        adjustedTimes:PropTypes.arrayOf(PropTypes.object).isRequired
    };

    constructor(props) {
        super(props);
        this.expandTable = this.expandTable.bind(this);
        this.state = {showGusts:false, showApparentTemp:false};
        props.tableViewedSet();
    }

    toggleZoom = () => {
        this.props.zoomToRangeToggled();
        cookie.save('zoomToRange', !this.props.zoomToRange, { path: '/' });
    };

    toggleAqi = async () => {
        this.props.fetchAqiToggled();
        cookie.save('fetchAqi', !this.props.fetchAqi, { path: '/' });
        if (this.props.fetchAqi) {
            (await AppToaster).show({ message: "AQI fetch enabled", timeout:3000 });
        } else {
            (await AppToaster).show({ message: "AQI fetch disabled", timeout:3000 });
        }
    };

    updateWeatherRange = (event) => {
        const start = parseInt(event.currentTarget.getAttribute('start'));
        if (this.state.selectedRow !== start) {
            this.props.weatherRangeSet({start:start, finish:parseInt(event.currentTarget.getAttribute('end'))});
            this.setState({selectedRow:start});
        }
    };

    toggleRange = (event) => {
        const start = parseInt(event.currentTarget.getAttribute('start'));
        this.props.weatherRangeToggled({start:start, finish:parseInt(event.currentTarget.getAttribute('end'))});
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
                case 'visualcrossing':
                //    return <a href="https://www.visualcrossing.com/weather-data"><img src={visualcrossing}/></a>;
                    return <div><a href="https://www.visualcrossing.com/weather-data">Powered by Visual Crossing Weather</a><p/></div>;
                case 'nws':
                    return <img src={"https://www.weather.gov/images/gjt/newsletter/NWSLogo.png"} width={100} height={100}/>;
                case 'meteomatics':
                    return meteomatics;
                case 'weatherKit':
                    return <img src={weatherKitImage} />;
                default: return <div/>;
            }
    }

    static getAdjustedTime(point, index, adjustedTimes) {
        if (adjustedTimes && adjustedTimes.length > 0 && adjustedTimes.findIndex(element => element.index===index) !== -1) {
            return adjustedTimes.find(element => element.index === index).time.toFormat('h:mm a')
        } else {
            return point.time
        }
    }

    expandTable(forecast, metric, adjustedTimes) {
        if (forecast.length > 0) {
            return (
                <tbody>
                {forecast.map((point,index) =>
                    <tr key={point.time+Math.random().toString(10)}
                        start={point.distance*milesToMeters}
                        end={index!==forecast.length-1?forecast[index+1].distance*milesToMeters:null}
                        className={this.state.selectedRow===parseInt(point.distance*milesToMeters)?'highlighted':null}
                        onClick={this.toggleRange} onMouseEnter={this.updateWeatherRange}>
                        <td className='timeCell'><Time time={index === forecast.length-1 ? null : ForecastTable.getAdjustedTime(point,index,adjustedTimes)}/></td>
                        <td>{metric ? ((point.distance*milesToMeters)/1000).toFixed(0) : point.distance}</td>
                        <td>{point.summary}</td>
                        <td>{this.state.showApparentTemp?
                            <i>{ForecastTable.formatTemperature(point.feel, this.props.metric)}</i>:
                            ForecastTable.formatTemperature(point.temp, this.props.metric)}</td>
                        <td className='chanceRain'>{point.precip}</td>
                        <MediaQuery minWidth={501}>
                            <td>{point.humidity}</td>
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
        const windHeader = <Tooltip content={'Click to toggle between average wind speed and wind gusts'} placement={'top'}>{windHeaderText}</Tooltip>

        const distHeaderText = this.props.metric ? 'KM' : 'Mile';
        const distHeader = <Tooltip content={'Distance at start of segment'} placement={'top'}>{distHeaderText}</Tooltip>

        const temperatureHeaderText = <span className={'clickableHeaderCell'}>{this.state.showApparentTemp ? "Feels like" : <Icon icon="temperature"/>}</span>;
        const temperatureHeader = <Tooltip content={'Click to toggle between temperature and apparent temperature'} placement={'top'}>{temperatureHeaderText}</Tooltip>

        return (
            <div className="animated slideInLeft">
<InstallExtensionButton/>
            <MediaQuery maxWidth={500}>
                <h2>{this.props.routeName}</h2>
            </MediaQuery>
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
                    <HTMLTable compact={true} striped bordered interactive style={{ fontSize: "12px", "borderSpacing": "0px"}}>
                        <thead>
                            <tr>
                                <th><span className={'timeHeaderCell'}>Time</span></th>
                                <th><span className={'headerCell'}>{distHeader}</span></th>
                                <th><span className={'headerCell'}>Summary</span></th>
                                <th id={'temp'} className={'clickableHeaderCell'} onClick={this.toggleApparentDisplay} style={{ cursor: "pointer" }}>{temperatureHeader}</th>
                                <th><span className={'headerCell'}>Chance of rain</span></th>
                                <MediaQuery minWidth={501}>
                                    <th><span className={'headerCell'}>Humidity</span></th>
                                    <th><span className={'headerCell'}>Cloud cover</span></th>
                                </MediaQuery>
                                <th className={'clickableHeaderCell'} onClick={this.toggleAqi} style={{ cursor: "pointer" }} id={'aqi'}>
                                <Tooltip content={'Air quality shows current conditions, not forecasted. Click to toggle for the next forecast requested'} placement={'top'}>
                                    <span className={this.props.fetchAqi?'largerClickableHeaderCell':'largerStruckClickableHeaderCell'}>AQI</span></Tooltip>
                                </th>
                                <th id={'wind'} onClick={this.toggleGustDisplay} style={{ cursor: "pointer" }}>{windHeader}</th>
                                <MediaQuery minWidth={501}>
                                    <th><span className={'headerCell'}>Wind bearing</span></th>
                                </MediaQuery>
                            </tr>
                        </thead>
                        {this.expandTable(this.props.forecast, this.props.metric, this.props.adjustedTimes)}
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
        zoomToRange: state.forecast.zoomToRange,
        routeName: state.routeInfo.name,
        fetchAqi: state.forecast.fetchAqi
    });

const mapDispatchToProps = {
    weatherRangeSet, tableViewedSet, weatherRangeToggled, zoomToRangeToggled, fetchAqiToggled
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
        time || finishTime && DateTime.fromFormat(finishTime, finishTimeFormat).toFormat('h:mm a') || "N/A"
    )
}