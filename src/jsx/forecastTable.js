import React, {Component} from 'react';
import {Table} from 'reactstrap';
import ErrorBoundary from "./errorBoundary";
import darkSky from 'Images/darkSkySmall.png';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {setWeatherRange} from './actions/actions';

const milesToKm = 1609.34;

class ForecastTable extends Component {
    static propTypes = {
        weatherCorrectionMinutes:PropTypes.number,
        forecast:PropTypes.arrayOf(PropTypes.object).isRequired,
        setWeatherRange:PropTypes.func.isRequired
    };

    constructor(props) {
        super(props);
        this.expandTable = this.expandTable.bind(this);
        this.state = {showGusts:false};
    }

    updateWeatherRange = (event) => {this.props.setWeatherRange(event.currentTarget.getAttribute('start'),
        event.currentTarget.getAttribute('end'));
        if (this.selectedRow!==undefined) {
            this.selectedRow.classList.remove('highlighted');
        }
        event.currentTarget.className = 'highlighted';
        this.selectedRow = event.currentTarget;
    }

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

    toggleGustDisplay = () => this.setState({showGusts:!this.state.showGusts});

    expandTable(forecast) {
        if (forecast.length > 0) {
            return (
                <tbody>
                {forecast.map((point,index) =>
                    /*<tr key={Math.random().toString(36).slice(2)}>*/
                    <tr key={point.time+Math.random().toString(10)}
                        start={point.distance*milesToKm}
                        end={index!==forecast.length-1?forecast[index+1].distance*milesToKm:null}
                        onClick={this.updateWeatherRange}>
                        <td>{point.time}</td>
                        <td>{point.distance}</td>
                        <td>{point.summary}</td>
                        <td>{point.tempStr}</td>
                        <td>{point.precip}</td>
                        <td>{point.cloudCover}</td>
                        <td className={ForecastTable.windStyle(point)}>{this.state.showGusts?<i>{point.gust}</i>:point.windSpeed}</td>
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
        return (
                <div className="animated slideInLeft">
                    <ErrorBoundary>
                    <a tabIndex='-1' href="https://darksky.net/poweredby/"><img src={darkSky}/></a>
                        {weatherCorrections}
                    <Table size='sm' hover bordered responsive>
                        <thead>
                        <tr>
                            <th className={'headerCell'}>Time</th>
                            <th className={'headerCell'}>Mile</th>
                            <th className={'headerCell'}>Summary</th>
                            <th className={'headerCell'}>Temperature</th>
                            <th className={'headerCell'}>Chance of rain</th>
                            <th className={'headerCell'}>Cloud cover</th>
                            <th className={'headerCell'} onClick={this.toggleGustDisplay}>{windHeader}</th>
                        </tr>
                        </thead>
                        {this.expandTable(this.props.forecast)}
                    </Table>
                    </ErrorBoundary>
                </div>
        );
    }
}

const mapStateToProps = (state) =>
    ({
        forecast: state.forecast.forecast,
        weatherCorrectionMinutes: state.routeInfo.weatherCorrectionMinutes
    });

const mapDispatchToProps = {
    setWeatherRange
};

export default connect(mapStateToProps,mapDispatchToProps)(ForecastTable);