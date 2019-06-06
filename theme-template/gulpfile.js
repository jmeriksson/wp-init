let browserSync = require('browser-sync').create()
let gulp = require('gulp')
let uglify = require('gulp-uglify')
let sass = require('gulp-sass')
let plumber = require('gulp-plumber')
let imagemin = require('gulp-imagemin')
let autoprefixer = require('gulp-autoprefixer')

// Scripts task
// Uglifies scripts
gulp.task('scripts', async () => {
    gulp.src('js/*.js')
        .pipe(plumber())
        .pipe(uglify())
        .pipe(gulp.dest('public/js/'))
        .pipe(browserSync.stream())
})

// Styles task
// Compiles SASS
gulp.task('styles', async () => {
    gulp.src('css/**/*.scss')
        .pipe(plumber())
        .pipe(sass({
            outputStyle: 'expanded'
        }))
        .pipe(autoprefixer('last 2 versions'))
        .pipe(gulp.dest('public/css/'))
        .pipe(browserSync.stream())
})

// Image task
// Compresses images
gulp.task('image', async () => {
    gulp.src('images/*')
        .pipe(imagemin())
        .pipe(gulp.dest('public/images'))
})

// Watch
// Watches for changes and updates browser
gulp.task('watch', async () => {
    browserSync.init({
        server: {
            baseDir: "./public"
        }
    })
    gulp.watch('js/*.js', gulp.parallel('scripts'))
    gulp.watch('css/*/scss', gulp.parallel('styles'))
    gulp.watch('css/**/*.scss', gulp.parallel('styles'))
    gulp.watch('public/*.html').on('change', browserSync.reload)
    gulp.watch('public/*/*.html').on('change', browserSync.reload)
    
})

gulp.task('default', gulp.parallel('scripts', 'styles', 'watch'))
