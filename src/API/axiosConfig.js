// 这里的配置是axios需要的
// 详细配置里可以参见: https://github.com/axios/axios

export default {
    createDefaultConfig: {
        baseURL: '/api',
        headers: {
            'Content-Type': 'application/json' // 一个示例，已经是默认配置，不要配置
        }
    },
    interceptors: {
        request(req) {
            return req
        },
        errorRequest(err) {
            return Promise.reject(err)
        },
        response(res) {
            return res.data
        },
        errorResponse(err) {
            return Promise.reject(err)
        },
    }
}
