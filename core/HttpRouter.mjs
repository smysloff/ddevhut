import { open } from 'node:fs/promises'
import { extname } from 'node:path'

class HttpRouter {

  #routes = new Map()

  #mimeTypes = new Map(Object.entries({
    bmp:     'image/bmp',
    css:     'text/css',
    csv:     'text/csv',
    eot:     'application/vnd.ms-fontobject',
    gif:     'image/gif',
    htm:     'text/html',
    html:    'text/html',
    ico:     'image/vnd.microsoft.icon',
    jpeg:    'image/jpeg',
    jpg:     'image/jpeg',
    js:      'text/javascript',
    json:    'application/json',
    jsonld:  'application/ld+json',
    jsonp:   'application/javascript',
    mjs:     'text/javascript',
    mp3:     'audio/mpeg',
    mp4:     'video/mp4',
    ogg:     'audio/ogg',
    otf:     'font/otf',
    pdf:     'application/pdf',
    png:     'image/png',
    rar:     'application/x-rar-compressed',
    svg:     'image/svg+xml',
    tar:     'application/x-tar',
    ttf:     'font/ttf',
    txt:     'text/plain',
    wav:     'audio/wav',
    webp:    'image/webp',
    woff2:   'font/woff2',
    xml:     'application/xml',
    zip:     'application/zip',
    woff:    'font/woff',
  }))

  get(route, callback) {
    this.#routes.set(route, callback)
    return this
  }

  static(route, filename) {
    const callback = async (_, response) => {
      const extension = extname(filename).slice(1)
      const contentType = this.#mimeTypes.get(extension)
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
      const regexp = this.#getRegexpFromRoute(route)
      const matches = url.match(regexp)
      if (matches) {
        const params = this.#getParamsFromRoute(route, matches)
        return (request, response) => callback(request, response, params)
      }
    }
    return () => this.error(404)
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

  #getRegexpFromRoute(route) {
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

const router = new HttpRouter()

router.get('/', () => 'home page')
router.get('/blog', () => 'blog index')
router.get('/blog/{id}/{name}', (request, response, params) => {
  if (params.id > 3) {
    return router.error(404)
  }
  return `blog post: id - ${ params.id }, name - ${ params.name }`
})

const controller = router.dispatch('/blog/4/title')

console.log( controller(request, response) )
