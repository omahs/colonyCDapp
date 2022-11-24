import React, { useMemo } from 'react';
import classnames from 'classnames';

import Popover from '~shared/Popover';
import UserAvatar from '~shared/UserAvatar';
// import HookedUserAvatar from '~users/HookedUserAvatar';
import { removeValueUnits } from '~utils/css';
import { useAppContext } from '~hooks';

import AvatarDropdownPopover from './AvatarDropdownPopover';

import styles from './AvatarDropdown.css';

const displayName = 'frame.AvatarDropdown';

const AvatarDropdown = () => {
  const { wallet } = useAppContext();
  const { refWidth, horizontalOffset, verticalOffset } = styles;

  /*
   * @NOTE Offset Calculations
   * See: https://popper.js.org/docs/v2/modifiers/offset/
   *
   * Skidding:
   * The Width of the reference element (width) plus the horizontal offset
   * Note that all skidding, for bottom aligned elements, needs to be negative.
   *
   * Distace:
   * This is just the required offset in pixels. Since we are aligned at
   * the bottom of the screen, this will be added to the bottom of the
   * reference element.
   */
  const popoverOffset = useMemo(() => {
    const skid =
      removeValueUnits(refWidth) + removeValueUnits(horizontalOffset);
    return [-1 * skid, removeValueUnits(verticalOffset)];
  }, [horizontalOffset, refWidth, verticalOffset]);

  return (
    <Popover
      renderContent={({ close }) => (
        <AvatarDropdownPopover closePopover={close} />
      )}
      trigger="click"
      showArrow={false}
      popperOptions={{
        modifiers: [
          {
            name: 'offset',
            options: {
              offset: popoverOffset,
            },
          },
        ],
      }}
    >
      {({ isOpen, toggle, ref, id }) => (
        <button
          id={id}
          ref={ref}
          className={classnames(styles.avatarButton, {
            [styles.activeDropdown]: isOpen,
          })}
          onClick={toggle}
          type="button"
          data-test="avatarDropdown"
        >
          <UserAvatar
            address={wallet?.address || ''}
            notSet={!wallet?.address}
            size="s"
          />
        </button>
      )}
    </Popover>
  );
};

AvatarDropdown.displayName = displayName;

export default AvatarDropdown;
