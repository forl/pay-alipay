/*
 * @Author: forl
 * @Date: 2017-01-19 14:16:17
 * @Last Modified by: forl
 * @Last Modified time: 2017-09-22 15:01:17
 */

const util = require('./util');
const request = require('request');
const debug = require('debug')('alipay');

const GATEWAY_URL = 'https://openapi.alipay.com/gateway.do';
const DEV_GATEWAY_URL = 'https://openapi.alipaydev.com/gateway.do';

const OPENAUTH_URL = 'https://openauth.alipay.com/oauth2/appToAppAuth.htm';
const DEV_OPENAUTH_URL = 'https://openauth.alipaydev.com/oauth2/appToAppAuth.htm';

const DEFAULT_TIMEOUT = 30 * 1000; // ms
const METHOD_TRADE_QUERY = 'alipay.trade.query';
const METHOD_TRADE_REFUND = 'alipay.trade.refund';
const METHOD_TRADE_PAY = 'alipay.trade.pay';
const METHOD_TRADE_PRECREATE = 'alipay.trade.precreate';
const METHOD_TRADE_CANCEL = 'alipay.trade.cancel';
const METHOD_TRADE_CREATE = 'alipay.trade.create';
const METHOD_TRADE_FASTPAY_REFUND_QUERY = 'alipay.trade.fastpay.refund.query';
const METHOD_TRADE_CLOSE = 'alipay.trade.close';
const METHOD_TRADE_ORDER_SETTLE = 'alipay.trade.order.settle';
const METHOD_OPEN_AUTH_TOKEN_APP = 'alipay.open.auth.token.app';

const methodsCanNotify = [
  METHOD_TRADE_PAY,
  METHOD_TRADE_PRECREATE,
  METHOD_TRADE_CREATE,
  METHOD_TRADE_CLOSE,
];

