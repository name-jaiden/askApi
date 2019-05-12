const express = require('express');
const app = express();

app.get('/user/:id/info', (req, res) => {
    if (req.params.id !== '123') {
        res.send({code: 1, data: {message: '用户不存在', result: null}})
    }
    res.send({
        code: 0,
        data: {
            message: '',
            result: {
                user: [
                    {
                        uerInfo: {
                            name: '张三',
                            age: 19,
                            id: 'wpd11122233'
                        }
                    }
                ]
            }
        }
    });
});


/**
 * Get Local IP
 */
getLocalIp = function () {
    const interfaces = require('os').networkInterfaces();
    for (let devName in interfaces) {
        let interfaceItem = interfaces[devName];
        for (let i = 0; i < interfaceItem.length; i++) {
            let alias = interfaceItem[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address
            } else {
                return '127.0.0.1'
            }
        }
    }
};

var port = 3000;
app.listen(port, () => {
    var ip = getLocalIp();
    console.log('your server API address at', 'http://' + ip + ':' + port)
});


module.exports = app;
