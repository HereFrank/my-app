import {
    PublicKey,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    TransactionInstruction
} from "@solana/web3.js";
import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    Token
} from "@solana/spl-token";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
/* global BigInt */

export const PROGRAM_ID = new PublicKey(
    "CGT1ix2HD6KEa3owrpKSBT7VRyW6a9RAW6aX6KgoXDYQ"
);
const TREASURY_ADDRESS = new PublicKey(
    "Eb63UcV5o4GLTb9tbiN7N2hMiLQLqUTYr54EqsQE62SE"
);

// create instruction data for selling, unlisting and buying
function createInstructionData(instruction, params) {
    if (instruction == "Sell") {
        let price = BigInt(params.price);
        let priceBuffer = [];
        for (let i = 0; i < 8; i++)
            priceBuffer[i] = parseInt((price >> BigInt(i * 8)) & BigInt(0xff));

        return new Uint8Array([1, ...priceBuffer]);
    } else if (instruction == "Withdraw") return new Uint8Array([2]);
    else if (instruction == "Buy") return new Uint8Array([3]);

    throw new Error(`Unrecognized instruction: ${instruction}`);
}

// generates associated token account address for token
function getAssociatedTokenAddress(walletAddress, tokenAddress, allowOffCurve = false) {
    return Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        tokenAddress,
        walletAddress,
        allowOffCurve
    );
}

function transactionKey(pubkey, isSigner, isWritable = true) {
    return {
        pubkey,
        isSigner,
        isWritable
    };
}

// generates the vault address --Checked--
const VAULT_PREFIX = "vault";
export async function getVaultAddress() {
    let [address] = await PublicKey.findProgramAddress(
        [Buffer.from(VAULT_PREFIX)],
        PROGRAM_ID
    );
    return address;
}

//generates the listing address that holds the nft data, owner, and sales price based on a nft input --checked--
export async function getListingAddress(token) {
    let [address] = await PublicKey.findProgramAddress(
        [token.toBytes()],
        PROGRAM_ID
    );
    return address;
}

// gets all listed tokens (kartik is fixing these)
export async function getListedTokens(connection){
	return getListedTokensByOwner(connection);
}

// gets tokens listed by owner
export async function getListedTokensByOwner(connection, owner = null, active = true){
	let filters = [];
	
	if(owner)
		filters.push(listedTokensOwnerFilter(owner));
	if(active == true || active == false)
		filters.push(listedTokensActiveFilter(active));
	
	let listingAccounts = await connection.getProgramAccounts(
		PROGRAM_ID,
		{ filters }
	);
	
	let tokens = [];
	for(let listingAccount of listingAccounts){
		let signatures = await connection.getSignaturesForAddress(listingAccount.pubkey);
		for(let { signature } of signatures){
			let confirmation = await connection.getTransaction(signature);
			let token = confirmation.transaction.message.accountKeys[4];
			if(token){
				tokens.push(token);
				break;
			}
		}
	}
	
	return tokens;
}

export function listedTokensActiveFilter(active){
	return {
		memcmp: {
			offset: 40,
			bytes: [active?1:0]
		}
	};
}

export function listedTokensOwnerFilter(owner){
	return {
		memcmp: {
			offset: 8,
			bytes: owner.toBase58()
		}
	};
}

// create instruction to sell token --see later-- 
export async function createSellTokenInstructionRaw(
    owner,
    token,
    candyMachine,
    price
) {
    let vaultAddress = await getVaultAddress();
    let listingAddress = await getListingAddress(token);
    let metadataAddress = await Metadata.getPDA(token);

    let sourceTokenAccount = await getAssociatedTokenAddress(owner, token);
    let destinationTokenAccount = await getAssociatedTokenAddress(
        vaultAddress,
        token,
        true
    );

    return new TransactionInstruction({
        programId: PROGRAM_ID,
        data: createInstructionData("Sell", { price }),
        keys: [
            transactionKey(owner, true),
            transactionKey(token, false, false),
            transactionKey(metadataAddress, false, false),
            transactionKey(candyMachine, false, false),
            transactionKey(vaultAddress, false, false),

            transactionKey(sourceTokenAccount, false),
            transactionKey(destinationTokenAccount, false),

            transactionKey(TOKEN_PROGRAM_ID, false, false),
            transactionKey(SystemProgram.programId, false, false),
            transactionKey(SYSVAR_RENT_PUBKEY, false, false),
            transactionKey(ASSOCIATED_TOKEN_PROGRAM_ID, false, false),

            transactionKey(listingAddress, false)
        ]
    });
}

