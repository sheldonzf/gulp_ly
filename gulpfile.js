/****** gulp依赖模块加载开始 ******/

  var gulp = require('gulp');

  //gulp-watch监视文件变化,gulpjs4.0版本前需配合gulp-plumber使用
  var watch = require('gulp-watch');
  var plumber = require('gulp-plumber');

  // 清除 files and folders.
  var del = require('del');

  // 替换内容
  var replace = require('gulp-replace');

  /** 自带livereload的本地server **/
  var connect = require('gulp-connect');

  /** 中间件，路由代理，主要用来做mock切换，如将/api的请求代理到m-p环境上去 **/
  var fs = require('fs');
  var path = require('path');
  var url = require('url');
  var proxy = require('proxy-middleware');

  /** sass编译 **/
  var sass = require('gulp-sass');

  /** css后处理器 **/
  var autoprefixer = require('gulp-autoprefixer');

  /** 将模板文件转成js代码 **/
  var tpl2js = require('gulp-tpl2js');

  /** 将react的jsx文件转成js文件 **/
  var react = require('gulp-react');

  /** js语法检测 **/
  var jshint = require('gulp-jshint');

  /** 重命名 **/
  var rename = require('gulp-rename');

  /** js文件压缩 **/
  var uglify = require('gulp-uglify');

  /** git管理 **/
  var git = require('gulp-git');

   /** seajs合并 **/
  var transport = require("gulp-seajs-transport");
  var concat = require('gulp-concat');

  var minimist = require('minimist');
/****** gulp依赖模块加载结束 ******/



/****** 开发目录路径定义开始 ******/
//  var devBasePath = '/Users/mac2012/Documents/work/tuniu/branch/';
  var devBasePath = '/tuniu/mcdn'  
  var distBasePath = 'dist/';

  // var currentProject = '/car/';
  // var currentProject = '/layout/new_201602/';
  // var currentProject = '/index/';
  var knownOptions = {
    string: 'module',
    default: { module: process.env.NODE_ENV || 'index' }
  };

  var options = minimist(process.argv.slice(2), knownOptions);  
  var currentProject = options.module;
  console.log( currentProject );

  var scssPath = path.join(devBasePath, 'site/m2015/scss', currentProject);
  var cssPath = path.join(devBasePath, 'site/m2015/css' , currentProject);
  var prototypePath = path.join(devBasePath, 'prototypes' , currentProject);
  var jsPath = path.join(devBasePath, 'site/m2015/js/modules' , currentProject);
  var configPath = path.join(devBasePath, 'site/m2015/js/config/');
  
  var originBranch = '/Users/mac2012/Documents/work/tuniu/branch';
  var modulesPath = path.join(originBranch, '/site/m2015/js/modules/');

/****** 开发目录路径定义结束 ******/



