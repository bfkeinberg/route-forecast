import { useTranslation } from 'react-i18next'
import { useAppSelector } from '../../utils/hooks';
import { useForecastDependentValues } from "../../utils/forecastValuesHook";
const gustySpeedThreshold = 25;
import '@mantine/core/styles/Popover.css';
import { Popover } from '@mantine/core';
import { TimeChangeChart } from './TimeChangeChart';
import {useState} from 'react'
import { useDisclosure } from '@mantine/hooks';

export const WeatherCorrections = () => {
  const [popoverIsOpen, setPopoverIsOpen] = useState(false)
  const isMetric = useAppSelector(state => state.controls.metric)

  const { weatherCorrectionMinutes, maxGustSpeed, chartData } = useForecastDependentValues()
  const { t } = useTranslation()

  const weatherId = (maxGustSpeed > gustySpeedThreshold) ? 'gustyWeather' : 'weatherCorrections';

  const lost = weatherCorrectionMinutes >= 0
  const [opened, { close, open }] = useDisclosure(false);
  return (
    <Popover onOpen={() => setPopoverIsOpen(true) } onClose={() => setPopoverIsOpen(false)} opened={opened} withArrow shadow='md' arrowPosition='side' position='right'>
      <Popover.Target>
        <span id={weatherId} style={{ fontSize: "14px" }} onMouseEnter={open} onMouseLeave={close}>
          <span>
            {Math.abs(Math.round(weatherCorrectionMinutes))} minutes <span style={{ color: lost ? "darkorange" : "deepskyblue" }}>
              {lost ? `${t('data.wind.lost')} ` : `${t('data.wind.gained')} `}</span>{lost ? `${t('data.wind.to')}` : `${t('data.wind.from')}`}
          </span>
        </span>
      </Popover.Target>
      <Popover.Dropdown>
          <TimeChangeChart chartData={chartData} metric={isMetric} popoverIsOpen={popoverIsOpen}/>
      </Popover.Dropdown>
    </Popover>
  )
}