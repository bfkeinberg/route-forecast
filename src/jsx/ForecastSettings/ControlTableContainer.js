
import React, { Suspense } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { lazy } from '@loadable/component';
import '../../static/controlsStyles.css';
import { componentLoader } from "../actions/actions.js";
import { Button } from "@blueprintjs/core";
import { UncontrolledTooltip, Card, CardBody, CardTitle } from "reactstrap";
import { addControl } from "../actions/actions";
import ErrorBoundary from '../errorBoundary';

const LoadableControlTable = lazy(() => componentLoader(import(/* webpackChunkName: "ControlTable" */'./ControlTable'), 5));

export const ControlTableContainer = () => {
  const hasControls = useSelector(state => state.controls.count !== 0)
  const name = useSelector(state => state.routeInfo.name)
  const dispatch = useDispatch()

  let title;
  let table = (<div/>);
  if (name === '') {
      title = (<div id={'controlListTitle'}>Control point list</div>);
  } else {
      title = (<div id={'controlListTitle'}>Control point list for <i>{name}</i></div>);
  }
  if (name !== '' || hasControls) {
      table = (
          <Suspense fallback={<div>Loading ControlTable...</div>}>
              <LoadableControlTable />
          </Suspense>
      );
  }
  
  return (
    <>
      <ErrorBoundary>
        <Card style={{ margin: '10px' }}>
          <CardBody>
            <CardTitle className="cpListTitle" tag='h6'>{title}</CardTitle>
            <ErrorBoundary>
              {table}
            </ErrorBoundary>
          </CardBody>
        </Card>
      </ErrorBoundary>
      <div className="controls-item">
        <Button minimal={true} tabIndex='10' onClick={() => dispatch(addControl())} id='addButton' icon={"add"}>Add</Button>
        <UncontrolledTooltip target={"addButton"}>Add a control point</UncontrolledTooltip>
      </div>
      <div tabIndex="98" onFocus={() => {
        let button = document.getElementById('addButton');
        if (button !== undefined) {
          button.focus();
        }
      }} />
    </>
  )
}