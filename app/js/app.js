const Web3 = require("web3");
const Promise = require("bluebird");
const truffleContract = require("truffle-contract");
const $ = require("jquery");

const splitterJson = require("../../build/contracts/Splitter.json");

// Supports Metamask, and other wallets that provide / inject 'web3'.
if (typeof web3 !== 'undefined') {
    // Use the Mist/wallet/Metamask provider.
    window.web3 = new Web3(web3.currentProvider);
} else {
    // Your preferred fallback.
    window.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545')); 
}

const Splitter = truffleContract(splitterJson);
Splitter.setProvider(web3.currentProvider);
let deployed;
let gas = 300000;

window.addEventListener('load', function() {
    return web3.eth.getAccounts()
        .then(function(accounts) {
            if (accounts.length == 0)
                throw new Error('No account found');
            
            window.account = accounts[0];
            return web3.eth.net.getId();
        })
        .then(function(network) {
            return Splitter.deployed();
        })
        .then(function(_deployed) {

            deployed = _deployed;

            updateStatus();
        })
        .then(function() {
            $('#send').click(sendShare);
            $('#withdraw').click(withdrawDeposit);
        })
        .catch(console.error);
});

const decipherLogShare = function(log) {
    return [log.args.firstAccount, log.args.secondAccount];
};

const displayAccountBalance = function(address) {
    deployed.accounts.call(address).then(function(balance) {
        $('#account_balances').append('<br/>' + address + ': ' + web3.utils.fromWei(balance) + ' Ether');
    });
};

const updateStatus = function() {

    return web3.eth.getBalance(deployed.address)
        .then(function(balance) {
            $('#contract_balance').html(web3.utils.fromWei(balance.toString(10)));
            
            return deployed.getPastEvents('LogShare', {fromBlock:0, toBlock:'latest'});
        })
        .then(function(events, err) {
            // Build list of accounts involved and list balances
            if (err)
                throw new Error('No logs found:', err);

            $('#account_balances').html('');
            var contractAccounts = [];
            events.forEach(element => {
                decipherLogShare(element).forEach(account => {
                    if (contractAccounts.indexOf(account) == -1)
                        contractAccounts.push(account);
                });
            });

            contractAccounts.forEach(displayAccountBalance);
        })
        .catch(console.error);  
};

const withdrawDeposit = function() {
    if (deployed === null)
        return;

    if (window.account == null)
        return;

    return deployed.withdraw.call({from: window.account, gas: gas})
        .then(function(success) {
            if (!success)
                throw new Error('The transaction will fail, not sending'); 
            return deployed.withdraw({from: window.account, gas: gas});
        })
        .then(function(txObj) {
            const receipt = txObj.receipt;
            if (!receipt.status) {
                $('#status').html('There was an error in the tx execution');
            } else if (receipt.logs.lenth == 0) {
                $('#status').html('There was an error in execution as log confirmation');
            } else {
                $('#status').html('Transfer executed');

                updateStatus();
            }
        })
        .catch(console.error);
};

const sendShare = function() {

    const firstAccount = $("input[name='firstAccount']").val();
    const secondAccount = $("input[name='secondAccount']").val();
    const amountToShare = $("input[name='amountToShare']").val();

    if (deployed === null) {
        return;        
    }

    if (firstAccount.length != 42 || secondAccount.length != 42) {
        $('#status').html('Please provide valid accounts');
        return;
    }

     // Test operation first (call)
    return deployed.share.call( firstAccount, 
                                secondAccount, 
                                {   from: window.account, 
                                    value: web3.utils.toWei(amountToShare), 
                                    gas: gas
        })
        .then(function(success) {
            if (!success) {
                throw new Error('The transaction will fail, not sending');
            }

            return deployed.share(  firstAccount, 
                                    secondAccount, 
                                    {   from: window.account, 
                                        value: web3.utils.toWei(amountToShare),
                                        gas: gas })
                .on('transactionHash', 
                    txHash => $('#status').html('Transaction en route ', txHash)
                );
        })
        .then(function(txObj) {
            // Check transaction for status and logs
            const receipt = txObj.receipt;
            if (!receipt.status) {
                $('#status').html('There was an error in the tx execution');
            } else if (receipt.logs.lenth == 0) {
                $('#status').html('There was an error in execution as log confirmation');
            } else {
                $('#status').html('Transfer executed');

                updateStatus();
            }
        })
        .catch(console.error);;
};
require("file-loader?name=../index.html!../index.html");
// Balance of contract UI element
// Balances of the accounts - highlight balance of current user
// UI element to enter address for two, validated and a field for the price
// Button to send
// Button to withdraw
