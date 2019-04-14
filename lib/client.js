/* eslint class-methods-use-this: 0, no-console: 0 */
const fs = require('fs');
const Web3 = require('web3');
const path = require('path');

const {
  Client,
  NonceTxMiddleware,
  SignedTxMiddleware,
  Address,
  LocalAddress,
  CryptoUtils,
  LoomProvider,
  Contracts,
  Web3Signer,
  soliditySha3
} = require('loom-js');

const BN = require('bn.js');

const coinMultiplier = new BN(10).pow(new BN(18));

const extdevChainId = 'extdev-plasma-us1';

const LyraTokenJSON = require('../build/contracts/LyraToken.json');

class LyraClient {
  constructor() {
    this.extDevAccount = this.loadExtdevAccount();
  }

  test() {
    console.log(LyraTokenJSON);
  }

  async mint(address, amount) {
    const { account, web3js, client } = this.extDevAccount;
    const addr = account;
    const contract = await this.getExtDevTokenContract(web3js);
    // console.log('contract.methods', contract.methods);
    let tx;
    try {
      tx = await contract.methods.mint(addr, amount).send({ from: addr });
      console.log('tx in mint', tx);
    } catch (err) {
      throw err;
    } finally {
      client.disconnect();
    }
    return tx;
  }

  async tokenBalance(address) {
    // const { account, web3js, client } = this.extDevAccount;
    // const ownerAddress = account;
    // const balance = this.getExtevTokenBalance(web3js, ownerAddress);
    // console.log(balance);
    try {
      const { account, web3js, client } = this.extDevAccount;
      let ownerAddress;
      let balance;
      if (address) {
        ownerAddress = address;
      } else {
        ownerAddress = account;
      }
      try {
        balance = await this.getExtDevTokenBalance(web3js, ownerAddress);
        // console.log('cool guy balance', balance);
        return balance;
      } catch (err) {
        throw err;
      } finally {
        client.disconnect();
      }
      // console.log(
      //   `${ownerAddress} balance is ${new BN(balance)
      //     .div(coinMultiplier)
      //     .toString()}`
      // );
      // console.log(`${ownerAddress} balance is ${balance}`);
    } catch (err) {
      console.log(err);
    }
  }

  async tokenSupply() {
    try {
      const { account, web3js, client } = this.extDevAccount;
      let totalSupply;
      try {
        totalSupply = await this.getExtDevTotalSupply(web3js, account);
        // console.log('totalSupply', totalSupply);
      } catch (err) {
        throw err;
      } finally {
        client.disconnect();
      }
      return totalSupply;
    } catch (err) {
      console.log(err);
    }
  }

  async getExtDevTotalSupply(web3js, accountAddress) {
    const contract = await this.getExtDevTokenContract(web3js);
    const addr = accountAddress.toLowerCase();
    const totalSupply = await contract.methods
      .totalSupply()
      .call({ from: addr });
    return totalSupply;
  }

  async getExtDevTokenContract(web3js) {
    const networkId = await web3js.eth.net.getId();
    console.log('networkId', networkId);
    return new web3js.eth.Contract(
      LyraTokenJSON.abi,
      LyraTokenJSON.networks[networkId].address
    );
  }

  async getExtDevTokenBalance(web3js, accountAddress) {
    const contract = await this.getExtDevTokenContract(web3js);
    const addr = accountAddress.toLowerCase();
    console.log('contract.methods', contract.methods);
    const balance = await contract.methods.balanceOf(addr).call({ from: addr });
    return balance;
  }

  loadExtdevAccount() {
    const privateKeyStr = fs.readFileSync(
      path.join(__dirname, '../extdev_private_key'),
      'utf-8'
    );
    const privateKey = CryptoUtils.B64ToUint8Array(privateKeyStr);
    const publicKey = CryptoUtils.publicKeyFromPrivateKey(privateKey);
    const client = new Client(
      extdevChainId,
      'wss://extdev-plasma-us1.dappchains.com/websocket',
      'wss://extdev-plasma-us1.dappchains.com/queryws'
    );
    client.txMiddleware = [
      new NonceTxMiddleware(publicKey, client),
      new SignedTxMiddleware(privateKey)
    ];
    client.on('error', msg => {
      console.error('PlasmaChain connection error', msg);
    });

    return {
      account: LocalAddress.fromPublicKey(publicKey).toString(),
      web3js: new Web3(new LoomProvider(client, privateKey)),
      client
    };
  }
}

module.exports = LyraClient;
