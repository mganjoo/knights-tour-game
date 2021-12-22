import "@testing-library/jest-dom"

export function makeLocalStorageMock() {
  let storage = {}

  return {
    setItem: function (key, value) {
      storage[key] = value
    },
    getItem: function (key) {
      return key in storage ? storage[key] : null
    },
    removeItem: function (key) {
      delete storage[key]
    },
    get length() {
      return Object.keys(storage).length
    },
    key: function (i) {
      const keys = Object.keys(storage)
      return keys[i] || null
    },
    clear: function () {
      storage = {}
    },
  }
}

global.localStorage = makeLocalStorageMock()