//see later --
export async function createSellTokenInstruction(connection, owner, token, price) {
    let metadata = await Metadata.load(connection, await Metadata.getPDA(token));
    let candyMachineAddress = metadata.data.data.creators[0].address;
    let candyMachine = new PublicKey(candyMachineAddress);

    return createSellTokenInstructionRaw(
        owner,
        token,
        candyMachine,
        price
    );
}

// create instruction to unlist token
export async function createWithdrawTokenInstructionRaw(owner, token) {
    let vaultAddress = await getVaultAddress();
    let listingAddress = await getListingAddress(token);

    let vaultTokenAccount = await getAssociatedTokenAddress(vaultAddress, token, true);
    let ownerTokenAccount = await getAssociatedTokenAddress(owner, token);

    return new TransactionInstruction({
        programId: PROGRAM_ID,
        data: createInstructionData("Withdraw"),
        keys: [
            transactionKey(owner, true),
            transactionKey(SystemProgram.programId, false),

            transactionKey(token, false, false),
            transactionKey(TOKEN_PROGRAM_ID, false, false),
            transactionKey(SYSVAR_RENT_PUBKEY, false, false),
            transactionKey(
                ASSOCIATED_TOKEN_PROGRAM_ID,
                false,
                false
            ),

            transactionKey(vaultAddress, false),
            transactionKey(vaultTokenAccount, false),
            transactionKey(ownerTokenAccount, false),

            transactionKey(listingAddress, false)
        ]
    });
}
export async function createWithdrawTokenInstruction(owner, token) {
    return createWithdrawTokenInstructionRaw(owner, token);
}

// create instruction to buy token
export async function createBuyTokenInstructionRaw(buyer, seller, token, creators) {
    let vaultAddress = await getVaultAddress();
    let listingAddress = await getListingAddress(token);
    let metadataAddress = await Metadata.getPDA(token);

    let vaultTokenAccount = await getAssociatedTokenAddress(vaultAddress, token, true);
    let buyerTokenAccount = await getAssociatedTokenAddress(buyer, token);

    return new TransactionInstruction({
        programId: PROGRAM_ID,
        data: createInstructionData("Buy"),
        keys: [
            transactionKey(buyer, true),
            transactionKey(SystemProgram.programId, false),

            transactionKey(token, false, false),
            transactionKey(TOKEN_PROGRAM_ID, false, false),
            transactionKey(SYSVAR_RENT_PUBKEY, false, false),
            transactionKey(
                ASSOCIATED_TOKEN_PROGRAM_ID,
                false,
                false
            ),

            transactionKey(vaultAddress, false),
            transactionKey(vaultTokenAccount, false),
            transactionKey(buyerTokenAccount, false),

            transactionKey(listingAddress, false),

            transactionKey(seller, false),
            transactionKey(metadataAddress, false, false),
            transactionKey(TREASURY_ADDRESS, false),

            ...creators.map(creator => transactionKey(creator, false))
        ]
    });
}
export async function createBuyTokenInstruction(connection, buyer, token) {
    let metadata = await Metadata.load(connection, await Metadata.getPDA(token));
    let creators = metadata.data.creators;

    let listingAddress = await getListingAddress(token);
    let listingData = await connection.getAccountInfo(listingAddress).then(e => e.data);
    let seller = new PublicKey(listingData.slice(8, 40));

    return createBuyTokenInstructionRaw(
        buyer,
        seller,
        token,
        creators
    );
}