'use strict';

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _bluebirdRetry = require('bluebird-retry');

var _bluebirdRetry2 = _interopRequireDefault(_bluebirdRetry);

var _webpackSources = require('webpack-sources');

var _webpackSources2 = _interopRequireDefault(_webpackSources);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function TinyPlugin(options) {
  this.options = options || {
    MAX_TRY: 10,
    MAX_TIME: 10000
  };
}

//todo assets rename,
//todo just change src
TinyPlugin.prototype.getUrl = function (url) {
  var _this = this;
  function promiseFactory() {
    return new Promise(function (resolve, reject) {
      (0, _axios2.default)({
        url: url,
        timeout: _this.options.MAX_TIME,
        method: 'get',
        responseType: 'arraybuffer'
      }).then(function (r) {
        resolve(r.data);
      }, function (err) {
        reject(err);
      });
    });
  }
  return promiseFactory();
};
TinyPlugin.prototype.postUrl = function (data) {
  var _this = this;
  function promiseFactory() {
    return new Promise(function (resolve, reject) {
      (0, _axios2.default)({ method: 'post',
        headers: {
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Encoding": "gzip, deflate",
          "Accept-Language": "zh-cn,zh;q=0.8,en-us;q=0.5,en;q=0.3",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
          "Connection": "keep-alive",
          "Host": "tinypng.com",
          "DNT": 1,
          "Referer": "https://tinypng.com/",
          "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:42.0) Gecko/20100101 Firefox/42.0"
        },
        timeout: _this.options.MAX_TIME,
        url: 'https://tinypng.com/web/shrink',
        data: data
      }).then(function (res) {
        resolve(res.data.output.url);
      }, function (err) {
        reject(err);
      });
    });
  }
  return promiseFactory();
};

TinyPlugin.prototype.tiny = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(assets, filename) {
    var url, rawData;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.next = 3;
            return (0, _bluebirdRetry2.default)(this.postUrl.bind(this, assets[filename].source()), { max_tries: this.options.MAX_TRY });

          case 3:
            url = _context.sent;
            _context.next = 6;
            return (0, _bluebirdRetry2.default)(this.getUrl.bind(this, url), { max_tries: this.options.MAX_TRY });

          case 6:
            rawData = _context.sent;

            console.log(filename, '=> success');
            assets[filename] = new _webpackSources2.default.RawSource(rawData);
            return _context.abrupt('return', Promise.resolve());

          case 12:
            _context.prev = 12;
            _context.t0 = _context['catch'](0);

            console.log(filename, '=>fail');
            return _context.abrupt('return', Promise.resolve());

          case 16:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[0, 12]]);
  }));

  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

TinyPlugin.prototype.apply = function (compiler) {
  var _this2 = this;

  compiler.plugin('emit', function (compilation, callback) {
    var pngs = [];
    for (var filename in compilation.assets) {
      if (filename.indexOf('png') > -1) {
        pngs.push(filename);
      }
    }
    Promise.all(pngs.map(function (filename) {
      return _this2.tiny(compilation.assets, filename);
    })).then(function () {
      callback();
    });
  });
};

module.exports = TinyPlugin;