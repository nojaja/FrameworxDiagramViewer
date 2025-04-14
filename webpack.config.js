const path = require('path');
const src = path.resolve(__dirname, 'src');
const dist = path.resolve(__dirname, 'docs');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const zlib = require('zlib');
const Initdb = require('db-initializer-sqlite3');
const DownloadFontPlugin = require('./plugins/download-font-plugin');
const initdb = new Initdb();

module.exports = {
  devtool: 'source-map',
  devServer: {
    static: {
      directory: dist
    },
    compress: true
  },
  entry: './src/js/index.js',
  output: {
    filename: 'main.bundle.js',
    path: dist
  },
  resolve: {
    fallback: {
      "fs": false,
      "zlib": require.resolve("browserify-zlib"),
      "punycode": require.resolve("punycode"),
      "assert": require.resolve("assert"),
      "buffer": require.resolve("buffer"),
      "stream": require.resolve("stream-browserify"),
      "util": require.resolve("util")
    }
  },
  module: {
    rules: [{
      test: /\.css$/i,
      use: ['style-loader', 'css-loader']
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
      Buffer: ['buffer', 'Buffer'],
      $: 'jquery',
      jQuery: 'jquery'
    }),
    new webpack.DefinePlugin({
      'process.env': '{}'
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
    })
  ]
};