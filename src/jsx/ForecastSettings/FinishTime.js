import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import '../../static/controlsStyles.css';
import { useActualFinishTime } from '../../utils/hooks';

export const FinishTime = () => {

    const predictedFinishTime = useSelector(state => state.routeInfo.finishTime)
    const actualFinishTime = useActualFinishTime()

    const [displayActualFinishTime, setDisplayActualFinishTime] = useState(false)
    
    return (
        <div className="controls-item-contents">
            <span id={'finish-time-label'} className="controls-textinput-label">Finish time</span>
            <span className="finish-time-value"
                  onMouseEnter={() => {
                      if (actualFinishTime !== null) {
                        setDisplayActualFinishTime(true);
                      }}}
                  onMouseLeave={() => setDisplayActualFinishTime(false)}
            >{displayActualFinishTime ? actualFinishTime : predictedFinishTime}</span>
        </div>
    );
};