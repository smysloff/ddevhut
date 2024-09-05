import HttpServer from './core/HttpServer.mjs'

const app = new HttpServer()

app.configFile = '.env'
app.staticDir = 'public'

app.router.get('/', (_, response) => {
  response.statusCode = 200
  response.setHeader('Content-Type', 'text/plain')
  response.end('home page')
})

app.listen()
