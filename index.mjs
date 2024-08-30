// import modules

import http from 'node:http'
import { EOL } from 'node:os'
import { mkdir, readFile, appendFile } from 'node:fs/promises'

import Client from './core/Client.mjs'

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
config.hosts = [config.host, `${ config.host }:${ config.port }`]


// load views into memory

const pages = new Map(Object.entries({
  '/': await readFile('views/index.html'),
  '/blog': await readFile('views/blog/index.html'),
  '/tools': await readFile('views/tools/index.html'),
  '/games': await readFile('views/games/index.html'),
  '/contacts': await readFile('views/contacts.html'),
}))

const tools = new Map(Object.entries({
  myip: await readFile('views/tools/myip.html')
}))


// server request handler

server.on('request', async (request, response) => {

  const client = new Client(request)

  if (!config.hosts.includes(client.host)) {
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
      if (client.isBrowser) {
        let html = tools.get('myip')
          .toString()
          .replace(/{{\s*ip\s*}}/, client.ip)
        response.setHeader('Content-Type', 'text/html')
        response.end(html)
      } else {
        response.setHeader('Content-Type', 'text/plain')
        response.end(client.ip)
      }
    } else {
      response.statusCode = 404
      response.setHeader('Content-Type', 'text/plain')
      response.end('Error 404: Page Not Found')
    }
  }

  const message = `[${ getDateTime(client.time) }] ${ client.ip }: ${ response.statusCode } ${ client.host } ${ client.url } "${ client.userAgent }"`
  appendFile('logs/access.log', message + EOL, { encoding: 'utf8', mode: 0o644 })

})


// start server

server.listen(config.port, async () => {
  const message = `[${ getDateTime() }] server: start listening on http://${ config.host }:${ config.port }`
  try { await mkdir('logs', { recoursive: true, mode: 0o755 }) } catch {}
  appendFile('logs/access.log', message + EOL, { encoding: 'utf8', mode: 0o644 })
})
