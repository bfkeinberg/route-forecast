import React from 'react';
import {useTranslation} from 'react-i18next'
import { useForecastDependentValues } from '../../utils/hooks';

const gustySpeedThreshold = 25;

export const WeatherCorrections = () => {
  const { weatherCorrectionMinutes, maxGustSpeed } = useForecastDependentValues()
  const { t } = useTranslation()

  const weatherId = (maxGustSpeed > gustySpeedThreshold) ? 'gustyWeather' : 'weatherCorrections';

  const lost = weatherCorrectionMinutes >= 0
  return (
    <span id={weatherId} style={{ fontSize: "14px" }}>
      <span>
        {Math.abs(Math.round(weatherCorrectionMinutes))} minutes <span style={{ color: lost ? "darkorange" : "deepskyblue" }}>
          {lost ? `${t('data.wind.lost')} ` : `${t('data.wind.gained')} `}</span>{lost ? `${t('data.wind.to')}` : `${t('data.wind.from')}`}
      </span>
    </span>
  )
}