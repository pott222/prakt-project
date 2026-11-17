const { src, dest, series, parallel, watch } = require('gulp');
const fs = require('fs');
const http = require('http');
const path = require('path');
const sass = require('gulp-sass')(require('sass'));
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cleanCss = require('gulp-clean-css');
const del = require('del');

const paths = {
  scss: { in: 'src/scss/main.scss', watch: 'src/scss/**/*.scss', out: 'css' },
  js:   { in: 'src/js/**/*.js',     watch: 'src/js/**/*.js',     out: 'js' },
  img:  { in: 'src/img/**/*',       watch: 'src/img/**/*',       out: 'img' }
};

function styles() {
  return src(paths.scss.in)
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([autoprefixer()]))
    .pipe(cleanCss())
    .pipe(dest(paths.scss.out));
}

function scripts() {
  return src(paths.js.in).pipe(dest(paths.js.out));
}

function images() {
  return src(paths.img.in).pipe(dest(paths.img.out));
}

function clean() {
  return del(['css', 'js', 'img']);
}

function watchFiles() {
  watch(paths.scss.watch, series(styles));
  watch(paths.js.watch, series(scripts));
  watch(paths.img.watch, series(images));
}

function serve(done) {
  const root = process.cwd();
  const contentTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.svg': 'image/svg+xml'
  };
  let listening = false;

  const server = http.createServer((request, response) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { Allow: 'GET, HEAD' });
      response.end('Method Not Allowed');
      return;
    }

    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    } catch (error) {
      response.writeHead(400);
      response.end('Bad Request');
      return;
    }

    let filePath;
    if (pathname === '/' || pathname === '/index.html') {
      filePath = path.join(root, 'index.html');
    } else {
      const match = pathname.match(/^\/(css|js|img|projects)\/(.+)$/);
      if (!match) {
        response.writeHead(404);
        response.end('Not Found');
        return;
      }

      const assetRoot = path.resolve(root, match[1]);
      filePath = path.resolve(assetRoot, match[2]);
      const relativePath = path.relative(assetRoot, filePath);
      if (relativePath === '..' || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) {
        response.writeHead(404);
        response.end('Not Found');
        return;
      }
    }

    fs.stat(filePath, (error, stats) => {
      if (error) {
        if (error.code !== 'ENOENT') {
          console.error(error);
          response.writeHead(500);
          response.end('Internal Server Error');
          return;
        }

        response.writeHead(404);
        response.end('Not Found');
        return;
      }

      if (!stats.isFile()) {
        response.writeHead(404);
        response.end('Not Found');
        return;
      }

      response.writeHead(200, {
        'Content-Type': contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream'
      });

      if (request.method === 'HEAD') {
        response.end();
        return;
      }

      const file = fs.createReadStream(filePath);
      file.on('error', (streamError) => {
        console.error(streamError);
        if (!response.headersSent) {
          response.writeHead(500);
          response.end('Internal Server Error');
        } else {
          response.destroy(streamError);
        }
      });
      file.pipe(response);
    });
  });

  server.on('error', (error) => {
    if (listening) {
      console.error(error);
    } else {
      done(error);
    }
  });

  server.listen(3000, '127.0.0.1', () => {
    listening = true;
    console.log('Site available at http://127.0.0.1:3000/');
    done();
  });
}

const build = series(clean, parallel(styles, scripts, images));
const dev = series(build, parallel(watchFiles, serve));

exports.styles = styles;
exports.clean = clean;
exports.build = build;
exports.serve = serve;
exports.default = dev;