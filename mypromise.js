// 1.首先我们要知道 promise 有个初始的状态值 是 pending 默认值是undfined 谈后通过 resolve 函数 和 reject 函数 去改变状态 
// 2.改变状态的时候 我们需要把我们的值也传入进去 
// 3.当我们 new Promise的时候 会传入一个函数 如果不穿就会类型报错 
function MyPromise(executor) {
    //1.这个立即执行函数我们必须要传入 如果不穿就报错
    if(typeof executor !== 'function') return new TypeError('MyPromise resolver undefined is not a function')
    //2.定义我们的初始状态 和我们的默认值
    this.MyPromiseState = 'pending'
    this.MyPromiseValue = undefined
    //14.传入我们then的两个函数 这里会重写然后可以把我们的状态值传入进去
    this.resolveFunction = function rejectFunction ()  {}
    this.rejectFunction = function rejectFunction () {}
    //3. 然后这个立即执行函数会执行 参数为两个函数 一个是成功的函数 resolve 一个是失败的函数 reject
    var resolve = function resolve (result){
    //4. 当我们 new Promise((resolve,reject) => { resolve(ok)}) 成功的时候会执行这个函数 改变状态为成功并且赋值
        change('fulfilled',result)
    }
    var reject = function reject (reason){
    //5. 当我们 new Promise((resolve,reject) => { reject(no)}) 失败的时候会执行这个函数 改变状态为失败并且赋值
        change('rejected',reason)
    }
    //8.为了保证this正确
    var _this = this
    //6.所以我们还要写一个改变状态的函数 这里的参数 我就是我们要的状态 和要 改变的值
    var change = function change(state,value) {
    //7.这里我们需要注意一下 当我们调用change函数的时候是在 resolve里调用的 调用这个函数前面什么也没有 
    //所以this只想是window 所以这里我们需要改变一下this的指向 下面那样写是不可以的
    // this.MyPromiseState = state
    // this.MyPromiseValue = value
    //8.我们知道promise 的状态一旦发生改变 就不可能再次发生改变 所以这里需要一个判断
    if(_this.MyPromiseState !== 'pending') return
    _this.MyPromiseState = state
    _this.MyPromiseValue = value
    //12.通知的方法是异步的 所以这里我们用宏任务模拟一下
    setTimeout(function(){
    //13.这里 就是当我们使用then去拿结果的时候 需要异步的方式去拿 而then里的两个函数 就是我们的this.resolveFunction this.rejectFunction
    state === 'fulfilled'? _this.resolveFunction(_this.MyPromiseValue):_this.rejectFunction(_this.MyPromiseValue)
    },0)
    }
    executor(resolve,reject)
}
//9. 以上我们就写完了基本 但是我们知道  状态改完的是同步的 但是我们需要通过.then的方法 通知我们的状态改变 和拿到值 这个过程是异步的
//10. 所以我们需要在我们的原型上写一个then的方法 来拿到我们的值 因为原型重写了 所以我们要写我们构造器
MyPromise.prototype = {
    constructor:MyPromise,
    //11. 然后上面有一个then方法 这个方法是异步的 接收两个函数 这个就是我们方面写的
    then:function then(resolveFunction,rejectFunction){
        //16.我们这里还有一个顺延效果  当你已经改变了promise的状态 但是你then里面不传resolve的时候 或者 reject的时候 就会返回一个没有值的promise实例 
        //在下个then中可以拿到值
        if(typeof resolveFunction !== 'function'){
            resolveFunction = function resolveFunction(result){
                return MyPromise.resolve(result)
            }
        }
        if(typeof rejectFunction !== 'function'){
            rejectFunction = function rejectFunction(result){
                return MyPromise.reject(result)
            }
        }
        this.resolveFunction = resolveFunction
        this.rejectFunction = rejectFunction
    }
}
//15.我们promise被当作对象的时候 还有两个方法 一个是 promise.resolve 和 promise.reject 这两个方法都会返回一个成功的promise实例
MyPromise.resolve = function resolve (result){
    return new MyPromise(function (resolve){
        resolve(result)
    })
}
MyPromise.reject = function reject (reason) {
    return new MyPromise(function(_,reject){
        reject(reason)
    })
}


var p1 = new MyPromise((resolve,reject) => {
    resolve('ok')
})
//目前作用域链机制还没洗完 所以还不能连续调用.then
// p1.then(null).ten(() => {

// })