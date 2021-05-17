// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom"

export function makeLocalStorageMock() {
  let storage: Record<string, string> = {}

  return {
    setItem: function (key: string, value: string) {
      storage[key] = value
    },
    getItem: function (key: string): string | null {
      return key in storage ? storage[key] : null
    },
    removeItem: function (key: string): void {
      delete storage[key]
    },
    get length(): number {
      return Object.keys(storage).length
    },
    key: function (i: number): string | null {
      const keys = Object.keys(storage)
      return keys[i] || null
    },
    clear: function (): void {
      storage = {}
    },
  }
}

global.localStorage = makeLocalStorageMock()
