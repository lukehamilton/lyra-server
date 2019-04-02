const LyraToken = artifacts.require('./LyraToken.sol');

module.exports = function(deployer, network, accounts) {
  if (network === 'rinkeby') {
    return;
  }

  deployer.then(async () => {
    await deployer.deploy(LyraToken);
    const lyraTokenInstance = await LyraToken.deployed();

    console.log(
      '\n*************************************************************************\n'
    );
    console.log(`LyraToken Contract Address: ${lyraTokenInstance.address}`);
    console.log(
      '\n*************************************************************************\n'
    );
  });
};
