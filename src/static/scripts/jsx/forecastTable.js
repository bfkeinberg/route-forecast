import React, { Component } from 'react';
import {Button,Table,Well} from 'react-bootstrap';

class ForecastTable extends React.Component {

    constructor(props) {
        super(props);
        this.state = {};
    }

    static expandTable(forecast) {
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
                        <td>{point[6]}</td>
                    </tr>
                )}
                </tbody>
            );
        }
    }

    render() {
        return (
                <div>
                    <a href="https://darksky.net/poweredby/">
                        <img src="https://darksky.net/dev/img/attribution/poweredby.png" alt="Powered by DarkSky" width="80" height="40"/>
                    </a>
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