module.exports = class Alipay {
  /**
   * Creates an instance of Alipay.
   * @param {any} {
   *     signType = 'RSA2',
   *     appid,
   *     notifyUrl,
   *     appPrivateKey,
   *     appAuthToken,
   *     format = 'JSON',
   *     charset = 'utf-8',
   *     alipayPublicKey,
   *     timeout = DEFAULT_TIMEOUT,
   *     sandbox = false,
   *   }
   */
  constructor({
    version = '1.0',
    signType = 'RSA2',
    appid,
    notifyUrl,
    appPrivateKey,
    appAuthToken,
    format = 'JSON',
    charset = 'utf-8',
    alipayPublicKey,
    timeout = DEFAULT_TIMEOUT,
    sandbox = false,
  }) {
    this.config = {
      version,
      signType,
      appid,
      notifyUrl,
      appPrivateKey,
      appAuthToken,
      format,
      charset,
      alipayPublicKey,
      timeout,
      gatewayUrl: sandbox ? DEV_GATEWAY_URL : GATEWAY_URL,
    };

    // debug('Alipay instance created with config:\n%O', this.config);
  }

  /**
   * 执行 Alipay API,
   *
   * @param {String} method
   * @param {Object} bizParams
   * @returns {Object}
   */
  async exec(method, bizParams) {
    const params = {
      method,
      app_id: this.config.appid,
      format: this.config.format,
      charset: this.config.charset,
      sign_type: this.config.signType,
      timestamp: util.getTimestamp(),
      version: this.config.version,
    };

    const bizContent = JSON.stringify(bizParams);

    if (this.config.appAuthToken) {
      params.app_auth_token = this.config.appAuthToken;
    }

    if (methodsCanNotify.some(methodCanNotify => (methodCanNotify === method)) &&
    this.config.notifyUrl) {
      params.notify_url = this.config.notifyUrl; // 只有部分 API 可选这个参数
    }

    const algorith = this.config.signType === 'RSA2' ? 'RSA-SHA256' : 'RSA-SHA1';

    // 拼接参数，规则见 https://doc.open.alipay.com/docs/doc.htm?docType=1&articleId=106118
    // debug('params before sign:\n %O', params);
    const sign = await util.generateSign(
      Object.assign({ biz_content: bizContent }, params),
      this.config.appPrivateKey, algorith,
    );
    let queryString = await util.generateQueryString(params);
    queryString += `&sign=${encodeURIComponent(sign)}&biz_content=${encodeURIComponent(bizContent)}`;
    // debug(`queryString: ${queryString}\n`);
    const requestUrl = `${this.config.gatewayUrl}?${queryString}`;
    // debug(`requestUrl: ${requestUrl}\n`);

    const responseBody = await new Promise((resolve, reject) => {
      request.post(requestUrl, {
        timeout: this.config.timeout,
      }, (err, res, body) => {
        if (err) {
          reject(err);
        }
        resolve(JSON.parse(body));
      });
    });

    // DEBUG
    // debug('responseBody:\n%O', responseBody);

    if (!responseBody.sign) {
      throw new Error('Alipay error: <sign> field is expected in the response body');
    }

    const responseKey = `${method.replace(/\./g, '_')}_response`;
    if (!responseBody[responseKey]) {
      throw new Error(`Alipay error: <${responseKey}> field is expected in the response body`);
    }

    debug(`\n${responseKey}:\n%O\n`, responseBody[responseKey]);

    if (!await util.verifySign(
      responseBody[responseKey], responseBody.sign,
      this.config.alipayPublicKey, algorith,
    )) {
      throw new Error('Alipay error: response signature verification failed');
    }

    return responseBody[responseKey];
  }

  /**
   * 统一收单交易支付接口
   * 收银员使用扫码设备读取用户手机支付宝“付款码”/声波获取设备（如麦克风）读取用户手机支付宝的声波信息后，
   * 将二维码或条码信息/声波信息通过本接口上送至支付宝发起支付。
   *
   * @param {Object} bizParams
   * @returns {promise}
   */
  async pay(bizParams) {
    return this.exec(METHOD_TRADE_PAY, bizParams);
  }

  /**
   * 统一收单 线下交易查询
   * 该接口提供所有支付宝支付订单的查询，商户可以通过该接口主动查询订单状态，完成下一步的业务逻辑。
   *
   * @param {Object} bizParams
   * @returns {promise}
   */
  async query(bizParams) {
    return this.exec(METHOD_TRADE_QUERY, bizParams);
  }

  /**
   * 统一收单交易退款接口
   * 当交易发生之后一段时间内，由于买家或者卖家的原因需要退款时，卖家可以通过退款接口将支付款退还给买家，
   * 支付宝将在收到退款请求并且验证成功之后，按照退款规则将支付款按原路退到买家帐号上。
   *
   * @param {Object} bizParams
   * @returns {promise}
   */
  async refund(bizParams) {
    return this.exec(METHOD_TRADE_REFUND, bizParams);
  }

  /**
   * 统一收单线下交易预创建
   * 收银员通过收银台或商户后台调用支付宝接口，生成二维码后，展示给用户，由用户扫描二维码完成订单支付。
   *
   * @param {Object} bizParams
   * @returns {promise}
   */
  async precreate(bizParams) {
    return this.exec(METHOD_TRADE_PRECREATE, bizParams);
  }

  /**
   * 统一收单交易创建接口
   * 商户通过该接口进行交易的创建下单
   *
   * @param {Object} bizParams
   * @returns {promise}
   */
  async create(bizParams) {
    return this.exec(METHOD_TRADE_CREATE, bizParams);
  }

  /**
   * 统一收单交易撤销接口
   * 支付交易返回失败或支付系统超时，调用该接口撤销交易。
   * 如果此订单用户支付失败，支付宝系统会将此订单关闭；如果用户支付成功，支付宝系统会将此订单资金退还给用户。
   *
   * @param {Object} bizParams
   * @returns {promise}
   */
  async cancel(bizParams) {
    return this.exec(METHOD_TRADE_CANCEL, bizParams);
  }

  /**
   * 统一收单交易 退款查询
   * 商户可使用该接口查询自已通过alipay.trade.refund提交的退款请求是否执行成功。
   *
   * @param {Object} bizParams
   * @returns {promise}
   */
  async refundQuery(bizParams) {
    return this.exec(METHOD_TRADE_FASTPAY_REFUND_QUERY, bizParams);
  }

  /**
   * 统一收单交易关闭接口
   * 用于交易创建后，用户在一定时间内未进行支付，可调用该接口直接将未付款的交易进行关闭。
   *
   * @param {Object} bizParams
   * @returns {promise}
   */
  async close(bizParams) {
    return this.exec(METHOD_TRADE_CLOSE, bizParams);
  }

  /**
   * 统一收单交易结算接口
   * 用于在线下场景交易支付后，进行结算
   *
   * @param {Object} bizParams
   * @returns {promise}
   */
  async settle(bizParams) {
    return this.exec(METHOD_TRADE_ORDER_SETTLE, bizParams);
  }

  /**
   * 使用 app_auth_code 换取 app_auth_token
   *
   * @param {any} bizParams
   */
  async getAppAuthToken(bizParams) {
    return this.exec(METHOD_OPEN_AUTH_TOKEN_APP, bizParams);
  }

  /**
   * 异步通知验签
   * 参考文档：https://docs.open.alipay.com/194/103296/
   * 说明：文档说只适用于扫码支付，但经过实验验证，条码支付、退款的异步通知都是如此。已经咨询支付宝技术人员，确认是文档
   * 没有更新。（2017-09-21）
   *
   * @param {Object} body 支付宝异步通知是 form data, 需要先 parse 成 object 并 decode URL 之后再使用
   * @returns
   */
  verifySignForNotify(body) {
    if (!body.sign || !body.sign_type) {
      throw new Error('sign and sign_type field required');
    }

    const algorith = body.sign_type === 'RSA2' ? 'RSA-SHA256' : 'RSA-SHA1';

    return util.verifyNotifySign(body, body.sign, this.config.alipayPublicKey, algorith);
  }

  static generateAuthUrl({
    sandbox = false,
    appId,
    redirectUri,
  }) {
    return `${sandbox ? DEV_OPENAUTH_URL : OPENAUTH_URL}?app_id=${appId}&redirect_uri=${redirectUri}`;
  }
};
