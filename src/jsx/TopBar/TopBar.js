import React from "react";
import DonationRequest from "./DonationRequest";
import BugReportButton from "./BugReportButton";
import PaceExplanation from "./PaceExplanation";
import ShortUrl from "./ShortUrl";
import "./TopBar.css"
import { useValueHasChanged } from "../../utils/hooks";

export const TopBar = ({sidePaneOptions, activeSidePane, setActiveSidePane, sidebarWidth, panesVisible}) => {
  return (
    <div style={{display: "flex"}}>
      <div style={{height: "50px", display: "flex", alignItems: "center", width: `${sidebarWidth}px`}}>
        {sidePaneOptions.map((option, index) =>
          <TopBarItem active={activeSidePane === index} key={option} onClick={() => setActiveSidePane(index)} visible={panesVisible.has(option)}>
            <div style={{fontWeight: "bold", textAlign: "center"}}>
              {option}
            </div>
          </TopBarItem>
        )}
      </div>
      <div style={{display: "flex", flexGrow: 1, alignItems: "center", padding: "0px 20px"}}>
        <PaceExplanation/>
        <div style={{flexGrow: 1, display: "flex", justifyContent: "flex-end", alignItems: "center"}}>
          <ShortUrl/>
          <DonationRequest wacky/>
          <div style={{margin: "0px 10px", flexShrink: 0}}><BugReportButton/></div>
          <NonexistentLogo/>
        </div>
      </div>
    </div>
  )
}

const NonexistentLogo = () => {
  return (
    <div style={{userSelect: "none", padding: "0px 10px"}}>
      <span style={{fontSize: "30px"}}>
        Randoplan
      </span>
      <span style={{fontSize: "6px"}}>(pretend this is a logo)</span>
    </div>
  )
}

const TopBarItem = ({children, active, onClick, visible}) => {
  const style = {
    cursor: "pointer",
    borderRight: "1px solid #00000050",
    borderBottom: active ? "" : "1px solid #00000030",
    height: "100%",
    display: "flex",
    alignItems: "center",
    userSelect: "none",
    backgroundColor: active ? "" : "#00000030",
    justifyContent: "center",
    transition: "background-color 0.3s",
    width: "0px"
  }

  const newlyVisible = useValueHasChanged(visible)

  if (!visible) {
    return null
  }


  return (
    <div onClick={onClick} style={style} className={"top-bar-item" + (newlyVisible ? " animated-entry" : "")}>
      {children}
    </div>
  )
}
