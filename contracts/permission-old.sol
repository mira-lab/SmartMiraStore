pragma solidity ^0.4.11;

contract SecretStorePermissions {
    mapping (uint => bytes32) keysIndex;
    mapping (bytes32 => address) keyOwner;
    mapping (bytes32 => bytes32) pins;
    uint keysCount;

    function addKeyAccess(address user, bytes32 document, bytes32 pin) public returns (bool) {
        for(uint i = 0; i < keysCount; i++) {
            if (keysIndex[i] == document) {
                return false;
            }
        }
        keysIndex[keysCount] = document;
        keyOwner[document] = user;
        pins[document] = pin;
        keysCount = keysCount + 1;
        return true;
    }

    function rmKeyAccess(address user, bytes32 document, bytes32 pin) public returns (bool) {
        for(uint i = 0; i < keysCount; i++) {
            if (keysIndex[i] == document) {
                if ((keyOwner[document] == user) && (pins[document] == pin)) {
                    delete keysIndex[i];
                    delete keyOwner[document];
                    delete pins[document];
                    keysCount = keysCount - 1;
                    return true;
                } else {
                    return false;
                }
            }
        }
        return false;
    }

    function checkKeyAccess(address user, bytes32 document, bytes32 pin) public returns (bool) {
        for(uint i = 0; i < keysCount; i++) {
            if (keysIndex[i] == document) {
                return (keyOwner[document] == user) && (pins[document] == pin);
            }
        }
        return false;
    }

    function whoAccess(bytes32 document) public returns (address) {
        for(uint i = 0; i < keysCount; i++) {
            if (keysIndex[i] == document) {
                return keyOwner[document];
            }
        }
        return 0;
    }

    function permittedCount(bytes32 document) public returns (uint256) {
        return keysCount;
    }

    function checkPermissions(address user, bytes32 document) public constant returns (bool) {
        for(uint i = 0; i < keysCount; i++) {
            if ((keysIndex[i] == document) && (keyOwner[keysIndex[i]] == user)) {
                return true;
            }
        }
        return false;
    }
}
