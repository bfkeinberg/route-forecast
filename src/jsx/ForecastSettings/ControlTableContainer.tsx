
import { Button, Card, Elevation } from "@blueprintjs/core";
import { useAppDispatch, useAppSelector } from "../../utils/hooks";
import { bankedDisplayToggled, controlAdded } from "../../redux/controlsSlice";
import * as Sentry from "@sentry/react"
import { ToggleButton } from '../shared/ToggleButton';
import { ControlTable } from './ControlTable';
import { DesktopTooltip } from "../shared/DesktopTooltip";
import {useTranslation} from 'react-i18next'

export const ControlTableContainer = () => {
  const displayBanked = useAppSelector(state => state.controls.displayBanked)
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  return (
    <>
      <Sentry.ErrorBoundary fallback={<h2>Something went wrong.</h2>}>
        <Card interactive={true} elevation={Elevation.TWO} style={{ margin: '10px', display: "flex", flexFlow: "column", alignItems: "center" }} >
            <Sentry.ErrorBoundary fallback={<h2>Something else went wrong.</h2>}>
              <ControlTable />
              <AddRowButton/>
              <DesktopTooltip usePortal={true} placement='bottom' content={t('tooltips.banked')}>
                  <ToggleButton style={{marginTop: "10px"}} active={displayBanked} onClick={() => dispatch(bankedDisplayToggled())}>{t("buttons.banked")}</ToggleButton>
              </DesktopTooltip>
            </Sentry.ErrorBoundary>
        </Card>
      </Sentry.ErrorBoundary>
      <div tabIndex={98} onFocus={() => {
        let button = document.getElementById('addButton');
        if (button !== undefined && button !== null) {
          button.focus();
        }
      }} />
    </>
  )
}

const AddRowButton = () => {
  const dispatch = useAppDispatch()
  return (
    <div style={{border: "1px solid black", width: "100%"}} onClick={() => dispatch(controlAdded())}>
      <Button id={'addButton'} style={{width: "100%"}} variant='minimal' tabIndex={0} icon={"add"}>Add</Button>
    </div>
  )
}