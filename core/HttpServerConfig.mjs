import { open } from 'node:fs/promises'

export default class HttpServerConfig {

  constructor() {
    this.port = 3000
    this.host = '0.0.0.0'
    this.prod = false
  }

  async load(filename) {
    const fileHandle = await open(filename)
    for await (const line of fileHandle.readLines({ encoding: 'utf8' })) {
      const [key, value] = line.split('=')
      switch (key) {
        case 'port': this[key] = parseInt(value); break
        case 'prod': this[key] = value === 'true'; break
        default: this[key] = value
      }
    }
  }

}
