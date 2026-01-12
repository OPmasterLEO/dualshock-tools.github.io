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

// Xbox 360 Button mapping configuration
const XBOX360_BUTTON_MAP = [
  { name: 'up', byte: 2, mask: 0x01, svg: 'Up' },
  { name: 'down', byte: 2, mask: 0x02, svg: 'Down' },
  { name: 'left', byte: 2, mask: 0x04, svg: 'Left' },
  { name: 'right', byte: 2, mask: 0x08, svg: 'Right' },
  { name: 'start', byte: 2, mask: 0x10, svg: 'Start' },
  { name: 'back', byte: 2, mask: 0x20, svg: 'Back' },
  { name: 'l3', byte: 2, mask: 0x40, svg: 'L3' },
  { name: 'r3', byte: 2, mask: 0x80, svg: 'R3' },
  { name: 'lb', byte: 3, mask: 0x01, svg: 'LB' },
  { name: 'rb', byte: 3, mask: 0x02, svg: 'RB' },
  { name: 'guide', byte: 3, mask: 0x04, svg: 'Guide' },
  { name: 'a', byte: 3, mask: 0x10, svg: 'A' },
  { name: 'b', byte: 3, mask: 0x20, svg: 'B' },
  { name: 'x', byte: 3, mask: 0x40, svg: 'X' },
  { name: 'y', byte: 3, mask: 0x80, svg: 'Y' },
];

// Xbox 360 Input processing configuration
const XBOX360_INPUT_CONFIG = {
  buttonMap: XBOX360_BUTTON_MAP,
  leftStickXByte: 6,
  leftStickYByte: 7,
  rightStickXByte: 8,
  rightStickYByte: 9,
  ltByte: 4,
  rtByte: 5,
};

// Xbox 360 Output Report Constants
const XBOX360_OUTPUT_REPORT = {
  REPORT_ID: 0x00,
  RUMBLE_REPORT_SIZE: 6,
};

/**
 * Xbox 360 Controller class for Gamepad API with HID support
 * Handles input/output reports for Xbox 360 controllers
 */
class Xbox360Controller extends BaseController {
  constructor(device) {
    super(device);
    this.model = "Xbox 360 Controller";
    this.finetuneMaxValue = 255;
    this.currentOutputState = {
      leftRumble: 0,
      rightRumble: 0,
    };
  }

  getInputConfig() {
    return XBOX360_INPUT_CONFIG;
  }

  async getSerialNumber() {
    // Xbox 360 controllers don't expose serial numbers via HID
    // Return a placeholder
    return "N/A";
  }

  async getInfo() {
    // Device-only: collect info and return a common structure
    try {
      const infoItems = [
        { key: l("Device Type"), value: "Xbox 360 Controller", cat: "hw" },
        { key: l("Connection Type"), value: "USB", cat: "hw" },
        { key: l("HW Version"), value: "N/A", cat: "hw" },
        { key: l("SW Version"), value: "N/A", cat: "fw" },
      ];

      la("xbox360_get_info");

      return { ok: true, infoItems, nv: { device: 'xbox360', status: 'n/a', locked: null }, disable_bits: 0, rare: false };
    } catch(error) {
      return { ok: false, error, disable_bits: 0 };
    }
  }

  /**
   * Xbox 360 controller calibration begin
   * Sets up the controller for stick center calibration
   */
  async calibrateSticksBegin() {
    la("xbox360_calibrate_sticks_begin");
    try {
      // Prepare controller for calibration by zeroing rumble
      await this.setVibration(0, 0);
      await sleep(100);
      return { ok: true };
    } catch(error) {
      la("xbox360_calibrate_sticks_begin_failed", {"r": error});
      return { ok: false, error };
    }
  }

  /**
   * Xbox 360 controller calibration sample
   * Takes a sample of the stick center position
   */
  async calibrateSticksSample() {
    la("xbox360_calibrate_sticks_sample");
    try {
      // Sample is handled by the application layer reading the stick values
      // This method just needs to succeed without throwing an error
      return { ok: true };
    } catch(error) {
      return { ok: false, error };
    }
  }

  /**
   * Xbox 360 controller calibration end
   * Completes the stick center calibration
   */
  async calibrateSticksEnd() {
    la("xbox360_calibrate_sticks_end");
    try {
      // Calibration is handled by the application layer
      // Reset vibration to ensure clean state
      await this.setVibration(0, 0);
      await sleep(100);
      return { ok: true };
    } catch(error) {
      la("xbox360_calibrate_sticks_end_failed", {"r": error});
      return { ok: false, error };
    }
  }

