const truffleAssert = require('truffle-assertions');
const SplitterContract = artifacts.require("./Splitter.sol");

contract('Splitter', accounts => {

    const ownerAccount = accounts[0];
    const firstAccount = accounts[1];
    const secondAccount = accounts[2];
    const amountToShare = web3.utils.toBN(web3.utils.toWei('1', 'ether'));
    let contract;
        
    it('Running by default is true', async () => {

        contract = await SplitterContract.new();
        assert.isTrue(await contract.running());
    });

    it('share 1 ether between 2 other users', async () => {
        
        const ownerAccountBalance = web3.utils.toBN(await web3.eth.getBalance(ownerAccount));
        
        const txObj = await contract.share( firstAccount, 
                                            secondAccount, 
                                            {from:ownerAccount, value:amountToShare});

        assert.strictEqual(txObj.logs.length, 1, 'We should have an event');
        assert.strictEqual(txObj.logs[0].event, 'LogShare');

        // We should the sender account balance reduce by 1 ether plus transaction fee
        const ownerNewAccountBalance = web3.utils.toBN(await web3.eth.getBalance(ownerAccount));
        
        var tx = await web3.eth.getTransaction(txObj.receipt.transactionHash);
        var txFee = web3.utils.toBN(tx.gasPrice * txObj.receipt.gasUsed);
        
        assert.strictEqual( ownerAccountBalance.sub(amountToShare).sub(txFee).toString(10), 
                            ownerNewAccountBalance.toString(10), 
                            'Balance should be amount shared less');
    
        // We should see the contract with a balance of 1 ether

        assert.strictEqual( await web3.eth.getBalance(contract.address), 
                            amountToShare.toString(10), 
                            'Amount in contract needs to be that shared');
        
        // We should see firstAccount and SecondAccount with 1/2 ether
        
        assert.strictEqual( await contract.getBalanceForAccount(firstAccount).then(b => b.toString(10)), 
                            (amountToShare / 2).toString(10), 
                            'Amount shared needs to be half for first account');
        
        assert.strictEqual( await contract.getBalanceForAccount(secondAccount).then(b => b.toString(10)), 
                            (amountToShare / 2).toString(10), 
                            'Amount shared needs to be half for second account');
        
    });

    it('withdraw balance for first account', async () => {

        const originalBalance = web3.utils.toBN(await web3.eth.getBalance(firstAccount));
        const amount = await contract.getBalanceForAccount.call(firstAccount);
        var txObj = await contract.withdraw({from: firstAccount});

        assert.strictEqual(txObj.logs.length, 1, 'We should have an event');
        assert.strictEqual(txObj.logs[0].event, 'LogWithdrawn');
        
        var tx = await web3.eth.getTransaction(txObj.receipt.transactionHash);
        var txFee = web3.utils.toBN(tx.gasPrice * txObj.receipt.gasUsed);

        const newBalance = web3.utils.toBN(await web3.eth.getBalance(firstAccount));
        
        assert.strictEqual( originalBalance.add(amount).sub(txFee).toString(10), 
                            newBalance.toString(10),
                            'New balance is not correct');
    });

    it('number of accounts should be 2', async () => {

        const number = await contract.getNumberOfAccounts();
        assert.strictEqual(number.toNumber(), 2, "We should have two accounts");
    });

    it('account balances should increase on each share', async () => {
        
        var txObj_1 = await contract.share( firstAccount, 
                                            secondAccount, 
                                            {from: ownerAccount, value: amountToShare});

        assert.strictEqual(txObj_1.logs.length, 1, 'We should have an event');
        assert.strictEqual(txObj_1.logs[0].event, 'LogShare');

        var balanceFirstAccount_1 = await contract.getBalanceForAccount(firstAccount);
        var balanceSecondAccount_1 = await contract.getBalanceForAccount(secondAccount);

        var txObj_2 = await contract.share( firstAccount, 
                                            secondAccount, 
                                            {from: ownerAccount, value: amountToShare});
        
        var balanceFirstAccount_2 = await contract.getBalanceForAccount(firstAccount);
        var balanceSecondAccount_2 = await contract.getBalanceForAccount(secondAccount);
        
        assert.strictEqual(txObj_2.logs.length, 1, 'We should have an event');
        assert.strictEqual(txObj_2.logs[0].event, 'LogShare');

        const sharedAmount = web3.utils.toBN(amountToShare / 2);
        
        assert.strictEqual( balanceFirstAccount_1.add(sharedAmount).toString(10), 
                            balanceFirstAccount_2.toString(10), 
                            'First account should have increased by shared amount');
        assert.strictEqual( balanceSecondAccount_1.add(sharedAmount).toString(10), 
                            balanceSecondAccount_2.toString(10), 
                            'Second account should have increased by shared amount');
        
        var numberOfAccounts = await contract.getNumberOfAccounts();
        assert.strictEqual(numberOfAccounts.toNumber(), 2, 'We should still have two accounts');
    });
});