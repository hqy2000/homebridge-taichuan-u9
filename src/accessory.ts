import {
  AccessoryConfig,
  AccessoryPlugin,
  API,
  HAP,
  Logging,
  Service,
} from 'homebridge';
import U9UDPProtocol from './protocol';


let hap: HAP;

/*
 * Initializer function called when the plugin is loaded.
 */
export = (api: API) => {
  hap = api.hap;
  api.registerAccessory('U9AccessControl', U9AccessControl);
};

class U9AccessControl implements AccessoryPlugin {
    private readonly log: Logging;
    private readonly name: string;
    private readonly _api: API;
    private readonly ip: string;
    private readonly protocol: U9UDPProtocol;
    private isUnlocked = false;
    private isExpectedUnlocked = false;

    private readonly lockService: Service;
    private readonly informationService: Service;

    constructor(log: Logging, config: AccessoryConfig, api: API) {
      this.log = log;
      this.name = config.name;
      this.ip = config.ip;
      this._api = api;

      this.lockService = new hap.Service.LockMechanism(this.name);
      this.lockService.getCharacteristic(hap.Characteristic.LockCurrentState)
        .onGet(this.handleLockCurrentStateGet.bind(this));

      this.lockService.getCharacteristic(hap.Characteristic.LockTargetState)
        .onGet(this.handleLockTargetStateGet.bind(this))
        .onSet(this.handleLockTargetStateSet.bind(this));

      this.informationService = new hap.Service.AccessoryInformation()
        .setCharacteristic(hap.Characteristic.Manufacturer, 'Taichuan')
        .setCharacteristic(hap.Characteristic.Model, 'U9')
        .setCharacteristic(hap.Characteristic.SerialNumber, '')
        .setCharacteristic(hap.Characteristic.FirmwareRevision, '0.0.0');

      this.protocol = new U9UDPProtocol();

      log.info(this.name + '@' + this.ip + ' finished initializing!');
    }

    /**
     * Handle requests to get the current value of the "Lock Current State" characteristic
     */
    handleLockCurrentStateGet() {
      this.log.debug('Triggered GET LockCurrentState');

      if (this.isUnlocked) {
        return hap.Characteristic.LockCurrentState.UNSECURED;
      } else {
        return hap.Characteristic.LockCurrentState.SECURED;
      }
    }

    /**
     * Handle requests to get the current value of the "Lock Target State" characteristic
     */
    handleLockTargetStateGet() {
      this.log.debug('Triggered GET LockTargetState');

      if (this.isExpectedUnlocked) {
        return hap.Characteristic.LockTargetState.UNSECURED;
      } else {
        return hap.Characteristic.LockTargetState.SECURED;
      }
    }

    /**
     * Handle requests to set the "Lock Target State" characteristic
     */
    handleLockTargetStateSet(value) {
      this.log.debug('Triggered SET LockTargetState:' + value);
      if (value === hap.Characteristic.LockCurrentState.UNSECURED) {
        try {
          this.isExpectedUnlocked = true;
          this.protocol.unlock(this.ip, ()=>{
            this.isUnlocked = true;
            setTimeout(() => {
              this.isExpectedUnlocked = false;
              this.isUnlocked = false;
            }, 5000);
          });
        } catch (e) {
          this.log.error(JSON.stringify(e));
          this.isUnlocked = false;
          this.isExpectedUnlocked = false;
        }

      }
    }


    /*
     * This method is optional to implement. It is called when HomeKit ask to identify the accessory.
     * Typical this only ever happens at the pairing process.
     */
    identify(): void {
      this.log('Identify!');
    }

    /*
     * This method is called directly after creation of this instance.
     * It should return all services which should be added to the accessory.
     */
    getServices(): Service[] {
      return [
        this.informationService,
        this.lockService,
      ];
    }

}
