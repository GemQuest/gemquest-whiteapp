-include .env

.PHONY: node clean build deploy help test sdeploy deployNft deployGem airdropGem deployUtils

node:
	@solana-test-validator -r --bpf-program metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s metadata.so

clean:
	@anchor clean

build:
	@anchor build

deploy:
	@anchor deploy

test:
	@anchor test

deployGems:
	@set -a; source .env; set +a; yarn run ts-mocha -p ./tsconfig.json -t 1000000 scripts/deployGems.ts

deployNfts:
	@set -a; source .env; set +a; yarn run ts-mocha -p ./tsconfig.json -t 1000000 scripts/deployNFTs.ts

deployTicket:
	@set -a; source .env; set +a; yarn run ts-mocha -p ./tsconfig.json -t 1000000 scripts/deployTicket.ts

deployReceipt:
	@set -a; source .env; set +a; yarn run ts-mocha -p ./tsconfig.json -t 1000000 scripts/deployReceipt.ts

airdropGem:
	@set -a; source .env; set +a; yarn run ts-mocha -p ./tsconfig.json -t 1000000 scripts/deployUserGems.ts

deployUtils:
	@set -e; \
	for script in $$(ls -1 scripts/*.ts | grep -v '.old.ts' | sort); do \
		echo "Executing $$script..."; \
		(set -a; source .env; set +a; yarn run ts-mocha -p ./tsconfig.json -t 1000000 $$script); \
	done; \
	echo "All deployment scripts have been executed successfully"

# Uncomment and use the following line to switch to devnet
# solana config set --url devnet

help:
	@echo "Available commands:"
	@echo "  make node          : Start a local Solana test validator"
	@echo "  make clean         : Clean the Anchor project"
	@echo "  make build         : Build the Anchor project"
	@echo "  make deploy        : Deploy the Anchor project"
	@echo "  make test          : Run Anchor tests"
	@echo "  make sdeploy       : Run the deployment script"
	@echo "  make deployNfts     : Deploy NFTs"
	@echo "  make deployGems     : Deploy Gems"
	@echo "  make deployTicket   : Deploy Ticket NFT Price and Collection"
	@echo "  make deployReceipt  : Deploy Receipt NFT Collection"
	@echo "  make airdropGem    : Airdrop gems to users"
	@echo "  make deployUtils   : Run all .ts scripts in alphabetical order"
	@echo "  make help          : Display this help message"
