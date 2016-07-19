'use strict';

import gulp         from 'gulp';
import browserify   from 'browserify';
import browserSync  from 'browser-sync';
import babelify     from 'babelify';
import source       from 'vinyl-source-stream';
import stylus       from 'gulp-stylus';
import postStylus   from 'poststylus';
import sourcemaps   from 'gulp-sourcemaps';
import lost         from 'lost';
import autoprefixer from 'autoprefixer';
import { spawn }    from 'child_process';


const onError = function (err) {
  console.log(err.stack);
  this.emit('end');
};

const PORT = 9090;

const paths = {
  public: './public',
  stylus: [
    './resources/assets/styl/**/*.styl'
  ],
  js: [
    './resources/assets/js/**/*.js'
  ],
  scala: [
    './app/**/*.scala',
    './app/**/*.scala.html',
  ]
};

const reload = (done) => {
  browserSync.reload();
  done && done();
};

gulp.task('stylus', () => {
  return gulp.src('./resources/assets/styl/app.styl')
    .pipe(sourcemaps.init())
    .pipe(stylus({
      use: [
        postStylus([lost, autoprefixer])
      ]
    }))
    .on('error', onError)
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(paths.public + '/css'))
    .pipe(browserSync.stream());
});

gulp.task('es6', () => {
  return browserify({
      entries: './resources/assets/js/app.js',
      extensions: ['.js'],
      debug: true
    })
    .transform(babelify)
    .bundle()
    .on('error', onError)
    .pipe(source('app.js'))
    .pipe(gulp.dest(paths.public + '/js'));
});

gulp.task('play', (done) => {
  const cmd = spawn('activator', [`~run ${PORT}`], {
    //stdio: 'inherit'
  });

  return cmd.stdout.on('data', (data) => {
    const str = String(data);

    if (str.trim() !== '') {
      console.log(str.replace(/(\r\n|\n|\r)+$/gm, ''));

      if (str.includes('Compiled in')) {
        reload(done);
      } else if (str.includes('Server started')) {
        done();
      }
    }
  });
});

gulp.task('serve', (done) => {
  browserSync.init({
    proxy: `http://localhost:${PORT}`
  }, done);
});

gulp.task('watch:stylus', () => {
  return gulp.watch(paths.stylus, gulp.series('stylus'));
});

// gulp.task('watch:scala', () => {
//   return gulp.watch(paths.scala, gulp.series(reload));
// });

gulp.task('watch:es6', () => {
  return gulp.watch(paths.js, gulp.series('es6', reload));
});

gulp.task('watch', gulp.parallel('watch:es6', 'watch:stylus'));

gulp.task('default', gulp.series('play', 'stylus', 'es6', 'serve', 'watch'));
