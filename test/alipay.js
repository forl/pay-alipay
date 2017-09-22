import test from 'ava';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import Alipay from '../lib';

dotenv.config();

const outTradeNo = Date.now().toString();
const outTradeNoPrecreate = outTradeNo + 1;

test.beforeEach((t) => {
  const alipayPublicKey = fs.readFileSync(path.resolve(
    __dirname,
    './keys/alipay_public_key.pem',
  ), 'utf8');
  const appPrivateKey = fs.readFileSync(path.resolve(
    __dirname,
    './keys/app_private_key.pem',
  ), 'utf8');

  t.context.alipayClient = new Alipay({
    appid: process.env.APP_ID,
    appPrivateKey,
    alipayPublicKey,
    notifyUrl: 'https://asia.smart-dominance.com/cb/alipay-notify',
    appAuthToken: '',
    sandbox: true,
  });
});

test.serial('pay()', async (t) => {
  const response = await t.context.alipayClient.pay({
    out_trade_no: outTradeNo,
    scene: 'bar_code',
    auth_code: '286764585298676483',
    subject: 'iPhone X',
    total_amount: 88.88,
  });
  t.is(response.code, '10000');
});

test.serial('query()', async (t) => {
  const response = await t.context.alipayClient.query({
    out_trade_no: outTradeNo,
  });
  t.is(response.code, '10000');
});

test.serial('cancel()', async (t) => {
  const response = await t.context.alipayClient.cancel({
    out_trade_no: outTradeNo,
  });
  t.is(response.code, '10000');
});

test.serial('close()', async (t) => {
  const response = await t.context.alipayClient.close({
    out_trade_no: outTradeNo,
  });
  t.is(response.code, '10000');
});

test.serial('refund()', async (t) => {
  const response = await t.context.alipayClient.refund({
    out_trade_no: outTradeNo,
    refund_amount: 8.88,
    refund_reason: '卖家寄出了一坨屎',
    out_request_no: Date.now().toString(),
  });
  t.is(response.code, '10000');
});

test.serial('query()', async (t) => {
  const response = await t.context.alipayClient.query({
    out_trade_no: outTradeNo,
  });
  t.is(response.code, '10000');
});

test.serial('precreate()', async (t) => {
  const response = await t.context.alipayClient.precreate({
    out_trade_no: outTradeNoPrecreate,
    subject: 'iPhone X',
    total_amount: 88.88,
    timeout_express: '60m',
  });

  t.is(response.code, '10000');
});

test.serial('query()', async (t) => {
  const response = await t.context.alipayClient.query({
    out_trade_no: outTradeNoPrecreate,
  });
  t.is(response.code, '10000');
});

test.serial('cancel()', async (t) => {
  const response = await t.context.alipayClient.cancel({
    out_trade_no: outTradeNoPrecreate,
  });
  t.is(response.code, '10000');
});

test.serial('close()', async (t) => {
  const response = await t.context.alipayClient.close({
    out_trade_no: outTradeNoPrecreate,
  });
  t.is(response.code, '10000');
});

test.serial('verifyNotifySign()', async (t) => {
  const notifyBody = {
    gmt_create: '2017-09-21 15:39:02',
    charset: 'utf-8',
    seller_email: 'ewnabq8191@sandbox.com',
    open_id: '20880032471103393766073132513489',
    subject: 'iPhone X',
    sign: 'D1BcQHSH/vLEJKaqOzerrvKm6CS3+IJ9AO1or1JauE2j81LnczeN+/5QPkucFdl+EMxRiJYiES8CT6WgHghDozb3TloFMhHviCalAV+jAaAwyNSu3fRpjSmgaIS7YirtovSFp50ck3k79WLnX1uiqknad1okyVDZbJUM17s94Gwn0yJ8HVEam09VlRZV4CUfIiIoIer+2hkkbCDsvR01xMkYNcNtCJ5c3/atzBdppo+jmXjP7G2Cp4fbo6ny71XAehK9DPhltF7G3hKBTQ6924kZhvkdj9LtglgV5Mh3MVf05rAJg8yRXhysGxymup79pNbl5GXTi0TGWApnB9sAtQ==',
    buyer_id: '2088102171299895',
    invoice_amount: '88.88',
    notify_id: '38be44b248b0b46aaeb2dc7fffbafb7mva',
    fund_bill_list: '[{"amount":"88.88","fundChannel":"ALIPAYACCOUNT"}]',
    notify_type: 'trade_status_sync',
    trade_status: 'TRADE_SUCCESS',
    receipt_amount: '88.88',
    app_id: '2016080400164856',
    buyer_pay_amount: '88.88',
    sign_type: 'RSA2',
    seller_id: '2088102169905344',
    gmt_payment: '2017-09-21 15:39:09',
    notify_time: '2017-09-21 15:39:09',
    version: '1.0',
    out_trade_no: '15059795153591',
    total_amount: '88.88',
    trade_no: '2017092121001004890200353105',
    auth_app_id: '2016080400164856',
    buyer_logon_id: 'cjq***@sandbox.com',
    point_amount: '0.00',
  };

  t.true(t.context.alipayClient.verifySignForNotify(notifyBody));
});
