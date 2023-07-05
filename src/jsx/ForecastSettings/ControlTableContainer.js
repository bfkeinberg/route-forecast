
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Card, Elevation, Tooltip } from "@blueprintjs/core";
import { addControl, toggleDisplayBanked } from "../../redux/actions";
import ErrorBoundary from '../shared/ErrorBoundary';
import { ControlTable } from './ControlTable';
import { ToggleButton } from '../shared/ToggleButton';

export const ControlTableContainer = () => {
  const displayBanked = useSelector(state => state.controls.displayBanked)
  const dispatch = useDispatch()

  return (
    <>
      <ErrorBoundary>
        <Card interactive={true} elevation={Elevation.TWO} style={{ margin: '10px', display: "flex", flexFlow: "column", alignItems: "center" }} >
            <ErrorBoundary>
              <ControlTable />
              <AddRowButton/>
              <Tooltip usePortal={true} placement='bottom' content='Show how many minutes remain to be within ACP/RUSA brevet finishing times'>
                  <ToggleButton style={{marginTop: "10px"}} active={displayBanked} onClick={() => dispatch(toggleDisplayBanked())}>Display banked time</ToggleButton>
              </Tooltip>
            </ErrorBoundary>
        </Card>
      </ErrorBoundary>
      <div tabIndex="98" onFocus={() => {
        let button = document.getElementById('addButton');
        if (button !== undefined && button !== null) {
          button.focus();
        }
      }} />
    </>
  )
}

const AddRowButton = () => {
  const dispatch = useDispatch()
  return (
    <div style={{border: "1px solid black", width: "100%"}} onClick={() => dispatch(addControl())}>
      <Button id={'addButton'} style={{width: "100%"}} minimal={true} tabIndex={0} icon={"add"}>Add</Button>
    </div>
  )
}