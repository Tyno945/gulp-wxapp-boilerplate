# 小程序 Gulp 开发脚手架

> 一个为微信小程序开发准备的基础骨架
[refer1](https://github.com/ksky521/gulp-wxapp-boilerplate)
[refer2](https://github.com/zce/weapp-boilerplate.git)


* sass 开发 wxss
* webfont 自动 base64 引入
* 支持 px2rpx
* es6/7 开发 js
* 支持开发阶段与生产阶段分离
* 支持小程序云
* 支持小程序云函数、存储 mock
* 支持 watch 功能
* 支持Source Map
<!-- 新增特性2018/10/13 -->
* (新增)自动化生成新页面所需文件并添加到配置中
* (新增)支持Travis CI

## 配置

* config.server.json 是 mock server 的配置

## 目录结构

```
├── README.md
├── client            // 小程序 client 部分，主要编写内容
│   ├── app.js
│   ├── app.json
│   ├── app.scss
│   ├── project.config.json  // 小程序项目配置，比如：云函数文件夹
│   ├── components   // 组件
│   ├── images       // 图片资源
│   ├── lib
│   │   ├── api-mock.js   // api-mock 功能，详见文档「云函数 mock」部分
│   │   ├── api.js       // 实际 api
│   │   ├── bluebird.js
│   │   └── util.js
│   └── pages
│       └── index
├── config.server.json
├── dist
├── gulpfile.js
├── package.json
├── server           // 小程序 server 部分，主要是静态资源和云函数
│   ├── cloud-functions
│   │   ├── test
│   │   └── test2
│   ├── index.js
│   ├── inline    // 云函数公共模块，打包的时候会 inline 进引入的云函数
│   │   └── utils.js
│   └── static
│       └── gulp.png
└── test         // 测试文件夹
    └── functions  // 存储小程序云测试用的参数模板
        └── test.json
```

## 使用
1. git clone 之后，进入文件夹，执行`npm i`安装依赖
2. 使用方法如下：

```bash
# 启动 gulp 编译 client 文件夹
npm run dev
# 启动 server，有nodemon，修改文件会自动重启
npm run server
# 上线打包
npm run build
# watch cloud functions 自动同步到 dist/cloud-functions
```

## 创建新页面

执行如下命令

```bash
# 启动生成器
$ npm run generate
# 完成每一个问题
# 自动生成...
```

由于微信小程序的每一个页面有特定的结构，新建工作比较繁琐。可以通过此任务减少操作。

## 云函数 mock
小程序Serverless云的云函数功能很好用，解决了前端开发小程序后端服务的痛点，但是云函数每次修改都要上传部署到线上才能测试，的确是很费时费力，我这里使用了express 做了个 mock server，原理是：

1. 将云函数代码拆分成单例
2. 在`server/index.js`中，将云函数作为一个 express 的中间件函数使用
3. 在本地开发中，小程序前端调用的云函数`wx.cloud.callFunction`的时候，替换成`api-mock.js`中的使用 `wx.request` 调用的本地 mock server 接口
4. 使用 jdists 开发时候使用本地的 `api-mock`，生产打包则暴漏真正的`api.js`（详见：`pages/index/index.js`）


## 环境判断

[从命令行传递参数](https://www.gulpjs.com.cn/docs/recipes/pass-arguments-from-cli/)
[gulp-environments](https://www.npmjs.com/package/gulp-environments)
[使用gulp进行简单的分环境配置](https://segmentfault.com/a/1190000004138375?_ea=503865)


## 常见bug及解决

1. `npm run build`失败，修改`"build": "gulp build --env prod"`。
2. `npm run server`失败，原因是缺少"cheerio"模块，安装即可
3. 自动化生成新页面时，默认是XML，需要将`generate-weapp-page`模块修改成生成WXML文件

## 相关项目

[zce/weapp-demo](https://github.com/zce/weapp-demo)

## 许可

MIT &copy; [Felix]()