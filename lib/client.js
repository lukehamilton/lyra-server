const loadExtdevAccount = () => {};

function loadExtdevAccount() {
  const privateKeyStr = fs.readFileSync(
    path.join(__dirname, './extdev_private_key'),
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