  /**
   * Xbox 360 controller range calibration begin
   * Sets up the controller for stick range calibration
   */
  async calibrateRangeBegin() {
    la("xbox360_calibrate_range_begin");
    try {
      // Prepare controller for range calibration
      await this.setVibration(0, 0);
      await sleep(100);
      return { ok: true };
    } catch(error) {
      la("xbox360_calibrate_range_begin_failed", {"r": error});
      return { ok: false, error };
    }
  }

  /**
   * Xbox 360 controller range calibration end
   * Completes the stick range calibration
   */
  async calibrateRangeEnd() {
    la("xbox360_calibrate_range_end");
    try {
      // Range calibration is handled by the application layer
      // Reset vibration to ensure clean state
      await this.setVibration(0, 0);
      await sleep(100);
      return { ok: true };
    } catch(error) {
      la("xbox360_calibrate_range_end_failed", {"r": error});
      return { ok: false, error };
    }
  }

  /**
   * Set vibration motors for haptic feedback
   * @param {number} leftMotor - Left motor intensity (0-255)
   * @param {number} rightMotor - Right motor intensity (0-255)
   */
  async setVibration(leftMotor = 0, rightMotor = 0) {
    try {
      // Xbox 360 output report: [0x00, leftMotor, rightMotor, 0, 0, 0]
      const reportData = new Uint8Array([
        0x00, // Report ID
        Math.max(0, Math.min(255, leftMotor)),
        Math.max(0, Math.min(255, rightMotor)),
        0x00,
        0x00,
        0x00,
      ]);

      await this.device.sendReport(0x00, reportData);

      this.currentOutputState.leftRumble = leftMotor;
      this.currentOutputState.rightRumble = rightMotor;

      return { success: true, message: "Vibration set successfully" };
    } catch (error) {
      throw new Error("Failed to set vibration", { cause: error });
    }
  }

  /**
   * Initialize the current output state when the controller is first connected
   */
  async initializeCurrentOutputState() {
    try {
      // Reset vibration to default (off)
      await this.setVibration(0, 0);
    } catch (error) {
      console.warn("Failed to initialize Xbox 360 output state:", error);
    }
  }

  /**
   * Parse Xbox 360 battery status from input data
   * Xbox 360 controllers have battery info in different formats
   */
  parseBatteryStatus(data) {
    // Xbox 360 wired controllers always show as charging (USB powered)
    // Wireless controllers have battery bytes at position 20 (for wireless adapters)
    
    // For this implementation, we'll assume USB powered (wired)
    return {
      charge_level: 100,
      cable_connected: true,
      is_charging: false,
      is_error: false
    };
  }

  /**
   * Send output report to the Xbox 360 controller
   */
  async sendOutputReport(reportId, data) {
    if (!this.device?.opened) {
      throw new Error('Device is not opened');
    }
    try {
      console.log(`Sending output report:`, reportId, buf2hex(data));
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
   * Get the list of supported quick tests for Xbox 360 controller
   * Xbox 360 supports button test, stick movement, and trigger test
   */
  getSupportedQuickTests() {
    return ['buttons', 'sticks', 'triggers'];
  }

  /**
   * Flash/save changes to the Xbox 360 controller
   * Note: Xbox 360 controllers don't have persistent storage like DS4/DS5
   */
  async flash(progressCallback = null) {
    la("xbox360_flash");
    try {
      // Xbox 360 controllers don't have NVS or persistent settings
      // Calibration is handled via the Gamepad API
      return { success: true, message: l("Changes saved successfully") };
    } catch(error) {
      throw new Error(l("Error while saving changes"), { cause: error });
    }
  }

  /**
   * Reset the Xbox 360 controller to default state
   */
  async reset() {
    la("xbox360_reset");
    try {
      await this.setVibration(0, 0);
    } catch(error) {
      console.warn("Failed to reset Xbox 360 controller:", error);
    }
  }

  /**
   * Query calibration status (Xbox 360 controllers use OS-level calibration)
   */
  async queryNvStatus() {
    try {
      return {
        device: 'xbox360',
        status: 'system',
        locked: false,
        mode: 'gamepad-api',
        code: 0
      };
    } catch (error) {
      return { device: 'xbox360', status: 'error', locked: null, code: 2, error };
    }
  }
}

export default Xbox360Controller;
