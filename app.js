import { check } from "./lib/check.js";
import { init } from "./lib/init.js";
import { createClient } from "oicq";
import { dealMsg, dealGroupNotice, dealFriend, dealGroupRequest } from "./lib/dealMsg.js";

//检查配置文件
await check();

//创建oicq
const Bot = createClient(BotConfig.account.qq, {
  log_level: BotConfig.account.log_level,
  platform: BotConfig.account.platform,
  // resend: false,
  data_dir: process.cwd() + "/data",
});
global.Bot = Bot;

//扫码登录 or 密码登录
Bot.on("system.login.qrcode", function (e) {
  this.logger.mark("扫码后按Enter完成登录");
  process.stdin.once("data", () => {
    this.login();
  });
}).login(BotConfig.account.pwd);

//提交滑动验证码
Bot.on("system.login.slider", function (e) {
  process.stdin.once("data", (input) => {
    this.submitSlider(input);
  });
});

//设备锁
Bot.on("system.login.device", function (e) {
  process.stdin.once("data", () => {
    this.login();
  });
});

//登录错误
Bot.on("system.login.error", function (e) {
  if (e.code == 1) this.logger.error("请打开config.js，修改输入正确的密码");
  process.exit();
});

//监听上线事件
Bot.on("system.online", async () => {
  await init();
});

//监听群聊消息事件
Bot.on("message.group", (event) => {
  event.isGroup = true;
  dealMsg(event).catch((error) => {
    Bot.logger.error(error);
  });
});

//监听私聊消息事件
Bot.on("message.private", (event) => {
  event.isPrivate = true;
  dealMsg(event).catch((error) => {
    Bot.logger.error(error);
  });
});

//监听好友事件
Bot.on("request.friend", (event) => {
  dealFriend(event);
});

//监听群通知
Bot.on("notice.group", (event) => {
  dealGroupNotice(event).catch((error) => {
    Bot.logger.error(error);
  });
});

//监听群事件
Bot.on("request.group", (event) => {
  dealGroupRequest(event);
});

process.on('unhandledRejection', (err, promise) => {
  Bot.logger.error(err);
});