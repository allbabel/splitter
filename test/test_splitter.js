const truffleAssert = require('truffle-assertions');
const SplitterContract = artifacts.require("./Splitter.sol");

contract('Splitter', function(accounts) {

    const[ownerAccount, firstAccount, secondAccount] = accounts;
    const amountToShare = web3.utils.toBN(web3.utils.toWei('0.1', 'ether'));
    let instance;
        
    beforeEach('initialise contract', async function() {
        instance = await SplitterContract.new({from: ownerAccount});
    });

    it('Running by default is true', async function() {

        assert.isTrue(await instance.getRunning());
    });

    it('share 1 ether between 2 other users', async function() {
        
        const txObj = await instance.share( firstAccount, 
                                            secondAccount, 
                                            {from:ownerAccount, value:amountToShare});

        assert.strictEqual(txObj.logs.length, 1, 'We should have an event');
        assert.strictEqual(txObj.logs[0].event, 'LogShare');
    
        // We should see the contract with a balance of 1 ether

        assert.strictEqual( await web3.eth.getBalance(instance.address), 
                            amountToShare.toString(10), 
                            'Amount in contract needs to be that shared');
        
        // We should see firstAccount and SecondAccount with 1/2 ether
        
        assert.strictEqual( (await instance.getBalanceForAccount(firstAccount)).toString(10), 
                            (amountToShare / 2).toString(10), 
                            'Amount shared needs to be half for first account');
        
        assert.strictEqual( (await instance.getBalanceForAccount(secondAccount)).toString(10), 
                            (amountToShare / 2).toString(10), 
                            'Amount shared needs to be half for second account');
        
    });

    it('withdraw balance for first account', async function() {
        
        var txObj = await instance.share( firstAccount, 
                                            secondAccount, 
                                            {from:ownerAccount, value:amountToShare});

        assert.strictEqual(txObj.logs.length, 1, 'We should have an event');
        assert.strictEqual(txObj.logs[0].event, 'LogShare');

        const originalBalance = web3.utils.toBN(await web3.eth.getBalance(firstAccount));
        const amount = await instance.getBalanceForAccount.call(firstAccount);
        txObj = await instance.withdraw({from: firstAccount});

        assert.strictEqual(txObj.logs.length, 1, 'We should have an event');
        assert.strictEqual(txObj.logs[0].event, 'LogWithdrawn');
        
        var tx = await web3.eth.getTransaction(txObj.receipt.transactionHash);
        var txFee = web3.utils.toBN(tx.gasPrice * txObj.receipt.gasUsed);

        const newBalance = web3.utils.toBN(await web3.eth.getBalance(firstAccount));
        
        assert.strictEqual( originalBalance.add(amount).sub(txFee).toString(10), 
                            newBalance.toString(10),
                            'New balance is not correct');
    });

    it('account balances should increase on each share', async function() {
        
        var txObj_1 = await instance.share( firstAccount, 
                                            secondAccount, 
                                            {from: ownerAccount, value: amountToShare});

        assert.strictEqual(txObj_1.logs.length, 1, 'We should have an event');
        assert.strictEqual(txObj_1.logs[0].event, 'LogShare');

        var balanceFirstAccount_1 = await instance.getBalanceForAccount(firstAccount);
        var balanceSecondAccount_1 = await instance.getBalanceForAccount(secondAccount);

        var txObj_2 = await instance.share( firstAccount, 
                                            secondAccount, 
                                            {from: ownerAccount, value: amountToShare});
        
        var balanceFirstAccount_2 = await instance.getBalanceForAccount(firstAccount);
        var balanceSecondAccount_2 = await instance.getBalanceForAccount(secondAccount);
        
        assert.strictEqual(txObj_2.logs.length, 1, 'We should have an event');
        assert.strictEqual(txObj_2.logs[0].event, 'LogShare');

        const sharedAmount = web3.utils.toBN(amountToShare / 2);
        
        assert.strictEqual( balanceFirstAccount_1.add(sharedAmount).toString(10), 
                            balanceFirstAccount_2.toString(10), 
                            'First account should have increased by shared amount');
        assert.strictEqual( balanceSecondAccount_1.add(sharedAmount).toString(10), 
                            balanceSecondAccount_2.toString(10), 
                            'Second account should have increased by shared amount');
    });
});