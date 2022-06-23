# maci-cli-defaults

If you're using Linux to run `scripts/maci-cycle/6-genProofs.ts` on hardhat network, you should edit this file `quadratic-voting-contracts/maci-cli-defaults/localhost/defaults.js` and change the `DEFAULT_ETH_PROVIDER` to `http://127.0.0.1:8545/`. See issue#12 for more details.

If you want to run `scripts/maci-cycle/6-genProofs.ts` on the **testnet**, you should add `defaults.js` under this folder, and provide the `DEFAULT_ETH_PROVIDER` and `DEFAULT_ETH_SK` in the file. See `defaults.example.js` for more details.

Besides, check out `scripts/maci-cycle/6-genProofs.ts` to see how the file mounted on the container.