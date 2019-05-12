module.exports = {
    devServer: {
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                ws: true,
                changeOrigin: true,//允许跨域
                pathRewrite: {
                    '^/api': ''
                }
            }
        }
    }
};
