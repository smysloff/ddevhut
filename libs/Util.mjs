/**
 * Gets a string representing the date and time in the specified format.
 *
 * The method takes a date and a format, returning a string in which the date and time are represented according to the specified pattern.
 * If only a format string is passed, the current date is used.
 * The following specifiers are supported:
 * - %y: year (4 digits)
 * - %m: month (01-12)
 * - %d: day (01-31)
 * - %h: hours (00-23)
 * - %i: minutes (00-59)
 * - %s: seconds (00-59)
 *
 * @param {Date|string} [date=new Date()] - The date to format, or the format string if only one argument is passed.
 * @param {string} [fmt='%y-%m-%d %h:%i:%s'] - The format in which the date and time string will be returned.
 *
 * @returns {string} - A string representing the date and time in the given format.
 */
export default class Util {

  static getDateTime(date = new Date(), fmt = '%y-%m-%d %h:%i:%s') {

    const normalize = (n) => n.toString().padStart(2, '0')

    if (arguments.length === 1 && typeof date === 'string') {
      fmt = date
      date = new Date()
    }

    const y = date.getFullYear()
    const m = normalize(date.getMonth() + 1)
    const d = normalize(date.getDate())
    const h = normalize(date.getHours())
    const i = normalize(date.getMinutes())
    const s = normalize(date.getSeconds())

    return fmt
      .replaceAll(/%y/g, y)
      .replaceAll(/%m/g, m)
      .replaceAll(/%d/g, d)
      .replaceAll(/%h/g, h)
      .replaceAll(/%i/g, i)
      .replaceAll(/%s/g, s)
  }

}

export const getDateTime = Util.getDateTime
