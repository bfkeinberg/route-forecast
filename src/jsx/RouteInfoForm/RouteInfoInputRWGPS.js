
import React, { useState } from 'react';
import RwGpsTypeSelector from './RwGpsTypeSelector';
import RideWithGpsId from './RideWithGpsId';
import PinnedRouteLoader from './PinnedRouteLoader.jsx';
import ErrorBoundary from "../shared/ErrorBoundary";
import { Button, Col, Row } from 'reactstrap';
import { connect } from 'react-redux';
import { loadFromRideWithGps } from '../../redux/actions';

export const RouteInfoInputRWGPS = () => {
  const [showPinnedRoutes, setShowPinnedRoutes] = useState(false)

  return (
    <>
      <Row>
        <Col>
          <div style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
            {showPinnedRoutes ? null : 
              <>
                <div style={{flex: 1, padding: "5px"}}><RideWithGpsId /></div>
                <div className="or-divider" style={{flex: 0.3, fontSize: "13px", textAlign: "center"}}>- OR -</div>
              </>
            }
            <ErrorBoundary>
              <div style={{flex: 1, padding: "5px"}}>
                <PinnedRouteLoader
                  showPinnedRoutes={showPinnedRoutes}
                  setShowPinnedRoutes={setShowPinnedRoutes}
                />
              </div>
            </ErrorBoundary>
            <RwGpsTypeSelector visible={false}/>
          </div>
        </Col>
      </Row>
      <Row>
        <RWGPSLoadRouteButton/>
      </Row>
    </>
  )
}

const RWGPSLoadRouteButton = connect(state => ({}), {loadFromRideWithGps})(
  ({loadFromRideWithGps}) => {
    return (
      <Button style={{backgroundColor: "#137cbd", borderColor: "#137cbd"}} onClick={() => loadFromRideWithGps()}>
        Load Route
      </Button>
    )
  }
)