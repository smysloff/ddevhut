import {
  rm,
  open,
  lstat,
  mkdir,
  readdir,
} from 'node:fs/promises'

import { createInterface } from 'node:readline/promises'
import { join } from 'node:path'

export default class FileManager {

  /**
   * Searches a file for lines that match the given regular expression.
   *
   * Static asynchronous generator method takes a filename, a regular expression pattern, and optional flags.
   * It reads the file line by line and returns lines that match the given pattern.
   * If lines are found, the method returns them one by one. If there are no matches, the method simply exits.
   *
   * @param {string} filename - The name of the file to search.
   * @param {string} pattern - The regular expression pattern to search for lines.
   * @param {string} [flags=''] - Optional flags for the regular expression (e.g. 'i' to ignore case).
   *
   * @yields {string} - Returns a string that matches the given pattern.
   */
  static async *grepLines(filename, pattern, flags = '') {
    for await (const line of this.readFile(filename)) {
      const regexp = new RegExp(pattern, `v${ flags }`)
      const match = line.match(regexp)
      if (match) {
        yield match.input
      }
    }
  }

  /**
   * Reads a file line by line and returns the lines.
   *
   * Static asynchronous generator method takes a file name and an optional encoding.
   * It opens the file and creates a stream for reading, returning the lines of the file one at a time.
   * The method uses an interface for reading lines, allowing it to handle large files without loading them into memory.
   * Once reading is complete, the file handle is closed.
   *
   * @param {string} filename - The name of the file to read.
   * @param {string} [encoding='utf8']
   *   - An optional encoding for reading the file (defaults to 'utf8').
   *
   * @yields {string} - Returns a line from the file.
   */
  static async *readFile(filename, encoding = 'utf8') {

    const fileHandle = await open(filename)
    const stream = fileHandle.createReadStream({ encoding })

    const rl = createInterface({
      input: stream,
      crlfDelay: Infinity,
    })

    try {
      for await (const line of rl) {
        yield line
      }
    } finally {
      fileHandle.close()
    }
  }

  /**
   * Creates files based on the given data.
   *
   * Static asynchronous generator method takes either an array of strings
   * representing file paths or a single string, and creates the corresponding files with the given options.
   * The method opens files in append mode and returns an object containing the file handle and file name.
   * On error, the method prints an error to the console and returns `null`.
   * Upon completion, all open file handles are closed.
   *
   * @param {string|string[]} data - The file path or array of file paths to create.
   *
   * @yields {{ handle: FileHandle, name: string }|null}
   *   - Returns an object with the file handle and the file name, or `null` on error.
   */
  static async *createFiles(data) {

    const fileHandles = []
    const options = 'ax'

    async function openFile(filename) {
      const fileHandle = await open(filename, options)
      fileHandles.push(fileHandle)
      return fileHandle
    }

    try {
      if (data instanceof Array) {
        for (const item of data) {
          yield { handle: await openFile(item), name: item }
        }
      } else {
        yield { handle: await openFile(data), name: data }
      }
    } catch (error) {
      console.error('error', error)
      yield null
    } finally {
      fileHandles.forEach(fileHandle => fileHandle.close())
    }

  }

  /**
   * Deletes files and directories based on the given data.
   *
   * Static asynchronous generator method takes either an array of strings
   * representing file and directory paths, or a single string,
   * and deletes the matching files and directories with the given parameters.
   * If the deletion succeeds, the method returns the path to the deleted file or directory.
   * On error, the method prints an error to the console and returns `null`.
   *
   * @param {string|string[]} data
   *   - The path to the file or array of paths to the files and directories to delete.
   *
   * @yields {string|null}
   *   - Returns the path to the deleted file or directory, or `null` on error.
   */
  static async *removeFiles(data) {

    const options = {
      force: true,
      recursive: true,
    }

    try {
      if (data instanceof Array) {
        for (const file of data) {
          await rm(file, options)
          yield file
        }
      } else {
        await rm(data, options)
        yield data
      }
    } catch (error) {
      console.error(error)
      yield null
    }

  }

  /**
   * Reads the contents of a directory and returns the paths to files and subdirectories.
   *
   * Static asynchronous generator method takes a directory path and a recursion depth.
   * It returns the paths to files and subdirectories in the specified directory,
   * recursively traversing subdirectories up to the specified depth.
   * If the depth is `Infinity`, the method will traverse all nesting levels.
   *
   * @param {string} dirname - The path to the directory whose contents should be read.
   * @param {number} [depth=Infinity] - The maximum recursion depth for traversing subdirectories.
   *
   * @yields {string} - Returns the path to the file or subdirectory.
   */
  static async *readDir(dirname, depth = Infinity) {
    if (depth > 0) {
      const files = await readdir(dirname)
      for (const file of files) {
        const filename = join(dirname, file)
        yield filename
        if (await this.isDirectory(filename)) {
          yield* this.readDir(filename, depth - 1)
        }
      }
    }
  }

  /**
   * Creates directories based on the given data.
   *
   * Static asynchronous generator method takes either an array of strings representing
   * directory paths or a single string and creates the corresponding directories with the given
   * parameters. If the directory creation is successful, the method returns the path to the created directory.
   * In case of an error, the method prints an error to the console and returns `null`.
   *
   * @param {string|string[]} data - The path to the directory or an array of paths to directories to create.
   *
   * @yields {string|null} - Returns the path to the created directory or `null` on error.
   */
  static async *createDirs(data) {

    const options = {
      mode: 0o755,
      recursive: true,
    }

    try {
      if (data instanceof Array) {
        for (const item of data) {
          await mkdir(item, options)
          yield item
        }
      } else {
        await mkdir(data, options)
        yield data
      }
    } catch (error) {
      console.error(error)
      yield null
    }

  }

  /**
   * Removes directories based on the passed data using the removeFiles method.
   *
   * Static asynchronous generator method is an alias for the removeFiles method
   * and takes either an array of strings representing directory paths, or a single string.
   * It removes the corresponding directories using the same parameters as the removeFiles method.
   * If the removal is successful, the method returns the path to the removed directory.
   * If an error occurs, the method prints an error to the console and returns `null`.
   *
   * @param {string|string[]} data
   *   - The path to the directory or an array of paths to directories to remove.
   *
   * @yields {string|null}
   * - Returns the path to the removed directory, or `null` on error.
   */
  static async *removeDirs(data) {
    yield* this.removeFiles(data)
  }

  static async isBlockDevice(data) {
    const stat = await lstat(data)
    return stat.isBlockDevice()
  }

  static async isCharacterDevice(data) {
    const stat = await lstat(data)
    return stat.isCharacterDevice()
  }

  static async isDirectory(data) {
    const stat = await lstat(data)
    return stat.isDirectory()
  }

  static async isFIFO(data) {
    const stat = await lstat(data)
    return stat.isFIFO()
  }

  static async isFile(data) {
    const stat = await lstat(data)
    return stat.isFile()
  }

  static async isSocket(data) {
    const stat = await lstat(data)
    return stat.isSocket()
  }

  static async isSymbolicLink(data) {
    const stat = await lstat(data)
    return stat.isSymbolicLink()
  }
}
