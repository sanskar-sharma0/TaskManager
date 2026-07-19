import * as React from "react"

export function useMediaQuery(query: string) {
  const [value, setValue] = React.useState(false)

  React.useEffect(() => {
    const result = matchMedia(query)
    const onChange = (event: MediaQueryListEvent) => {
      setValue(event.matches)
    }
    result.addEventListener("change", onChange)
    // Avoid calling setState synchronously during render by checking if it changed
    if (result.matches !== value) {
      setValue(result.matches)
    }

    return () => result.removeEventListener("change", onChange)
  }, [query, value])

  return value
}
