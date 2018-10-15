const fs = require('fs')
const path = require('path')

const gulp = require('gulp')
const rename = require('gulp-rename')
const del = require('del')

const through = require('through2')
const colors = require('ansi-colors')
const log = require('fancy-log')
const argv = require('minimist')(process.argv.slice(2))

const postcss = require('gulp-postcss')
const pxtorpx = require('postcss-px2rpx')
const base64 = require('postcss-font-base64')

const htmlmin = require('gulp-htmlmin')
const sass = require('gulp-sass')
const jsonminify = require('gulp-jsonminify')
const combiner = require('stream-combiner2')
const babel = require('gulp-babel')
const uglify = require('gulp-uglify')
const cssnano = require('gulp-cssnano')
const runSequence = require('run-sequence')
const sourcemaps = require('gulp-sourcemaps')
const filter = require('gulp-filter')
const jdists = require('gulp-jdists')
const util = require('gulp-util')
const imagemin = require('gulp-imagemin')
// 引入生成文件模块
const inquirer = require('inquirer')
const generatePage = require('generate-weapp-page')

const src = './client'
const dist = './dist'
// const isProd = argv.type === 'prod'
const isProd = argv.env === 'prod'  // 环境判断修改

const handleError = (err) => {
  console.log('\n')
  log(colors.red('Error!'))
  log('fileName: ' + colors.red(err.fileName))
  log('lineNumber: ' + colors.red(err.lineNumber))
  log('message: ' + err.message)
  log('plugin: ' + colors.yellow(err.plugin))
}

// utils functions

/**
 * 生成小程序基础文件页面
 * @param  {Object} options 用户选择对象
 * @return {Array}        生成的文件集
 */
function generateFile (options) {
  const files = generatePage({
    root: path.resolve(__dirname, './client/pages/'),
    name: options.pageName,
    less: options.styleType === 'less',
    scss: options.styleType === 'scss',
    css: options.styleType === 'css',
    json: options.needConfig
  })
  files.forEach && files.forEach(file => util.log('[generate]', file))
  return files
}

/**
 * 将文件页面添加到app.json配置
 * @param  {Object} options 用户选择对象
 * @return
 */
function generateJson (options) {
  const filename = path.resolve(__dirname, 'client/app.json')
  const now = fs.readFileSync(filename, 'utf8')
  const temp = now.split('\n    // Dont remove this comment')
  if (temp.length !== 2) {
    return util.log('[generate]', 'Append json failed')
  }
  const result = `${temp[0].trim()},
    "pages/${options.pageName}/${options.pageName}"
    // Dont remove this comment
  ${temp[1].trim()}
`
  fs.writeFileSync(filename, result)
}

// task start

/**
 * Compile json source to distribution directory
 */
gulp.task('json', () => {
  return gulp.src(`${src}/**/*.json`)
    .pipe(jsonminify())
    .pipe(gulp.dest(dist))
})

/**
 * Compile wxml source to distribution directory
 */
gulp.task('wxml', () => {
  return gulp
    .src(`${src}/**/*.wxml`)
    .pipe(
      isProd
        ? htmlmin({
            collapseWhitespace: true,
            removeComments: true,
            keepClosingSlash: true
          })
        : through.obj()
    )
    .pipe(gulp.dest(dist))
})

/**
 * Compile wxs source to distribution directory
 */
gulp.task('wxs', () => {
  return gulp.src(`${src}/**/*.wxs`).pipe(gulp.dest(dist))
})

/**
 * Compile scss source to distribution directory
 */
gulp.task('wxss', () => {
  const combined = combiner.obj([
    gulp.src(`${src}/**/*.{wxss,scss}`),
    sass().on('error', sass.logError),
    postcss([pxtorpx(), base64()]),
    isProd
      ? cssnano({
          autoprefixer: false,
          discardComments: {removeAll: true}
        })
      : through.obj(),
    rename((path) => (path.extname = '.wxss')),
    gulp.dest(dist)
  ])

  combined.on('error', handleError)
})

/**
 * Compile img source to distribution directory
 */
gulp.task('images', () => {
  return gulp.src(`${src}/images/**`)
    .pipe(isProd ? imagemin() : through.obj())
    .pipe(gulp.dest(`${dist}/images`))
})

/**
 * Compile js source to distribution directory
 */
gulp.task('js', () => {
  const f = filter((file) => !/(mock|bluebird)/.test(file.path))
  gulp
    .src(`${src}/**/*.js`)
    .pipe(isProd ? f : through.obj())
    .pipe(
      isProd
        ? jdists({
            trigger: 'prod'
          })
        : jdists({
            trigger: 'dev'
          })
    )
    .pipe(isProd ? through.obj() : sourcemaps.init())
    .pipe(
      babel({
        presets: ['env']
      })
    )
    .pipe(
      isProd
        ? uglify({
            compress: true
          })
        : through.obj()
    )
    .pipe(isProd ? through.obj() : sourcemaps.write('./'))
    .pipe(gulp.dest(dist))
})

/**
 * Watch source change
 */
gulp.task('watch', () => {
  ;['wxml', 'wxss', 'js', 'json', 'wxs'].forEach((v) => {
    gulp.watch(`${src}/**/*.${v}`, [v])
  })
  gulp.watch(`${src}/images/**`, ['images'])
  gulp.watch(`${src}/**/*.scss`, ['wxss'])
})

/**
 * Clean distribution directory
 */
gulp.task('clean', () => {
  return del(['./dist/**'])
})

/**
 * Dev
 */
gulp.task('dev', ['clean'], () => {
  runSequence('json', 'images', 'wxml', 'wxss', 'js', 'wxs', 'cloud', 'watch')
})

/**
 * Build
 */
gulp.task('build', ['clean'], () => {
  runSequence('json', 'images', 'wxml', 'wxss', 'js', 'wxs', 'cloud')
})

// cloud-functions 处理方法
const cloudPath = './server/cloud-functions'
gulp.task('cloud', () => {
  return gulp
    .src(`${cloudPath}/**`)
    .pipe(
      isProd
        ? jdists({
            trigger: 'prod'
          })
        : jdists({
            trigger: 'dev'
          })
    )
    .pipe(gulp.dest(`${dist}/cloud-functions`))
})

gulp.task('watch:cloud', () => {
  gulp.watch(`${cloudPath}/**`, ['cloud'])
})

gulp.task('cloud:dev', () => {
  runSequence('cloud', 'watch:cloud')
})


/**
 * Generate new page
 */
gulp.task('generate', next => {
  inquirer.prompt([
    {
      type: 'input',
      name: 'pageName',
      message: 'Input the page name',
      default: 'index'
    },
    {
      type: 'confirm',
      name: 'needConfig',
      message: 'Do you need a configuration file',
      default: false
    },
    {
      type: 'list',
      name: 'styleType',
      message: 'Select a style framework',
      choices: ['scss', 'less', 'css'],
      default: 'scss'
    }
  ])
  .then(options => {
    const res = generateFile(options)
    if (res) generateJson(options)
  })
  .catch(err => {
    throw new util.PluginError('generate', err)
  })
})