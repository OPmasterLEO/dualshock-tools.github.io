'use strict';

import BaseController from './base-controller.js';
import {
  sleep,
  buf2hex,
  dec2hex,
  format_mac_from_view,
  la
} from '../utils.js';
import { l } from '../translations.js';

// NACON PS4 Asymmetric Wireless Controller Button mapping
// Similar to DS4 but with some layout differences
const NACON_BUTTON_MAP = [
  { name: 'up', byte: 4, mask: 0x0 }, // Dpad handled separately
  { name: 'right', byte: 4, mask: 0x1 },
  { name: 'down', byte: 4, mask: 0x2 },
  { name: 'left', byte: 4, mask: 0x3 },
  { name: 'square', byte: 4, mask: 0x10, svg: 'Square' },
  { name: 'cross', byte: 4, mask: 0x20, svg: 'Cross' },
  { name: 'circle', byte: 4, mask: 0x40, svg: 'Circle' },
  { name: 'triangle', byte: 4, mask: 0x80, svg: 'Triangle' },
  { name: 'l1', byte: 5, mask: 0x01, svg: 'L1' },
  { name: 'l2', byte: 5, mask: 0x04, svg: 'L2' }, // analog handled separately
  { name: 'r1', byte: 5, mask: 0x02, svg: 'R1' },
  { name: 'r2', byte: 5, mask: 0x08, svg: 'R2' }, // analog handled separately
  { name: 'share', byte: 5, mask: 0x10, svg: 'Share' },
  { name: 'options', byte: 5, mask: 0x20, svg: 'Options' },
  { name: 'l3', byte: 5, mask: 0x40, svg: 'L3' },
  { name: 'r3', byte: 5, mask: 0x80, svg: 'R3' },
  { name: 'ps', byte: 6, mask: 0x01, svg: 'PS' },
  { name: 'touchpad', byte: 6, mask: 0x02, svg: 'Touchpad' },
];

// NACON Input processing configuration
const NACON_INPUT_CONFIG = {
  buttonMap: NACON_BUTTON_MAP,
  dpadByte: 4,
  l2AnalogByte: 7,
  r2AnalogByte: 8,
  touchpadOffset: 34,
};

/**
 * NACON PS4 Asymmetric Wireless Controller class
 * Third-party PS4 controller with wireless USB dongle
 * Compatible with similar HID protocol to DS4
 */
class NaconController extends BaseController {
  constructor(device) {
    super(device);
    this.model = "NACON PS4 Asymmetric Wireless";
    this.finetuneMaxValue = 255;
    this.currentOutputState = {
      validFlag0: 0,
      validFlag1: 0,
      rumbleRight: 0,
      rumbleLeft: 0,
      ledRed: 0,
      ledGreen: 0,
      ledBlue: 255,
      ledFlashOn: 0,
      ledFlashOff: 0,
    };
  }

  getInputConfig() {
    return NACON_INPUT_CONFIG;
  }

  async getSerialNumber() {
    try {
      const view = await this.receiveFeatureReport(0x81);
      return buf2hex(view.buffer.slice(1, 7));
    } catch (error) {
      return "N/A";
    }
  }

  async getInfo() {
    try {
      const infoItems = [
        { key: l("Device Type"), value: "NACON PS4 Asymmetric", cat: "hw" },
        { key: l("Connection Type"), value: "USB Wireless Dongle", cat: "hw" },
      ];

      try {
        const serialNum = await this.getSerialNumber();
        if (serialNum !== "N/A") {
          infoItems.push({ key: l("Serial Number"), value: serialNum, cat: "hw", copyable: true });
        }
      } catch (e) {
        // Serial number not available
      }

      la("nacon_get_info");

      return { ok: true, infoItems, nv: { device: 'nacon', status: 'n/a', locked: null }, disable_bits: 0, rare: false };
    } catch(error) {
      return { ok: false, error, disable_bits: 0 };
    }
  }

  /**
   * NACON controller calibration begin
   */
  async calibrateSticksBegin() {
    la("nacon_calibrate_sticks_begin");
    try {
      // Prepare by zeroing rumble
      await this.setVibration(0, 0);
      await sleep(100);
      return { ok: true };
    } catch(error) {
      la("nacon_calibrate_sticks_begin_failed", {"r": error});
      return { ok: false, error };
    }
  }

  /**
   * NACON controller calibration sample
   */
  async calibrateSticksSample() {
    la("nacon_calibrate_sticks_sample");
    try {
      return { ok: true };
    } catch(error) {
      return { ok: false, error };
    }
  }

