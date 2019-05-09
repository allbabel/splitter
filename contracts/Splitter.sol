pragma solidity 0.5.0;
import "./Running.sol";

contract Splitter is Running
{
    mapping(address => uint) accounts;
    mapping(address => bool) validAccounts;
    address[] accountList;

    event LogShare(address indexed sender, address indexed firstAccount, address indexed secondAccount, uint256 originalAmount);
    event LogWithdrawn(address indexed sender, uint256 amount);

    constructor()
        public
    {
        setRunning(true);
    }

    function addAccount(address addr, uint balance)
        private
    {
        require(addr != address(0x0), 'need valid address');
        require(balance >= 0, 'balance has to be greater than zero');

        if (!validAccounts[addr])
        {
            accountList.push(addr);
            validAccounts[addr] = true;
        }

        accounts[addr] += balance;
    }

    function getNumberOfAccounts()
        public
        view
        returns(uint)
    {
        return accountList.length;
    }

    function getBalanceForAccount(address account)
        public
        view
        returns(uint256 balance)
    {
        return accounts[account];
    }

    function share(address firstAccount, address secondAccount)
        public
        payable
        isRunning
        returns(bool success)
    {
        require(msg.value > 0, "Value is invalid");
        require(msg.value % 2 == 0, "Value needs to be divisable by two");
        require(firstAccount != address(0), "First account is invalid");
        require(secondAccount != address(0), "Second account is invalid");
        require((firstAccount != msg.sender) || (secondAccount != msg.sender), "You cannot share to yourself");

        uint256 originalAmount = msg.value;
        uint256 sharedAmount = originalAmount / 2;

        addAccount(firstAccount, sharedAmount);
        addAccount(secondAccount, sharedAmount);

        emit LogShare(msg.sender, firstAccount, secondAccount, originalAmount);
        return true;
    }

    function withdraw()
        public
        isRunning
        returns(bool success)
    {
        uint256 accountBalance = accounts[msg.sender];
        require(accountBalance > 0, "Nothing to withdraw");
        accounts[msg.sender] = 0;

        msg.sender.transfer(accountBalance);

        emit LogWithdrawn(msg.sender, accountBalance);
        return true;
    }
}