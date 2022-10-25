import React, { ReactNode } from 'react';

// import { useDialog } from '~core/Dialog';

import ColonyHomeActions from '~common/ColonyHomeActions';
import ColonyTotalFunds from '~common/ColonyTotalFunds';
// import WrongNetworkDialog from '~dialogs/WrongNetworkDialog';

// import { checkIfNetworkIsAllowed } from '~utils/networks';

import { Colony } from '~types';

import ColonyDomainSelector from './ColonyDomainSelector';
import ColonyFunding from './ColonyFunding';
// import ColonyUnclaimedTransfers from './ColonyUnclaimedTransfers';
import ColonyTitle from './ColonyTitle';
import ColonyNavigation from './ColonyNavigation';
import ColonyMembers from './ColonyMembers';
// import ColonyExtensions from './ColonyExtensions';
import ColonyDomainDescription from './ColonyDomainDescription';
// import ColonyUpgrade from './ColonyUpgrade';
// import ColonyFinishDeployment from './ColonyFinishDeployment';
// import ExtensionUpgrade from './ExtensionUpgrade';

import styles from './ColonyHomeLayout.css';

type Props = {
  colony: Colony;
  filteredDomainId: number;
  onDomainChange?: (domainId: number) => void;
  /*
   * This component should only be used with a child to render,
   * otherwise it has no point
   */
  children: ReactNode;
  showControls?: boolean;
  showNavigation?: boolean;
  showSidebar?: boolean;
  showActions?: boolean;
  // ethDomainId?: number;
};

const displayName = 'dashboard.ColonyHome.ColonyHomeLayout';

const ColonyHomeLayout = ({
  colony,
  filteredDomainId,
  children,
  showControls = true,
  showNavigation = true,
  showSidebar = true,
  showActions = true,
  onDomainChange = () => null,
}: // ethDomainId,
Props) => {
  // const isNetworkAllowed = checkIfNetworkIsAllowed(networkId);
  // const openWrongNetworkDialog = useDialog(WrongNetworkDialog);

  // useEffect(() => {
  //   if (!ethereal && !isNetworkAllowed) {
  //     openWrongNetworkDialog();
  //   }
  // }, [ethereal, isNetworkAllowed, openWrongNetworkDialog]);

  return (
    <div className={styles.main}>
      <div
        className={showSidebar ? styles.mainContentGrid : styles.minimalGrid}
      >
        <aside className={styles.leftAside}>
          <ColonyTitle colony={colony} />
          {showNavigation && <ColonyNavigation colony={colony} />}
        </aside>
        <div className={styles.mainContent}>
          {showControls && (
            <>
              <ColonyTotalFunds colony={colony} />
              <div className={styles.contentActionsPanel}>
                <div className={styles.domainsDropdownContainer}>
                  <ColonyDomainSelector
                    filteredDomainId={filteredDomainId}
                    onDomainChange={onDomainChange}
                    colony={colony}
                  />
                </div>
                {showActions && (
                  <ColonyHomeActions
                  // colony={colony}
                  // ethDomainId={ethDomainId}
                  // ethDomainId={0}
                  />
                )}
              </div>
            </>
          )}
          {children}
        </div>
        {showSidebar && (
          <aside className={styles.rightAside}>
            <ColonyDomainDescription
              colony={colony}
              currentDomainId={filteredDomainId}
            />
            {/* <ColonyUnclaimedTransfers colony={colony} /> */}
            <ColonyFunding
              colony={colony}
              // currentDomainId={filteredDomainId}
            />
            <ColonyMembers
              colony={colony}
              // currentDomainId={filteredDomainId}
              currentDomainId={0}
            />
            {/* <ColonyExtensions colony={colony} /> */}
          </aside>
        )}
      </div>
      {/* <ColonyUpgrade colony={colony} />
      <ExtensionUpgrade colony={colony} />
      <ColonyFinishDeployment colony={colony} /> */}
    </div>
  );
};

ColonyHomeLayout.displayName = displayName;

export default ColonyHomeLayout;
