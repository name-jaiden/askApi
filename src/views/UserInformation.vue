<template>
    <div>
        <h1 class="textCenter">这是用户信息页面</h1>
        <div class="textCenter">请确认以下信息是否正确？</div>
        <form class="center">
            <p class="padding-left-100">
                <span>model 交互的数据: </span>
                <!--
                    配置的askConfig会被初始化为state加入，res，与 req
                    state的数据和vue的数据是一样的，可以直接使用，
                    发请求时，会直接使用这res,req两个数据,当然这不是必须的
                -->
                <input v-model="$ask.state.userInformation.req.model"/>
            </p>
            <p class="padding-left-100">
                <span>localStorage 数据联动: </span>
                <!--
                    state 的数据也可以和 localStorage 做交互
                    但是直接绑定是做不到,需要使用askApi的get 和 set 方法
                    see code@47
                -->
                <input v-model="local"/>
            </p>
            <p class="padding-left-100">
                <span>sessionStorage 数据联动: </span>
                <!--
                    与 localStorage 用法一直
                -->
                <input v-model="session"/>
            </p>
            <p class="padding-left-100">
                <span>cookie 数据联动: </span>
                <!--
                    与 localStorage 用法一直
                -->
                <input v-model="cookie"/>
            </p>
        </form>
        <div class="center">
            <button @click="clickConfirm"> 确认信息提交请求</button>
        </div>
        <div class="center">
            <br/>state 的数据:<br/>
            {{$ask.state.userInformation}}
        </div>
    </div>
</template>

<script>
export default {
    name: 'userInformation',
    computed: {
        local: {
            /*
            * 这里要使用方法获取，直接使用将不会初始化
            * 当然 'state.userInformation.req.local' 这样的取值
            * 当然 getState 对 state 的取值是优先查找的，这个例子 可以简写 'req.local'
            * 但要记住 getState setState的 取值路径应该相同, 否则会导致 localStorage 取值错误
            * */
            get() {
                return this.$ask.getState('state.userInformation.req.local', 'local')
            },
            set(value) {
                return this.$ask.setState('state.userInformation.req.local', value, 'local')
            }
        },
        session: {
            /*
            * 与 local 用法一致
            * 注意如果你的数据源是同一份，那么应该对应一出缓存，否则数据会无法保证准确性
            * 比如 sessionStorage 缓存一份与 localStorage 一样路径的数据，这样会出现数据源不唯一
            * 错:-> return this.$ask.【get/set】State('state.userInformation.req.local', 'session')
            * */
            get() {
                return this.$ask.getState('state.userInformation.req.session', 'session')
            },
            set(value) {
                return this.$ask.setState('state.userInformation.req.session', value, 'session')
            }
        },
        cookie: {
            /*
            * 与 local 用法一致
            * */
            get() {
                return this.$ask.getState('state.userInformation.req.cookie', 'cookie')
            },
            set(value) {
                return this.$ask.setState('state.userInformation.req.cookie', value, 'cookie')
            }
        }
    },
    methods: {
        async clickConfirm() {
            /*
            * 请求
            * req里的参数会直接当请求参数，当然这不是必须的，你也可以给请求传参
            * mappingData 是一个用来映射后端接口的配置
            * 它有一个属性 %fetchMock ，开启后可以直接拿到 mock 的数据
            * 若你没有开启mock模式，mappingData的key和value都要是string类型
            * */
            this.$ask.state.userInformation.req.id = 123;
            await this.$ask.fetch('userInformation');
            // 接口给的数据 在 serverApi 文件下
            console.log(this.$ask.state.userInformation.res)
        }
    }
}
</script>

<style scoped>
    .center {
        width: 600px;
        margin: 0 auto;
    }

    .textCenter {
        text-align: center;
    }

    .padding-left-100 {
        padding-left: 100px;
    }
</style>
