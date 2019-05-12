// 所有 '用户信息页' 的接口在这里管理
export const userInformation = {
    apiPath: '/user/:id/info',
    method: 'GET',
    mappingData: {
        userId: 'id'
    },
    request(req) {
        // console.log(req)
    },
    response(res) {
        // console.log(res)
    }
};
