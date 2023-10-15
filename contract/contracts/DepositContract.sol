// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

error InvalidAddress();
error InsufficientFunds();
error FeeBasisPointsExceedBase();

contract DepositContract is UUPSUpgradeable, OwnableUpgradeable {
    mapping(address => uint256) public balances;
    address public companyAddress;
    uint256 public feeBasisPoints; // 0.1% fee
    uint256 public constant feeBase = 10000;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event Sent(
        address indexed sender,
        address indexed receiver,
        uint256 amount
    );

    function initialize(
        address _companyAddress,
        uint _feeBasisPoints
    ) external initializer {
        companyAddress = _companyAddress;
        feeBasisPoints = _feeBasisPoints;

        _transferOwnership(msg.sender);
    }

    function setBasisPoint(uint _points) external onlyOwner {
        if (_points > feeBase) revert FeeBasisPointsExceedBase();
        feeBasisPoints = _points;
    }

    function deposit() external payable {
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external payable {
        if (balances[msg.sender] < amount) revert InsufficientFunds();

        balances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
        emit Withdrawn(msg.sender, amount);
    }

    function sendTo(address recipient, uint256 amount) external {
        if (balances[msg.sender] < amount) revert InsufficientFunds();

        uint256 fee = (amount * feeBasisPoints) / feeBase;
        uint256 netAmount = amount - fee;

        balances[msg.sender] -= amount;
        balances[recipient] += netAmount;
        balances[companyAddress] += fee;

        emit Sent(msg.sender, recipient, netAmount);
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}

    uint256[50] private __gap;
}
