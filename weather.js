//本地测试
// import axios from "axios";
// import nodemailer from "nodemailer";
// import yaml from "js-yaml";
// import fs from "fs";
//服务器
const axios = require("axios");
const nodemailer = require("nodemailer");
const yaml = require("js-yaml");
const fs = require("fs");
const path = require("path");

//读取配置
const configPath = path.join(__dirname, "config.yaml"); // 获取绝对路径

const fileContents = fs.readFileSync(configPath, "utf8");
const config = yaml.load(fileContents); //将获取到的数据存储在config中
const users = config.users; //读取用户配置
const info = { hint: [], hint_priority: [] }; //存储天气数据
const warn_weather = {}; //存储预警数据
const hints = config.hints; //读取生活指数
info.hint_num = config.hint_num; //读取生活指数显示个数
info.hint_priority = config.hint_priority; //读取生活指数优先级
var wea = config.wea; //读取天气代码

// 读取邮箱配置
var transporter = nodemailer.createTransport({
  service: config.email_config.service,
  auth: {
    user: config.email_config.auth.user,
    pass: config.email_config.auth.pass,
  },
});

// 生成时间戳
var timedate = Date.now();

// 正则匹配数据
const extractData = (inform, varName) => {
  const match = inform.match(new RegExp(`var ${varName}\\s*=\\s*([^;]+)`));
  return match ? JSON.parse(match[1].trim()) : null;
};

// 发送邮件的函数
const sendEmail = (mailOptions) => {
  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        reject(error);
      } else {
        resolve(info);
      }
    });
  });
};

// 延迟函数
const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

//获取天气指数函数
function getWeatherHints(info, priority, count) {
  const hintsToOutput = priority
    .slice(0, count)
    .map((index) => info.hint[index]);
  return hintsToOutput;
}

// 处理每个用户的函数
async function processUser(user) {
  try {
    /***获取今日天气***/
    /** 包含天气状况 **/
    /*****************/
    const response1 = await axios.get(
      `https://d1.weather.com.cn/weather_index/${user.citycode}.html?_=${timedate}`,
      {
        headers: {
          referer: "http://www.weather.com.cn/",
        },
      }
    );

    const inform = response1.data;
    // 今日天气
    const cityDZ = extractData(inform, "cityDZ");

    // 实时天气
    const dataSK = extractData(inform, "dataSK");

    // 生活指数
    const dataZS = extractData(inform, "dataZS");

    // 近日天气
    const fc = extractData(inform, "fc");

    info.city = cityDZ.weatherinfo.city;

    // 今日天气
    info.max_temp_1 = fc.f[0].fc;
    info.min_temp_1 = fc.f[0].fd;
    info.weather = cityDZ.weatherinfo.weather;
    info.wind = cityDZ.weatherinfo.wd;
    info.wind_level = cityDZ.weatherinfo.ws;
    info.air_1 = fc.f[0].fm;
    info.wet_1 = parseFloat(fc.f[0].fn);

    // 明日天气
    info.max_temp_2 = fc.f[1].fc;
    info.min_temp_2 = fc.f[1].fd;
    info.air_2 = fc.f[1].fm;
    info.wet_2 = parseFloat(fc.f[1].fn);
    info.weather_2 =
      fc.f[1].fb === fc.f[1].fa
        ? wea[fc.f[1].fb]
        : `${wea[fc.f[1].fb]}转${wea[fc.f[1].fa]}`;

    // 后天天气
    info.max_temp_3 = fc.f[2].fc;
    info.min_temp_3 = fc.f[2].fd;
    info.air_3 = fc.f[2].fm;
    info.wet_3 = parseFloat(fc.f[2].fn);
    info.weather_3 =
      fc.f[2].fb === fc.f[2].fa
        ? wea[fc.f[2].fb]
        : `${wea[fc.f[2].fb]}转${wea[fc.f[2].fa]}`;

    hints.forEach((hint, index) => {
      info.hint[index + 1] = dataZS.zs[hint];
    });

    //指数输出
    info.hint_out = getWeatherHints(info, info.hint_priority, info.hint_num);

    /***获取小时天气预警***/
    /*********＊＊********/

    const response2 = await axios.get(
      `
https://d1.weather.com.cn/wap_40d/${user.citycode}.html?_=${timedate}`,
      {
        headers: {
          referer: "http://www.weather.com.cn/",
        },
      }
    );
    const warn = response2.data;

    const inform_24 = extractData(warn, "fc1h_24");

    //获取小时天气数据
    for (let i = 0; i < config.warn_num; i++) {
      if (inform_24.jh[i].ja > 2) {
        warn_weather.hour = parseInt(inform_24.jh[i].jf.substring(8, 10), 10);
        warn_weather.info = wea[inform_24.jh[i].ja];
        break;
      } else {
        warn_weather.hour = 999;
      }
    }

    /***配置邮箱发送内容***/
    /*********＊＊********/

    // 配置发件人
    const generateFromEmail = (prefix, email = "860733455@qq.com") => {
      return `"${prefix}" <${email}>`;
    };

    // 构建发件人名称
    const noRainPrefix = `今日${info.weather},${config.warn_num}h内无雨`;
    const rainAlertPrefix = `${warn_weather.hour}时有${warn_weather.info},记得带伞`;

    // 生成最终邮箱地址
    warn_weather.hour === 999
      ? generateFromEmail(noRainPrefix)
      : generateFromEmail(rainAlertPrefix);

    // 邮件配置对象
    const mailOptions = {
      from: `"${noRainPrefix}" <860733455@qq.com>`,
      to: user.email, // 收件人邮箱
      subject: `气温${info.min_temp_1}℃~${info.max_temp_1}℃♥`, // 邮件主题
      html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px 0; background-color: #f5f5f5; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">


        <!-- 天气详情 -->
        <div style="padding: 32px; text-align: center;">
            <div style="display: inline-block; margin: 0 12px; padding: 16px; border: 1px solid #eeeeee; border-radius: 8px;">
                <div style="color: #666666; margin-bottom: 8px;">明天</div>
                <div style="font-size: 20px; color: #333333; margin-bottom: 8px;">${
                  info.weather_2
                }</div>
                <div style="color: #888888;">${info.min_temp_2}℃ ~ ${
        info.max_temp_2
      }℃</div>
            </div>

            <div style="display: inline-block; margin: 0 12px; padding: 16px; border: 1px solid #eeeeee; border-radius: 8px;">
                <div style="color: #666666; margin-bottom: 8px;">后天</div>
                <div style="font-size: 20px; color: #333333; margin-bottom: 8px;">${
                  info.weather_3
                }</div>
                <div style="color: #888888;">${info.min_temp_3}℃ ~ ${
        info.max_temp_3
      }℃</div>
            </div>
        </div>

        <!-- 温馨提示 -->
        <div style="padding: 24px 32px; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
            <div style="color: #666666; font-size: 14px; line-height: 1.6;">
                 ${info.hint_out
                   .map(
                     (hint) => `🌸
${hint}<br>
`
                   )
                   .join("")}
            </div>
        </div>
    </div>
</body>
</html>`,
    };

    // 发送邮件
    const emailInfo = await sendEmail(mailOptions);
    console.log(`Email sent to ${user.email}: ${emailInfo.response}`);
  } catch (error) {
    console.error(`Error processing user ${user.email}:`, error);
  }
}

// 处理所有用户的函数
async function processAllUsers() {
  for (const user of users) {
    await processUser(user);
    await delay(1000); // 每处理一个用户延迟1秒
  }
  transporter.close();
}

processAllUsers();
