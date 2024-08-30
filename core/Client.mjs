export default class Client {
  constructor(request) {
    const address = request.socket.remoteAddress.split(':').pop()
    this.ip = address.length > 1 ? address : '127.0.0.1'
    this.port = request.socket.remotePort
    this.userAgent = request.headers['user-agent']
    this.host = request.headers.host
    this.url = request.url
    this.time = new Date()
    const regexp = new RegExp('Gecko|Chrome|Mozilla|Firefox|AppleWebKit')
    this.isBrowser = regexp.test(this.userAgent)
  }
}
