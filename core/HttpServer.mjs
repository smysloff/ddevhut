import { Server } from 'node:http'
import { join } from 'node:path'
import { cwd } from 'node:process'
import { opendir, lstat } from 'node:fs/promises'
import HttpRouter from './HttpRouter.mjs'
import HttpServerConfig from './HttpServerConfig.mjs'

export default class HttpServer {

  #server = new Server()

  constructor() {
    this.configFile = '.env'
    this.staticDir = 'public'
    this.config = new HttpServerConfig()
    this.router = new HttpRouter()
  }

  async listen(port) {
    if (this.configFile) {
      const filename = join(cwd(), this.configFile)
      await this.config.load(filename)
    }

    if (this.staticDir) {
      async function serveFilesFromDir(dirname) {
        for await (const dirent of await opendir(dirname)) {
          const entity = join(dirname, dirent.name)
          const stat = await lstat(entity)
          if (stat.isFile()) {
            const filename = entity.replace(/index\.html$/, '')
                                   .replace(/\.html$/, '')
                                   .replace(/\/\//, '/')
            console.log(entity, '|', filename)
          }
          if (stat.isDirectory()) {
            await serveFilesFromDir(entity)
          }
        }
      }

      await serveFilesFromDir(this.staticDir)
    }

    this.#server.on('request', (request, response) => {
      const controller = this.router.dispatch(request.url)
      controller(request, response)
    })

    this.#server.listen(port ?? this.config.port)
  }
}
