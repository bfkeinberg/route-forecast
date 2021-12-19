import { useEffect, useState } from "react"

const useValueHasChanged = (value) => {
  const [initialValue] = useState(value)
  const [hasChanged, setHasChanged] = useState(false)
  useEffect(() => { if (initialValue !== value) setHasChanged(true) }, [value])
  return hasChanged
}

export { useValueHasChanged }