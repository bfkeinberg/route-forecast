import "./TopBar.css"

import PropTypes from 'prop-types';
import React from "react";
import { useMediaQuery } from "react-responsive";

import { useForecastDependentValues,usePreviousPersistent, useReusableDelay, useValueHasChanged } from "../../utils/hooks";
import { useLoadingFromURLStatus } from "../DesktopUI";
import { RouteTitle } from "../shared/RouteTitle";
import BugReportButton from "./BugReportButton";
import DonationRequest from "./DonationRequest";
import ShortUrl from "./ShortUrl";
export const TopBar = ({sidePaneOptions, activeSidePane, setActiveSidePane, sidebarWidth, panesVisible}) => {
  // const smallScreen = useMediaQuery({ query: '(max-width: 900px)' })
  const roomFortitle = useMediaQuery({ query: '(min-width: 1100px)' });
  const roomForFinishTime = useMediaQuery({ query: '(min-width: 1000px)' });
  const roomForLogo = useMediaQuery({ query: '(min-width: 1300px)' });
  const { finishTime: predictedFinishTime } = useForecastDependentValues();
  const predictedFinishTimeExists = predictedFinishTime !== null;
  const finishTimeFontSize = useMediaQuery({ query: '(min-width: 1725px)' }) ? "20px" : "15px"
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
      <div style={{display: "flex", flexGrow: 1, alignItems: "center", padding: "0px 20px", borderWidth: "0px 0px 0px 1px", borderStyle: "solid", borderColor: "grey"}}>
        {roomFortitle && <RouteTitle/>}
        {roomForFinishTime && predictedFinishTimeExists && <div style={{flexGrow: 1, fontStyle: "oblique", color: "rgba(64, 111, 140, 0.87)", fontSize: finishTimeFontSize, height: "60px", textAlign: alignment}}>{predictedFinishTime}</div>}
        <div style={{flexGrow: 1, display: "flex", justifyContent: "flex-end", alignItems: "center"}}>
          <ShortUrl/>
          <DonationRequest wacky/>
          <div style={{margin: "0px 10px", flexShrink: 0}}><BugReportButton/></div>
          {roomForLogo && <NonexistentLogo/>}
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

const Tabs = ({sidePaneOptions, activeSidePane, setActiveSidePane, sidebarWidth, panesVisible}) => {

  const [
loadingFromURLStarted,
loadingFromURLFinished,
displayContent
] = useLoadingFromURLStatus()
console.info(`loadingFromUrlFinished=${loadingFromURLFinished}`)
return (
    <div style={{height: "50px", display: "flex", alignItems: "center", width: `${sidebarWidth}px`}} className={(loadingFromURLStarted && displayContent) ? "fade-in" : ""}>
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
