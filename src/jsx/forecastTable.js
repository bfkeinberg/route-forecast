import React, {Component} from 'react';
import {Table, UncontrolledTooltip} from 'reactstrap';
import ErrorBoundary from "./errorBoundary";
import darkSky from 'Images/darkSkySmall.png';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {setWeatherRange, toggleWeatherRange, setTableViewed} from './actions/actions';
import MediaQuery from 'react-responsive';

const milesToMeters = 1609.34;
const gustySpeed = 25;

export class ForecastTable extends Component {
    static propTypes = {
        weatherCorrectionMinutes:PropTypes.number,
        forecast:PropTypes.arrayOf(PropTypes.object).isRequired,
        setWeatherRange:PropTypes.func.isRequired,
        toggleWeatherRange:PropTypes.func.isRequired,
        setTableViewed:PropTypes.func.isRequired,
        metric:PropTypes.bool.isRequired,
        gustSpeed: PropTypes.number
    };

    constructor(props) {
        super(props);
        this.expandTable = this.expandTable.bind(this);
        this.state = {showGusts:false, showApparentTemp:false};
        props.setTableViewed();
    }

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

    static windStyle(point) {
        if (point.relBearing <90) {
            if (Math.cos((Math.PI / 180) * point.relBearing) * parseInt(point.windSpeed) > 10) {
                return 'redText';
            } else {
                return 'orangeText';
            }
        } else {
            return 'skyBlueText';
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

    static formatSpeed = (speed, isMetric) => {
        return isMetric ? `${((speed*milesToMeters)/1000).toFixed(0)} kph` : `${speed} mph`;
    };

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
                        <td>{point.time}</td>
                        <td>{metric ? ((point.distance*milesToMeters)/1000).toFixed(0) : point.distance}</td>
                        <td>{point.summary}</td>
                        <td>{this.state.showApparentTemp?
                            <i>{ForecastTable.formatTemperature(point.feel, this.props.metric)}</i>:
                            ForecastTable.formatTemperature(point.temp, this.props.metric)}</td>
                        <td>{point.precip}</td>
                        <MediaQuery minWidth={501}>
                            <td>{point.cloudCover}</td>
                        </MediaQuery>
                        <td className={ForecastTable.windStyle(point)}>{this.state.showGusts?
                            <i>{
                            ForecastTable.formatSpeed(point.gust, this.props.metric)}</i>:
                            ForecastTable.formatSpeed(point.windSpeed, this.props.metric)}</td>
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
        let weatherCorrections;
        if (this.props.weatherCorrectionMinutes !== null) {
            if (this.props.weatherCorrectionMinutes >= 0) {
                weatherCorrections = Math.round(this.props.weatherCorrectionMinutes) + " minutes lost to wind";
            }
            else {
                weatherCorrections = -Math.round(this.props.weatherCorrectionMinutes) + " minutes gained from wind";
            }
        }
        else {
            weatherCorrections = null;
        }
        const windHeader = this.state.showGusts ? 'Wind gust' : 'Wind speed';
        const distHeader = this.props.metric ? 'Kilometer' : 'Mile';
        const temperatureHeader = this.state.showApparentTemp ? 'Apparent temp' : 'Temperature';
        const weatherId = (this.props.gustSpeed > gustySpeed) ? 'gustyWeather' : 'weatherCorrections';
        return (
                <div className="animated slideInLeft">
                    <ErrorBoundary>
                    <a tabIndex='-1' href="https://darksky.net/poweredby/"><img src={darkSky}/></a>
                    <span id={weatherId}>{weatherCorrections}</span>
                    <Table size='sm' hover bordered>
                        <thead>
                        <tr>
                            <th className={'headerCell'}>Time</th>
                            <th id={'dist'} className={'headerCell'}>{distHeader}</th>
                                <th className={'headerCell'}>Summary</th>
                            <th id={'temp'} className={'headerCell'} onClick={this.toggleApparentDisplay}>{temperatureHeader}</th>
                            <th className={'headerCell'}>Chance of rain</th>
                            <MediaQuery minWidth={501}>
                                <th className={'headerCell'}>Cloud cover</th>
                            </MediaQuery>
                            <th id={'wind'} className={'headerCell'} onClick={this.toggleGustDisplay}>{windHeader}</th>
                            <MediaQuery minWidth={501}>
                                <th className={'headerCell'}>Wind bearing</th>
                            </MediaQuery>
                        </tr>
                        </thead>
                        {this.expandTable(this.props.forecast, this.props.metric)}
                    </Table>
                    </ErrorBoundary>
                    <UncontrolledTooltip placement={'top'} target={'dist'}>Distance at start of segment</UncontrolledTooltip>
                    <UncontrolledTooltip placement={'top'} target={'temp'}>Click to toggle between temperature and apparent temperature</UncontrolledTooltip>
                    <UncontrolledTooltip placement={'top'} target={'wind'}>Click to toggle between average wind speed and wind gusts</UncontrolledTooltip>
                </div>
        );
    }
}

const mapStateToProps = (state) =>
    ({
        forecast: state.forecast.forecast,
        weatherCorrectionMinutes: state.routeInfo.weatherCorrectionMinutes,
        gustSpeed: state.routeInfo.maxGustSpeed,
        metric: state.controls.metric
    });

const mapDispatchToProps = {
    setWeatherRange, setTableViewed, toggleWeatherRange
};

export const formatTemperature = ForecastTable.formatTemperature;
export default connect(mapStateToProps,mapDispatchToProps)(ForecastTable);