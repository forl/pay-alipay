# 支付宝支付 API 服务端 SDK —— pay-alipay

## 使用

### 安装

```
npm install pay-alipay
```
或者
```
yarn add pay-alipay
```

主要实现了支付宝[当面付](https://docs.open.alipay.com/194/105203/)的 API，包含以下 API：

* alipay.trade.query
* alipay.trade.refund
* alipay.trade.pay
* alipay.trade.precreate
* alipay.trade.cancel
* alipay.trade.create
* alipay.trade.fastpay.refund.query
* alipay.trade.close
* alipay.trade.order.settle
* alipay.open.auth.token.app

```
const Alipay = require('pay-alipay);

const alipayClient = new Alipay({
  appid: 'APPID',
  appPrivateKey: 'content of alipay app private key',
  alipayPublicKey: 'content of alipay public key',
  notifyUrl: 'https:example.com/alipay-notify',
  appAuthToken: '',
  sandbox: false,
});
```

## 通过测试了解更多

### 测试前的准备工作

由于需要配置 APPID 和密钥，在运行 `yarn run test` 之前，需要做一些准备工作。

1. **使用 .env 文件配置 APPID：**在项目根目录下新建一个名为 .env 的文件，然后将 .env.example 的文件内容拷贝过来。修改 APP_ID 参数为支付宝沙箱应用的 APPID。
1. **配置密钥：**在 `/test/keys/`目录中放入三个密钥文件，分别是支付宝沙箱应用的私钥和公钥（[生成教程](https://doc.open.alipay.com/docs/doc.htm?articleId=106130&docType=1)），支付宝公钥。沙箱环境的具体使用方法请参考官方[文档](https://docs.open.alipay.com/200/105311/)。三个密钥文件名称：
```
test
├── alipay.js
└── keys
    ├── alipay_public_key.pem
    ├── app_private_key.pem
    └── app_public_key.pem
```

### 测试

```
npm test
```
或者
```
yarn test
```
若需要查看 DEBUG 打印信息：
```
DEBUG=alipay npm test
``` 
或者 
```
DEBUG=alipay yarn test
```

