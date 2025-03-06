const path = require('path')
const src = __dirname + "/src"
const dist = __dirname + "/docs"
const webpack = require('webpack')
const CopyPlugin = require('copy-webpack-plugin')
const FontminPlugin = require('fontmin-webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const zlib = require('zlib')
const Initdb  = require('db-initializer-sqlite3')
const initdb = new Initdb()

module.exports = {
  //devtool: 'inline-source-map',
  devtool: 'source-map',
  devServer: {
    static: {
      directory: path.join(__dirname, 'docs'),
    },
    compress: true
  },
  entry: './src/js/index.js',
  output: {
    filename: 'main.bundle.js',
    path: path.resolve(__dirname, 'docs'),
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
    // }, {
    //   test: /\.(woff|woff2|eot|ttf|otf)$/i,
    //   type: 'asset/resource',
    //   use: ['file-loader'],
    //   generator: {
    //     filename: 'fonts/[hash][ext][query]'
    //   }
    // }, {
    //   test: /\.(woff|woff2|eot|ttf|otf)$/i,
    //   use: ['file-loader'],
    //   generator: {
    //     filename: 'fonts/[hash][ext][query]'
    //   }
    // }, {
    //   test: /\.(woff|woff2|eot|ttf|otf)$/i,
    //   use: ['file-loader']
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
    // new FontminPlugin({
    //   autodetect: true,
    //   glyphs: [
    //     'account_tree',
    //     'mediation',
    //     'domain',
    //     'precision_manufacturing',
    //     'database',
    //     'extension',
    //     'power',
    //     'host',
    //     'live_help'
    //   ],
    //   allowedFilesRegex: /material-symbols-outlined.*\.woff2$/
    // }),
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ['main'],
      template: 'src/html/index.html',
      filename: 'index.html'
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
      ],
    }),
  ],
};
