import React, {Component} from 'react';
import {Table, UncontrolledTooltip} from 'reactstrap';
import ErrorBoundary from "./errorBoundary";
import darkSky from 'Images/darkSkySmall.png';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {setWeatherRange} from './actions/actions';

const milesToKm = 1609.34;

export class ForecastTable extends Component {
    static propTypes = {
        weatherCorrectionMinutes:PropTypes.number,
        forecast:PropTypes.arrayOf(PropTypes.object).isRequired,
        setWeatherRange:PropTypes.func.isRequired,
        metric:PropTypes.bool.isRequired
    };

    constructor(props) {
        super(props);
        this.expandTable = this.expandTable.bind(this);
        this.state = {showGusts:false, showApparentTemp:false};
    }

    updateWeatherRange = (event) => {
        const start = parseInt(event.currentTarget.getAttribute('start'));
        this.props.setWeatherRange(start, event.currentTarget.getAttribute('end'));
        this.setState({selectedRow:start});
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

    expandTable(forecast, metric) {
        if (forecast.length > 0) {
            return (
                <tbody>
                {forecast.map((point,index) =>
                    /*<tr key={Math.random().toString(36).slice(2)}>*/
                    <tr key={point.time+Math.random().toString(10)}
                        start={point.distance*milesToKm}
                        end={index!==forecast.length-1?forecast[index+1].distance*milesToKm:null}
                        className={this.state.selectedRow===parseInt(point.distance*milesToKm)?'highlighted':null}
                        onClick={this.updateWeatherRange} onMouseEnter={this.updateWeatherRange}>
                        <td>{point.time}</td>
                        <td>{metric ? ((point.distance*milesToKm)/1000).toFixed(0) : point.distance}</td>
                        <td>{point.summary}</td>
                        <td>{ForecastTable.formatTemperature(this.state.showApparentTemp?point.feel : point.temp, this.props.metric)}</td>
                        <td>{point.precip}</td>
                        <td>{point.cloudCover}</td>
                        <td className={ForecastTable.windStyle(point)}>{this.state.showGusts?<i>{point.gust}</i>:point.windSpeed}</td>
                        <td>{point.windBearing}</td>
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
        return (
                <div className="animated slideInLeft">
                    <ErrorBoundary>
                    <a tabIndex='-1' href="https://darksky.net/poweredby/"><img src={darkSky}/></a>
                        {weatherCorrections}
                    <Table size='sm' hover bordered>
                        <thead>
                        <tr>
                            <th className={'headerCell'}>Time</th>
                            <th className={'headerCell'}>{distHeader}</th>
                            <th className={'headerCell'}>Summary</th>
                            <th id={'temp'} className={'headerCell'} onClick={this.toggleApparentDisplay}>{temperatureHeader}</th>
                            <th className={'headerCell'}>Chance of rain</th>
                            <th className={'headerCell'}>Cloud cover</th>
                            <th id={'wind'} className={'headerCell'} onClick={this.toggleGustDisplay}>{windHeader}</th>
                            <th className={'headerCell'}>Wind bearing</th>
                        </tr>
                        </thead>
                        {this.expandTable(this.props.forecast, this.props.metric)}
                    </Table>
                    </ErrorBoundary>
                    <UncontrolledTooltip placement={'top'} flip={false} target={'temp'}>Click to toggle between temperature and apparent temperature</UncontrolledTooltip>
                    <UncontrolledTooltip placement={'top'} flip={false} target={'wind'}>Click to toggle between average wind speed and wind gusts</UncontrolledTooltip>
                </div>
        );
    }
}

const mapStateToProps = (state) =>
    ({
        forecast: state.forecast.forecast,
        weatherCorrectionMinutes: state.routeInfo.weatherCorrectionMinutes,
        metric: state.controls.metric
    });

const mapDispatchToProps = {
    setWeatherRange
};

export const formatTemperature = ForecastTable.formatTemperature;
export default connect(mapStateToProps,mapDispatchToProps)(ForecastTable);