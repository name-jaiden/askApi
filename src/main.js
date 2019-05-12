import Vue from 'vue'
import App from './App.vue'
import router from './views'
import askApi from './API'

Vue.config.productionTip = false;

new Vue({
    askApi,
    router,
    render: h => h(App)
}).$mount('#app');
