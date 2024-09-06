import HttpServer from './core/HttpServer.mjs'

const app = new HttpServer()

app.configFile = '.env'
app.staticDir = 'public'

app.router.get('/tools/myip', (request, response) => {

  console.log(request)

  response.statusCode = 200
  response.setHeader('Content-Type', 'text/plain')
  response.end('MyIP Tool')
})

app.listen()
