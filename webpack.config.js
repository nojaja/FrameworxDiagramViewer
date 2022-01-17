const path = require('path')
const src = __dirname + "/src"
const dist = __dirname + "/docs"
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyFilePlugin = require('copy-webpack-plugin')
const WriteFilePlugin = require('write-file-webpack-plugin')
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin')
const zlib = require('zlib')
const Initdb  = require('db-initializer-sqlite3')
const initdb = new Initdb()

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'development' : 'production',
  devtool: 'source-map',
  devServer: {
    disableHostCheck: true,
    contentBase: dist,
    public: process.env.URL || ''
  },
  context: src,
  entry: {
    'main': './js/index.js'
  },
  output: {
		globalObject: 'self',
    filename: './[name].bundle.js',
    sourceMapFilename: './map/[id].[chunkhash].js.map',
    chunkFilename: './chunk/[id].[chunkhash].js',
    path: dist,
    publicPath:""
  },
  resolve: {
    alias: {
      '@': path.resolve(src, '/js/')
    }
  },
  module: {
    rules: [{
      test: /\.css$/,
      use: ['style-loader', 'css-loader']
    }, {
      test: /\.(woff|woff2|eot|ttf)$/,
      use: ['file-loader']
    }, {
      test: /\.(svg)$/,
      use: ['raw-loader']
    }
  ]
  },
  node: {
    fs: 'empty'
  },
  plugins: [
    //new HardSourceWebpackPlugin(),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery'
    }),
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ['main'],
      template: './html/index.html',
      filename: './index.html'
    }),
    new CopyFilePlugin(
        [
            {
                from: '../node_modules/sql.js/dist/sql-wasm.wasm',
                to: dist+"/[name].[ext].gz",
                transform(content, absoluteFrom) {
                  const gz = zlib.gzipSync("data:application/octet-stream;base64," + content.toString('base64'));// 圧縮
                  return gz;
                }
            },
            {
              context: 'assets/',
              from: '*.json',
              to: dist
            },
            {
              context: 'assets/',
              from: '*.json',
              to: dist
            },
            {
              context: 'assets/',
              from: '_locales/**/*.*',
              to: dist
            },
            {
              context: 'assets/',
              from: 'icons/*.*',
              to: dist
            },
            {
                from: 'css/*.css',
                to: dist
            },
            {
                from: 'assets/*.*',
                to: dist,
                globOptions: {
                  dot: true,
                  gitignore: true,
                  ignore: ["**/*.db","**/*.json"]
                }
            },
            {
                from: 'assets/datas/*.json',
                to: dist+"/assets/[name].db.gz",
                transform(content, absoluteFrom) {
                  return initdb.init(require(absoluteFrom)).then(function (savedata) {
                          const gz = zlib.gzipSync(savedata);// 圧縮
                          return gz;
                        }
                    );
                }
            }
        ],
        { copyUnmodified: true }
    ),
    new WriteFilePlugin()
  ]
}