import { ethers } from 'ethers'
import {
  ERC20_ABI,
  SHRIMP_TOKEN_ADDR,
  YAM_TOKEN_ABI,
  YFI_TOKEN_ADDR,
  Y_STAKING_POOL_ABI,
  CREAM_TOKEN_ADDR,
} from '../../../constants'
import {
  get_synth_weekly_rewards,
  lookUpPrices,
  toDollar,
  toFixed,
} from '../../../utils'

export default async function main(App) {
  const stakingTokenAddr = CREAM_TOKEN_ADDR
  const stakingTokenTicker = 'CREAM'
  const rewardPoolAddr = '0xa8ed29d39Ec961Ded44451D38e56B609Fe08126e'
  const rewardTokenAddr = SHRIMP_TOKEN_ADDR
  const rewardTokenTicker = 'SHRIMP'

  const Y_STAKING_POOL = new ethers.Contract(
    rewardPoolAddr,
    Y_STAKING_POOL_ABI,
    App.provider
  )
  const STAKING_TOKEN = new ethers.Contract(
    stakingTokenAddr,
    ERC20_ABI,
    App.provider
  )

  const SHRIMP_TOKEN = new ethers.Contract(
    rewardTokenAddr,
    YAM_TOKEN_ABI,
    App.provider
  )

  const yamScale = (await SHRIMP_TOKEN.yamsScalingFactor()) / 1e18

  const stakedYAmount =
    (await Y_STAKING_POOL.balanceOf(App.YOUR_ADDRESS)) / 1e18
  const earnedYFFI =
    (yamScale * (await Y_STAKING_POOL.earned(App.YOUR_ADDRESS))) / 1e18
  const totalStakedYAmount =
    (await STAKING_TOKEN.balanceOf(rewardPoolAddr)) / 1e18

  const weekly_reward =
    ((await get_synth_weekly_rewards(Y_STAKING_POOL)) *
      (await SHRIMP_TOKEN.yamsScalingFactor())) /
    1e18

  const rewardPerToken = weekly_reward / totalStakedYAmount

  const prices = await lookUpPrices(['cream-2', 'shrimp-finance'])
  const stakingTokenPrice = prices['cream-2'].usd
  const rewardTokenPrice = prices['shrimp-finance'].usd

  const weeklyRoi =
    (rewardPerToken * rewardTokenPrice * 100) / stakingTokenPrice

  return {
    provider: 'Shrimp',
    name: 'Shrimp CREAM',
    poolRewards: [rewardTokenTicker],
    links: [
      {
        title: 'Info',
        link: 'https://twitter.com/FinanceShrimp',
      },
      {
        title: 'Staking',
        link: 'https://shrimp.finance/',
      },
    ],
    apr: toFixed(weeklyRoi * 52, 4),
    prices: [
      { label: stakingTokenTicker, value: toDollar(stakingTokenPrice) },
      { label: rewardTokenTicker, value: toDollar(rewardTokenPrice) },
    ],
    staking: [
      {
        label: 'Pool Total',
        value: toDollar(totalStakedYAmount * stakingTokenPrice),
      },
      {
        label: 'Your Total',
        value: toDollar(stakedYAmount * stakingTokenPrice),
      },
    ],
    rewards: [
      {
        label: `${toFixed(earnedYFFI, 4)} ${rewardTokenTicker}`,
        value: toDollar(earnedYFFI * rewardTokenPrice),
      },
    ],
    ROIs: [
      {
        label: 'Hourly',
        value: `${toFixed(weeklyRoi / 7 / 24, 4)}%`,
      },
      {
        label: 'Daily',
        value: `${toFixed(weeklyRoi / 7, 4)}%`,
      },
      {
        label: 'Weekly',
        value: `${toFixed(weeklyRoi, 4)}%`,
      },
    ],
  }
}
