var Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerPlatform("homebridge-lock-test", "SomeLockBridge2", SomeLockBridgePlatform2);
  homebridge.registerAccessory("homebridge-lock-test", "SomeLock2", SomeLockAccessory2);
  homebridge.registerAccessory("homebridge-lock-test", "SomeSwitch2", SomeSwitchAccessory2);
};

function SomeLockBridgePlatform2(log, config) {
  this.log = log;
}

SomeLockBridgePlatform2.prototype = {

  accessories : function(callback) {
    var accessories = [];
    accessories.push(new SomeLockAccessory2(this.log));
    accessories.push(new SomeSwitchAccessory2(this.log));
    callback(accessories);
  }
}

function SomeLockAccessory2(log) {
  this.log = log;
  this.id = "someId2";
  this.name = "someLockName";

  this.lockServiceALocked = true;
  this.lockServiceBLocked = true;
  this.lockServiceCLocked = true;

  this.informationService = new Service.AccessoryInformation();
  this.informationService.setCharacteristic(Characteristic.Manufacturer, "SomeLock.io").setCharacteristic(Characteristic.Model, "Some Lock").setCharacteristic(Characteristic.SerialNumber, "SomeLock.io-Id " + this.id);

  this.lockServiceA = new Service.LockMechanism(this.name + " A", this.name + " A");
  this.lockServiceA.getCharacteristic(Characteristic.LockCurrentState).on('get', this.getStateA.bind(this));
  this.lockServiceA.getCharacteristic(Characteristic.LockTargetState).on('get', this.getStateA.bind(this)).on('set', this.setStateA.bind(this));

  this.lockServiceB = new Service.LockMechanism(this.name + " B", this.name + " B");
  this.lockServiceB.getCharacteristic(Characteristic.LockCurrentState).on('get', this.getStateB.bind(this));
  this.lockServiceB.getCharacteristic(Characteristic.LockTargetState).on('get', this.getStateB.bind(this)).on('set', this.setStateOther.bind(this, this.lockServiceB));

  this.lockServiceC = new Service.LockMechanism(this.name + " C", this.name + " C");
  this.lockServiceC.getCharacteristic(Characteristic.LockCurrentState).on('get', this.getStateC.bind(this));
  this.lockServiceC.getCharacteristic(Characteristic.LockTargetState).on('get', this.getStateC.bind(this)).on('set', this.setStateOther.bind(this, this.lockServiceC));
};

SomeLockAccessory2.prototype.getStateA = function(callback) {
  callback(null, this.lockServiceALocked ? Characteristic.LockCurrentState.SECURED : Characteristic.LockCurrentState.UNSECURED);
};

SomeLockAccessory2.prototype.getStateB = function(callback) {
  callback(null, this.lockServiceBLocked ? Characteristic.LockCurrentState.SECURED : Characteristic.LockCurrentState.UNSECURED);
};

SomeLockAccessory2.prototype.getStateC = function(callback) {
  callback(null, this.lockServiceCLocked ? Characteristic.LockCurrentState.SECURED : Characteristic.LockCurrentState.UNSECURED);
};

SomeLockAccessory2.prototype.setStateA = function(state, callback) {
  this.setStateOther(this.lockServiceA, state, callback);
  // callback gets executed in setStateOther

  setTimeout(() => {
    // Additionally mirror current state to lockServiceB
    this.lockServiceBLocked = true;
    this.lockServiceB.getCharacteristic(Characteristic.LockTargetState).updateValue(state);
    this.lockServiceB.getCharacteristic(Characteristic.LockCurrentState).updateValue(state);
  }, 1000);
};

