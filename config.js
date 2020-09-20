const MINE_RATE = 1000;
const INITIAL_DIFFICULTY = 3;

const GENSIS_DATA = {
    timestamp : 1,
    lastHash : "-----",
    data: [],
    difficulty: INITIAL_DIFFICULTY,
    nonce: 0,
    hash: "hash-one"
};

const STARTING_BALANCE = 1000;

const REWARD_INPUT = {
    address: '*authorized-reward*'
};

const MINING_REWARD = 50;

module.exports = {GENSIS_DATA,
    MINE_RATE,
    STARTING_BALANCE,
    REWARD_INPUT,
    MINING_REWARD
};