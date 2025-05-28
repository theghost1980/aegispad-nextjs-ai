import { HIVE_CLIENT_NODES } from "@/constants/constants";
import { SubscribedCommunity } from "@/types/general.types"; // Usar la nueva interfaz
import { Account, Client } from "@hiveio/dhive";

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

export async function getUserSubscribedCommunities(
  username: string
): Promise<SubscribedCommunity[] | null> {
  try {
    const userSubscriptionArrays: unknown =
      await dhiveClient.hivemind.listAllSubscriptions([username]);

    console.log({ userSubscriptionArrays }); //TODO REM

    if (!Array.isArray(userSubscriptionArrays)) {
      console.warn(
        `No subscriptions data array found for ${username} in API response, received:`,
        userSubscriptionArrays
      );
      return [];
    }

    if (userSubscriptionArrays.length === 0) {
      return [];
    }

    return userSubscriptionArrays.map((subArray: any[]) => ({
      id: subArray[0] as string, // community_id
      name: subArray[1] as string, // community_name/title
      role: subArray[2] as string, // user_role
      pending_posts: subArray[3],
    }));
  } catch (error) {
    console.error(
      `Error fetching subscribed communities for ${username}:`,
      error
    );
    return null;
  }
}
