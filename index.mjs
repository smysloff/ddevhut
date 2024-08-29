// import modules

import http from 'node:http'
import { mkdir, readFile, appendFile } from 'node:fs/promises'
import { EOL } from 'node:os'
import { getDateTime } from './libs/Util.mjs'
import FileManager from './libs/FileManager.mjs'


// main constants

const config = {}
const server = http.Server()


// parse config from .env

for await (const line of FileManager.readFile('.env')) {
  const [key, value] = line.split('=')
  switch (key) {
    case 'host': config.host = value; break
    case 'port': config.port = parseInt(value); break;
  }
}


// load views into memory

const pages = new Map(Object.entries({
  '/': await readFile('views/index.html'),
  '/blog': await readFile('views/blog/index.html'),
  '/tools': await readFile('views/tools/index.html'),
  '/games': await readFile('views/games/index.html'),
  '/contacts': await readFile('views/contacts.html'),
}))


// server request handler

server.on('request', async (request, response) => {

  const address = request.socket.remoteAddress.split(':').pop()
  const client = address.length > 1 ? address : '127.0.0.1'

  if (![config.host, `${ config.host }:${ config.port }`].includes(request.headers.host)) {
    let location = new URL(request.url, `http://${ config.host }:${ config.port }`)
    response.writeHead(308, { Location: `${ location }` })
    response.end()
  } else {
    if (pages.has(request.url)) {
      response.statusCode = 200
      response.setHeader('Content-Type', 'text/html')
      response.end(pages.get(request.url))
    } else if (request.url === '/tools/myip') {
      response.statusCode = 200
      response.setHeader('Content-Type', 'text/plain')
      response.end(client)
    }else {
      response.statusCode = 404
      response.setHeader('Content-Type', 'text/plain')
      response.end('Error 404: Page Not Found')
    }
  }

  const message = `[${ getDateTime() }] ${ client }: ${ request.url } ${ response.statusCode }`
  appendFile('logs/access.log', message + EOL, { encoding: 'utf8', mode: 0o644 })

})


// start server

server.listen(config.port, async () => {
  const message = `[${ getDateTime() }] server: start listening on http://${ config.host }:${ config.port }`
  await mkdir('logs', { recoursive: true, mode: 0o755 })
  appendFile('logs/access.log', message + EOL, { encoding: 'utf8', mode: 0o644 })
})