/****** gulp任务开始 ******/


  /************
   *小任务
   */

  //清除dist文件夹
  gulp.task('clean', function(cb) {
    del([path.join(distBasePath, '**/*')], cb);
  });

  //css后处理器
  gulp.task('prefixer', function ( para ) {
    console.log(arguments.length);
    console.log('para:' + para);
    console.log(cssPath);
    return gulp.src(path.join(cssPath,'*.css'))
      .pipe(autoprefixer({
          browsers: ['> 1%'],
          cascade: false
      }))
      .pipe(gulp.dest(cssPath));
  });

  //jshint
  gulp.task('hint', function() {
    return gulp.src([path.join(jsPath ,'*.js'), '!' + path.join(jsPath ,'*.min.js')])
      .pipe(jshint())
      .pipe(jshint.reporter('default'));
  });

  //模板处理
  gulp.task('template', function() {
    return gulp.src(path.join(jsPath,'/template/*.tpl'))
      .pipe(tpl2js())
      .pipe(replace(/^(\w*)=([\S\s]*)$/gm, 'define(function(require,exports,module){\n  "use strict";\n  var tpl = $2\n\n  module.exports = tpl;\n});')) 
      .pipe(gulp.dest(path.join(jsPath,'/template')));
  });

  //jsx文件处理
  gulp.task('jsx', function () {
    return gulp.src(path.join(jsPath,'/jsx/*.jsx'))
      .pipe(react())
      .pipe(gulp.dest(path.join(jsPath,'/jsx')));
  });



  /************
   *中任务
   */

  //本地server
  gulp.task('connect', function() {
    connect.server({
      root: devBasePath,
      port: 8000,
      livereload: true,
      middleware: function(connect, opt) {
        var configPath = path.resolve(path.join(prototypePath,'mock/config.js'));
        var proxyList  = [];

        if(fs.existsSync(configPath)){
          var config = require(configPath);

          config.forEach(function(e,i){
            var options = url.parse(e.url);
            options.route = e.route;
            proxyList.push(proxy(options));
          });
        }
        return proxyList;
      }
    });
  });

  //CSS开发中编译
  //gulp.task('styles', function() {
  //  gulp.src(path.join(scssPath,'*.scss'))
  //    .pipe(plumber())
  //    .pipe(sass({
  //      outputStyle: 'expanded'
  //    }))
  //    .pipe(gulp.dest('temp/'))
  //    .pipe(gulp.dest(cssPath));
  //});

  //CSS打包前编译,与style任务不同的是加入了autoprefixer
  gulp.task('stableStyles', function() {
    gulp.src(path.join(scssPath,'*.scss'))
      .pipe(plumber())
      .pipe(sass({
        outputStyle: 'expanded'
      }))
      .pipe(autoprefixer({
          browsers: ['> 1%'],
          cascade: false
      }))
      .pipe(gulp.dest(cssPath));
  });

  //监视文件变化
  gulp.task('watch', function() {
    gulp.watch(path.join(prototypePath,'/html/*.html'), function(){
      gulp.src(path.join(prototypePath,'/html/*.html')).pipe(connect.reload());
    });

    gulp.watch(path.join(cssPath,'**/*.css'), function(){
      gulp.src(path.join(cssPath,'**/*.css')) .pipe(connect.reload()); 
    });
    
    gulp.watch(path.join(scssPath,'**/*.scss'), ['styles']);
    gulp.watch(path.join(jsPath,'/template/*.tpl'), ['template']);
    gulp.watch(path.join(jsPath,'/jsx/*.jsx'), ['jsx']);
  });

  // seajs合并
  gulp.task('seajsconcat' , function(){
   return gulp.src([path.join(jsPath,'**/*.min.js'), '!' + path.join(jsPath,'entry.min.js'), '!' + path.join(jsPath,'all.min.js')],{base:"/tuniu/mcdn/site/m2015/js/"})
      .pipe(transport())
      .pipe(concat('all.min.js'))
      .pipe(uglify({mangle: {except: ['require']}}))
      .pipe(gulp.dest(jsPath));
  })

  //JS压缩
  gulp.task('compress', ['template', 'jsx'], function() {
    gulp.src([path.join(jsPath,'**/*.js'), '!' + path.join(jsPath,'**/*.min.js')])
      .pipe(rename(function (path) {
        path.basename += ".min";
      }))
      // 为压缩后的js中所有路径引用的js路径添加min,注意未压缩的路径中一定要以.js结尾
      .pipe(replace(/(["'][\.\s\w/-]*)(\.js)(\s*["'])/gmi, "$1.min$2$3")) 
      .pipe(uglify({mangle: {except: ['require']}}))
      .pipe(gulp.dest(jsPath));

    gulp.src([path.join(configPath,'config.js')])
      .pipe(rename(function (path) {
        path.basename += ".min";
      }))
      .pipe(uglify())
      .pipe(gulp.dest(configPath));
  });


  /************
   *大任务
   */

  //开发环境
  gulp.task('default', ['connect', 'watch']);

  //发布环境
  gulp.task('stable', ['clean', 'stableStyles', 'hint', 'compress'], function(){
    gulp.src(path.join(devBasePath,'**/*'))
      .pipe(gulp.dest(distBasePath));
  });

  //拉取SVN同步,慎用啊~~~
  gulp.task('pullOrigin', function(){
    
    git.checkout('master', function (err) {
      if (err) throw err;
    });

    var sourcePaths = [
      'site/m2015/scss/',
      'site/m2015/css/',
      'site/m2015/images/',
      'site/m2015/fonts30/',
      'site/m2015/js/'
    ];

    for (var i = sourcePaths.length - 1; i >= 0; i--) {
      gulp.src(path.join(originBranch, sourcePaths[i], '**/*'))
        .pipe(gulp.dest(path.join(devBasePath, sourcePaths[i])));
    }
  });

  //推送SVN同步
  gulp.task('push',  function(){
    var sourcePaths = [scssPath, cssPath, jsPath, prototypePath];

    for (var i = sourcePaths.length - 1; i >= 0; i--) {
      gulp.src(path.join(sourcePaths[i], '/**/*'))
        .pipe(gulp.dest(path.join(originBranch, sourcePaths[i].replace(devBasePath, ''))));
    }
  });
