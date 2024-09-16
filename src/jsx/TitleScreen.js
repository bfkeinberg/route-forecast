import {Icon} from "@blueprintjs/core"
import * as React from "react";
// import usage_demo from "Images/usage_demo.gif";

export const TitleScreen = () => {
  return (
    <div style={{height: "600px", position: "relative"}}>
      <Icon icon={"cycle"} size={160} style={{ position: "absolute", top: "50%", left: "50%" }} />
      {/* <img src={usage_demo} style={{ position: "relative", width:"100%", height:"100%" }}/> */}
    </div>
  )
}