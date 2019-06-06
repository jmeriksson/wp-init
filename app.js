'use strict'

// Dependencies
const Website = require('./lib/Website')
const readline = require('readline')

// Access JSON file with URLs for HTTP requests 
const plugins = require('./plugins.json')

// String that clears terminal
const clearTerminal = '\u001B[2J\u001B[0;0f'

// Open a readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

/**
 * Initiates a new WordPress installation customized according to user input.
 */
const initNewWordPress = async function () {
    process.stdout.write(clearTerminal)

    // Greets user and introduces the application.
    process.stdout.write(
        '|| WP INIT ||\nThis application will create a WordPress installation with a custom theme.\nPlease provide the required input below to customize your new WordPress installation (use only A-Z, a-z and 0-9 characters).\n\n')
    
    const questions = [
        'Name your new WordPress theme: ',
        'Name of the theme author (leave blank to skip): ',
        'Theme author\'s website url (leave blank to skip): ',
        'Remove pre-added (standard) plugins from your new WordPress installation (y/n)? ',
        'Remove pre-added (standard) themes from your new WordPress installation (y/n)? ',
        'Install all necessary npm packages in the theme directory upon completion (y/n)? '
    ]
    addPlugins(questions)
    
    let questionIndex = 0

    let wordPressData = {}

    let pluginsToInstall = []

    rl.setPrompt(questions[questionIndex])

    rl.on('line', input => {
        // Handles user input
        switch (questionIndex) {
            case 0:
                // theme name
                if (input.trim().length > 0) {
                    input = input.replace(/ /g, '-')
                    wordPressData.themeName = input.trim()
                } else {
                    return rl.prompt()
                }
                break
            case 1:
                // theme author
                if (input.trim().length > 0) {
                    wordPressData.themeAuthor = input.trim()
                }
                break
            case 2:
                // theme author URI
                wordPressData.authorUri = input.trim()
                break
            case 3:
                // remove plugin (boolean)
                if (input.toLowerCase().trim() === 'y') {
                    wordPressData.removePlugins = true
                } else if (input.toLowerCase().trim() === 'n') {
                    wordPressData.removePlugins = false
                } else {
                    console.log('Please answer either "y" for "yes" or "n" for "no": ')
                    return rl.prompt()
                }
                break
            case 4:
                // remove themes (boolean)
                if (input.toLowerCase().trim() === 'y') {
                    wordPressData.removeThemes = true
                } else if (input.toLowerCase().trim() === 'n') {
                    wordPressData.removeThemes = false
                } else {
                    console.log('Please answer either "y" for "yes" or "n" for "no": ')
                    return rl.prompt()
                }
                break
            case 5:
                // auto install npm packages (boolean)
                if (input.toLowerCase().trim() === 'y') {
                    wordPressData.autoInstall = true
                } else if (input.toLowerCase().trim() === 'n') {
                    wordPressData.autoInstall = false
                } else {
                    console.log('Please answer either "y" for "yes" or "n" for "no": ')
                    return rl.prompt()
                }
                break
            default:
                // plugins
                if (input.toLowerCase().trim() === 'y') {
                    pluginsToInstall.push(Object.keys(plugins)[questionIndex - 6])
                } else if (input.toLowerCase().trim() !== 'y' && input.toLowerCase().trim() !== 'n') {
                    rl.setPrompt('Please answer either "y" for "yes" or "n" for "no": ')
                    return rl.prompt()
                }
        }

        if (questionIndex === questions.length - 1) {
            rl.close()
        } else {
            questionIndex++
            rl.setPrompt(questions[questionIndex])
            rl.prompt()
        }
    })

    rl.on('close', () => {
        wordPressData.plugins = pluginsToInstall
        const WPInstallation = new Website(
            wordPressData.themeName,
            wordPressData.themeAuthor,
            wordPressData.authorUri,
            wordPressData.autoInstall,
            wordPressData.removePlugins,
            wordPressData.removeThemes,
            wordPressData.plugins
        )
        process.stdout.write(clearTerminal)
        process.stdout.write('Please hold while neccesarry packages are being downloaded and unzipped.\n\n')
        WPInstallation.initWebsite()
    })

    rl.prompt()
}

/**
 * Takes an array (empty or not) and pushes a question string per plugin to it. Plugins are collected from a JSON file.
 * @param {arr} array Array to push questions to.
 */
const addPlugins = function (array) {
    Object.keys(plugins).forEach(pluginName => {
        array.push(`Do you wish to install this plugin: ${pluginName} (y/n)? `)
    })
}

/**
 * Starting point of application. Asynchronously initiates a new WordPress installation.
 */
const main = async function () {
    await initNewWordPress()
}

main()
