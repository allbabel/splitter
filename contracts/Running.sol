pragma solidity 0.5.0;
import "./Owned.sol";

contract Running is Owned
{
    bool private running;

    event LogRunningChanged(bool oldRunning, bool newRunning);

    modifier isRunning
    {
        require(running, "We have stopped");
        _;
    }

    constructor() public
    {
    }

    function getRunning() public view returns(bool)
    {
        return running;
    }

    function pause() public isOwner
    {
        setRunning(false);
    }

    function resume() public isOwner
    {
        setRunning(true);
    }

    function setRunning(bool newRunning) private
        isOwner
    {
        emit LogRunningChanged(running, newRunning);
        running = newRunning;
    }
}