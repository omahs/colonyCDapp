import { useMemo } from 'react';

import { Member } from '~types';

const useAvatarDisplayCounter = (
  maxAvatars: number,
  members: Member[],
  isLastAvatarIncluded = true,
) => {
  const avatarsDisplaySplitRules = useMemo(() => {
    if (!members?.length) {
      return 0;
    }
    if (members.length <= maxAvatars) {
      return members.length;
    }
    return isLastAvatarIncluded ? maxAvatars : maxAvatars - 1;
  }, [members, maxAvatars, isLastAvatarIncluded]);
  const remainingAvatarsCount = useMemo(() => {
    if (!members?.length) {
      return 0;
    }
    if (members.length <= maxAvatars) {
      return 0;
    }
    return (
      members.length - (isLastAvatarIncluded ? maxAvatars : maxAvatars - 1)
    );
  }, [members, maxAvatars, isLastAvatarIncluded]);
  return {
    avatarsDisplaySplitRules,
    remainingAvatarsCount,
  };
};

export default useAvatarDisplayCounter;
