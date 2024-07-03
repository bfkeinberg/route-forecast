import "./TopBar.css"

import PropTypes from 'prop-types';
import React from "react";
import MediaQuery, { useMediaQuery } from "react-responsive";

import { useForecastDependentValues,usePreviousPersistent, useReusableDelay, useValueHasChanged } from "../../utils/hooks";
import { useLoadingFromURLStatus } from "../DesktopUI";
import { RouteTitle } from "../shared/RouteTitle";
import BugReportButton from "./BugReportButton";
import DonationRequest from "./DonationRequest";
import ShortUrl from "./ShortUrl";
import {useTranslation} from 'react-i18next'
import FaqButton from "./FaqButton";

const TitleAndFinishTime = ({finishTime, fontSize, alignment}) => {
  return (
    <div style={{display:'flex', flexDirection:'column'}}>
      <RouteTitle/>
      <div style={{fontStyle: "oblique", color: "rgba(64, 111, 140, 0.87)", fontSize: fontSize, height: "60px", textAlign: alignment}}>
        {finishTime}
      </div>
    </div>
  )
}
export const TopBar = ({sidePaneOptions, activeSidePane, setActiveSidePane, sidebarWidth, panesVisible}) => {
  const roomForTitle = useMediaQuery({ query: '(min-width: 1610px)' });
  const roomForFinishTime = useMediaQuery({ query: '(min-width: 1000px)' });
  const titleAdjacent = roomForFinishTime && roomForTitle
  const titleMustBeStacked = roomForFinishTime && !roomForTitle
  const { finishTime: predictedFinishTime } = useForecastDependentValues();
  const predictedFinishTimeExists = predictedFinishTime !== null;
  const finishTimeFontSize = useMediaQuery({ query: '(min-width: 1300px)' }) ? "20px" : "15px"
  const alignment = useMediaQuery({ query: '(min-width: 1500px)' }) ? "right" : "left"

  return (
    <div style={{display: "flex"}}>
      <Tabs
        sidePaneOptions={sidePaneOptions}
        activeSidePane={activeSidePane}
        setActiveSidePane={setActiveSidePane}
        sidebarWidth={sidebarWidth}
        panesVisible={panesVisible}
      />
      <div style={{display: "flex", flexGrow: 1, flexShrink: 8, justifyContent: "space-between", alignItems: "center", padding: "0px 20px", borderWidth: "0px 0px 0px 1px", borderStyle: "solid", borderColor: "grey"}}>
        {roomForTitle && <RouteTitle style={{width:'21rem'}} className={'truncated_title'}/>}
        {titleMustBeStacked && predictedFinishTimeExists && <TitleAndFinishTime finishTime={predictedFinishTime} fontSize={finishTimeFontSize} alignment={alignment}/>}
        {titleAdjacent && predictedFinishTimeExists && <div style={{fontStyle: "oblique", color: "rgba(64, 111, 140, 0.87)", fontSize: finishTimeFontSize, height: "60px", textAlign: alignment}}>{predictedFinishTime}</div>}
        <div style={{display: "flex", justifyContent: "flex-end", alignItems: "center"}}>
          <MediaQuery minWidth={1780}>
            <ShortUrl/>
          </MediaQuery>
          <DonationRequest wacky/>
          <div style={{margin: "0px 10px", flexShrink: 0}}><BugReportButton/></div>
        </div>
      </div>
    </div>
  )
}

TopBar.propTypes = {
  sidePaneOptions:PropTypes.array.isRequired,
  activeSidePane:PropTypes.number.isRequired,
  setActiveSidePane:PropTypes.func.isRequired,
  sidebarWidth:PropTypes.number,
  panesVisible:PropTypes.object.isRequired
};

