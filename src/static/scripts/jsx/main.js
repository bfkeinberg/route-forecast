global.jQuery = require('jquery');
import React, { Component } from 'react';
import ControlPointList from './controls';
import ReactDOM from 'react-dom';
import RouteInfoForm from './routeInfoEntry';
import RouteForecastMap from './map';
import ForecastTable from './forecastTable';
import SplitPane from 'react-split-pane';
let MediaQuery = require('react-responsive');
require('!style!css!bootstrap/dist/css/bootstrap.min.css');
require('!style!css!normalize.css/normalize.css');
require('!style!css!@blueprintjs/core/dist/blueprint.css');
require('!style!css!@blueprintjs/datetime/dist/blueprint-datetime.css');

class RouteWeatherUI extends React.Component {

    constructor(props) {
        super(props);
        this.updateControls = this.updateControls.bind(this);
        this.updateRouteInfo = this.updateRouteInfo.bind(this);
        this.updateForecast = this.updateForecast.bind(this);
        let script = document.getElementById( "routeui" );

        this.state = {controlPoints: [], routeInfo:{bounds:{},points:[], name:'',finishTime:''}, forecast:[], action:script.getAttribute('action'),
            maps_key:script.getAttribute('maps_api_key')};
    }

    updateControls(controlPoints) {
        this.setState({controlPoints: controlPoints})
    }

    updateRouteInfo(routeInfo,controlPoints) {
        this.setState({routeInfo:routeInfo,controlPoints:controlPoints});
    }

    updateForecast(forecast) {
        this.setState({forecast:forecast['forecast']});
    }

    render() {
        return (
        <div>
            <MediaQuery minDeviceWidth={1000}>
                {(matches) => {
                    return (
                        <SplitPane defaultSize={matches?294:500} minSize={150} maxSize={matches?530:600} split="horizontal">
                            <SplitPane defaultSize={matches?550:200} minSize={matches?150:30} split={matches?"vertical":"horizontal"} pane2Style={{'overflow':'scroll'}}>
                                <RouteInfoForm action={this.state.action}
                                                updateRouteInfo={this.updateRouteInfo}
                                                updateForecast={this.updateForecast}
                                                controlPoints={this.state.controlPoints}
                                />
                                <ControlPointList controlPoints={this.state.controlPoints}
                                                  updateControls={this.updateControls}
                                                  finishTime={this.state.routeInfo['finishTime']}
                                                  name={this.state.routeInfo['name']}/>
                            </SplitPane>
                            {matches?
                                <SplitPane defaultSize={500} minSize={150} split="vertical" paneStyle={{'overflow':'scroll'}}>
                                    <ForecastTable forecast={this.state.forecast}/>
                                    <RouteForecastMap maps_api_key={this.state.maps_key}
                                                      forecast={this.state.forecast} routeInfo={this.state.routeInfo}/>
                                </SplitPane>:
                                <ForecastTable forecast={this.state.forecast}/>}
                        </SplitPane>)}}
            </MediaQuery>
        </div>
      );
    }
}

ReactDOM.render(
  <RouteWeatherUI />,
  document.getElementById('content')
);
