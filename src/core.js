let Vue, axios;
/*
* cache 对数据缓存操作
* local session cookie 若取不到值则返回 undefined
* 数据 取 存 都会调用JSON方法进行转换 如不成功则为 ''
* */
const cache = {
    local(mode, key, value) {
        if (mode === 'get') {
            const value = window.localStorage.getItem(key);
            return jsonParse(value)
        } else if (mode === 'set') {
            if (value === null) {
                window.localStorage.removeItem(key)
            } else {
                window.localStorage.setItem(key, JSON.stringify(value))
            }
        }
    },
    session(mode, key, value) {
        if (mode === 'get') {
            const value = window.sessionStorage.getItem(key);
            return jsonParse(value)
        } else if (mode === 'set') {
            if (value === null) {
                window.sessionStorage.removeItem(key)
            } else {
                window.sessionStorage.setItem(key, JSON.stringify(value))
            }
        }
    },
    cookie(mode, key, value) {
        if (mode === 'get') {
            if (!key) {
                return ''
            }
            let cookieValue = '';
            const cookieName = `${key}=`;
            const cookieStart = document.cookie.indexOf(cookieName);
            if (cookieStart > -1) {
                let cookieEnd = document.cookie.indexOf(';', cookieStart);
                if (cookieEnd === -1) {
                    cookieEnd = document.cookie.length
                }
                cookieValue = document.cookie.substring(cookieStart + cookieName.length, cookieEnd)
            }
            return jsonParse(cookieValue)
        } else if (mode === 'set') {
            let cookieText = '';
            const flag = value === undefined && value === null;
            cookieText += `${key}=${JSON.stringify(flag ? '' : value)}`;
            document.cookie = cookieText
        }
    }
};

/*
* 对 JSON.parse 处理确保不会异常中断
* null undefined '' 都解析为 undefined
* @param {value:any}
* @return {jsonObject or undefined}
* */
function jsonParse(value) {
    try {
        return value === null || value === undefined || value === ''
            ? undefined
            : JSON.parse(value)
    } catch (e) {
    }
}

/*
* 判断是不是一个对象
* @param {data:any}
* @return {true or false}
* */
function isObject(data) {
    return data !== null && typeof data === 'object'
}

/*
* 根据路径返回对象的value
* @param {targetPath:string}
* @param {data:object}
* @return {value：any} 返回值可以是找到的任何值 若找不到则返回 undefined
* */
function searchData(targetPath, data) {
    try {
        return targetPath.split('.').reduce((total, key) => total[key], data)
    } catch (e) {

    }
}

/*
* 对一个字符串数组每一个成员拼接一个 '.' + <string>
* @param {list:array} 一个全字符串数组 若不是字符串,也会直接拼接
* @param {redundancy:sting} 若不是字符串,则返回原list
* @return {list:array} 返回原数组或操作拼接后的数组
* */
function addRedundancy(lsit, redundancy) {
    if (typeof redundancy === 'string') {
        redundancy = redundancy.charAt(0) === '.'
            ? redundancy
            : `.${redundancy}`;
        return lsit.map(item => item + redundancy)
    }
    return lsit
}

/*
* 广度遍历查找对象下key,深度越深权重越低
* @param {target:sting} 查找对象下key
* @param {data:object} 用于查找的 对象，但不会直接引用
* @param {redundancy:sting} 对查找后结果,是否要添加完整路径,若是个string则会向每一个结果添加,反之不会
* @return {list:array} 返回路径数组,深度越深位置越后:查找到的所有符合的key所在data里的路径;若data不是对象,不会查找,直接返回[data];
*                      若有redundancy参数则返回拼接了redundancy的路径数组
* */
function breadthTraversal(target, data, redundancy) {
    if (!isObject(data)) {
        return []
    }
    const queue = [JSON.parse(JSON.stringify(data))];
    const targetPathList = [];
    while (queue.length) {
        const item = queue.shift();
        Object.entries(item).map(([key, value]) => {
            const targetPath = item._targetPath_ ? `${item._targetPath_}.${key}` : key;
            if (key === target) {
                targetPathList.push(targetPath)
            } else if (isObject(value)) {
                value._targetPath_ = targetPath;
                queue.push(value)
            }
        })
    }
    return redundancy ? addRedundancy(targetPathList, redundancy) : targetPathList
}

/*
* 给定key路径查找object对应的value,层级优先
* @param {targetKey:sting} object下的key路径
* @param {data:Object} object下的key路径
* @return {data:any} 查找object对应的value,层级优先;没有找到返回 undefined
* */
function onceKeySeek(targetKey, data) {
    const target = targetKey.split('.');
    const resultPathList = breadthTraversal(target.shift(), data, target.join('.'));
    return resultPathList
        .map(path => searchData(path, data))
        .filter(f => f !== undefined)
        .shift()
}

/*
* 映射数据
* @param {targetKey:sting} object下的key路径
* @param {data:Object} data的每一value都必须是string, value对应着要映射的数据
* @return {data:any} 查找object对应的value,层级优先;没有找到返回 undefined
* */
function mappingModel(target, data) {
    return Object.entries(target).map(([key, value]) => {
        if (typeof value === 'string') {
            return {[key]: onceKeySeek(value, data)}
        } else {
            throw new Error(`the mapping requires a string, and the passing ${key} is a ${typeof value}`)
        }
    }).reduce((total, current) => Object.assign(total, current), {})
}

