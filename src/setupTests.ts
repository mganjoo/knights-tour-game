export function makeLocalStorageMock() {
  let storage: { [key: string]: string } = {}

  return {
    setItem: function (key: string, value: string) {
      storage[key] = value
    },
    getItem: function (key: string) {
      return key in storage ? storage[key] : null
    },
    removeItem: function (key: string) {
      delete storage[key]
    },
    get length() {
      return Object.keys(storage).length
    },
    key: function (i: number) {
      const keys = Object.keys(storage)
      return keys[i] || null
    },
    clear: function () {
      storage = {}
    },
  }
}

// jsdom defines localStorage as a getter-only property on window, so it has to
// be replaced rather than assigned to.
Object.defineProperty(globalThis, "localStorage", {
  value: makeLocalStorageMock(),
  writable: true,
  configurable: true,
})
