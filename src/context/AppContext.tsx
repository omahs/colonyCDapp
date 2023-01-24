import { utils } from 'ethers';
import React, {
  createContext,
  useState,
  useMemo,
  ReactNode,
  useCallback,
} from 'react';

import {
  GetCurrentUserDocument,
  GetCurrentUserQuery,
  GetCurrentUserQueryVariables,
} from '~gql';
import { ColonyWallet, User } from '~types';

import { getContext, ContextModule } from './index';

export interface AppContextValues {
  wallet?: ColonyWallet | null;
  walletConnecting?: boolean;
  setWalletConnecting?: React.Dispatch<React.SetStateAction<boolean>>;
  user?: User | null;
  userLoading?: boolean;
  updateWallet?: () => void;
  updateUser?: (
    address?: string,
    shouldBackgroundUpdate?: boolean,
  ) => Promise<void>;
}

export const AppContext = createContext<AppContextValues>({});

export const AppContextProvider = ({ children }: { children: ReactNode }) => {
  let initialWallet: ColonyWallet | undefined;

  /*
   * Wallet
   */
  try {
    initialWallet = getContext(ContextModule.Wallet);
  } catch (error) {
    // silent
    // It means that it was not set in context yet
  }

  const [wallet, setWallet] =
    useState<AppContextValues['wallet']>(initialWallet);
  const [user, setUser] = useState<User | null | undefined>();
  const [userLoading, setUserLoading] = useState(false);
  const [walletConnecting, setWalletConnecting] = useState(false);

  const updateUser = useCallback(
    async (address?: string, shouldBackgroundUpdate = false) => {
      if (address) {
        try {
          if (!shouldBackgroundUpdate) {
            setUserLoading(true);
          }
          const apolloClient = getContext(ContextModule.ApolloClient);
          const { data } = await apolloClient.query<
            GetCurrentUserQuery,
            GetCurrentUserQueryVariables
          >({
            query: GetCurrentUserDocument,
            variables: { address: utils.getAddress(address) },
            fetchPolicy: 'network-only',
          });
          const [currentUser] = data?.getUserByAddress?.items || [];
          if (currentUser) {
            setUser(currentUser);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error(error);
        } finally {
          setUserLoading(false);
        }
      }
    },
    [],
  );

  const updateWallet = useCallback((): void => {
    try {
      const updatedWallet = getContext(ContextModule.Wallet);
      setWallet(updatedWallet);
      // Update the user as soon as the wallet address changes
      if (updatedWallet.address !== wallet?.address) {
        updateUser(updatedWallet.address);
      }
    } catch (error) {
      if (wallet) {
        // It means that the user logged out
        setWallet(null);
        setUser(null);
      }
      // It means that it was not set in context yet
    }
  }, [updateUser, wallet]);

  const appContext = useMemo<AppContextValues>(
    () => ({
      wallet,
      walletConnecting,
      setWalletConnecting,
      user,
      userLoading,
      updateWallet,
      updateUser,
    }),
    [
      updateWallet,
      user,
      userLoading,
      wallet,
      walletConnecting,
      setWalletConnecting,
      updateUser,
    ],
  );

  return (
    <AppContext.Provider value={appContext}>{children}</AppContext.Provider>
  );
};
