const path = require('path');
const HWP = require('html-webpack-plugin');
module.exports = {
  entry: './client/src/index.tsx',
  devtool: 'source-map',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: 'url-loader',
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    alias: {
      '@dataTypes': path.resolve(__dirname, 'lib/types/dataTypes.ts'),
      '@app': path.resolve(__dirname, 'client/src/'),
      '@images': path.resolve(__dirname, 'images'),
    },
  },
  plugins: [new HWP({template: './client/src/index.html'})],
};
