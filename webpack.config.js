const path = require('path');
const src = __dirname + "/src";
const dist = __dirname + "/docs";
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const zlib = require('zlib');
const Initdb = require('db-initializer-sqlite3');
const DownloadFontPlugin = require('./plugins/download-font-plugin');
const initdb = new Initdb();

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'development' : 'production',
  devtool: 'source-map',
  devServer: {
    static: {
      directory: path.join(__dirname, 'docs'),
    },
    compress: true
  },
  entry: './src/js/index.js',
  output: {
    globalObject: 'self',
    filename: 'main.bundle.js',
    path: path.resolve(__dirname, 'docs'),
  },
  resolve: {
    alias: {
      '@': path.resolve(src, '/js/')
    },
    fallback: {
      "fs": false
    }
  },
  module: {
    rules: [{
      test: /\.css$/i,
      use: ['style-loader', 'css-loader']
      //}, {
      //  test: /\.(woff|woff2|eot|ttf)$/,
      //  use: ['file-loader']
    }, {
      test: /\.woff2$/,
      type: 'asset/resource',
      generator: {
        filename: 'fonts/[name][ext]'
      }

    }, {
      test: /\.svg$/i,
      type: 'asset/source'
    }]
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery'
    }),
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ['main'],
      template: 'src/html/index.html',
      filename: 'index.html'
    }),
    new DownloadFontPlugin({
      // フォントの設定（オプション）
      fill: 0,
      weight: 300,
      grade: 0,
      opticalSize: 20,
      // 使用するアイコンのリスト
      icons: [
        'account_tree',
        'mediation',
        'domain',
        'precision_manufacturing',
        'database',
        'extension',
        'power',
        'host',
        'live_help'
      ]
    }),
    new CopyPlugin({
      patterns: [
        {
          from: 'node_modules/sql.js/dist/sql-wasm.wasm',
          to: dist + "/[name].[ext].gz",
          transform(content, absoluteFrom) {
            const gz = zlib.gzipSync("data:application/octet-stream;base64," + content.toString('base64'));// 圧縮
            return gz;
          }
        },
        {
          from: 'src/assets/*.json',
          to: '[name][ext]'
        },
        {
          from: 'src/css/*.css',
          to: '[path][name][ext]'
        },
        {
          from: 'src/assets/*',
          to: 'assets/[name][ext]',
          globOptions: {
            dot: true,
            gitignore: true,
            ignore: ['**/*.db', '**/*.json']
          }
        },
        {
          from: 'src/assets/datas/*.json',
          to: 'assets/[name].db.gz',
          async transform(content, absoluteFrom) {
            const savedata = await initdb.init(require(absoluteFrom));
            return zlib.gzipSync(savedata);
          }
        }
      ]
    }),
  ]
}