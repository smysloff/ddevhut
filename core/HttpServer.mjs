import { Server } from 'node:http'
import { open } from 'node:fs/promises'
import HttpRouter from './HttpRouter.mjs'

export default class HttpServer {

  #configFile = '.env'
  #staticDir = 'public'
  #config = new Map()
  #router = new HttpRouter()
  #server = new Server()

  set staticDir(dirname) {
    this.#staticDir = dirname
    this.#router.staticDir = dirname
  }

  get staticDir() {
    return this.#staticDir
  }

  set configFile(filename) {
    this.#configFile = filename
  }

  get configFile() {
    return this.#configFile
  }

  async #loadConfig(filename) {
    const fh = await open(filename)
    for await (const line of fh.readLines({ encoding: 'utf8' })) {
      const [key, value] = line.split('=')
      switch (key) {
        case 'port': this.#config[key] = parseInt(value); break
        case 'prod': this.#config[key] = value === 'true'; break
        default: this.#config[key] = value
      }
    }
  }

  async listen(port) {
    await this.#loadConfig(this.#configFile)
    await this.#router.loadRoutes()
    this.#server.on('request', async (request, response) => {
      const controller = await this.#router.dispatch(request.url)
      controller(request, response)
    })
    this.#server.listen(port ?? this.#config.port)
  }

  get(url, callback) {
    this.#router.get(url, callback)
  }
}

function homeController(request, response) {
  response.statusCode = 200
  response.setHeader('Content-Type', 'text/plain')
  response.end('Home Controller')
}

function blogListController(request, response) {
  response.statusCode = 200
  response.setHeader('Content-Type', 'text/plain')
  response.end('BlogList Controller')
}

function blogArticleController(request, response, ...args) {
  response.statusCode = 200
  response.setHeader('Content-Type', 'text/plain')
  response.end(`BlogArticle Controller: id - ${ args?.id }, name - ${ args?.name }`)
}

const app = new HttpServer()
//app.configFile = '.env'
//app.staticDir = 'public'
app.get('/', homeController)
app.get('/blog', blogListController)
app.get('/blog/{id}/{name}', blogArticleController)
app.listen()
