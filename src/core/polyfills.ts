/**
 * Small polyfills for slightly older browsers (e.g. iOS 16/17 Safari, which many in-app
 * browsers are built on). Imported first by the app and by the PDF worker.
 */

if (typeof (Promise as { withResolvers?: unknown }).withResolvers !== 'function') {
  Object.defineProperty(Promise, 'withResolvers', {
    configurable: true,
    writable: true,
    value: function withResolvers<T>(this: PromiseConstructor) {
      let resolve!: (value: T | PromiseLike<T>) => void
      let reject!: (reason?: unknown) => void
      const promise = new this<T>((res, rej) => {
        resolve = res
        reject = rej
      })
      return { promise, resolve, reject }
    },
  })
}

export {}
