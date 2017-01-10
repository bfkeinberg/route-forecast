global.jQuery = require('jquery');
let React = require('react'),
Grid = require('react-bootstrap').Grid,
Row = require('react-bootstrap').Row,
Col = require('react-bootstrap').Col,
PageHeader = require('react-bootstrap').PageHeader,
ControlPointList = require('./controls'),
ReactDOM = require('react-dom'),
RouteInfoForm = require('./routeInfoEntry'),
RouteForecastMap = require('./map'),
ForecastTable = require('./forecastTable');

var css = require('bootstrap/dist/css/bootstrap.min.css'),
    css1 = require('normalize.css/normalize.css'),
    css2 = require('@blueprintjs/core/dist/blueprint.css'),
    css3 = require('@blueprintjs/datetime/dist/blueprint-datetime.css');

class RouteWeatherUI extends React.Component {

    constructor(props) {
        super(props);
        this.updateControls = this.updateControls.bind(this);
        this.updateForecast = this.updateForecast.bind(this);
        let script = document.getElementById( "routeui" );

        this.state = {controlPoints: [], forecast:{}, routeName:'', action:script.getAttribute('action')};
    }

    updateControls(controlPoints) {
        this.setState({controlPoints: controlPoints})
    }

    updateForecast(forecast) {
        this.setState({forecast:forecast, routeName:forecast['name'], controlPoints:forecast['controls']});
    }

    render() {
      return (
        <div>
            {/*<PageHeader>Get weather for route</PageHeader>*/}
            <Grid>
                <Row>
                    <Col lg={5} md={4}>
                        <RouteInfoForm action={this.state.action}
                                       updateForecast={this.updateForecast}
                                       controlPoints={this.state.controlPoints}/>
                    </Col>
                    <Col lg={7} xs={6} md={7}><ControlPointList controlPoints={this.state.controlPoints}
                                                                updateControls={this.updateControls}
                                                                name={this.state.routeName}/></Col>
                </Row>
                <Row>
                    <Col lg={8}>
                        <ForecastTable forecast={this.state.forecast}/>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <RouteForecastMap forecast={this.state.forecast}/>
                    </Col>
                </Row>
            </Grid>
        </div>
      );
    }
}


ReactDOM.render(
  <RouteWeatherUI />,
  document.getElementById('content')
);
