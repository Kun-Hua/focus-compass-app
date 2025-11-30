const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 排除 Web 版本目錄（web邏輯）
const projectRoot = __dirname;
const webLogicPath = path.resolve(projectRoot, 'web邏輯');

config.resolver.blockList = [
    // 排除整個 web邏輯 目錄
    new RegExp(`^${webLogicPath.replace(/\\/g, '\\\\')}.*$`),
];

module.exports = config;
