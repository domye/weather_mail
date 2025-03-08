import axios from 'axios';
import nodemailer from "nodemailer";

const date = Date.now();
var transporter = nodemailer.createTransport({
     service: 'QQ',
     auth: {
         user: '860733455@qq.com',//发送者邮箱
         pass: 'yerfpvttzwpfbbjf' //邮箱第三方登录授权码
     },
});

//简略信息
// 		cityname: 地名
// 		temp:     最高气温
// 		tempn:    最低气温
// 		weather:  天气状况
// 		wd:       风向
// 		ws:       风等级

//当前时刻详细信息
// temp:            温度
// WD:              风向的中文描述
// wde:             风向的英文缩写
// WS:              风力等级
// wse:             风速
// SD:              相对湿度
// qy:              气压
// njd:             能见度
// rain:            当前降水量。
// rain24h:         过去24小时的降水量。
// aqi:             空气质量指数。
// aqi_pm25:        PM2.5的空气质量指数。

let combinedInfo = {};

axios.get(`http://d1.weather.com.cn/dingzhi/101220505.html?_=${date}`, {
    headers: {
        'referer': "http://www.weather.com.cn/",
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
    }
})
    .then((response) => {
        const cityInfoStr1 = response.data.split('var cityDZ101220505 =')[1].split(';')[0];
        const cityInfo1 = JSON.parse(cityInfoStr1);
        const weatherinfo = cityInfo1.weatherinfo;

        // 简略天气信息
        combinedInfo.cityname = weatherinfo.cityname;
        combinedInfo.temp = weatherinfo.temp;
        combinedInfo.tempn = weatherinfo.tempn;
        combinedInfo.weather = weatherinfo.weather;
        combinedInfo.wd = weatherinfo.wd;
        combinedInfo.ws = weatherinfo.ws;

        console.log("当前城市：" + combinedInfo.cityname);
        console.log(`今天天气：${combinedInfo.weather}\n风向:${combinedInfo.wd}\n风力:${combinedInfo.ws}\n最高温度:${combinedInfo.temp}\n最低温度:${combinedInfo.tempn}`);

        // 第二个请求
        return axios.get(`http://d1.weather.com.cn/sk_2d/101220505.html?_=${date}`, {
            headers: {
                'referer': "http://www.weather.com.cn/",
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
            }
        });
    })
    .then((response) => {
        const cityInfoStr2 = response.data.split('var dataSK=')[1].split(';')[0];
        const cityInfo2 = JSON.parse(cityInfoStr2);

        // 详细天气信息
        combinedInfo.WD = cityInfo2.WD;
        combinedInfo.wse = cityInfo2.wse;
        combinedInfo.SD = cityInfo2.SD;
        combinedInfo.qy = cityInfo2.qy;
        combinedInfo.njd = cityInfo2.njd;
        combinedInfo.rain = cityInfo2.rain;
        combinedInfo.rain24h = cityInfo2.rain24h;
        combinedInfo.aqi = cityInfo2.aqi;
        combinedInfo.aqi_pm25 = cityInfo2.aqi_pm25;

        console.log(`温度:${combinedInfo.temp}°C\n风力等级:${combinedInfo.ws}\n风速:${combinedInfo.wse}m/s\n相对湿度:${combinedInfo.SD}%\n气压:${combinedInfo.qy}hPa\n能见度:${combinedInfo.njd}km\n当前降水量:${combinedInfo.rain}mm\n过去24小时降水量:${combinedInfo.rain24h}mm\n空气质量指数:${combinedInfo.aqi}\nPM2.5空气质量指数:${combinedInfo.aqi_pm25}`);

        const mailOptions = {
            from: `${combinedInfo.weather} <860733455@qq.com>`, // 你的邮箱
            to: '1523610551@qq.com',
            subject: `气温:${combinedInfo.tempn}~${combinedInfo.temp}`,
            text: `当前城市：${combinedInfo.cityname}\n风向:${combinedInfo.wd}\n风力:${combinedInfo.ws}\n最高温度:${combinedInfo.temp}\n最低温度:${combinedInfo.tempn}°C\n温度:${combinedInfo.temp}°C\n风力等级:${combinedInfo.ws}\n风速:${combinedInfo.wse}\n相对湿度:${combinedInfo.SD}%\n气压:${combinedInfo.qy}\n能见度:${combinedInfo.njd}\n当前降水量:${combinedInfo.rain}\n过去24小时降水量:${combinedInfo.rain24h}mm\n空气质量指数:${combinedInfo.aqi}\nPM2.5空气质量指数:${combinedInfo.aqi_pm25}`, // 邮件文本
        };

        transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
            transporter.close();
        });
    })
    .catch((error) => {
        console.error(error);
    });
