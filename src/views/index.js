import Vue from 'vue'
import Router from 'vue-router'
import UserInformation from './UserInformation'

Vue.use(Router);

export default new Router({
    mode: 'history',
    routes: [
        {
            path: '/',
            name: 'userInformation',
            component: UserInformation
        }
    ]
})
