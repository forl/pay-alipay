/*
 * @Author: forl
 * @Date: 2017-01-19 14:16:22
 * @Last Modified by: forl
 * @Last Modified time: 2017-09-22 10:32:08
 */

const crypto = require('crypto');
const moment = require('moment');

/**
 * 获取支付宝 API 规定格式的时间戳，格式为"yyyy-MM-dd HH:mm:ss"
 *
 * @returns {String}
 */
function getTimestamp() {
  return moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
}

/**
 * 生成签名
 * 支付宝官方文档：https://doc.open.alipay.com/docs/doc.htm?docType=1&articleId=106118
 * 筛选排序 -> 拼接 -> 签名
 *
 * @param {Object} dataObj 待签名的数据对象
 * @param {String} privateKey 私钥
 * @returns {String}
 */
async function generateSign(dataObj, privateKey, algorith) {
  const stringToBeSign = Object.keys(dataObj).sort().reduce((acc, k) => {
    if (k !== 'sign' && dataObj[k] !== undefined) {
      const v = `${dataObj[k]}`;
      if (v.length !== 0) {
        if (acc.length === 0) {
          acc += `${k}=${v}`;
        } else {
          acc += `&${k}=${v}`;
        }
      }
    }
    return acc;
  }, '');

  if (stringToBeSign.length === 0) {
    throw new Error('The data to be signed is empty.');
  } else {
    const cryptoSign = crypto.createSign(algorith);
    cryptoSign.update(stringToBeSign, 'utf8');
    return cryptoSign.sign(privateKey, 'base64');
  }
}

/**
 * 验证签名
 *
 * @param {String} content
 * @param {String} sign
 * @param {String} publicKey
 * @param {String} algorith
 * @returns {Boolean}
 */
async function verifySign(dataObj, sign, publicKey, algorith) {
  // 验证签名,验证的规则见文档：https://doc.open.alipay.com/docs/doc.htm?docType=1&articleId=106120
  const verify = crypto.createVerify(algorith);

  // 文档中说了如果字符串中包含“http://”的正斜杠，需要先将正斜杠做转义
  verify.update(JSON.stringify(dataObj).replace(/\//g, '\\/'));
  return verify.verify(publicKey, sign, 'base64');
}

function verifyNotifySign(body, sign, publicKey, algorith) {
  const stringToVerify = Object.keys(body).sort().reduce((acc, k) => {
    if (k !== 'sign' && k !== 'sign_type' && body[k] !== undefined) {
      const v = `${body[k]}`;
      if (v.length !== 0) {
        if (acc.length === 0) {
          acc += `${k}=${v}`;
        } else {
          acc += `&${k}=${v}`;
        }
      }
    }
    return acc;
  }, '');

  const verify = crypto.createVerify(algorith);

  // 文档中说了如果字符串中包含“http://”的正斜杠，需要先将正斜杠做转义
  verify.update(stringToVerify);
  return verify.verify(publicKey, sign, 'base64');
}

/**
 * 将Params Object对象格式化为 query string 形式
 *
 * @param {Object} paramsObj        params 对象
 * @returns {String}
 */
function generateQueryString(paramsObj) {
  return Object.keys(paramsObj).reduce((acc, k) => {
    if (paramsObj[k] !== undefined) {
      const v = `${paramsObj[k]}`;
      if (v.length !== 0) {
        const encoded = encodeURIComponent(v);
        if (acc.length === 0) {
          acc += `${k}=${encoded}`;
        } else {
          acc += `&${k}=${encoded}`;
        }
      }
    }
    return acc;
  }, '');
}

module.exports = {
  getTimestamp,
  verifySign,
  verifyNotifySign,
  generateSign,
  generateQueryString,
};
