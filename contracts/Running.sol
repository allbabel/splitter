pragma solidity 0.5.8;
import "./Owned.sol";

contract Running is Owned
{
    bool running;

    event LogRunningChanged(bool oldRunning, bool newRunning);

    modifier isRunning
    {
        require(running, "We have stopped");
        _;
    }

    constructor() public
    {
        // By default we are stopped
        running = false;
    }

    function setRunning(bool newRunning) public isOwner
    {
        emit LogRunningChanged(running, newRunning);
        running = newRunning;
    }
}