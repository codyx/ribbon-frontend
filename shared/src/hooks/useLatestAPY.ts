import { useMemo } from "react";
import moment, { Moment } from "moment";
import { formatUnits } from "@ethersproject/units";

import {
  getAssets,
  VaultFees,
  VaultList,
  VaultOptions,
  VaultVersion,
  VaultVersionList,
} from "../constants/constants";
import useVaultPriceHistory, {
  useVaultsPriceHistory,
} from "./useVaultPerformanceUpdate";
import { VaultPriceHistory } from "../models/vault";
import { getAssetDecimals } from "../utils/asset";
import useYearnAPIData from "./useYearnAPIData";
import useLidoAPY from "./useLidoOracle";

const getPriceHistoryFromPeriod = (
  priceHistory: VaultPriceHistory[],
  periodStart: Moment
): [VaultPriceHistory, VaultPriceHistory] | undefined => {
  const [periodStartTimestamp, periodEndTimestamp, nextPeriodEndTimestamp] = [
    periodStart.unix(),
    periodStart.clone().add(1, "week").unix(),
    periodStart.clone().add(2, "week").unix(),
  ];

  const priceHistoryInPeriod = priceHistory.filter(
    (historyItem) =>
      historyItem.timestamp >= periodStartTimestamp &&
      historyItem.timestamp < periodEndTimestamp
  );
  const priceHistoryInNextPeriod = priceHistory.filter(
    (historyItem) =>
      historyItem.timestamp >= periodEndTimestamp &&
      historyItem.timestamp < nextPeriodEndTimestamp
  );

  /**
   * Check if one of the period is empty
   */
  if (!priceHistoryInPeriod.length || !priceHistoryInNextPeriod.length) {
    /**
     * If combined length is more than 2, we simply return the first and second
     */
    if (priceHistoryInPeriod.length + priceHistoryInNextPeriod.length >= 2) {
      const combinedPriceHistory = [
        ...priceHistoryInPeriod,
        ...priceHistoryInNextPeriod,
      ];
      return [combinedPriceHistory[0], combinedPriceHistory[1]];
    }

    /**
     * Else, return undefined
     */
    return undefined;
  }

  return [priceHistoryInPeriod[0], priceHistoryInNextPeriod[0]];
};

/**
 * To calculate APY, we first find a week that has not been exercised.
 * This is to remove accounting of losses into calculating APY.
 * The calculation shall be calculated based on the start of previous period versus the the start of current period.
 * Each period consist of a week, starting from a friday UTC 10am until the next friday UTC 10am.
 */
export const calculateAPYFromPriceHistory = (
  priceHistory: VaultPriceHistory[],
  decimals: number,
  {
    vaultOption,
    vaultVersion,
  }: { vaultOption: VaultOptions; vaultVersion: VaultVersion },
  underlyingYieldAPR: number
) => {
  const periodStart = moment()
    .isoWeekday("friday")
    .utc()
    .set("hour", 10)
    .set("minute", 0)
    .set("second", 0)
    .set("millisecond", 0);

  if (periodStart.isAfter(moment())) {
    periodStart.subtract(1, "week");
  }

  let currentWeek = true;

  while (true) {
    const priceHistoryFromPeriod = getPriceHistoryFromPeriod(
      priceHistory,
      periodStart
    );

    if (!priceHistoryFromPeriod) {
      return 0;
    }

    const [startingPricePerShare, endingPricePerShare] = [
      parseFloat(
        formatUnits(priceHistoryFromPeriod[0].pricePerShare, decimals)
      ),
      parseFloat(
        formatUnits(priceHistoryFromPeriod[1].pricePerShare, decimals)
      ),
    ];

    /**
     * If the given period is profitable, we calculate APY
     */
    if (endingPricePerShare > startingPricePerShare) {
      if (!currentWeek) {
        /**
         * Fees and underlying yields had been accounted
         */
        return (
          ((1 +
            (endingPricePerShare - startingPricePerShare) /
              startingPricePerShare) **
            52 -
            1) *
          100
        );
      }

      switch (vaultVersion) {
        case "v1":
          /**
           * V1 does not have fees that can impact performance
           */

          return (
            ((1 +
              (endingPricePerShare - startingPricePerShare) /
                startingPricePerShare) **
              52 -
              1) *
              100 +
            underlyingYieldAPR
          );
        case "v2":
          /**
           * We first calculate price per share after annualized management fees are charged
           */
          const endingPricePerShareAfterManagementFees =
            endingPricePerShare *
            (1 -
              parseFloat(VaultFees[vaultOption].v2?.managementFee!) / 100 / 52);
          /**
           * Next, we calculate how much performance fees will lower the pricePerShare
           */
          const performanceFeesImpact =
            (endingPricePerShare - startingPricePerShare) *
            (parseFloat(VaultFees[vaultOption].v2?.performanceFee!) / 100);
          /**
           * Finally, we calculate price per share after both fees
           */
          const pricePerShareAfterFees =
            endingPricePerShareAfterManagementFees - performanceFeesImpact;

          return (
            ((1 +
              (pricePerShareAfterFees - startingPricePerShare) /
                startingPricePerShare) **
              52 -
              1) *
              100 +
            underlyingYieldAPR
          );
      }
    }

    /**
     * Otherwise, we look for the previous week
     */
    periodStart.subtract(1, "week");
    currentWeek = false;
  }
};

