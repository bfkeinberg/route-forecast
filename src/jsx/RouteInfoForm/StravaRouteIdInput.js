import React from 'react';
import PropTypes from 'prop-types';
import { Label, Input, FormGroup } from 'reactstrap';
import { connect } from 'react-redux';
import { setStravaActivity } from "../../redux/actions";

const StravaRouteIdInput = ({ setStravaActivity, strava_activity, canAnalyze }) => {
    return (
        <FormGroup>
            <Label for='stravaRoute' size='sm' tag='b'>Strava Activity Id</Label>
            <Input autoFocus id='stravaRoute' tabIndex='2' type="text"
                onDrop={event => {
                    let dt = event.dataTransfer;
                    if (dt.items) {
                        for (let i = 0;i < dt.items.length;i++) {
                            if (dt.items[i].kind === 'string') {
                                event.preventDefault();
                                dt.items[i].getAsString(value => {
                                    setStravaActivity(value);
                                    if (strava_activity !== '') {
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
                /*
                                     onDragOver={event => {
                                         event.preventDefault();
                                         event.dataTransfer.dropEffect = 'move';
                                     }}
                */
                onDragEnd={event => {
                    let dt = event.dataTransfer;
                    if (dt.items) {
                        // Use DataTransferItemList interface to remove the drag data
                        for (let i = 0;i < dt.items.length;i++) {
                            dt.items.remove(i);
                        }
                    }
                }}
                value={strava_activity}
                onChange={event => { setStravaActivity(event.target.value) }}
                onFocus={() => {
                    if (canAnalyze) {
                        // TODO
                        // i suspect this is here as a mechanism to automatially begin fetching if linked to with a premade url
                        // but this feels not ideal to me, making that functionality rely on the focus details of a random text input deep in the component tree
                        // should think about better ways of doing this
                        //updateExpectedTimes(strava_activity)
                    } else {
                        console.log('gained focus but not acting')
                    }
                }}
                onBlur={() => { if (strava_activity !== '') { /*updateExpectedTimes(strava_activity)*/ } }} />
        </FormGroup>
    );
};

StravaRouteIdInput.propTypes = {
    strava_activity:PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.oneOf([''])
    ]).isRequired,
    setStravaActivity:PropTypes.func.isRequired,
    canAnalyze:PropTypes.bool.isRequired
};

const mapStateToProps = (state) =>
    ({
        strava_activity: state.strava.activity,
        canAnalyze: state.strava.activity !== '' && state.strava.access_token != null
    });

const mapDispatchToProps = {
    setStravaActivity
};

export default connect(mapStateToProps,mapDispatchToProps)(StravaRouteIdInput);
