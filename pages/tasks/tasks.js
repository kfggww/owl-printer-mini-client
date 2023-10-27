const app = getApp();

const OWL_BLE_SERVICE_UUID = "4e3eeda0-83bf-45d7-8707-769d6348411c";
const OWL_BLE_STATUS_REPORT_UUID = "4e3eedb2-83bf-45d7-8707-769d6348411c";

Page({
  data: {
    connectedDeviceId: null,
    volt: null,
    temp: null,
    paper: null,
    deviceStatusTimerId: null,
    selectedImageFilePath: null,
  },

  onShow(options) {
    const that = this;
    const connectedDevice = app.globalData.connectedDevice;

    // 清空之前的数据
    that.setData({
      connectedDeviceId: null,
      volt: null,
      temp: null,
      paper: null,
      deviceStatusTimerId: null,
    })

    if (connectedDevice != null) {
      // 记录设备ID
      that.setData({
        connectedDeviceId: connectedDevice.deviceId,
      });
      // 注册一个特征变化的回调函数
      wx.onBLECharacteristicValueChange((result) => {
        const values = new Float32Array(result.value);

        if (values.length < 3) {
          console.log("读取设备信息失败");
          return;
        }

        const volt = values[0].toFixed(1);
        const temp = values[1].toFixed(1);
        const paper = values[2] == 0 ? "正常" : "异常";

        that.setData({
          volt: volt,
          temp: temp,
          paper: paper,
        });

        console.log("读取到设备信息: ", "volt=" + volt, "temp=" + temp, "paper=" + paper);
      });
      // 开启读取设备信息的定时器
      const timerId = setInterval(() => {
        wx.readBLECharacteristicValue({
          characteristicId: OWL_BLE_STATUS_REPORT_UUID,
          deviceId: connectedDevice.deviceId,
          serviceId: OWL_BLE_SERVICE_UUID,
        });
        console.log("开始读取设备信息...");
      }, 600);

      that.setData({
        deviceStatusTimerId: timerId,
      });
      console.log("定时器开启");
    }
  },

  onHide(options) {
    // 关闭读取设备信息的定时器
    const that = this;
    const timerId = that.data.deviceStatusTimerId;

    if (timerId != null) {
      // 关闭监听特征的回调
      wx.offBLECharacteristicValueChange();
      // 关闭定时器
      clearInterval(timerId);
      that.setData({
        deviceStatusTimerId: null,
      });
      console.log("定时器关闭");
    }
  },

  userSelectImage(event) {
    const that = this;

    // 获取用户选择的图片路径
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType: ["album"],
      sizeType: ["original", "compressed"],
      success: function (res) {
        const imageFilePath = res.tempFiles[0].tempFilePath;
        that.setData({
          selectedImageFilePath: imageFilePath,
        });
        console.log("用户选择文件: " + imageFilePath);

        wx.getImageInfo({
          src: imageFilePath,
          success: function (res) {
            const imageWidth = res.width;
            const imageHeight = res.height;

            // 获取 <canvas> 元素的上下文
            const context = wx.createCanvasContext('myCanvas');

            // 获取 <canvas> 的宽度和高度
            const canvasWidth = 384;
            const canvasHeight = 384;

            // 计算缩放比例
            const scale = Math.min(canvasWidth / imageWidth, canvasHeight / imageHeight);

            // 计算绘制图像的宽度和高度
            const drawWidth = imageWidth * scale;
            const drawHeight = imageHeight * scale;

            // 计算图像在 <canvas> 中的位置，使其居中
            const x = (canvasWidth - drawWidth) / 2;
            const y = (canvasHeight - drawHeight) / 2;

            // 绘制图像
            context.drawImage(imageFilePath, x, y, drawWidth, drawHeight);

            // 将图像绘制到canvas上, 并进行灰度处理
            context.draw(false, () => {
              wx.canvasGetImageData({
                canvasId: 'myCanvas',
                height: 384,
                width: 384,
                x: 0,
                y: 0,
                success: (res) => {
                  const finalImageData = new Uint8ClampedArray(384 * 48);
                  const imageData = res.data;
                },
                fail: (res) => {

                }
              });
            });
          }
        });
      },
      fail: function (res) {
        console.log("用户选择文件失败...");
      }
    });
  },

  userPrintImage(event) {

  }
});