  /**
   * NACON controller calibration end
   */
  async calibrateSticksEnd() {
    la("nacon_calibrate_sticks_end");
    try {
      await this.setVibration(0, 0);
      await sleep(100);
      return { ok: true };
    } catch(error) {
      la("nacon_calibrate_sticks_end_failed", {"r": error});
      return { ok: false, error };
    }
  }

  /**
   * NACON controller range calibration begin
   */
  async calibrateRangeBegin() {
    la("nacon_calibrate_range_begin");
    try {
      await this.setVibration(0, 0);
      await sleep(100);
      return { ok: true };
    } catch(error) {
      la("nacon_calibrate_range_begin_failed", {"r": error});
      return { ok: false, error };
    }
  }

  /**
   * NACON controller range calibration end
   */
  async calibrateRangeEnd() {
    la("nacon_calibrate_range_end");
    try {
      await this.setVibration(0, 0);
      await sleep(100);
      return { ok: true };
    } catch(error) {
      la("nacon_calibrate_range_end_failed", {"r": error});
      return { ok: false, error };
    }
  }

  /**
   * Set vibration motors for haptic feedback
   */
  async setVibration(leftMotor = 0, rightMotor = 0) {
    try {
      // NACON uses similar vibration control to DS4
      const reportData = new Uint8Array([
        0x00,
        Math.max(0, Math.min(255, rightMotor)),
        Math.max(0, Math.min(255, leftMotor)),
        0x00,
        0x00,
        0x00,
      ]);

      await this.device.sendReport(0x00, reportData);

      this.currentOutputState.rumbleLeft = leftMotor;
      this.currentOutputState.rumbleRight = rightMotor;

      return { success: true, message: "Vibration set successfully" };
    } catch (error) {
      throw new Error("Failed to set vibration", { cause: error });
    }
  }

  /**
   * Initialize the current output state
   */
  async initializeCurrentOutputState() {
    try {
      await this.setVibration(0, 0);
    } catch (error) {
      console.warn("Failed to initialize NACON output state:", error);
    }
  }

  /**
   * Parse NACON battery status from input data
   */
  parseBatteryStatus(data) {
    // NACON wireless controllers have battery info
    // Check for battery byte (typically around position 29-30 like DS4)
    try {
      const bat = data.getUint8(29);
      const bat_data = bat & 0x0f;
      const bat_status = (bat >> 4) & 1;

      return {
        charge_level: Math.min(bat_data * 10 + 5, 100),
        cable_connected: bat_status === 1,
        is_charging: bat_status === 1,
        is_error: false
      };
    } catch (e) {
      // Fallback if battery info not available
      return {
        charge_level: 0,
        cable_connected: false,
        is_charging: false,
        is_error: true
      };
    }
  }

  /**
   * Send output report to the NACON controller
   */
  async sendOutputReport(reportId, data) {
    if (!this.device?.opened) {
      throw new Error('Device is not opened');
    }
    try {
      console.log(`Sending NACON output report:`, reportId, buf2hex(data));
      await this.device.sendReport(reportId, new Uint8Array(data));
    } catch (error) {
      throw new Error(`Failed to send output report: ${error.message}`);
    }
  }

  /**
   * Update the current output state
   */
  updateCurrentOutputState(state) {
    this.currentOutputState = { ...state };
  }

  /**
   * Get a copy of the current output state
   */
  getCurrentOutputState() {
    return { ...this.currentOutputState };
  }

  getNumberOfSticks() {
    return 2;
  }

  /**
   * Get the list of supported quick tests for NACON controller
   */
  getSupportedQuickTests() {
    return ['buttons', 'sticks', 'triggers'];
  }

  /**
   * Flash/save changes to the NACON controller
   */
  async flash(progressCallback = null) {
    la("nacon_flash");
    try {
      return { success: true, message: l("Changes saved successfully") };
    } catch(error) {
      throw new Error(l("Error while saving changes"), { cause: error });
    }
  }

  /**
   * Reset the NACON controller to default state
   */
  async reset() {
    la("nacon_reset");
    try {
      await this.setVibration(0, 0);
    } catch(error) {
      console.warn("Failed to reset NACON controller:", error);
    }
  }

  /**
   * Query calibration status
   */
  async queryNvStatus() {
    try {
      return {
        device: 'nacon',
        status: 'system',
        locked: false,
        mode: 'gamepad-api',
        code: 0
      };
    } catch (error) {
      return { device: 'nacon', status: 'error', locked: null, code: 2, error };
    }
  }
}

export default NaconController;
