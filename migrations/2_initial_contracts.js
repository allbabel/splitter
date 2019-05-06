const Owned = artifacts.require("Owned");
const Running = artifacts.require("Running");
const Splitter = artifacts.require("Splitter");

module.exports = function(deployer) {
  deployer.deploy(Owned);
  deployer.deploy(Running);
  deployer.deploy(Splitter);
};
