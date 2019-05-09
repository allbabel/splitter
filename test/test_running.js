const truffleAssert = require('truffle-assertions');
const RunningContract = artifacts.require("./Running.sol");

contract('Running', accounts => {

    const ownerAccount = accounts[0];
    const firstAccount = accounts[1];

    let contract;

    it('Running by default is false', async () => {

        contract = await RunningContract.deployed();

        assert.isFalse(await contract.running());
    });

    it('the owner should be able to change running', async () => {
        
        const txObj = await contract.setRunning(true, {from: ownerAccount});
        
        assert.isTrue(await contract.running());
        assert.strictEqual(txObj.logs.length, 1, 'We should have an event');
        assert.strictEqual(txObj.logs[0].event, 'LogRunningChanged');
    });

    it('only the owner can change the running state', async () => {

        await truffleAssert.reverts(
            contract.setRunning(true, {from: firstAccount}),
            'Owner permission required'
        );

    });
});