import {Cell, beginCell, Address, beginDict, toNano} from "ton";
import walletHex from "../build/jetton-wallet.compiled.json";
export const JETTON_WALLET_CODE = Cell.fromBoc(walletHex.hex)[0];
export type CollectionStateInterface = { 
  owner_address: Address; 
  next_item_index: number,
  content: Cell,
  nft_item_code: Cell,
  royalty_params: Cell,
}
// encode contract storage according to save_data() contract method
export function data(params: CollectionStateInterface): Cell {
  var dict = beginDict(64);
  dict.storeCell(1, beginCell().storeUint(100, 64).endCell());
  dict.storeCell(2, beginCell().storeInt(101,64).endCell());
  dict.storeCell(3, beginCell().storeInt(101,64).endCell());
  dict.storeCell(4, beginCell().storeInt(101,64).endCell());
  dict.storeCell(5, beginCell().storeInt(101,64).endCell());
  dict.storeCell(6, beginCell().storeInt(101,64).endCell());
  console.log(params.content)
  const era_minter = Address.parseFriendly("kQBJvVU2i_EYLME341AhUmUmIP9StZM9qtEf4W5wwaDsy8fX").address;
  return beginCell()
          .storeAddress(params.owner_address)
          .storeUint(params.next_item_index, 64)
          .storeRef(params.content)
          .storeRef(params.nft_item_code)
          .storeRef(params.royalty_params)
          .storeRef(beginCell().storeDict(dict.endDict()).storeRef(JETTON_WALLET_CODE).endCell())
    .storeAddress(era_minter)


    .endCell();
}

export function deployNFT(owner: Address): Cell {

  return beginCell().storeUint(1, 32)
    .storeUint(0, 64)
    .storeUint(1, 64)
    .storeCoins(toNano(0.01))
    .storeRef(beginCell().storeAddress(owner).storeRef(beginCell().storeUint8(1).endCell()).endCell()).endCell();
}