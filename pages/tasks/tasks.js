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
  }
});