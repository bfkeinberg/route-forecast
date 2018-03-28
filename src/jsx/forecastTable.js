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
        forecast:PropTypes.arrayOf(PropTypes.array).isRequired,
        setWeatherRange:PropTypes.func.isRequired
    };

    constructor(props) {
        super(props);
        this.expandTable = this.expandTable.bind(this);
        this.state = {};
    }

    updateWeatherRange = (event) => this.props.setWeatherRange(event.currentTarget.getAttribute('start'),event.currentTarget.getAttribute('end'));

    expandTable(forecast) {
        const redText = ({color:'red'});
        const orange = ({color:'darkOrange'});
        const skyBlue = ({color:'deepSkyBlue'});
        if (forecast.length > 0 && forecast[0].length > 5) {
            return (
                <tbody>
                {forecast.map((point,index) =>
                    /*<tr key={Math.random().toString(36).slice(2)}>*/
                    <tr key={point[0]+Math.random().toString(10)}
                        start={point[1]*milesToKm}
                        end={index!==forecast.length-1?forecast[index+1][1]*milesToKm:null}
                        onClick={this.updateWeatherRange}>
                        <td>{point[0]}</td>
                        <td>{point[1]}</td>
                        <td>{point[2]}</td>
                        <td>{point[3]}</td>
                        <td>{point[4]}</td>
                        <td>{point[5]}</td>
                        <td style={point[11]<90?(Math.cos((Math.PI / 180)*point[11])*parseInt(point[6])>10?redText:orange):skyBlue}>{point[6]}</td>
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
        return (
                <div className="animated slideInLeft">
                    <ErrorBoundary>
                    <a tabIndex='-1' href="https://darksky.net/poweredby/"><img src={darkSky}/></a>
                        {weatherCorrections}
                    <Table striped size='sm' hover bordered responsive>
                        <thead>
                        <tr>
                            <th style={{'fontSize':'80%'}}>Time</th>
                            <th style={{'fontSize':'80%'}}>Mile</th>
                            <th style={{'fontSize':'80%'}}>Summary</th>
                            <th style={{'fontSize':'80%'}}>Temperature</th>
                            <th style={{'fontSize':'80%'}}>Chance of rain</th>
                            <th style={{'fontSize':'80%'}}>Cloud cover</th>
                            <th style={{'fontSize':'80%'}}>Wind speed</th>
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