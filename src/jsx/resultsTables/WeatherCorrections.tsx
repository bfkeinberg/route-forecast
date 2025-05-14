import {useTranslation} from 'react-i18next'
import { useForecastDependentValues, useAppSelector } from '../../utils/hooks';
import {useState} from "react"
const gustySpeedThreshold = 25;
import { TimeChangeChart } from './TimeChangeChart';

export const WeatherCorrections = () => {
  const [hovering, setHovering] = useState(false)
  const isMetric = useAppSelector(state => state.controls.metric)
  const onMouseEnter = () => setHovering(true)
  const onMouseLeave = () => setHovering(false)
  
  const { weatherCorrectionMinutes, maxGustSpeed, chartData } = useForecastDependentValues()
  const { t } = useTranslation()

  const weatherId = (maxGustSpeed > gustySpeedThreshold) ? 'gustyWeather' : 'weatherCorrections';

  const lost = weatherCorrectionMinutes >= 0
  return (
    <span id={weatherId} style={{ fontSize: "14px" }}>
      <span onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
        {hovering && <TimeChangeChart chartData={chartData} metric={isMetric}/>}
        {Math.abs(Math.round(weatherCorrectionMinutes))} minutes <span style={{ color: lost ? "darkorange" : "deepskyblue" }}>
          {lost ? `${t('data.wind.lost')} ` : `${t('data.wind.gained')} `}</span>{lost ? `${t('data.wind.to')}` : `${t('data.wind.from')}`}
      </span>
    </span>
  )
}