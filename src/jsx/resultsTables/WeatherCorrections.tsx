import { useTranslation } from 'react-i18next'
import { useForecastDependentValues, useAppSelector } from '../../utils/hooks';
const gustySpeedThreshold = 25;
import { Popover } from '@blueprintjs/core';
import { TimeChangeChart } from './TimeChangeChart';

export const WeatherCorrections = () => {
  const isMetric = useAppSelector(state => state.controls.metric)

  const { weatherCorrectionMinutes, maxGustSpeed, chartData } = useForecastDependentValues()
  const { t } = useTranslation()

  const weatherId = (maxGustSpeed > gustySpeedThreshold) ? 'gustyWeather' : 'weatherCorrections';

  const lost = weatherCorrectionMinutes >= 0

  return (
    <Popover interactionKind='hover' content={TimeChangeChart(chartData, isMetric)}>
      <span id={weatherId} style={{ fontSize: "14px" }}>
        <span>
          {Math.abs(Math.round(weatherCorrectionMinutes))} minutes <span style={{ color: lost ? "darkorange" : "deepskyblue" }}>
            {lost ? `${t('data.wind.lost')} ` : `${t('data.wind.gained')} `}</span>{lost ? `${t('data.wind.to')}` : `${t('data.wind.from')}`}
        </span>
      </span>
    </Popover>
  )
}