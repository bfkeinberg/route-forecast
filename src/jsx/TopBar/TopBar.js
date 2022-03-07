import React from "react";
import DonationRequest from "./DonationRequest";
import BugReportButton from "./BugReportButton";
import ShortUrl from "./ShortUrl";
import "./TopBar.css"
import { usePreviousPersistent, useReusableDelay, useValueHasChanged } from "../../utils/hooks";
import { useLoadingFromURLStatus } from "../DesktopUI";
import { useMediaQuery } from "react-responsive";

export const TopBar = ({sidePaneOptions, activeSidePane, setActiveSidePane, sidebarWidth, panesVisible}) => {
  const smallScreen = useMediaQuery({ query: '(max-width: 900px)' })
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
        <div style={{flexGrow: 1, display: "flex", justifyContent: "flex-end", alignItems: "center"}}>
          <ShortUrl/>
          <DonationRequest wacky/>
          <div style={{margin: "0px 10px", flexShrink: 0}}><BugReportButton/></div>
          {!smallScreen && <NonexistentLogo/>}
        </div>
      </div>
    </div>
  )
}

const Tabs = ({sidePaneOptions, activeSidePane, setActiveSidePane, sidebarWidth, panesVisible}) => {

  const [
loadingFromURLStarted,
loadingFromURLFinished,
displayContent
] = useLoadingFromURLStatus()
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