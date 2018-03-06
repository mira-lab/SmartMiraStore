pragma solidity ^0.4.11;

contract PinSecretStorePermissions {
    address private _masterAdmin;

    struct SecretStoreKey {
        address keyOwner;
        bytes32 pin;
        bool allowChangeOwner;
    }

    mapping (bytes32 => SecretStoreKey) secretStoreKeys;
    uint keysCount;

    function PinSecretStorePermissions() {
        _masterAdmin = msg.sender;
    }

    function changePin(bytes32 document, bytes32 oldPin, bytes32 newPin, bool allowChangeOwner) public returns (bool) {
        require(secretStoreKeys[document]);

        if ((msg.sender != secretStoreKeys[document].keyOwner) || (secretStoreKeys[document].pin != oldPin)) {
            return false;
        }
        secretStoreKeys[document].pin = newPin;
        secretStoreKeys[document].allowChangeOwner = allowChangeOwner;
        return true;
    }

    function changeOwner(bytes32 document, bytes32 accessPin, bytes32 setPin) public returns (bool) {
        require(secretStoreKeys[document]);

        if ((!secretStoreKeys[document].allowChangeOwner) || (secretStoreKeys[document].pin != accessPin)) {
            return false;
        }
        secretStoreKeys[document].pin = setPin;
        secretStoreKeys[document].allowChangeOwner = false;
        return true;
    }

    function addKey(bytes32 document, address user, bytes32 pin) public returns (bool) {
        require(!secretStoreKeys[document]);

        secretStoreKeys[document] = {
            keyOwner: user,
            pin: pin,
            allowChangeOwner: false
        }
        keysCount = keysCount + 1;
        return true;
    }

    function checkKeyAccess(bytes32 document, address user, bytes32 pin) public returns (bool) {
        require(secretStoreKeys[document]);
        return (secretStoreKeys[i].keyOwner == user) && (secretStoreKeys[i].pin == pin);
    }

    function whoAccess(bytes32 document) public returns (address) {
        require(secretStoreKeys[document]);
        return secretStoreKeys[document].keyOwner;
    }

    function permittedCount(bytes32 document) public returns (uint256) {
        return keysCount;
    }

    function checkPermissions(bytes32 document, address user) public constant returns (bool) {
        require(secretStoreKeys[document]);
        return secretStoreKeys[document].keyOwner == user;
    }
}
