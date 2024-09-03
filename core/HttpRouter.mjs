import { open, opendir, lstat } from 'node:fs/promises'
import { join, extname } from 'node:path'

export default class HttpRouter {

  #staticDir = 'public'

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

  #routes = new Map()

  async #loadStaticDir(dirname) {

    for await (const entity of await opendir(dirname)) {
      const dirent = join(dirname, entity.name)
      const stat = await lstat(dirent)
      if (stat.isFile()) {
        const url = dirent.replace(this.#staticDir, '')
          .replace('index.html', '/')
          .replace('//', '/')
          .replace(/(.+)\/$/, '$1')
          .replace('.html', '')
        const callback = async (_, response) => {
          const extension = extname(dirent)?.slice(1)
          const contentType = this.#mimeTypes.get(extension)
          const fh = await open(dirent)
          const stream = fh.createReadStream()
          response.statusCode = 200
          response.setHeader('Content-Type', contentType)
          stream.pipe(response)
        }
        this.#routes.set(url, callback)
      }
      if (stat.isDirectory()) {
        await this.#loadStaticDir(dirent)
      }
    }

  }

  async loadRoutes() {
    await this.#loadStaticDir(this.#staticDir)
  }

  async dispatch(url) {
    if (this.#routes.has(url)) {
      return this.#routes.get(url)
    }
    return (_, response) => { 
      response.statusCode = 404
      response.setHeader('Content-Type', 'text/plain')
      response.end('Error 404: Page Not Found')
    }
  }
}
