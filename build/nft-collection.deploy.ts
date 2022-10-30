import * as main from "../contracts/nft-collection";
import {Address, beginCell, Cell, toNano, WalletContract} from "ton";
import fs from "fs";
const OFFCHAIN_CONTENT_PREFIX = 0x01;

const serializeUri = (uri: string) => {
  return new TextEncoder().encode(encodeURI(uri));
}

function create_content() {
  const contentBuffer = serializeUri("https://api.histopia.io/utils/testMetadata");
  const contentBaseBuffer = serializeUri("https://api.histopia.io/nft/meta/80001/");
  var content_cell =  beginCell().storeUint(OFFCHAIN_CONTENT_PREFIX, 8);
  contentBuffer.forEach((byte) => {
    content_cell.storeUint8(byte);
    console.log(byte);
  })

  var content_base =  beginCell()
  contentBaseBuffer.forEach((byte) => {
    content_base.storeUint8(byte);
    console.log(byte);
  })
  return  beginCell().storeRef(content_cell.endCell()).storeRef(content_base.endCell())
}

// return the init Cell of the contract storage (according to load_data() contract method)
export function initData() {

  const hexArtifact = `build/nft-item.compiled.json`;
  const owner_wallet = "EQBmVo--5CGcB1YdclgIUvUY-949a0ivzC1Cw9_J3l7ayxnT"

  const owner_address = Address.parseFriendly(owner_wallet).address;

  const content = create_content();
  return main.data({
    owner_address,
    next_item_index: 0,
    content: content.endCell(),
    nft_item_code: Cell.fromBoc(JSON.parse(fs.readFileSync(hexArtifact).toString()).hex)[0],
    royalty_params: beginCell().storeUint(10, 16).storeUint(100, 16).storeAddress(owner_address).endCell(),
  });
}

// return the op that should be sent to the contract on deployment, can be "null" to send an empty message
export function initMessage() {
  return null;
}


// optional end-to-end sanity test for the actual on-chain contract to see it is actually working on-chain
export async function postDeployTest(walletContract: WalletContract, secretKey: Buffer, contractAddress: Address) {
  // const call = await walletContract.client.callGetMethod(contractAddress, "counter");
  // const counter = new TupleSlice(call.stack).readBigNumber();
  // console.log(`   # Getter 'counter' = ${counter.toString()}`);

  // const owner_address = Address.parseFriendly("EQBmVo--5CGcB1YdclgIUvUY-949a0ivzC1Cw9_J3l7ayxnT").address;
  // const message = main.deployNFT(owner_address);
  // await sendInternalMessageWithWallet({ walletContract, secretKey, to: contractAddress, value: toNano(0.05), body: message })
  //   .then(() => console.log(`   # Sent 'deployNFT' op message`)).catch(e => console.log(e));
  // console.log(`   # Sent 'increment' op message`);

}
