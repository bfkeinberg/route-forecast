
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import '../../static/controlsStyles.css';
import { Button } from "@blueprintjs/core";
import { Card, CardBody, CardTitle } from "reactstrap";
import { addControl } from "../actions/actions";
import ErrorBoundary from '../errorBoundary';
import { ControlTable } from './ControlTable';

export const ControlTableContainer = () => {
  const hasControls = useSelector(state => state.controls.userControlPoints.length > 0)
  const name = useSelector(state => state.routeInfo.name)

  let title;
  if (name === '') {
      title = (<div id={'controlListTitle'}>Control point list</div>);
  } else {
      title = (<div id={'controlListTitle'}>Control point list for <i>{name}</i></div>);
  }
  
  return (
    <>
      <ErrorBoundary>
        <Card style={{ margin: '10px' }}>
          <CardBody>
            <CardTitle className="cpListTitle" tag='h6'>{title}</CardTitle>
            <ErrorBoundary>
              <ControlTable />
              <AddRowButton/>
            </ErrorBoundary>
          </CardBody>
        </Card>
      </ErrorBoundary>
      <div tabIndex="98" onFocus={() => {
        let button = document.getElementById('addButton');
        if (button !== undefined) {
          button.focus();
        }
      }} />
    </>
  )
}

const AddRowButton = () => {
  const dispatch = useDispatch()
  return (
    <div style={{border: "1px solid black"}} onClick={() => dispatch(addControl())}>
      <Button style={{width: "100%"}} minimal={true} tabIndex='10' icon={"add"}>Add</Button>
    </div>
  )
}