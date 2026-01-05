# 開發構建 (Development Build) 遷移與音訊功能升級說明書

這份手冊旨在引導您解決 Expo Go 的環境限制，特別是針對「鬧鐘音量通道控制」與「媒體庫完整存取」的功能解鎖。

> [!IMPORTANT]
> **為什麼要遷移到 Development Build？**
> 1. **音量通道控制**：解鎖 Android 的 `USAGE_ALARM`，讓番茄鐘鬧鈴真正受鬧鐘音量控制，而非媒體音量。
> 2. **解除權限限制**：解決 `expo-media-library` 在 Expo Go 中無法掃描裝置音訊的問題。
> 3. **性能與穩定性**：升級到 `expo-audio` 架構，解決 `expo-av` 處理棄用 (Deprecated) 的問題。

---

## 第一階段：環境準備 (EAS 配置)

在執行下列步驟前，請確保您的電腦已安裝 [EAS CLI](https://docs.expo.dev/build/setup/)。

- [ ] **安裝 EAS CLI**
  ```bash
  npm install -g eas-cli
  ```
- [ ] **登入 Expo 帳號**
  ```bash
  eas login
  ```
- [ ] **初始化專案配置**
  ```bash
  eas build:configure
  ```
- [ ] **安裝開發客戶端庫**
  ```bash
  npx expo install expo-dev-client
  ```

---

## 第二階段：音訊庫升級 (expo-av → expo-audio)

這是解鎖「鬧鐘通道」的核心步驟。

- [ ] **安裝新一代音訊庫**
  ```bash
  npx expo install expo-audio
  ```
- [ ] **修改 `TimerView.tsx` 播放邏輯**
  - [ ] 導入 `import { useAudioPlayer } from 'expo-audio';`
  - [ ] 初始化 Player 並設定 `audioUsage: 'alarm'`
  - [ ] 將原本的 `Audio.Sound` 載入邏輯轉換為 `useAudioPlayer` 的監聽與播放機制。
- [ ] **修改 `DeviceAudioList.tsx` 預覽邏輯**
  - [ ] 使用 `createAudioPlayer` 取代 `Audio.Sound.createAsync`。
- [ ] **移除舊庫 (完成所有測試後)**
  ```bash
  npm uninstall expo-av
  ```

---

## 第三階段：Android 權限與配置 (解鎖媒體存取)

- [ ] **更新 `app.json` (或 `app.config.ts`)**
  確保 `expo-media-library` 的插件配置包含音訊權限：
  ```json
  {
    "expo": {
      "plugins": [
        [
          "expo-media-library",
          {
            "photosPermission": "Allow access to photos",
            "savePhotosPermission": "Allow saving to photos",
            "isAccessMediaLocationEnabled": true
          }
        ]
      ]
    }
  }
  ```
- [ ] **手動宣告 Android 權限 (如果需要)**
  在 `app.json` 的 `android.permissions` 中加入 `READ_EXTERNAL_STORAGE` 或 `READ_MEDIA_AUDIO`。

---

## 第四階段：構建與安裝 (EAS Build)

此步驟會產出一個可以在真機安裝的專屬 App（取代 Expo Go）。

- [ ] **構建 Android 開發版 (APK)**
  ```bash
  eas build --profile development --platform android
  ```
- [ ] **下載並安裝至手機**
  構建完成後，透過 QR Code 在 Android 手機安裝產出的 `tar.gz` 或 `apk`。
- [ ] **啟動開發伺服器**
  ```bash
  npx expo start --dev-client
  ```
  > [!TIP]
  > 打開手機上剛安裝好的 App，在伺服器列表中選擇您的電腦。

---

## 功能驗證 Check-list

- [ ] **音量管道驗證**：調整「媒體音量」為 0，調整「鬧鐘音量」為最大。啟動鬧鈴，確認是否有聲音。
- [ ] **靜音開關驗證**：切換手機側邊靜音撥桿，確認鬧鈴是否依然會響（需符合 alarm 行為）。
- [ ] **媒體庫掃描**：在設定中打開「選擇裝置音訊」，確認不再出現 Permission Error，且能看到手機內的 MP3 列表。
- [ ] **持久化驗證**：重啟 App，確認自訂音效 URI 依然正確載入且可播放。