export const useLatestAPY = (
  vaultOption: VaultOptions,
  vaultVersion: VaultVersion
) => {
  const { priceHistory, loading } = useVaultPriceHistory(
    vaultOption,
    vaultVersion
  );
  const { getVaultAPR } = useYearnAPIData();
  const lidoAPY = useLidoAPY();

  switch (vaultVersion) {
    case "v2":
      switch (vaultOption) {
        /**
         * TODO: Temporarily hardcode it for the launch because it is inaccurate
         */
        case "rAVAX-THETA":
          return { fetched: true, res: 17.46 };
      }
  }

  let underlyingYieldAPR = 0;

  switch (vaultOption) {
    case "ryvUSDC-ETH-P-THETA":
      underlyingYieldAPR = getVaultAPR("yvUSDC", "0.3.0") * 100;
      break;
    case "rstETH-THETA":
      underlyingYieldAPR = lidoAPY * 100;
  }

  return {
    fetched: !loading,
    res: loading
      ? 0
      : calculateAPYFromPriceHistory(
          priceHistory,
          getAssetDecimals(getAssets(vaultOption)),
          { vaultOption, vaultVersion },
          underlyingYieldAPR
        ),
  };
};

export default useLatestAPY;

export const useLatestAPYs = () => {
  const { data, loading } = useVaultsPriceHistory();
  const { getVaultAPR } = useYearnAPIData();
  const lidoAPY = useLidoAPY();

  const latestAPYs = useMemo(
    () =>
      Object.fromEntries(
        VaultVersionList.map((version) => [
          version,
          Object.fromEntries(
            VaultList.map((vaultOption) => {
              const priceHistory = data[version][vaultOption];

              switch (version) {
                case "v2":
                  switch (vaultOption) {
                    /**
                     * TODO: Temporarily hardcode it for the launch because it is inaccurate
                     */
                    case "rAVAX-THETA":
                      return [vaultOption, 17.46];
                  }
              }

              let underlyingYieldAPR = 0;

              switch (vaultOption) {
                case "ryvUSDC-ETH-P-THETA":
                  underlyingYieldAPR = getVaultAPR("yvUSDC", "0.3.0") * 100;
                  break;
                case "rstETH-THETA":
                  underlyingYieldAPR = lidoAPY * 100;
              }

              return [
                vaultOption,
                loading
                  ? 0
                  : calculateAPYFromPriceHistory(
                      priceHistory,
                      getAssetDecimals(getAssets(vaultOption)),
                      { vaultOption, vaultVersion: version },
                      underlyingYieldAPR
                    ),
              ];
            })
          ),
        ])
      ) as {
        [version in VaultVersion]: {
          [option in VaultOptions]: number;
        };
      },
    [data, getVaultAPR, lidoAPY, loading]
  );

  return { fetched: !loading, res: latestAPYs };
};
