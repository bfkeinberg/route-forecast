import React, { Component } from 'react';
import {Button,Table,Well} from 'react-bootstrap';

class ForecastTable extends React.Component {

    constructor(props) {
        super(props);
        this.state = {};
    }

    static expandTable(forecast) {
        const redText = ({color:'red'});
        const orange = ({color:'darkOrange'});
        const skyBlue = ({color:'deepSkyBlue'});
        if (forecast.length > 0 && forecast[0].length > 5) {
            return (
                <tbody>
                {forecast.map((point, index, data) =>
                    /*<tr key={Math.random().toString(36).slice(2)}>*/
                    <tr key={point[0]}>
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
        if (this.props.weatherCorrectionMinutes != null) {
            if (this.props.weatherCorrectionMinutes >= 0) {
                var weatherCorrections = Math.round(this.props.weatherCorrectionMinutes) + " minutes lost to wind";
            }
            else {
                var weatherCorrections = Math.round(this.props.weatherCorrectionMinutes) + " minutes gained from wind";
            }
        }
        else {
            var weatherCorrections = null;
        }
        return (
                <div>
                    <a tabIndex='-1' href="https://darksky.net/poweredby/">
                        <img src="https://darksky.net/dev/img/attribution/poweredby.png" alt="Powered by DarkSky" width="80" height="40"/>
                    </a>{weatherCorrections}
                    <Table striped condensed hover bordered>
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
                        {ForecastTable.expandTable(this.props.forecast)}
                    </Table>
                </div>
        );
    }
}

module.exports=ForecastTable;
export default ForecastTable;