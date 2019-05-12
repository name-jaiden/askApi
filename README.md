# askApi

> 一个 Vue.js 请求管理插件. -> [askApi 文档](https://github.com/name-jaiden/askApi/blob/master/README.md)

## 简介
`askApi` Vue.js 请求管理插件,配合axios做了一个请求状态管理,拥有缓存与状态交互,配合Vue.js 得MVVM的状态，做到极简请求。

## 项目使用示例

我精心准备了一个简单的 [一分钟上手例子](https://github.com/name-jaiden/askApi/tree/example) 方便您体验到 `askApi` 带来的乐趣, 在example分支哦。

## 主要特性

- 彻底脱离后端文档开发：提高开发效率。
- 完整的 `Vue.js` 开发体验，无需理解复杂的状态管理。
- localStorage、sessionStorage、cookie 一键数据管理方案。
- 请求数据自动管理，告别繁杂的获取数据工作方式。
- 响应数据自动映射，告别不看文档不知道怎么取值的被动工作方式。
- 对各种请求风格支持良好，方便维护。
- 不依赖任何服务，可以mock数据开发。

其它特性正在等着你去探索。欢迎您提交[Issues](https://github.com/name-jaiden/askApi/issues)
 

## 如何使用
#### 第一步: 创建 api.js
``` js
import Vue from 'vue'
import axios from 'axios'
import askApi from 'askapi-alpha' // or import askApi from 'askapi'

Vue.use(askApi, axios);

export default askApi.create({
    axiosConfig,
    askConfig: {
        home:{
            apipath: 'home/user/input/content',
            method: 'POST'
        }
    }
})
```
#### 第二步: 在 main.js 里引入 api.js，并挂在到vue实例上
``` js
import Vue from 'vue'
import App from './App.vue'
import router from './views'
import askApi from './api'

Vue.config.productionTip = false;

new Vue({
    askApi,
    router,
    render: h => h(App)
}).$mount('#app');
```
#### 在任何一个.vue的文件里
``` js
<template>
    <div>
        <input v-model='$ask.state.home.req.content'>
        <button @clikc='clickConfirm'>点击发起请求</button>
    </div>
</template>

<script>
export default {
    methods: {
        async clickConfirm () {
            await this.$ask.fetch('home')
            // 接口给回的数据
            console.log('接口给回的数据:', this.$ask.state.home.res )
        }
    }
}
</script>
```


## 配置详情
```
axiosConfig
    createDefaultConfig
    interceptors
        request
        errorRequest
        response
        errorResponse
askConfig
    'any'
        apiPath
        method
        mappingData
            %fetchMock
        request
        response
```
* axiosConfig 的配置来自 axios,你可以查看 [axios 文档](https://github.com/axios/axios/blob/master/README.md)
* createDefaultConfig `可选参数` 初始化 axios 的配置
* interceptors `可选参数` axios 的拦截器配置
* request  `可选参数` axios 的全局请求拦截成功回调
* errorRequest  `可选参数` axios 的全局请求拦截错误回调
* response  `可选参数` axios 的全局响应拦截成功回调
* errorResponse  `可选参数` axios 的全局响应拦截错误回调
* askConfig 初始化 askApi state的配置
* any 代表任意深度的对象,任意对象包含 apiPath 和 method 就认为是一个state
* apiPath `必选参数`  api接口路径;支持params写法: '/user/:id/info',当请求参数有id时,:id 会被替换成值
* method `必选参数` 请求方法
* mappingData `可选参数` 用于映射接口数据,mappingData必须是一个key，value都是String类型对象,value会映射成接口具体的值,层级优先。
* %fetchMock `可选参数` 设置为 ture 开启mock模式，此时mappingData的value可以是任意值
* request `可选参数` 单次请求拦截,当 return 值为 null ,则不会发起请求
* response `可选参数` 单次响应拦截，当 return 值为 null,则不会更新state.
