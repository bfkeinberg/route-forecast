import { FormGroup,InputGroup } from '@blueprintjs/core'
import PropTypes from 'prop-types';
import * as React from 'react';
import { connect } from 'react-redux';

import { stravaRouteSet } from '../../redux/reducer';

const StravaRouteIdInput = ({ stravaRouteSet, strava_route }) => {
    return (
        <FormGroup label={<span><b>Strava Route Id</b></span>} labelFor={"stravaRoute"}>
            <InputGroup style={{fontSize:"16px"}} id='stravaRoute' tabIndex='1' type="text"
                onDrop={event => {
                    let dt = event.dataTransfer;
                    if (dt.items) {
                        for (let i = 0;i < dt.items.length;i++) {
                            if (dt.items[i].kind === 'string') {
                                event.preventDefault();
                                dt.items[i].getAsString(value => {
                                    stravaRouteSet(value);
                                    if (strava_route !== '') {
                                        //updateExpectedTimes(strava_activity);
                                    }
                                });
                            } else {
                                console.log('vetoing drop of', i, dt.items[i].kind);
                                return false;
                            }
                        }
                    }
                }}
                onDragEnd={event => {
                    let dt = event.dataTransfer;
                    if (dt.items) {
                        // Use DataTransferItemList interface to remove the drag data
                        for (let i = 0;i < dt.items.length;i++) {
                            dt.items.remove(i);
                        }
                    }
                }}
                value={strava_route}
                onChange={event => { stravaRouteSet(event.target.value) }}
                onBlur={() => { if (strava_route !== '') { /*updateExpectedTimes(strava_activity)*/ } }} />
        </FormGroup>
    );
};

StravaRouteIdInput.propTypes = {
    strava_route:PropTypes.oneOfType([
        PropTypes.string,
        // eslint-disable-next-line array-element-newline
        PropTypes.oneOf([''])
    ]).isRequired,
    stravaRouteSet:PropTypes.func.isRequired,
};

const mapStateToProps = (state) =>
    ({
        strava_route: state.strava.route
    });

const mapDispatchToProps = {
    stravaRouteSet
};

export default connect(mapStateToProps,mapDispatchToProps)(StravaRouteIdInput);
