/**
 * webpack.config.js
 * @authors Joe Jiang (hijiangtao@gmail.com)
 * @date    2017-04-07 19:24:44
 * @version $Id$
 */

var webpack = require('webpack');
var path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

var devConfig = {
    entry: {
        force: './src/index.js',
        tabControl:'./src/component/tabControl.js', //web component
    },
    output: {
        filename: '[name].bundle.js',
        path: path.join(__dirname, 'dist'),
        publicPath: ''
    },
    devtool: 'source-map',
    mode: 'development',
    module: {
        rules: [
          {
            test: /\.js$/,
              exclude: /(node_modules|bower_components)/,
            loader: 'babel-loader',
        },{
            test: /\.css$/,
            use: [
              'style-loader',
              'css-loader'
            ]
        },{
            test: /\.(png|svg|jpg|gif)$/,
            use: [
                {
                    loader:  'file-loader',
                    options: {
                        name: '[name].[ext]',
                        publicPath: './images',
                        outputPath: './images'
                    }
                }

            ]
        }
        ],
    },
    devServer: {
      contentBase: './dist',
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
          hash: false,
          template: './index.html'
        }),
      new webpack.NamedChunksPlugin(),
      new webpack.HotModuleReplacementPlugin()
    ]
};

module.exports = devConfig;
