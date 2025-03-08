const axios = require("axios");
const nodemailer = require("nodemailer");

// 用户列表，每个用户包含邮箱和城市代码
const users = [
  { email: "1523610551@qq.com", citycode: "101220505" },
  { email: "2192280631@qq.com", citycode: "101220505" },
];

// 邮箱配置
var transporter = nodemailer.createTransport({
  service: "QQ",
  auth: {
    user: "860733455@qq.com", // 发送者邮箱
    pass: "yerfpvttzwpfbbjf", // 邮箱第三方登录授权码
  },
});

// 天气代码
var wea = {
  "00": "晴",
  "01": "多云",
  "02": "阴",
  "03": "阵雨",
  "04": "雷阵雨",
  "05": "雷阵雨伴有冰雹",
  "06": "雨夹雪",
  "07": "小雨",
  "08": "中雨",
  "09": "大雨",
  10: "暴雨",
  13: "阵雪",
  14: "小雪",
  15: "中雪",
  16: "大雪",
  17: "暴雪",
};

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

// 处理每个用户的函数
async function processUser(user) {
  try {
    const response = await axios.get(
      `https://d1.weather.com.cn/weather_index/${user.citycode}.html?_=${timedate}`,
      {
        headers: {
          referer: "http://www.weather.com.cn/",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
        },
      }
    );

    const inform = response.data;
    // 今日天气
    const cityDZ = extractData(inform, "cityDZ");

    // 实时天气
    const dataSK = extractData(inform, "dataSK");

    // 生活指数
    const dataZS = extractData(inform, "dataZS");

    // 近日天气
    const fc = extractData(inform, "fc");

    const info = {};
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

    // 大后天天气
    info.max_temp_4 = fc.f[3].fc;
    info.min_temp_4 = fc.f[3].fd;
    info.air_4 = fc.f[3].fm;
    info.wet_4 = parseFloat(fc.f[3].fn);
    info.weather_4 =
      fc.f[3].fb === fc.f[3].fa
        ? wea[fc.f[3].fb]
        : `${wea[fc.f[3].fb]}转${wea[fc.f[3].fa]}`;

    // 生活指数
    info.clothes_1 = (info.wet_1 + info.wet_2 + info.wet_3) / 3;
    info.clothes_2 = (info.wet_2 + info.wet_3 + info.wet_4) / 3;
    if (info.clothes_1 < info.clothes_2 || info.wet_1 > 75)
      info.dry = "可以拖一天晒";
    else {
      if (info.clothes_1 < 60) info.dry = "衣服能干,建议晒";
      else if (info.clothes_1 < 70) info.dry = "衣服能干，干得慢";
      else info.dry = "衣服很难干,三思";
    }

    // 邮件内容
    const mailOptions = {
      from: `${info.city}今日${info.weather}<860733455@qq.com>`, // 发送者邮箱
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
                <div style="font-size: 20px; color: #333333; margin-bottom: 8px;">${info.weather_2}</div>
                <div style="color: #888888;">${info.min_temp_2}℃ ~ ${info.max_temp_2}℃</div>
            </div>

            <div style="display: inline-block; margin: 0 12px; padding: 16px; border: 1px solid #eeeeee; border-radius: 8px;">
                <div style="color: #666666; margin-bottom: 8px;">后天</div>
                <div style="font-size: 20px; color: #333333; margin-bottom: 8px;">${info.weather_3}</div>
                <div style="color: #888888;">${info.min_temp_3}℃ ~ ${info.max_temp_3}℃</div>
            </div>
        </div>

        <!-- 温馨提示 -->
        <div style="padding: 24px 32px; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
            <div style="color: #666666; font-size: 14px; line-height: 1.6;">
                🌸 温馨提示：${info.dry}
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
