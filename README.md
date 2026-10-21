明日方舟 PRTS 主题的 DeepSeek Harness 启动 / 登录 / 美化插件 An Arknights PRTS-themed boot & theming plugin for DeepSeek Harness

🎯 项目简介 / About

dsh-prts-boot 是一款《明日方舟》PRTS 主题的 DeepSeek Harness 插件，提供完整的启动动画、登录认证与主界面美化，让每次启动都如同接入罗德岛终端。

dsh-prts-boot is an Arknights PRTS-themed plugin for DeepSeek Harness, delivering a complete boot sequence, login gate and main-UI theming — every launch feels like connecting to the Rhodes Island terminal.

✨ 特性 / Features

🚀 PRTS 开机动画与身份认证流程（档案选择 / 编号匹配 / 密钥验证）
🎤 原生风格的 PRTS 系统语音（官方原声 + RVC 声线转换）
🔒 隐藏彩蛋账号「普瑞赛斯」，含干扰影像动效
🎨 双主题皮肤（白·档案 / 黑·核心），覆盖背景、聊天框、侧边栏等全局界面
⚙️ 丰富的可自定义设置，即存即用

🚀 PRTS boot animation and identity gate (profile picker / serial match / passcode)
🎤 Authentic PRTS-style voice set (official clips + RVC voice conversion)
🔒 Hidden "Priestess" easter-egg account with glitch effects
🎨 Two theme skins (White · Archive / Black · Core) covering the whole app surface
⚙️ Rich settings, saved instantly
📦 安装 / Install

标准 DSH 插件包。将本仓库目录添加至 profile 的 dependencies（link:）与 dsh.profile.bundles，或直接 npm pack 后安装 tgz，重启应用即可。

A standard DSH bundle plugin. Add the repo directory to your profile's dependencies (link:) and dsh.profile.bundles, or npm pack and install the tarball, then restart the app.

jsonc


// <DSH_HOME>/profiles/<profile>/package.json
{
  "dependencies": { "dsh-prts-boot": "link:./path/to/dsh-prts-boot" },
  "dsh": { "profile": { "bundles": ["dsh-prts-boot"] } }
}

📌 版本声明 / Version

当前版本 v0.1.0（首个正式版），适用于 DeepSeek Harness（desktop profile），无第三方运行时依赖；本项目采用 MIT 协议，属同人粉丝作品、仅供个人学习与使用，禁止商业用途，其中《明日方舟》相关角色、语音与图像素材版权归鹰角网络所有，后续版本更新将在此记录。

Currently at v0.1.0 (first official release), targeting DeepSeek Harness desktop profiles with no third-party runtime dependencies. Licensed under MIT, this is a fan-made project for personal use only — commercial use is prohibited — and all Arknights-related characters, voices and assets belong to Hypergryph. Future updates will be noted here.
