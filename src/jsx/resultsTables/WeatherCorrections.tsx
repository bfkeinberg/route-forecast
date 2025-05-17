import { useTranslation } from 'react-i18next'
import { useForecastDependentValues, useAppSelector } from '../../utils/hooks';
const gustySpeedThreshold = 25;
import { Popover } from '@blueprintjs/core';
import { TimeChangeChart } from './TimeChangeChart';
import {useState} from 'react'

export const WeatherCorrections = () => {
  const [popoverIsOpen, setPopoverIsOpen] = useState(false)
  const isMetric = useAppSelector(state => state.controls.metric)

  const { weatherCorrectionMinutes, maxGustSpeed, chartData } = useForecastDependentValues()
  const { t } = useTranslation()

  const weatherId = (maxGustSpeed > gustySpeedThreshold) ? 'gustyWeather' : 'weatherCorrections';

  const lost = weatherCorrectionMinutes >= 0

  return (
    <Popover onOpening={() => setPopoverIsOpen(true) } onClosing={() => setPopoverIsOpen(false)} interactionKind='hover' content={TimeChangeChart(chartData, isMetric, popoverIsOpen)}>
      <span id={weatherId} style={{ fontSize: "14px" }}>
        <span>
          {Math.abs(Math.round(weatherCorrectionMinutes))} minutes <span style={{ color: lost ? "darkorange" : "deepskyblue" }}>
            {lost ? `${t('data.wind.lost')} ` : `${t('data.wind.gained')} `}</span>{lost ? `${t('data.wind.to')}` : `${t('data.wind.from')}`}
        </span>
      </span>
    </Popover>
  )
}