const Tabs = ({ sidePaneOptions, activeSidePane, setActiveSidePane, sidebarWidth, panesVisible }) => {

  const [
    loadingFromURLStarted,
    loadingFromURLFinished,
    displayContent
  ] = useLoadingFromURLStatus()
  const { t } = useTranslation()
  console.info(`loadingFromUrlFinished=${loadingFromURLFinished}`)
  return (
    <div style={{
      width: `${sidebarWidth}px`
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between" 
      }}>
        <div style={{ flex: 1 }}>
          <NonexistentLogo />
        </div>
        <FaqButton/>
        <div style={{
          "textAlign": "end",
          "opacity": "0.85",
          "fontSize": "16px",
          "marginLeft": "auto",
          "fontWeight": "bold",
          "padding": "12px",
          flex: 1
        }}>
          {t('data.summary')}
        </div>
      </div>
      <div style={{ height: "50px", display: "flex", alignItems: "center" }} className={(loadingFromURLStarted && displayContent) ? "fade-in" : ""}>
        {displayContent ?
          sidePaneOptions.map((option, index) => {
            const displayIndex = Array.from(panesVisible).indexOf(option)
            const activeDisplayIndex = Array.from(panesVisible).indexOf(sidePaneOptions[activeSidePane])
            return (
              <TopBarItem
                active={activeSidePane === index}
                leftNeighborActive={activeDisplayIndex === displayIndex - 1}
                rightNeighborActive={activeDisplayIndex === displayIndex + 1}
                last={index === panesVisible.size - 1}
                onClick={() => setActiveSidePane(index)}
                visible={panesVisible.has(option)}
                key={option}
              >
                <div style={{ fontWeight: "bold", textAlign: "center" }}>
                  {option}
                </div>
              </TopBarItem>
            )
          }) :
          null
        }
      </div>
    </div>
  )
}
Tabs.propTypes = {
  sidePaneOptions:PropTypes.array.isRequired,
  activeSidePane:PropTypes.number.isRequired,
  setActiveSidePane:PropTypes.func.isRequired,
  sidebarWidth:PropTypes.number.isRequired,
  panesVisible:PropTypes.object.isRequired
};

const NonexistentLogo = () => {
  return (
    <div style={{userSelect: "none", padding: "0px 10px"}}>
      <span style={{fontSize: "30px"}}>
        Randoplan
      </span>
    </div>
  )
}

const TopBarItem = ({children, active, leftNeighborActive, rightNeighborActive, last, onClick, visible}) => {
  const style = {
    cursor: "pointer",
    borderLeft: `1px solid #000000${leftNeighborActive ? "50" : "00"}`,
    borderRight: `1px solid #000000${rightNeighborActive || (!active && !last) ? "50" : "00"}`,
    borderBottom: active ? "1px solid #00000000" : "1px solid #00000030",
    height: "100%",
    display: "flex",
    alignItems: "center",
    userSelect: "none",
    backgroundColor: active ? "" : "#00000030",
    justifyContent: "center",
    transition: "background-color 0.3s",
    width: "0px",
    fontSize: "15px",
    borderRadius: `0px 0px ${rightNeighborActive ? 5 : 0}px ${leftNeighborActive ? 5 : 0}px`
  }

  const wasEverVisible = useValueHasChanged(visible) || visible
  const previouslyVisible = usePreviousPersistent(visible)
  const newlyVisible = !previouslyVisible && visible
  const newlyNonvisible = previouslyVisible && !visible
  const [exitAnimationFinished] = useReusableDelay(1500, newlyNonvisible)

  if (exitAnimationFinished || !wasEverVisible) {
    return null
  }


  return (
    <div onClick={onClick} style={style} className={"top-bar-item" + (newlyVisible ? " animated-entry" : "") + (newlyNonvisible ? " animated-exit" : "")}>
      {children}
    </div>
  )
}

TopBarItem.propTypes = {
  children:PropTypes.object.isRequired,
  active:PropTypes.bool.isRequired,
  leftNeighborActive:PropTypes.bool.isRequired,
  rightNeighborActive:PropTypes.bool.isRequired,
  last:PropTypes.bool,
  onClick:PropTypes.func,
  visible:PropTypes.bool.isRequired
};
