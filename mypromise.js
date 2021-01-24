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

    //16. 这里为了能当状态改变成功或者失败之后 我们then 里面什么也不传  然后在在第二个then中调用 能拿到结果 所以我们还是要返回一个promise实例 
    //这样才能接着用then调用 为了保证this 指向正确我们缓存一下
        var _this = this
        return new MyPromise(function(resolve,reject) {
            //17.这里由于我们不知道 究竟调用的是 成功的函数  还是 失败的函数 所以 这我们在把函数包装一层方便监控
            _this.resolveFunction = function(result){
                //18.这里有两种情况 第一种是 你自己有返回值 比如10 20 一个对象之类的 不是一个promise的成功的状态 我们直接返回就可以
                // 第二种 就是 你代码写的问题 直接报错了 所以我们要返回失败的状态
                try{
                    var x = resolveFunction(result)
                    // 判断 你是返回的promise实例 还是特殊的值
                    x instanceof MyPromise? x.then(resolve,reject):resolve(x)
                }catch(e){
                    reject(e)
                }
            }
            _this.rejectFunction = function(reason) {
                try{
                    var x = rejectFunction(reason)
                    // 判断 你是返回的promise实例 还是特殊的值
                    x instanceof MyPromise? x.then(resolve,reject):resolve(x)
                }catch(e){
                    reject(e)
                }
            }
        })
    },
    catch:function(rejectFunction){
        // xxx.catch(() => {}) => xxx.then(null,() => {})
        return this.then(null,rejectFunction)
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
//19. Promise.all([fn1(),fn2(),fn3(),10]) 返回的也是promise实例 每个参数都是一个promise的实例 
//只要有一个promise实例 是失败的 那么返回的整个状态就是失败
//最后返回实例的顺序 也是按照我们上面传递参数的顺序是一样的
MyPromise.all = function(promiseArr) {
    //1. 先缓存下this
    var _this = this
    //2. 最后返回的也是一个promise的实例数组 值是有所有单个实例组成的数组
    return new MyPromise(function(resolve,reject){
        var index = 0 //用来计数
            results = [] //用来存放我们每次promise实例的结果
        //5. 这里我们还需要写一个通知的函数 当我们已经循环完了所有你传进来的数组 并且结果都已经返回了 就我们就该把结果 拿出去了
        var fire = function () {
            if(index >= promiseArr.length){
                resolve(results)
            }
        }
        for(var i = 0; i < promiseArr.length; i++){
            (function(i){
            //3. 这个是每个实例
            var item = promiseArr[i]

            //5. 这里开始判断 如果你不是promise实例 那么我们就直接返还给你 并且结束当前 开始下一轮循环
            if(!(item instanceof MyPromise)){
                results[i] = item
                index++
                //看看 循环结束了么 如果结束了 我们就要返回结果了
                fire()
                return
            }
            //6. 如果不是promise实例 我们就要拿到它的返回结果 放进results
            item.then(function(res){
                results[i] = res
                index++
                fire()
            }).catch(function(reason){
                reject(reason)
            })
            })(i)
            //8.以上那么写 是会有错的 因为 你then 里面是异步的 这个时候循环已经结束了 i 的值 已经变成最后循环那轮结束的了 所以我们需要用闭包包起来 保证i的值是当前的
        }
    })
}


function fn1(){
    return MyPromise.resolve(10)
}
function fn2(){
    return MyPromise.resolve(20)
}
function fn3(){
    return new MyPromise( function (resolve,reject) {
        setTimeout(() => {
            resolve(30)
        },100)
    })
}
const p1 = MyPromise.all([fn1(),fn2(),fn3(),40])
console.log(p1)
p1.then(res => {
    console.log(`${res}`)
}).catch(e => {
    console.log(e)
})