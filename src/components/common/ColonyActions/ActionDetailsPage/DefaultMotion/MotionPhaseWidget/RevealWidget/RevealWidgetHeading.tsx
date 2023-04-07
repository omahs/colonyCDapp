import React from 'react';
import { FormattedMessage, defineMessages } from 'react-intl';

import { Heading4 } from '~shared/Heading';
import { CustomRadio } from '~shared/Fields';
import { MotionVote } from '~utils/colonyMotions';

import styles from './RevealWidgetHeading.css';

const displayName =
  'common.ActionDetailsPage.DefaultMotion.RevealWidgetHeading';

const MSG = defineMessages({
  voteHiddenInfo: {
    id: `${displayName}.voteHiddenInfo`,
    defaultMessage: `Your vote is hidden from others.`,
  },
  title: {
    id: `${displayName}.title`,
    defaultMessage: `{revealed, select,
        true {Waiting for other voters to reveal their votes.}
        other {Reveal your vote to others to claim your reward.}
      }`,
  },
  titleNotVoted: {
    id: `${displayName}.titleNotVoted`,
    defaultMessage: `Please wait for the voters to reveal their vote.`,
  },
});

interface RevealWidgetHeadingProps {
  hasUserVoted: boolean;
  userVoteRevealed: boolean;
}

const RevealWidgetHeading = ({
  hasUserVoted,
  userVoteRevealed,
}: RevealWidgetHeadingProps) => {
  const vote = MotionVote.Nay; /// Todo
  return (
    <div className={styles.main}>
      <Heading4
        text={hasUserVoted ? MSG.title : MSG.titleNotVoted}
        textValues={hasUserVoted ? { revealed: userVoteRevealed } : undefined}
        appearance={{ weight: 'bold', theme: 'dark', margin: 'none' }}
      />
      {userVoteRevealed ? (
        <>
          {vote === MotionVote.Yay ? (
            <CustomRadio
              /*
               * @NOTE This is just for display purposes, we don't actually
               * want to use it as radio button
               */
              value=""
              name="voteYes"
              label={{ id: 'button.yes' }}
              appearance={{ theme: 'primary' }}
              icon="circle-thumbs-up"
              checked
            />
          ) : (
            <CustomRadio
              /*
               * @NOTE This is just for display purposes, we don't actually
               * want to use it as radio button
               */
              value=""
              name="voteNo"
              label={{ id: 'button.no' }}
              appearance={{ theme: 'danger' }}
              icon="circle-thumbs-down"
              checked
            />
          )}
        </>
      ) : (
        hasUserVoted && (
          <div className={styles.voteHiddenInfo}>
            <FormattedMessage {...MSG.voteHiddenInfo} />
          </div>
        )
      )}
    </div>
  );
};

RevealWidgetHeading.displayName = displayName;

export default RevealWidgetHeading;
