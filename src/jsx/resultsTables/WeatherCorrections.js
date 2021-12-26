import React from 'react';

export const WeatherCorrections = ({minutesLost}) => {
    const lost = minutesLost >= 0
    return (
      <span>
        {Math.abs(Math.round(minutesLost))} minutes <span style={{color: lost ? "darkorange" : "deepskyblue"}}>{lost ? "lost " : "gained "}</span>{lost ? "to" : "from"} wind
      </span>
    )
}