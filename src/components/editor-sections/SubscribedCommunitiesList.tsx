import LoadingSpinner from "@/components/loading-spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubscribedCommunity } from "@/types/general.types";
import type { FC } from "react";

interface SubscribedCommunitiesListProps {
  communities: SubscribedCommunity[];
  isLoading: boolean;
  error: string | null;
  displayMode: "full" | "min";
  onCommunitySelect?: (communityId: string) => void;
  selectedValue?: string | null;
  t: (
    key: keyof IntlMessages["FinalReviewPage"]["communitiesList"],
    values?: Record<string, any>
  ) => string;
}

const SubscribedCommunitiesList: FC<SubscribedCommunitiesListProps> = ({
  communities,
  isLoading,
  error,
  t,
  displayMode,
  onCommunitySelect,
  selectedValue,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <LoadingSpinner size={24} />
        <p className="ml-2 text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{t("errorTitle")}</AlertTitle>
        <AlertDescription>{t("errorMessage", { error })}</AlertDescription>
      </Alert>
    );
  }

  if (displayMode === "min") {
    if (!communities || communities.length === 0) {
      return (
        <Select disabled>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("noCommunitiesSelect")} />
          </SelectTrigger>
        </Select>
      );
    }
    return (
      <Select
        value={selectedValue || undefined}
        onValueChange={(value) => {
          if (onCommunitySelect) {
            onCommunitySelect(value);
          }
        }}
        disabled={isLoading}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t("selectCommunityPlaceholder")} />
        </SelectTrigger>
        <SelectContent>
          {communities.map((community) => (
            <SelectItem key={community.name} value={community.id}>
              {community.id} ({community.name})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (!communities || communities.length === 0) {
    return <p className="text-muted-foreground">{t("noCommunitiesList")}</p>;
  }

  return (
    <ul className="list-disc pl-5 space-y-1 text-sm">
      {communities.map((community) => (
        <li key={community.name}>
          <strong>{community.name}</strong> ({community.name})
        </li>
      ))}
    </ul>
  );
};

export default SubscribedCommunitiesList;
