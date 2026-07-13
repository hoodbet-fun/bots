import { parseAbi } from 'viem'

export const erc20Abi = parseAbi([
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
])

export const rngAbi = parseAbi([
  'function requestRandomness() external returns (uint32)',
  'function fulfillRandomness(uint32 requestId) external',
  'event RandomnessRequested(uint32 indexed requestId, uint256 atBlock)',
])

export const drawManagerAbi = parseAbi([
  'function startDraw() external',
  'function finishDraw() external',
  'function canStartDraw() external view returns (bool)',
  'function canFinishDraw() external view returns (bool)',
])

export const liquidationPairAbi = parseAbi([
  'function tokenIn() external view returns (address)',
  'function tokenOut() external view returns (address)',
  'function maxAmountOut() external returns (uint256)',
  'function computeExactAmountIn(uint256 amountOut) external view returns (uint256)',
  'function smoothingFactor() external view returns (uint256)',
  'function lastAuctionPrice() external view returns (uint256)',
  'function targetAuctionPeriod() external view returns (uint256)',
])

export const liquidationRouterAbi = parseAbi([
  'function swapExactAmountOut(address _liquidationPair, address _receiver, uint256 _amountOut, uint256 _amountInMax, uint256 _deadline) external returns (uint256)',
])

export const harvesterAbi = parseAbi([
  'function harvest() external returns (uint256)',
])

export const prizePoolAbi = parseAbi([
  'function getLastAwardedDrawId() external view returns (uint24)',
  'function getOpenDrawId() external view returns (uint24)',
  'function numberOfTiers() external view returns (uint8)',
  'function isWinner(address _vault, address _user, uint8 _tier, uint32 _prizeIndex) external view returns (bool)',
])

export const claimerAbi = parseAbi([
  'function claimPrizes(address _vault, uint8 _tier, address[] _winners, uint32[][] _prizeIndices, address _feeRecipient, uint256 _minFeePerClaim) external returns (uint256)',
])
