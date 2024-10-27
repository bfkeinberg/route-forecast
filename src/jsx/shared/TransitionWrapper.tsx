import { useEffect, useState } from 'react';
import * as Sentry from "@sentry/react";

interface TransitionWrapperInput {
  diffData: number
  children: React.ReactNode
  transitionTime: number
  transitionType: string
  width: number
}

export const TransitionWrapper = ({ diffData, children, transitionTime, transitionType, width }:TransitionWrapperInput) => {

  const [
    cachedRenderContent,
    setCachedRenderContent
  ] = useState<React.ReactNode>(null)
  const [
    currentData,
    setCurrentData
  ] = useState<number|null>(null)
  const [
    transitionState,
    setTransitionState
  ] = useState<string>("active")

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
          Sentry.addBreadcrumb({ category: "No stack", level: "info", message: "TransitionWrapper" })
          setCachedRenderContent(children)
          setTransitionState("active")
        }, transitionTime * 1000 / 2)
      }
    } else if (transitionState === "active") {
      setCachedRenderContent(children)
    }
  }, [diffData])

  return (
    <div style={{ overflow: "hidden" }}>
      <TransitioningContent transitionTime={transitionTime} transitioning={transitionState === "inactive"} transitionType={transitionType} width={width}>
        {cachedRenderContent}
      </TransitioningContent>
    </div>
  );
}

interface TransitionContentInput {
  children: React.ReactNode
  transitionTime: number
  transitioning: boolean
  transitionType: string
  width: number
}

const TransitioningContent = ({ children, transitionTime, transitioning, transitionType, width }: TransitionContentInput) => {
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
  ] = useState<boolean|null>(transitioning)

  useEffect(() => {
    if (transitionType === "none" || initial === transitioning) {
      return
    } else {
      setInitial(null)
    }

    setTeleporting(true)
    setPosition(translateOrigin)
    setTimeout(() => {
      Sentry.addBreadcrumb({ category: "No stack", level: "info", message: "TransitioningContent" })
      setTeleporting(false)
      setPosition(translateTarget)
    }, 0)
  }, [transitioning])

  const easingFunction = "cubic-bezier(.39,1.38,.78,1)"

  const wrapperStyle = transitionType !== undefined ?
    {
      transform: `translateX(${position}px)`,
      // this below is very hacky but i don't care
      transition: (teleporting && transitionType !== "slideLeftRight") ? "none" : `transform ${transitionTime / 2}s ${easingFunction}`
    } :
    {}

  return (
    <div style={wrapperStyle}>
      {children}
    </div>
  )
}
