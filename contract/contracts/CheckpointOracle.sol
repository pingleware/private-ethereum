// SPDX-License-Identifier: CC-BY-4.0
pragma solidity >=0.4.22 <0.9.0;

// curl --data '{"method":"eth_call","params":[{"to":"0xebe8efa441b9302a0d7eaecc277c09d20d684540","data":"0x0be5b6ba"}, "latest", {"0xebe8efa441b9302a0d7eaecc277c09d20d684540": {"code":"0x608060405234801561001057600080fd5b5060b78061001f6000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80630be5b6ba14602d575b600080fd5b60336047565b604051603e91906068565b60405180910390f35b6000600754905090565b6000819050919050565b6062816051565b82525050565b6000602082019050607b6000830184605b565b9291505056fea26469706673582212201f08b6d85f41ca205bc428b542f8bb07c46d369ac8253003163d016c0232f3f864736f6c634300080a0033"}}],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:8545


contract CheckpointOracle {
    mapping(address => bool) admins;
    address[] adminList;
    uint64 sectionIndex;
    uint height;
    bytes32 hash;
    uint sectionSize;
    uint processConfirms;
    uint threshold;

    function VotingThreshold() public view returns (uint) {
        return threshold;
    }
}
