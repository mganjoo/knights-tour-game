import { useRef, useEffect } from "react"

export function useWhyDidYouUpdate(label: string, props: Record<string, any>) {
  const previousProps = useRef<Record<string, any>>()

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props })
      const changes: Record<string, { from: any; to: any }> = {}
      allKeys.forEach((key) => {
        if (
          previousProps.current &&
          previousProps.current[key] !== props[key]
        ) {
          changes[key] = {
            from: previousProps.current[key],
            to: props[key],
          }
        }
      })
      if (Object.keys(changes).length) {
        console.log("[why-did-you-update]", label, changes)
      }
    }
    previousProps.current = props
  })
}
