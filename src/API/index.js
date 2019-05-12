import Vue from 'vue'
import axios from 'axios'
import askApi from 'askapi-alpha'
import axiosConfig from './axiosConfig'
import {userInformation} from './userInformation'

// 试用askAPI插件 依赖 axios
Vue.use(askApi, axios);

export default askApi.create({
    axiosConfig,
    askConfig: {
        userInformation
    }
})
