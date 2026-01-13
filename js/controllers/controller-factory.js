'use strict';

import DS4Controller from './ds4-controller.js';
import DS5Controller from './ds5-controller.js';
import DS5EdgeController from './ds5-edge-controller.js';
import VR2Controller from './vr2-controller.js';
import Xbox360Controller from './xbox360-controller.js';
import NaconController from './nacon-controller.js';
import { dec2hex } from '../utils.js';

/**
* Controller Factory - Creates the appropriate controller instance based on device type
*/
class ControllerFactory {
  static getSupportedModels() {
    const ds4v1 = { vendorId: 0x054c, productId: 0x05c4 };
    const ds4v2 = { vendorId: 0x054c, productId: 0x09cc };
    const ds5 = { vendorId: 0x054c, productId: 0x0ce6 };
    const ds5edge = { vendorId: 0x054c, productId: 0x0df2 };
    const vr2_left = { vendorId: 0x054c, productId: 0x0e45 };
    const vr2_right = { vendorId: 0x054c, productId: 0x0e46 };
    const xbox360_wired = { vendorId: 0x045e, productId: 0x028e };
    const xbox360_wireless_legacy = { vendorId: 0x045e, productId: 0x0289 };
    const nacon_asymmetric = { vendorId: 0x146b, productId: 0x0d01 };
    const nacon_asymmetric_v2 = { vendorId: 0x146b, productId: 0x0d05 };
    const nacon_revolution_pro = { vendorId: 0x146b, productId: 0x0d02 };
    const nacon_revolution_pro2 = { vendorId: 0x146b, productId: 0x0d06 };
    const nacon_revolution_pro3 = { vendorId: 0x146b, productId: 0x0d10 };
    const nacon_compact = { vendorId: 0x146b, productId: 0x0d09 };
    const nacon_daija = { vendorId: 0x146b, productId: 0x0d13 };
    const nacon_gc100 = { vendorId: 0x146b, productId: 0x0603 };
    const nacon_ps4_wired = { vendorId: 0x146b, productId: 0x0d08 };
    return [ds4v1, ds4v2, ds5, ds5edge, vr2_left, vr2_right, xbox360_wired, xbox360_wireless_legacy, 
            nacon_asymmetric, nacon_asymmetric_v2, nacon_revolution_pro, nacon_revolution_pro2, 
            nacon_revolution_pro3, nacon_compact, nacon_daija, nacon_gc100, nacon_ps4_wired];
  }


  /**
  * Create a controller instance based on the HID device product ID
  * @param {HIDDevice} device The HID device
  * @returns {BaseController} The appropriate controller instance
  */
  static createControllerInstance(device) {
    switch (device.productId) {
      case 0x05c4: // DS4 v1
      case 0x09cc: // DS4 v2
        return new DS4Controller(device);

      case 0x0ce6: // DS5
        return new DS5Controller(device);

      case 0x0df2: // DS5 Edge
        return new DS5EdgeController(device);

      case 0x0e45: // VR2 Left
        return new VR2Controller(device, true);

      case 0x0e46: // VR2 Right
        return new VR2Controller(device, false);

      case 0x028e: // Xbox 360 Controller (Wired)
      case 0x0289: // Xbox 360 Controller (Wireless Legacy)
        return new Xbox360Controller(device);

      case 0x0d01: // NACON PS4 Asymmetric Wireless
      case 0x0d05: // NACON PS4 Asymmetric Wireless v2
      case 0x0d02: // NACON Revolution Pro Controller
      case 0x0d06: // NACON Revolution Pro Controller 2
      case 0x0d10: // NACON Revolution Pro Controller 3
      case 0x0d09: // NACON Compact Controller
      case 0x0d13: // NACON Daija Arcade Stick
      case 0x0603: // NACON GC-100
      case 0x0d08: // NACON PS4 Wired Controller
        return new NaconController(device);

      default:
        throw new Error(`Unsupported device: ${dec2hex(device.vendorId)}:${dec2hex(device.productId)}`);
    }
  }

