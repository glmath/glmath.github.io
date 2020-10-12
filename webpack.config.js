var path = require('path') // this is so we have path so we can set the output path
module.exports = {

        entry:{
                main: "./client/src/js/main.jsx",
        },
        output:{
                filename:"bundle.js",
                path: path.join(__dirname, "./client"),
        },
        mode:"development",
        module: {
                rules: [
                        {
                                test: /\.(js|jsx)$/,
                                exclude: /node_modules/,
                                use: {
                                        loader: "babel-loader"
                                }
                        },
                        {
                                test: /\.css$/,
                                loader: 'style-loader!css-loader'
                        },
                        {
                                test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
                                loader: 'url-loader',
                                options: {
                                        limit: 10000
                                }
                        }
                ]
        }
};
