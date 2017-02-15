global.jQuery = require('jquery');
import React, { Component } from 'react';
import ControlPointList from './controls';
import ReactDOM from 'react-dom';
import RouteInfoForm from './routeInfoEntry';
import RouteForecastMap from './map';
import ForecastTable from './forecastTable';
import SplitPane from 'react-split-pane';
import { Button } from 'react-bootstrap';
let MediaQuery = require('react-responsive');
require('!style!css!bootstrap/dist/css/bootstrap.min.css');
require('!style!css!normalize.css/normalize.css');
require('!style!css!@blueprintjs/core/dist/blueprint.css');
require('!style!css!@blueprintjs/datetime/dist/blueprint-datetime.css');
const queryString = require('query-string');

class RouteWeatherUI extends React.Component {

    constructor(props) {
        super(props);
        this.updateControls = this.updateControls.bind(this);
        this.updateRouteInfo = this.updateRouteInfo.bind(this);
        this.updateForecast = this.updateForecast.bind(this);
        let script = document.getElementById( "routeui" );

        this.state = {controlPoints: [], routeInfo:{bounds:{},points:[], name:'',finishTime:''}, forecast:[], action:script.getAttribute('action'),
            maps_key:script.getAttribute('maps_api_key'),formVisible:true};
    }

    updateControls(controlPoints) {
        this.setState({controlPoints: controlPoints})
    }

    updateRouteInfo(routeInfo,controlPoints) {
        this.setState({routeInfo:routeInfo,controlPoints:controlPoints});
    }

    updateForecast(forecast) {
        this.setState({forecast:forecast['forecast'],formVisible:false});
    }

    render() {
        let queryParams = queryString.parse(location.search);
        const inputForm = (
            <RouteInfoForm action={this.state.action}
                           updateRouteInfo={this.updateRouteInfo}
                           updateForecast={this.updateForecast}
                           controlPoints={this.state.controlPoints}
                           formVisible={this.state.formVisible}
                           updateFormVisibility={this.updateFormVisibility}
                           start={queryParams.start}
                           pace={queryParams.pace}
                           interval={queryParams.interval}
                           rwgpsRoute={queryParams.rwgpsRoute}
            />
        );
        const formButton = (
            <Button bsStyle="primary" onClick={event => this.setState({formVisible:true})}>Show input</Button>
        );
        return (
        <div>
            <MediaQuery minDeviceWidth={1000}>
                <SplitPane defaultSize={300} minSize={150} maxSize={530} split="horizontal">
                    <SplitPane defaultSize={550} minSize={150} split='vertical' pane2Style={{'overflow':'scroll'}}>
                        {inputForm}
                        <ControlPointList controlPoints={this.state.controlPoints}
                                          updateControls={this.updateControls}
                                          finishTime={this.state.routeInfo['finishTime']}
                                          name={this.state.routeInfo['name']}/>
                    </SplitPane>
                        <SplitPane defaultSize={500} minSize={150} split="vertical" paneStyle={{'overflow':'scroll'}}>
                            <ForecastTable forecast={this.state.forecast}/>
                            <RouteForecastMap maps_api_key={this.state.maps_key}
                                              forecast={this.state.forecast} routeInfo={this.state.routeInfo}/>
                        </SplitPane>
                </SplitPane>
            </MediaQuery>
            <MediaQuery maxDeviceWidth={800}>
                <SplitPane defaultSize={this.state.formVisible?500:250} minSize={120} maxSize={600} split="horizontal" pane2Style={{'overflow':'scroll'}}>
                    <SplitPane defaultSize={this.state.formVisible?308:33} minSize={30} split="horizontal" pane2Style={{'overflow':'scroll'}}>
                        {this.state.formVisible ? inputForm : formButton}
                        <ControlPointList controlPoints={this.state.controlPoints}
                                          updateControls={this.updateControls}
                                          finishTime={this.state.routeInfo['finishTime']}
                                          name={this.state.routeInfo['name']}/>
                    </SplitPane>
                    <ForecastTable forecast={this.state.forecast}/>
                </SplitPane>
            </MediaQuery>
        </div>
      );
    }
}

ReactDOM.render(
  <RouteWeatherUI />,
  document.getElementById('content')
);
