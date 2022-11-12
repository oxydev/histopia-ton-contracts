import * as main from "../contracts/nft-collection";
import {Address, beginCell, beginDict, Cell, toNano, TonClient, WalletContract} from "ton";
import fs from "fs";
import {mintERA, mintFreeHistopian, mintHistopians} from "./jetton-minter.deploy";
import {sendInternalMessageWithWallet} from "../test/helpers";
import BN from "bn.js";
import {log} from "util";
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
let client = new TonClient({
    endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
    apiKey: 'f0791374aa6a2e374598f99bc2cb97ea53c158a4c06fed507b78fcca0558e6ba'

})
const getNFTAddress = async (tokenId: number, contractAddress: Address) => {
    let res = await client.callGetMethod(
        contractAddress,
        'get_nft_address_by_index',
        [['num', tokenId]]
    )
    let resultCell = Cell.fromBoc(Buffer.from(res.stack[0][1].bytes, 'base64'))[0];
    return resultCell.beginParse().readAddress()
}
async function lockHistopian(walletContract: WalletContract, secretKey: Buffer, numbers: number[], contractAddress: Address) {
    let addresses_nfts = []
    for (let i = 0; i < numbers.length; i++) {
        let address = await getNFTAddress(numbers[i], contractAddress)
        addresses_nfts.push(address)
    }
    console.log(addresses_nfts)
    const dict = beginDict(64);
    for (let i = 1; i < numbers.length ; i++) {
        console.log(addresses_nfts[i])
        const nextNFTInfo = beginCell().storeAddress(addresses_nfts[i]).endCell();
        dict.storeCell(i, nextNFTInfo);
    }
    // console.log(dict)
    const payload = beginCell().storeUint(100, 32).storeUint(0, 64)
        .storeAddress(walletContract.address)
        .storeRefMaybe(dict.endDict())
        .storeRef(beginCell().storeUint(0, 64)
            .storeAddress(null)
            .endCell())
        .endCell()

    // @ts-ignore
    await sendInternalMessageWithWallet({ walletContract, secretKey, to: addresses_nfts[0], value: toNano((0.07 + numbers.length * 0.02).toFixed(8)), body: payload })
        .then((r) => console.log(r,`   # Sent 'deployNFT' op message`)).catch(e => console.log(e));
}

async function getNFTInfo(contractAddress: Address, number: number) {
    const nft = await getNFTAddress(number, contractAddress)
    console.log(nft)
    if(nft) {
        const props = [];
        for (let i = 1; i < 6; i++) {
            const res = await client.callGetMethod(
                nft,
                'get_key',
                [['num', i]]
            )
            const resultCell = new BN(res.stack[0][1].replace(/^0x/, ''), 16).toNumber()
            props.push(resultCell)
        }
        console.log(props)
    }
}

// optional end-to-end sanity test for the actual on-chain contract to see it is actually working on-chain
export async function postDeployTest(walletContract: WalletContract, secretKey: Buffer, contractAddress: Address) {
   // await mintFreeHistopian(walletContract, secretKey, contractAddress, Address.parseFriendly("EQBmVo--5CGcB1YdclgIUvUY-949a0ivzC1Cw9_J3l7ayxnT").address);
   // await mintHistopians(walletContract, secretKey, contractAddress, 2, Address.parseFriendly("EQBmVo--5CGcB1YdclgIUvUY-949a0ivzC1Cw9_J3l7ayxnT").address);
   //  await new Promise(r => setTimeout(r, 10000));

   //  await getNFTInfo(contractAddress, 0)
   //  await getNFTInfo(contractAddress, 1)
   //  await getNFTInfo(contractAddress, 2)
   //  await new Promise(r => setTimeout(r, 1000));

   // await lockHistopian(walletContract, secretKey, [0,1,2], contractAddress);

    // await mintERA(walletContract, secretKey, Address.parse("kQBRLa722aRcleQDsu-pGNp6ATSnVfvvS_GJxnFjzhQqYKzs"), 1, Address.parseFriendly("EQBmVo--5CGcB1YdclgIUvUY-949a0ivzC1Cw9_J3l7ayxnT").address);
    // const call = await walletContract.client.callGetMethod(contractAddress, "counter");
  // const counter = new TupleSlice(call.stack).readBigNumber();
  // console.log(`   # Getter 'counter' = ${counter.toString()}`);

  // const owner_address = Address.parseFriendly("EQBmVo--5CGcB1YdclgIUvUY-949a0ivzC1Cw9_J3l7ayxnT").address;
  // const message = main.deployNFT(owner_address);
  // await sendInternalMessageWithWallet({ walletContract, secretKey, to: contractAddress, value: toNano(0.05), body: message })
  //   .then(() => console.log(`   # Sent 'deployNFT' op message`)).catch(e => console.log(e));
  // console.log(`   # Sent 'increment' op message`);

}
