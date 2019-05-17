pragma solidity 0.5.0;
import "./Running.sol";
import "./SafeMath.sol";

contract Splitter is Running
{
    mapping(address => uint) public accounts;
    event LogShare(address indexed sender, address indexed firstAccount, address indexed secondAccount, uint256 originalAmount);
    event LogWithdrawn(address indexed sender, uint256 amount);
    using SafeMath for uint256;

    constructor(bool running)
        Running(running)
        public
    {
    }

    function share(address firstAccount, address secondAccount)
        public
        payable
        whenRunning
        returns(bool success)
    {
        require(msg.value > 1, "Value is invalid");
        require(firstAccount != address(0), "First account is invalid");
        require(secondAccount != address(0), "Second account is invalid");
        require((firstAccount != msg.sender) && (secondAccount != msg.sender), "You cannot share to yourself");

        // If the Wei is odd we send back 1 Wei to sender
        uint remainder = msg.value % 2;
        if (remainder > 0)
        {
            accounts[msg.sender] = accounts[msg.sender].add(remainder);
        }

        uint256 sharedAmount = msg.value.div(2);

        accounts[firstAccount] = accounts[firstAccount].add(sharedAmount);
        accounts[secondAccount] = accounts[secondAccount].add(sharedAmount);

        emit LogShare(msg.sender, firstAccount, secondAccount, msg.value);
        return true;
    }

    function withdraw()
        public
        whenRunning
        returns(bool success)
    {
        uint256 accountBalance = accounts[msg.sender];
        require(accountBalance > 0, "Nothing to withdraw");
        accounts[msg.sender] = 0;

        emit LogWithdrawn(msg.sender, accountBalance);

        msg.sender.transfer(accountBalance);

        return true;
    }
}