/*
* 对参数解析
* */
function overloadedFetch(payload) {
    if (isObject(payload)) {
        return payload
    } else if (typeof payload === 'string') {
        return {apiKey: payload}
    }
    return {}
}

/*
* 调用方法
* */
function useInterceptors(use, data) {
    if (typeof use !== 'function') {
        return data
    }
    const result = use(data);
    return result === undefined ? data : result
}

/*
* 循环设置状态
* */
function loopSetupState(Key, value, arr, root) {
    return arr.reduce((parent, k) => {
        Key === k ? Vue.set(parent, k, value) : Vue.set(parent, k, {});
        return parent[k]
    }, root)
}

/*
* 构造axios的请求参数
* */
function constructRequestParameters({apiPath: url, method, data}) {
    const flag = method.toUpperCase() === 'GET';

    data = isObject(data) ? JSON.parse(JSON.stringify(data)) : {};

    if (url.includes(':')) {
        Object.entries(data).map(([key, value]) => {
            url = url.replace(new RegExp(`\/:(${key})`, 'g'), (m, k) => delete data[k] && `/${value}`)
        })
    }
    return Object.assign({url, method}, flag ? {params: data} : {data})
}

/*
* 初始化 axios
* */
function createAxios({createDefaultConfig = {}, interceptors = {}}) {
    const _axios = axios.create(createDefaultConfig);
    if (Object.keys(interceptors).length !== 0) {
        const defFn = f => f;
        const defErr = e => Promise.reject(e);
        const {request = defFn, response = defFn, errorRequest = defErr, errorResponse = defErr} = interceptors;
        _axios.interceptors.request.use(request, errorRequest);
        _axios.interceptors.response.use(response, errorResponse)
    }
    return _axios
}

/*
* 出初始化状态数据
* */
function initState(state) {
    let result = (state.apiPath && state.method) ? {res: {}, req: {}} : null;
    Object.entries(state).forEach(([key, value]) => {
        if (isObject(value)) {
            const item = initState(value);
            if (item) {
                result = result || {};
                result[key] = item
            }
        }
    });
    return result
}

class AskApi {
    constructor({axiosConfig = {}, askConfig = {}}) {
        const state = initState(askConfig);
        this._config = askConfig;
        this._axios = createAxios(axiosConfig);
        this._watchVM = new Vue({data: {state}})
    }

    get state() {
        return this._watchVM.state
    }

    setState(pathKey, value, mode) {
        const pathKeyArr = pathKey.split('.');
        const key = pathKeyArr.pop();
        const parentKey = pathKeyArr.join('.') || key;
        let parent;

        if (typeof cache[mode] === 'function') {
            const strValue = JSON.stringify(value);
            if (strValue === cache[`_data${mode}`]) {
                return
            }
            cache[`_data${mode}`] = strValue;
            cache[mode]('set', pathKey, value)
        }

        if (/^state.*/.test(pathKey)) {
            parent = searchData(parentKey, this);
            if (!parent) {
                return loopSetupState(key, value, pathKeyArr.slice(1).concat(key), this.state)
            }
        } else {
            parent = onceKeySeek(parentKey, this.state);
            if (!parent && key === parentKey) {
                parent = this.state
            }
        }

        Vue.set(parent, key, value)
    }

    getState(pathKey, mode) {
        if (typeof cache[mode] === 'function') {
            const value = cache[mode]('get', pathKey);
            if (value !== undefined) {
                this.setState(pathKey, value, mode)
            }
        }

        return /^state.*/.test(pathKey)
            ? searchData(pathKey, this)
            : onceKeySeek(pathKey, this.state)
    }

    fetch(payload, requestData) {
        const {apiKey, mode} = overloadedFetch(payload);
        const {apiPath, method, mappingData, request, response} = onceKeySeek(apiKey, this._config);
        requestData = requestData || onceKeySeek(`${apiKey}.req`, this.state);

        requestData = constructRequestParameters({apiPath, method, data: requestData});

        requestData = useInterceptors(request, requestData);

        if (requestData === null) {
            return
        }

        return new Promise((resolve, reject) => {
            this._axios(requestData)
                .then(res => {
                    if (isObject(mappingData)) {
                        res = mappingData['%fetchMock'] === true
                            ? mappingData
                            : mappingModel(mappingData, res)
                    }

                    const result = useInterceptors(response, res);
                    if (result === null) {
                        return resolve(res)
                    }

                    this.setState(`${apiKey}.res`, result, mode);
                    resolve(result)
                })
                .catch(err => {
                    if (mappingData['%fetchMock'] === true) {
                        const result = useInterceptors(response, mappingData);
                        this.setState(`${apiKey}.res`, result, mode);
                        return resolve(result)
                    } else {
                        return reject(useInterceptors(response, err))
                    }
                })
        })
    }
}

/*
* 初始化Vue环境
* */
const install = (_vue, _axios) => {
    Vue = _vue;
    axios = _axios;
    Vue.mixin({
        beforeCreate() {
            if (this.$options && this.$options.askApi) {
                this.$ask = this.$options.askApi
            } else {
                this.$ask = this.$parent && this.$parent.$ask
            }
        }
    })
};
/*
* 返回 AskApi 实例
* */
const create = (config) => new AskApi(config);
/*
* 对外暴露
* */
export {
    install,
    create
}
