![WP Init](./docs/wp-init-logo.png)

__This application automates the process of initiating a new WordPress installation. WP Init will download the latest version of WordPress along with all the plugins you choose. It will then create a new theme and copy all the basic PHP files necessary for you to start developing your new theme.__

## Prerequisites and disclaimer

* WP Init requires NodeJS and npm to be installed on your computer. The included template theme also relies on NodeJS and npm for development.
* WP Init does in no way produce a completed WordPress theme and if you do not have any prior experience with WordPress theme development, it will probably not be very useful to you*.

_*Tip: If you wish to learn how to develop WordPress themes. Take a look at [this excellent article series by Tania Rascia](https://www.taniarascia.com/developing-a-wordpress-theme-from-scratch/)._

## User instructions

1. Clone this repo to your local machine.
2. Open a command line and run `npm install` in the root directory of this application.
3. To add plugins (optional):
    * Go to [the plugins section on the WordPress website](https://wordpress.org/plugins/) and find your desired plugin.
    * Copy the download URL for the plugin (i.e. by right clicking on the 'Download' button and choosing to copy the link). This URL should have a '.zip' ending.
    * Open the 'plugins.json' file located in the root directory of this application.
    * Add a new entry in the 'plugins.json' file. The name of the entry should be a string representing the name of the plugin and the value should be a string containing the URL you just copied from the WordPress website.
4. Open a command line and run `npm start` in the root directory of this application.
5. Follow the instructions given in the command line interface until the process is completed.
6. Upon completion, your new WordPress installation is located in a directory named 'wordpress', in the root directory of this application. If you run this application again, all content in this folder will be wiped so you should copy it to a new directory before you start working with it. 

## The included template theme

WP Init comes with a template theme, located in the [theme-template directory](./theme-template). This is not a finished theme that is ready to be installed, but a solid foundation for you to develop a custom theme upon. It is designed for a workflow where you first design a static website using HTML, Sass and JavaScript and then (when you are happy with the overall design) transfer your HTML code to PHP files that allow you to easily add partials like headers, footers and navigation menus to your whole website. Again, if you are completely new to WordPress theme development, please take a look at some articles or tutorials on the subject before using WP Init.

The template theme, when properly installed, consists of a header with place for a logo or brand name and a responsive navigation menu (that collapses into a hamburger menu on small screens), and a footer with just a text paragraph. It should look like this when opened in a browser:

![Print screen of template theme](./docs/template-theme-output.png)

If preferred, you can replace the included template theme with a template theme of your own design. You can also build upon the included template theme after cloning this repo and then re-use it several times. WP Init will copy the contents of the 'theme-template' directory and place them in the theme folder of your WordPress installation (which is located in 'wordpress/wp-content/themes/' after WP Init has finished running).

### Gulp and Browsersync

The template theme uses [Gulp](https://gulpjs.com/) to automatically compile Sass and minify any custom JavaScript you write inside the 'script.js' file. All configuration for Gulp can be found in 'gulpfile.js', located in the root of the [theme-template directory](./theme-template). Gulp is used in combination with [Browsersync](https://www.browsersync.io/) in order to live serve your theme to your browser and provide you with an easy-to-use development environment. Open a command line and run the `gulp` command in the theme's root in order to start this process, which both live serves your theme and automatically recompiles your code every time you save.

Gulp also has image minifying functions which helps you reduce image sizes and decrease loading times on your finished website. In order to use this function, place an image file in the 'images' directory inside the theme directory, then open up a command line in your theme's root directory and run the `gulp image` command. A minified image will then appear inside the 'public/img' directory.

Please refer to [Gulp's website](https://gulpjs.com/) for information on how you can make changes in gulpfile.js to fit your own project.

### Bootstrap

Styling and scripts from [Bootstrap](https://getbootstrap.com/) are added to the index.html file found in the 'public' directory of the template theme. The pre-built header with a responsive navigation menu utilizes Bootstrap and will stop working if Bootstrap is removed. Please refer to the thorough documentation on [Bootstrap's website](https://getbootstrap.com/) for help with using Bootstrap.

### Replacing the template theme

If you are using WP Init repeatedly and wish to replace the included theme with a template theme of your own design, feel free to do so. Here is what you need to have in mind:

* WP Init looks for a directory called 'theme-template' that is located directly in the root directory of the application. It then copies everything placed inside this directory into the new theme directory. If you replace the template theme with a new theme, make sure to name the new theme 'theme-template' and place it directly into the root.
* WP Init will ask the user if they wish to run the `npm install` command in the new theme directory once it is created. If your new theme does not contain a valid package.json file, always answer 'no' when asked if you wish to run `npm install`.