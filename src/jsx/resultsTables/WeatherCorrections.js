import React from 'react';
import { useForecastDependentValues } from '../../utils/hooks';

const gustySpeedThreshold = 25;

export const WeatherCorrections = () => {
  const { weatherCorrectionMinutes, maxGustSpeed } = useForecastDependentValues()

  const weatherId = (maxGustSpeed > gustySpeedThreshold) ? 'gustyWeather' : 'weatherCorrections';

  const lost = weatherCorrectionMinutes >= 0
  return (
    <span id={weatherId} style={{ fontSize: "13px" }}>
      <span>
        {Math.abs(Math.round(weatherCorrectionMinutes))} minutes <span style={{ color: lost ? "darkorange" : "deepskyblue" }}>{lost ? "lost " : "gained "}</span>{lost ? "to" : "from"} wind
      </span>
    </span>
  )
}