  /**
  * Get device name based on product ID
  * @param {number} productId Product ID
  * @returns {string} Device name
  */
  static getDeviceName(productId) {
    switch (productId) {
      case 0x05c4:
        return "Sony DualShock 4 V1";
      case 0x09cc:
        return "Sony DualShock 4 V2";
      case 0x0ce6:
        return "Sony DualSense";
      case 0x0df2:
        return "Sony DualSense Edge";
      case 0x028e:
        return "Xbox 360 Controller (Wired)";
      case 0x0289:
        return "Xbox 360 Controller (Wireless)";
      case 0x0e45:
        return "VR2 Left Controller";
      case 0x0e46:
        return "VR2 Right Controller";
      case 0x0d01:
        return "NACON PS4 Asymmetric Wireless";
      case 0x0d05:
        return "NACON PS4 Asymmetric Wireless V2";
      case 0x0d02:
        return "NACON Revolution Pro Controller";
      case 0x0d06:
        return "NACON Revolution Pro Controller 2";
      case 0x0d10:
        return "NACON Revolution Pro Controller 3";
      case 0x0d09:
        return "NACON Compact Controller";
      case 0x0d13:
        return "NACON Daija Arcade Stick";
      case 0x0603:
        return "NACON GC-100";
      case 0x0d08:
        return "NACON PS4 Wired Controller";
      default:
        return "Unknown Device";
    }
  }

  /**
  * Get UI configuration based on product ID
  * @param {number} productId Product ID
  * @returns {Object} UI configuration
  */
  static getUIConfig(productId) {
    switch (productId) {
      case 0x05c4: // DS4 v1
      case 0x09cc: // DS4 v2
        return { 
          showInfo: false, 
          showFinetune: false, 
          showInfoTab: false,
          showQuickTests: true,
          showFourStepCalib: true,
          showQuickCalib: false,
          showCalibrationHistory: false
        };

      case 0x0ce6: // DS5
      case 0x0df2: // DS5 Edge
        return { 
          showInfo: true, 
          showFinetune: true, 
          showInfoTab: true,
          showQuickTests: true,
          showFourStepCalib: false,
          showQuickCalib: true,
          showCalibrationHistory: true
        };

      case 0x0e45: // VR2 Left Controller
      case 0x0e46: // VR2 Right Controller
        return { 
          showInfo: true, 
          showFinetune: false, 
          showInfoTab: true,
          showQuickTests: false,
          showFourStepCalib: true,
          showQuickCalib: false
        };

      case 0x028e: // Xbox 360 Wired
      case 0x0289: // Xbox 360 Wireless
        return { 
          showInfo: true, 
          showFinetune: false, 
          showInfoTab: true,
          showQuickTests: true,
          showFourStepCalib: true,
          showQuickCalib: false,
          showCalibrationHistory: false
        };

      case 0x0d01: // NACON PS4 Asymmetric Wireless
      case 0x0d05: // NACON PS4 Asymmetric Wireless V2
      case 0x0d02: // NACON Revolution Pro Controller
      case 0x0d06: // NACON Revolution Pro Controller 2
      case 0x0d10: // NACON Revolution Pro Controller 3
      case 0x0d09: // NACON Compact Controller
        return { 
          showInfo: true, 
          showFinetune: false, 
          showInfoTab: true,
          showQuickTests: true,
          showFourStepCalib: true,
          showQuickCalib: false,
          showCalibrationHistory: false
        };

      default:
        return { 
          showInfo: false, 
          showFinetune: false, 
          showInfoTab: false,
          showQuickTests: false,
          showFourStepCalib: false,
          showQuickCalib: false,
          showCalibrationHistory: false
        };
    }
  }
}

// Export for use in other modules
export default ControllerFactory;
