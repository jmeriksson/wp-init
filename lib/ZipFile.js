'use strict'

// Dependencies
const fs = require('fs')
const http = require('http')
const https = require('https')
const yauzl = require('yauzl')
const path = require('path')
const logSymbols = require('log-symbols')
const Transform = require('stream').Transform

module.exports = class ZipFile {
    /**
     * Instantiates a new ZipFile object.
     * @param {strung} url - A URL where a zip-file can be downloaded from. 
     * @param {string} targetDir - Path to a directory where the new ZipFile should be unzipped.
     * @param {string} zipFileName - A name to give the new ZipFile, should end with ".zip".
     * @param {object} eventEmitter - An event emitter object.
     */
    constructor (url, targetDir, zipFileName, eventEmitter) {
        this.source = url
        this.targetDir = targetDir
        this.zipFileName = zipFileName
        this.eventEmitter = eventEmitter
    }

    /**
     * Performs a GET request to the URL given when instantiating a new ZipFile object. 
     */
    downloadZip () {
        return new Promise((resolve, reject) => {
            if (this.source.substring(0,4).toLowerCase() !== 'http') {
                switch (this.zipFileName) {
                    case './wp.zip':
                        this.eventEmitter.emit('invalidWpUrl')
                        break
                    default:
                        this.eventEmitter.emit('invalidPluginUrl')
                        break
                }
            } else if (this.source.substring(0,5).toLowerCase() === 'https') {
                https.get(this.source, response => {
                    return resolve(response)
                })
            } else {
                http.get(this.source, response => {
                    return resolve(response)
                })
            }
        })
    }

    /**
     * Downloads a zip file, pipes it to the root directory and unpacks it to
     * the given target directory.
     */
    async downloadAndUnpack () {
        process.stdout.write(`\r  Downloading and unzipping: ${this.zipFileName}.   `)
        let zipFile = await this.downloadZip()
        this.intervalID = setInterval(() => {
            process.stdout.write('\r' + `  Downloading and unzipping: ${this.zipFileName}.   `)
            this.timeout500 = setTimeout(() => {
                process.stdout.write('\r' + `  Downloading and unzipping: ${this.zipFileName}..  `)
            }, 500)
            this.timeout1000 = setTimeout(() => {
                process.stdout.write('\r' + `  Downloading and unzipping: ${this.zipFileName}... `)
            }, 1000)
        }, 1500)
        let targetForZipFile = fs.createWriteStream(this.zipFileName)
        zipFile.pipe(targetForZipFile)
        targetForZipFile.on('close', () => {
            this.unzip()
        })
    }

    /**
     * Unzips the downloaded zip file into the target directory that is given when the ZipFile
     * object was instansiated.
     */
    unzip () {
        if (this.zipFileName == null) {
            console.log('Error: Cannot unzip because path to zip file is not valid.')
            process.exit()
        }
        yauzl.open(this.zipFileName, {lazyEntries: true}, this.handleZipFile.bind(this))
    }

    /**
     * Creates a new directory.
     * @param {string} dir Path to new directory.
     * @param {object} callback Function to be called when directory is created.
     */
    mkdirp (dir, callback) {
        if (dir === '.') return callback()
        fs.stat(dir, (err) => {
            if (err == null) return callback()

            let parent = path.dirname(dir)
            this.mkdirp(parent, () => {
                fs.mkdir(`${this.targetDir}/${dir}`, callback)
            })
        })
    }

    /**
     * Increments this.handleCount 
     */
    incrementHandleCount() {
        this.handleCount++
    }

    /**
     * Decrements this.handleCount
     */
    decrementHandleCount() {
        this.handleCount--
            if (this.handleCount === 0) {
                console.log('All input and output handles closed')
            }
    }

    /**
     * Unzips a zipped file or directory, should only be used as a callback function to yauzl.open().
     * @param {object} err Automatically added error handler, do not modify.
     * @param {string} zipfile Automatically added path to zip file, do not modify.
     */
    handleZipFile (err, zipfile) {
        if (err) {
            switch (this.zipFileName) {
                case './wp.zip':
                    fs.unlink(this.zipFileName, err => {
                        if (err) {
                            throw err
                        }
                    })
                    this.eventEmitter.emit('invalidWpUrl')
                    break
                default:
                    fs.unlink(this.zipFileName, err => {
                        if (err) {
                            throw err
                        }
                    })
                    clearTimeout(this.timeout500)
                    clearTimeout(this.timeout1000)
                    clearInterval(this.intervalID)
                    return this.eventEmitter.emit('invalidPluginUrl')
            }
        }

        // Tracking when all files have closed       
        this.handleCount = 0

        this.incrementHandleCount()

        zipfile.on('close', () => {
            clearTimeout(this.timeout500)
            clearTimeout(this.timeout1000)
            clearInterval(this.intervalID)
            this.decrementHandleCount()
            fs.unlink(this.zipFileName, err => {
                if (err) {
                    throw err
                }
            })
            if (this.zipFileName === './wp.zip') {
                this.eventEmitter.emit('wpUnzipped')
            } else {
                this.eventEmitter.emit('pluginUnzipped')
            }
        })

        zipfile.readEntry()

        zipfile.on('entry', entry => {
            if (/\/$/.test(entry.fileName)) {
                // If the directory file names end with '/'
                this.mkdirp(entry.fileName, () => {
                    if (err) throw err
                    zipfile.readEntry()
                })
            } else {
                // Make sure parent directory exists
                this.mkdirp(path.dirname(entry.fileName), () => {
                    zipfile.openReadStream(entry, (err, readStream) => {
                        if (err) throw err
                        let filter = new Transform()
                        filter._transform = function (chunk, encoding, callback) {
                            callback(null, chunk)
                        }
                        filter._flush = function (callback) {
                            callback()
                            zipfile.readEntry()
                        }

                        // Pump file contents
                        let writeStream = fs.createWriteStream(`${this.targetDir}/${entry.fileName}`)
                        this.incrementHandleCount()
                        writeStream.on('close', this.decrementHandleCount)
                        readStream.pipe(filter).pipe(writeStream)
                    })
                })
            }
        })
    }
}