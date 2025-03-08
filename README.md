# weather_mail
## 来源

- 本人不爱在桌面上放小组件，但又有看天气的需求
- 一般的天气预报晒衣服指数只会考虑当前一天，而不会考虑后面的天气情况
- 有时候会忘了看一天的天气，导致忽略一些状况
- 天气软件无用信息太多，我只希望获取最需要的信息
- 需要定时推送消息

综上，我决定自己写一个程序去自动推送天气信息到我的QQ中



## 功能

1. 获取七日天气状态
2. 分析今日适不适合晒衣服

3. 自动推送到QQ邮箱
4. 多用户多地区推送
5. 多种生活指数
6. 可自己配置发送内容



## 使用教程

连接上服务器之后，执行以下命令：

```
sudo apt update //在安装 Node.js 之前，先更新服务器的软件包列表
sudo apt install curl //安装curl工具
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - //安装nodejs环境
sudo apt install -y nodejs //安装nodejs
node -v
npm -v //检查node和npm版本
```

在服务器上安装axios库

```
npm install axios
```

实现在服务器上定时执行打卡脚本：

```
crontab -e //设置 cron 定时任务
30 7 * * * /usr/bin/node /root/weather.js >> /root/weather.log 2>&1
```

crontab 文件中添加，30 7 * * * : 这表示每天的 7:30执行任务

```
cd /root
node weather.js //测试脚本
```

