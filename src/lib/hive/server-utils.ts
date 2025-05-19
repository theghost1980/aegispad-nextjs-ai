import { Account, Client } from "@hiveio/dhive";

const HIVE_CLIENT_NODES = [
  "https://api.hive.blog",
  "https://api.deathwing.me",
  "https://rpc.ausbit.dev",
  "https://api.openhive.network",
];

const dhiveClient = new Client(HIVE_CLIENT_NODES);

export async function getHiveAccount(
  username: string
): Promise<Account | null> {
  try {
    const accounts = await dhiveClient.database.getAccounts([username]);
    return accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error(`Error fetching Hive account ${username}:`, error);
    return null;
  }
}
