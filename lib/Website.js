'use strict'

// Dependencies
const fs = require('fs')
const path = require('path')
const copydir = require('copy-dir')
const logSymbols = require('log-symbols')
const ZipFile = require('./ZipFile')
const wp = require('../wp.json')
const plugins = require('../plugins.json')
const EventEmitter = require('events')
const { exec } = require('child_process')

// String that clears terminal
const clearTerminal = '\u001B[2J\u001B[0;0f'

// Creates an event emitter
const myEE = new EventEmitter()

module.exports = class Website {
    /**
     * Instantiates a new instance of Website
     * @param {string} themeName The name of the website's WordPress theme.
     * @param {string} author (optional) The name of the WordPress theme author.
     * @param {string} URI (optional) A link to the WordPress theme author's website.
     * @param {boolean} autoInstall Set to true if all necessary npm packages should be installed in theme directory.
     * @param {arr} plugins An array containing the WordPress plugins that will be installed. 
     */
    constructor (themeName, author = undefined, URI = undefined, autoInstall, removePlugins, removeThemes, plugins) {
        this.themeName = themeName,
        this.author = author,
        this.URI = URI,
        this.autoInstall = autoInstall,
        this.removePlugins = removePlugins,
        this.removeThemes = removeThemes,
        this.plugins = plugins
    }

    /**
     * Initiates the new WordPress installation and sets event listeners that recognises different parts of the process.
     */
    initWebsite () {
        this.downloadWordPress()

        // setting event listeners
        myEE.on('wpUnzipped', () => {
            process.stdout.write('\r' + logSymbols.success + ' ')
            process.stdout.write('\n')
            this.createThemeDir()
        })
        myEE.on('themeCreated', () => {
            this.removeStandardThemes()
            this.removeStandardPlugins()
            if (this.plugins.length > 0) {
                this.downloadPlugins()
            } else {
                myEE.emit('finished')
            }
        })
        myEE.on('finished', () => {
            if (this.autoInstall) {
                this.installNpm()
            } else {
                process.stdout.write('\nFinished. Navigate to theme directory and enter \'npm install\' to install necessary npm packages.')
                process.exit()
            }
        })
        myEE.on('invalidWpUrl', () => {
            process.stdout.write('\r' + logSymbols.error + ' ')
            process.stdout.write('\n')
            process.stdout.write(`  ${logSymbols.info} WordPress installation could not be created because URL is not valid.\n\nPlease check the wp.json file located in the root directory of this application and report it as an issue on GitHub if it does not contain a URL that leads to the latest version of WordPress.\n`)
            process.exit()
        })
    }

    /**
     * Instantiates a ZipFile object for the WordPress files.
     */
    downloadWordPress () {
        const wpZip = new ZipFile(wp['WordPress'], './', './wp.zip', myEE)
        wpZip.downloadAndUnpack()
    }

    /**
     * Creates a directory for the new WordPress theme.
     */
    createThemeDir () {
        fs.mkdir(`./wordpress/wp-content/themes/${this.themeName}`, function() {
            copydir.sync('./theme-template', `./wordpress/wp-content/themes/${this.themeName}`)
            const styleFileContent = `/*\nTheme Name: ${this.themeName}\nAuthor: ${this.author}\nAuthor URI: ${this.URI}\n*/`
            fs.writeFile(`./wordpress/wp-content/themes/${this.themeName}/style.css`, styleFileContent, function() {
                myEE.emit('themeCreated')
            })
        }.bind(this))
    }

    /**
     * Instatiates a new ZipFile object for each WordPress plugin and unzips them in the correct directory.
     */
    downloadPlugins () {
        myEE.on('pluginUnzipped', () => {
            process.stdout.write('\r' + logSymbols.success + ' ')
            process.stdout.write('\n')
            index++
            if (index === this.plugins.length) {
                myEE.emit('finished')
            } else {
                download(this.plugins[index])
            }
        })
        myEE.on('invalidPluginUrl', () => {
            process.stdout.write('\r' + logSymbols.error + ' ')
            process.stdout.write('\n')
            process.stdout.write(`  ${logSymbols.info} This URL is not valid or does not lead to a .zip file: ${plugins[this.plugins[index]]}`)
            process.stdout.write('\n')
            index++
            if (index === this.plugins.length) {
                myEE.emit('finished')
            } else {
                download(this.plugins[index])
            }
        })

        const download = function (plugin) {
            let concName = plugin.replace(/ /g, '-')
            let pluginZip = new ZipFile(plugins[plugin], './wordpress/wp-content/plugins/', `./${concName}.zip`, myEE)
            pluginZip.downloadAndUnpack()
        }

        let index = 0
        
        download(this.plugins[index])
    }

    /**
     * Synchronously removes directories even if they are not empty.
     * @param {string} path Path to directory to be removed.
     */
    removeDirectoryRecursive (path) {
        if (fs.existsSync(path)) {
            fs.readdirSync(path).forEach(function(file, index) {
                let currentPath = path + '/' + file
                if (fs.lstatSync(currentPath).isDirectory()) {
                    this.removeDirectoryRecursive(currentPath)
                } else {
                    fs.unlinkSync(currentPath)
                }
            }.bind(this))
            fs.rmdirSync(path)
        }
    }

    /**
     * Removes all standard plugins located in the "./wordpress/wp-content/plugins/" directory.
     */
    removeStandardPlugins () {
        if (this.removePlugins === false) return

        const pluginsDirectory = './wordpress/wp-content/plugins/'

        fs.readdir(pluginsDirectory, (err, files) => {
            if (err) throw err

            for (let file of files) {
                if (file !== 'index.php') {
                    let temporaryPath = path.join(pluginsDirectory, file)
                    if (fs.lstatSync(temporaryPath).isDirectory()) {
                        this.removeDirectoryRecursive(temporaryPath)
                    } else {
                        fs.unlinkSync(temporaryPath)
                    }
                }
            }
        })
    }

    /**
     * Removes all standard themes located in the "./wordpress/wp-content/themes/" directory.
     */
    removeStandardThemes () {
        if (this.removeThemes === false) return 

        const themesDirectory = './wordpress/wp-content/themes/'

        fs.readdir(themesDirectory, (err, files) => {
            if (err) throw err

            for (let file of files) {
                if (file !== 'index.php' && file !== this.themeName) {
                    let temporaryPath = path.join(themesDirectory, file)
                    if (fs.lstatSync(temporaryPath).isDirectory()) {
                        this.removeDirectoryRecursive(temporaryPath)
                    } else {
                        fs.unlinkSync(temporaryPath)
                    }
                }
            }
        })
    }

    /**
     * Installs npm packages in the custom theme folder by executing the "npm install" command.
     */
    installNpm () {
        this.npmInterval = setInterval(() => {
            process.stdout.write('\r  Installing npm packages. This may take a few minutes.  ')
            this.npmTimeout500 = setTimeout(() => {
                process.stdout.write('\r  Installing npm packages. This may take a few minutes.. ')
            }, 500)
            this.npmTimeout1000 = setTimeout(() => {
                process.stdout.write('\r  Installing npm packages. This may take a few minutes...')
            }, 1000)
        }, 1500)
        exec(`cd ./wordpress/wp-content/themes/${this.themeName} && npm install -y`, (error, stdout, stderr) => {
            if (error) {
                console.log(`exec error: ${error}`)
                process.exit()
            }
            clearTimeout(this.npmTimeout500)
            clearTimeout(this.npmTimeout1000)
            clearInterval(this.npmInterval)
            process.stdout.write('\r' + logSymbols.success + ' ')
            process.stdout.write('\n\nAll npm packages have sucessfully been installed in your theme directory.')
            process.exit()
        })
    }
}