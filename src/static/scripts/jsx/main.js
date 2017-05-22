global.jQuery = require('jquery');
import React, { Component } from 'react';
import ControlPointList from './controls';
import ReactDOM from 'react-dom';
import RouteInfoForm from './routeInfoEntry';
import RouteForecastMap from './map';
import ForecastTable from './forecastTable';
import moment from 'moment';
import SplitPane from 'react-split-pane';
import { Button } from 'react-bootstrap';
let MediaQuery = require('react-responsive');
require('!style!css!bootstrap/dist/css/bootstrap.min.css');
require('!style!css!normalize.css/normalize.css');
require('!style!css!@blueprintjs/core/dist/blueprint.css');
require('!style!css!@blueprintjs/datetime/dist/blueprint-datetime.css');
const queryString = require('query-string');
import cookie from 'react-cookie';

class RouteWeatherUI extends React.Component {

    constructor(props) {
        super(props);
        this.updateControls = this.updateControls.bind(this);
        this.updateRouteInfo = this.updateRouteInfo.bind(this);
        this.updateForecast = this.updateForecast.bind(this);
        this.updateFinishTime = this.updateFinishTime.bind(this);
        let script = document.getElementById( "routeui" );
        let queryParams = queryString.parse(location.search);
        this.state = {controlPoints: queryParams.controlPoints==null?[]:JSON.parse(queryParams.controlPoints),
            routeInfo:{bounds:{},points:[], name:'',finishTime:''}, forecast:[], action:script.getAttribute('action'),
            maps_key:script.getAttribute('maps_api_key'),formVisible:true, weatherCorrectionMinutes:null};
    }

    updateControls(controlPoints) {
        this.setState({controlPoints: controlPoints})
        if (this.state.routeInfo.name != '') {
            cookie.save(this.state.routeInfo.name,JSON.stringify(controlPoints));
        }
    }

    updateRouteInfo(routeInfo,controlPoints) {
        if (this.state.routeInfo.name != routeInfo.name) {
            let savedControlPoints = cookie.load(routeInfo.name);
            if (savedControlPoints != null && savedControlPoints.length > 0) {
                controlPoints = savedControlPoints;
            }
        }
        if (routeInfo.name != '') {
            cookie.save(routeInfo.name,JSON.stringify(controlPoints));
        }
        this.setState({'routeInfo':routeInfo,'controlPoints':controlPoints});
    }

    updateFinishTime(weatherCorrectionMinutes) {
        let routeInfoCopy = this.state.routeInfo;
        routeInfoCopy.finishTime =
            moment(routeInfoCopy.finishTime,'ddd, MMM DD h:mma').add(weatherCorrectionMinutes,'minutes').format('ddd, MMM DD h:mma');
        this.setState({'routeInfo':routeInfoCopy,weatherCorrectionMinutes:weatherCorrectionMinutes});
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
                           updateControls={this.updateControls}
                           controlPoints={this.state.controlPoints}
                           formVisible={this.state.formVisible}
                           updateFormVisibility={this.updateFormVisibility}
                           updateFinishTime={this.updateFinishTime}
                           start={queryParams.start}
                           pace={queryParams.pace}
                           interval={queryParams.interval}
                           rwgpsRoute={queryParams.rwgpsRoute}
                           maps_api_key={this.state.maps_key}
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
                            <ForecastTable forecast={this.state.forecast} weatherCorrectionMinutes={this.state.weatherCorrectionMinutes}/>
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
                    <ForecastTable forecast={this.state.forecast} weatherCorrectionMinutes={this.state.weatherCorrectionMinutes}/>
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
