/**
 * askApi v0.0.16
 * (c) 2019 Jaiden
 * @license MIT
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.askApi = factory());
}(this, function () { 'use strict';

  var Vue, axios;
  /*
  * cache 对数据缓存操作
  * local session cookie 若取不到值则返回 undefined
  * 数据 取 存 都会调用JSON方法进行转换 如不成功则为 ''
  * */
  var cache = {
    local: function local (mode, key, value) {
      if (mode === 'get') {
        var value$1 = window.localStorage.getItem(key);
        return jsonParse(value$1)
      } else if (mode === 'set') {
        if (value === null) {
          window.localStorage.removeItem(key);
        } else {
          window.localStorage.setItem(key, JSON.stringify(value));
        }
      }
    },
    session: function session (mode, key, value) {
      if (mode === 'get') {
        var value$1 = window.sessionStorage.getItem(key);
        return jsonParse(value$1)
      } else if (mode === 'set') {
        if (value === null) {
          window.sessionStorage.removeItem(key);
        } else {
          window.sessionStorage.setItem(key, JSON.stringify(value));
        }
      }
    },
    cookie: function cookie (mode, key, value) {
      if (mode === 'get') {
        if (!key) {
          return ''
        }
        var cookieValue = '';
        var cookieName = key + "=";
        var cookieStart = document.cookie.indexOf(cookieName);
        if (cookieStart > -1) {
          var cookieEnd = document.cookie.indexOf(';', cookieStart);
          if (cookieEnd === -1) {
            cookieEnd = document.cookie.length;
          }
          cookieValue = document.cookie.substring(cookieStart + cookieName.length, cookieEnd);
        }
        return jsonParse(cookieValue)
      } else if (mode === 'set') {
        var cookieText = '';
        var flag = value === undefined && value === null;
        cookieText += key + "=" + (JSON.stringify(flag ? '' : value));
        document.cookie = cookieText;
      }
    }
  };

  /*
  * 对 JSON.parse 处理确保不会异常中断
  * null undefined '' 都解析为 undefined
  * @param {value:any}
  * @return {jsonObject or undefined}
  * */
  function jsonParse (value) {
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
  function isObject (data) {
    return data !== null && typeof data === 'object'
  }

  /*
  * 根据路径返回对象的value
  * @param {targetPath:string}
  * @param {data:object}
  * @return {value：any} 返回值可以是找到的任何值 若找不到则返回 undefined
  * */
  function searchData (targetPath, data) {
    try {
      return targetPath.split('.').reduce(function (total, key) { return total[key]; }, data)
    } catch (e) {

    }
  }

  /*
  * 对一个字符串数组每一个成员拼接一个 '.' + <string>
  * @param {list:array} 一个全字符串数组 若不是字符串,也会直接拼接
  * @param {redundancy:sting} 若不是字符串,则返回原list
  * @return {list:array} 返回原数组或操作拼接后的数组
  * */
  function addRedundancy (lsit, redundancy) {
    if (typeof redundancy === 'string') {
      redundancy = redundancy.charAt(0) === '.'
        ? redundancy
        : ("." + redundancy);
      return lsit.map(function (item) { return item + redundancy; })
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
  function breadthTraversal (target, data, redundancy) {
    if (!isObject(data)) {
      return []
    }
    var queue = [JSON.parse(JSON.stringify(data))];
    var targetPathList = [];
    var loop = function () {
      var item = queue.shift();
      Object.entries(item).map(function (ref) {
        var key = ref[0];
        var value = ref[1];

        var targetPath = item._targetPath_ ? ((item._targetPath_) + "." + key) : key;
        if (key === target) {
          targetPathList.push(targetPath);
        } else if (isObject(value)) {
          value._targetPath_ = targetPath;
          queue.push(value);
        }
      });
    };

    while (queue.length) loop();
    return redundancy ? addRedundancy(targetPathList, redundancy) : targetPathList
  }

  /*
  * 给定key路径查找object对应的value,层级优先
  * @param {targetKey:sting} object下的key路径
  * @param {data:Object} object下的key路径
  * @return {data:any} 查找object对应的value,层级优先;没有找到返回 undefined
  * */
  function onceKeySeek (targetKey, data) {
    var target = targetKey.split('.');
    var resultPathList = breadthTraversal(target.shift(), data, target.join('.'));
    return resultPathList
      .map(function (path) { return searchData(path, data); })
      .filter(function (f) { return f !== undefined; })
      .shift()
  }

  /*
  * 映射数据
  * @param {targetKey:sting} object下的key路径
  * @param {data:Object} data的每一value都必须是string, value对应着要映射的数据
  * @return {data:any} 查找object对应的value,层级优先;没有找到返回 undefined
  * */
  function mappingModel (target, data) {
    return Object.entries(target).map(function (ref) {
      var obj;

      var key = ref[0];
      var value = ref[1];
      if (typeof value === 'string') {
        return ( obj = {}, obj[key] = onceKeySeek(value, data), obj )
      } else {
        throw new Error(("the mapping requires a string, and the passing " + key + " is a " + (typeof value)))
      }
    }).reduce(function (total, current) { return Object.assign(total, current); }, {})
  }

  /*
  * 对参数解析
  * */
  function overloadedFetch (payload) {
    if (isObject(payload)) {
      return payload
    } else if (typeof payload === 'string') {
      return { apiKey: payload }
    }
    return {}
  }

  /*
  * 调用方法
  * */
  function useInterceptors (use, data) {
    if (typeof use !== 'function') {
      return data
    }
    var result = use(data);
    return result === undefined ? data : result
  }

  /*
  * 循环设置状态
  * */
  function loopSetupState (Key, value, arr, root) {
    return arr.reduce(function (parent, k) {
      Key === k ? Vue.set(parent, k, value) : Vue.set(parent, k, {});
      return parent[k]
    }, root)
  }

  /*
  * 构造axios的请求参数
  * */
  function constructRequestParameters (ref) {
    var url = ref.apiPath;
    var method = ref.method;
    var data = ref.data;

    var flag = method.toUpperCase() === 'GET';

    if (url.includes(':') && flag) {
      Object.entries(data).map(function (ref) {
        var key = ref[0];
        var value = ref[1];

        url = url.replace(new RegExp(("/:(" + key + ")"), 'g'), function (m, k) { return delete data[k] && ("/" + value); });
      });
    }
    return Object.assign({ url: url, method: method }, flag ? { params: data } : { data: data })
  }

  /*
  * 初始化 axios
  * */
  function createAxios (ref) {
    var createDefaultConfig = ref.createDefaultConfig; if ( createDefaultConfig === void 0 ) createDefaultConfig = {};
    var interceptors = ref.interceptors; if ( interceptors === void 0 ) interceptors = {};

    var _axios = axios.create(createDefaultConfig);
    if (Object.keys(interceptors).length !== 0) {
      var defFn = function (f) { return f; };
      var defErr = function (e) { return Promise.reject(e); };
      var request = interceptors.request; if ( request === void 0 ) request = defFn;
      var response = interceptors.response; if ( response === void 0 ) response = defFn;
      var errorRequest = interceptors.errorRequest; if ( errorRequest === void 0 ) errorRequest = defErr;
      var errorResponse = interceptors.errorResponse; if ( errorResponse === void 0 ) errorResponse = defErr;
      _axios.interceptors.request.use(request, errorRequest);
      _axios.interceptors.response.use(response, errorResponse);
    }
    return _axios
  }

  /*
  * 出初始化状态数据
  * */
  function initState (state) {
    var result = (state.apiPath && state.method) ? { res: {}, req: {}} : null;
    Object.entries(state).forEach(function (ref) {
      var key = ref[0];
      var value = ref[1];

      if (isObject(value)) {
        var item = initState(value);
        if (item) {
          result = result || {};
          result[key] = item;
        }
      }
    });
    return result
  }

  var AskApi = function AskApi (ref) {
    var axiosConfig = ref.axiosConfig; if ( axiosConfig === void 0 ) axiosConfig = {};
    var askConfig = ref.askConfig; if ( askConfig === void 0 ) askConfig = {};

    var state = initState(askConfig);
    this._config = askConfig;
    this._axios = createAxios(axiosConfig);
    this._watchVM = new Vue({ data: { state: state }});
  };

  var prototypeAccessors = { state: { configurable: true } };

  prototypeAccessors.state.get = function () {
    return this._watchVM.state
  };

  AskApi.prototype.setState = function setState (pathKey, value, mode) {
    var pathKeyArr = pathKey.split('.');
    var key = pathKeyArr.pop();
    var parentKey = pathKeyArr.join('.') || key;
    var parent;

    if (typeof cache[mode] === 'function') {
      var strValue = JSON.stringify(value);
      if (strValue === cache[("_data" + mode)]) {
        return
      }
      cache[("_data" + mode)] = strValue;
      cache[mode]('set', pathKey, value);
    }

    if (/^state.*/.test(pathKey)) {
      parent = searchData(parentKey, this);
      if (!parent) {
        return loopSetupState(key, value, pathKeyArr.slice(1).concat(key), this.state)
      }
    } else {
      parent = onceKeySeek(parentKey, this.state);
      if (!parent && key === parentKey) {
        parent = this.state;
      }
    }

    Vue.set(parent, key, value);
  };

  AskApi.prototype.getState = function getState (pathKey, mode) {
    if (typeof cache[mode] === 'function') {
      var value = cache[mode]('get', pathKey);
      if (value !== undefined) {
        this.setState(pathKey, value, mode);
      }
    }

    return /^state.*/.test(pathKey)
      ? searchData(pathKey, this)
      : onceKeySeek(pathKey, this.state)
  };

  AskApi.prototype.fetch = function fetch (payload, requestData) {
      var this$1 = this;

    var ref = overloadedFetch(payload);
      var apiKey = ref.apiKey;
      var mode = ref.mode;
    var ref$1 = onceKeySeek(apiKey, this._config);
      var apiPath = ref$1.apiPath;
      var method = ref$1.method;
      var mappingData = ref$1.mappingData;
      var request = ref$1.request;
      var response = ref$1.response;
    requestData = requestData || onceKeySeek((apiKey + ".req"), this.state);

    requestData = constructRequestParameters({ apiPath: apiPath, method: method, data: requestData });

    requestData = useInterceptors(request, requestData);

    if (requestData === null) {
      return
    }

    return new Promise(function (resolve, reject) {
      this$1._axios(requestData)
        .then(function (res) {
          if (isObject(mappingData)) {
            res = mappingData['%fetchMock'] === true
              ? mappingData
              : mappingModel(mappingData, res);
          }

          var result = useInterceptors(response, res);
          if (result === null) {
            return resolve(res)
          }

          this$1.setState((apiKey + ".res"), result, mode);
          resolve(result);
        })
        .catch(function (err) {
          if (mappingData['%fetchMock'] === true) {
            var result = useInterceptors(response, mappingData);
            this$1.setState((apiKey + ".res"), result, mode);
            return resolve(result)
          } else {
            return reject(useInterceptors(response, err))
          }
        });
    })
  };

  Object.defineProperties( AskApi.prototype, prototypeAccessors );

  /*
  * 初始化Vue环境
  * */
  var install = function (_vue, _axios) {
    Vue = _vue;
    axios = _axios;
    Vue.mixin({
      beforeCreate: function beforeCreate () {
        if (this.$options && this.$options.askApi) {
          this.$ask = this.$options.askApi;
        } else {
          this.$ask = this.$parent && this.$parent.$ask;
        }
      }
    });
  };
  /*
  * 返回 AskApi 实例
  * */
  var create = function (config) { return new AskApi(config); };

  var index = {
    create: create,
    install: install,
    version: '0.0.16'
  };

  return index;

}));
