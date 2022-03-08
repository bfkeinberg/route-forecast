import React, {useState, useEffect} from 'react';
import PropTypes from 'prop-types';

export const TransitionWrapper = ({diffData, children, transitionTime, transitionType, width}) => {

  const [
cachedRenderContent,
setCachedRenderContent
] = useState(null)
  const [
currentData,
setCurrentData
] = useState(null)
  const [
transitionState,
setTransitionState
] = useState("active")

  // don't animate initial load or no-op re-renders
  useEffect(() => {
    if (cachedRenderContent === null) {
      setCachedRenderContent(children)
    }
  }, [children])

  useEffect(() => {
    if (currentData !== diffData) {
      setCurrentData(diffData)

      if (transitionType === "none") {
        setCachedRenderContent(children)
        return
      }

      // don't animate initial load
      if (cachedRenderContent !== null) {
        setTransitionState("inactive")
        setTimeout(() => {
          setCachedRenderContent(children)
          setTransitionState("active")
        }, transitionTime * 1000 / 2)
      }
    } else if (transitionState === "active") {
      setCachedRenderContent(children)
    }
  }, [diffData])

  return (
    <div style={{width: width, overflow: "hidden"}}>
      <TransitioningContent transitionTime={transitionTime} transitioning={transitionState === "inactive"} transitionType={transitionType} width={width}>
        {cachedRenderContent}
      </TransitioningContent>
    </div>
  );
}

TransitionWrapper.propTypes = {
  diffData:PropTypes.object
};

const TransitioningContent = ({children, transitionTime, transitioning, transitionType, width}) => {
  const translateOrigin = transitioning ? 0 : (transitionType === "slideRight" ? width * -1 : width)
  const translateTarget = transitioning ? width * (transitionType === "slideRight" ? 1 : -1) : 0

  const [
position,
setPosition
] = useState(transitioning ? translateTarget : 0)
  const [
teleporting,
setTeleporting
] = useState(false)

  const [
initial,
setInitial
] = useState(transitioning)

  useEffect(() => {
    if (transitionType === "none" || initial === transitioning) {
      return
    } else {
      setInitial(null)
    }

    setTeleporting(true)
    setPosition(translateOrigin)
    setTimeout(() => {
      setTeleporting(false)
      setPosition(translateTarget)
    }, 0)
  }, [transitioning])

  const easingFunction = "cubic-bezier(.39,1.38,.78,1)"

  const wrapperStyle = transitionType !== undefined ? {
    transform: `translateX(${position}px)`,
    // this below is very hacky but i don't care
    transition: (teleporting && transitionType !== "slideLeftRight") ? "none" : `transform ${transitionTime / 2}s ${easingFunction}`
  } : {}

  return (
    <div style={wrapperStyle}>
      {children}
    </div>
  )
}

TransitioningContent.propTypes = {

};