SomeLockAccessory2.prototype.setStateOther = function (service, state, callback) {
  this.log("S E T S T A T E: service=" + service.getCharacteristic(Characteristic.Name).value + "; SECURING=" + (state === Characteristic.LockTargetState.SECURED));

  const locked = state === Characteristic.LockTargetState.SECURED;
  if (service === this.lockServiceA) {
    this.lockServiceALocked = locked;
  } else if (service === this.lockServiceB) {
    this.lockServiceBLocked = locked;
  } else if (service === this.lockServiceC) {
    this.lockServiceCLocked = locked;
  }

  callback(); // return callback before we update the LockCurrentState characteristic
  service.getCharacteristic(Characteristic.LockCurrentState).updateValue(state);
};

SomeLockAccessory2.prototype.getServices = function() {
  return [ this.lockServiceA,
    this.lockServiceB,
    this.lockServiceC,
    this.informationService ];
};

function SomeSwitchAccessory2(log) {
  this.log = log;
  this.id = "someSwitchId2";
  this.name = "someSwitchName";

  this.switchAOn = false;
  this.switchBOn = false;
  this.switchCOn = false;

  this.informationService = new Service.AccessoryInformation();
  this.informationService.setCharacteristic(Characteristic.Manufacturer, "SomeSwitch.io").setCharacteristic(Characteristic.Model, "SomeSwitch.io Switch").setCharacteristic(Characteristic.SerialNumber, "SomeSwitch.io-Id " + this.id);

  this.switchServiceA = new Service.Switch(this.name + " A", this.name + " A");
  this.switchServiceA.getCharacteristic(Characteristic.On).on('get', this.getStateA.bind(this)).on('set', this.setState.bind(this, "A"));

  this.switchServiceB = new Service.Switch(this.name + " B", this.name + " B");
  this.switchServiceB.getCharacteristic(Characteristic.On).on('get', this.getStateB.bind(this)).on('set', this.setState.bind(this, "B"));

  this.switchServiceC = new Service.Switch(this.name + " C", this.name + " C");
  this.switchServiceC.getCharacteristic(Characteristic.On).on('get', this.getStateC.bind(this)).on('set', this.setState.bind(this, "C"));
}

SomeSwitchAccessory2.prototype.getStateA = function(callback) {
  this.log("Getting current state for A '%s'...", this.id);
  callback(null, this.switchAOn);
};

SomeSwitchAccessory2.prototype.getStateB = function(callback) {
  this.log("Getting current state for B '%s'...", this.id);
  callback(null, this.switchBOn);
};

SomeSwitchAccessory2.prototype.getStateC = function(callback) {
  this.log("Getting current state for C '%s'...", this.id);
  callback(null, this.switchCOn);
};

SomeSwitchAccessory2.prototype.execSwitchAction = function(switchType, powerOn, callback) {
  if (switchType === "A") {
    this.switchAOn = powerOn;
  }
  else if (switchType === "B") {
    this.switchBOn = powerOn;
  }
  else {
    this.switchCOn = powerOn;
  }
  callback();
  this.log("execSwitchAction is execute for switchType '%s' and powerOn '%s'", switchType, powerOn);
}

SomeSwitchAccessory2.prototype.setState = function(switchType, powerOn, callback, context) {
  this.log("Switch state for '%s' '%s' to '%s'...", this.id, switchType, powerOn);

  if (switchType === "C") {
    callback(null);
    return;
  }
  var mySwitchActionCallback = function() {
    // update lock service A
    this.switchServiceA.getCharacteristic(Characteristic.On).updateValue(powerOn, undefined, null);

    // update lock service B
    this.switchServiceB.getCharacteristic(Characteristic.On).updateValue(powerOn, undefined, "myContextString");

    callback(null);
  }.bind(this);

  if (context === "myContextString") {
    // only call callback as characteristic already has corret state
    callback(null);
  }
  else {
    this.execSwitchAction(switchType, powerOn, mySwitchActionCallback);
  }
};

SomeSwitchAccessory2.prototype.getServices = function() {
  return [ this.switchServiceA, this.switchServiceB, this.switchServiceC, this.informationService ];
};
