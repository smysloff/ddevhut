import { open } from 'node:fs/promises'
import { extname } from 'node:path'
import MimeTypes from '../libs/MimeTypes.mjs'

export default class HttpRouter {

  #routes = new Map()

  get(route, callback) {
    this.#routes.set(route, callback)
    return this
  }

  static(route, filename) {
    const callback = async (_, response) => {
      const extension = extname(filename).slice(1)
      const contentType = MimeTypes.get(extension)
      const fileHandle = await open(filename)
      const stream = fileHandle.createReadStream()

      response.statusCode = 200
      response.setHeader('Content-Type', contentType)
      stream.pipe(response)
    }
    this.#routes.set(route, callback)
    return this
  }

  dispatch(url) {
    for (const [route, callback] of this.#routes) {
      const regexp = this.#getRegExpFromRoute(route)
      const matches = url.match(regexp)
      if (matches) {
        const params = this.#getParamsFromRoute(route, matches)
        return (request, response) => callback(request, response, params)
      }
    }
    return this.error(404)
  }

  error(code) {
    switch (code) {
      case 404: return (_, response) => {
        response.statusCode = 404
        response.setHeader('Content-Type', 'text/plain')
        response.end('Error 404: Page not Found')
      }
    }
  }

  #getRegExpFromRoute(route) {
    const regexp = route.replaceAll(/\{.+?\}/gui, '(.+?)')
    return new RegExp(`^${ regexp }$`, 'ui')
  }

  #getParamsFromRoute(route, matches) {
    const keys = [...route.matchAll(/\{(.+?)\}/gui)].map(match => match[1])
    const values = [...matches.slice(1)]
    return keys.reduce((acc, key, index) => {
      acc[key] = values[index]
      return acc
    }, {})
  }

}
