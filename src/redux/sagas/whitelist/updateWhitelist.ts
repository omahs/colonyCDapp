import { all, call, fork, put, takeEvery } from 'redux-saga/effects';
import { ClientType, Extension } from '@colony/colony-js';
import { $Values } from 'utility-types';

import { ActionTypes } from '../../actionTypes';
import { AllActions, Action } from '../../types/actions';
import {
  WhitelistedUsersDocument,
  WhitelistedUsersQuery,
  WhitelistedUsersQueryVariables,
} from '~data/index';
import { ContextModule, getContext } from '~context';
import { putError, takeFrom, refreshExtension } from '../utils';
import { TxConfig } from '~types';

import {
  ChannelDefinition,
  createTransaction,
  createTransactionChannels,
} from '../transactions';

export function* updateWhitelist({
  meta,
  payload: { userAddresses, colonyAddress, status },
}: Action<ActionTypes.WHITELIST_UPDATE>) {
  const apolloClient = getContext(ContextModule.ApolloClient);
  const requireTransactions = Math.ceil(userAddresses.length / 100);
  const channelNames: string[] = [];

  for (let index = 0; index < requireTransactions; index += 1) {
    channelNames.push(String(index));
  }

  /*
   * Define a manifest of transaction ids and their respective channels.
   */
  const channels: { [id: string]: ChannelDefinition } = yield call(
    createTransactionChannels,
    meta.id,
    channelNames,
  );
  try {
    const createGroupedTransaction = (
      { id, index }: $Values<typeof channels>,
      config: TxConfig,
    ) =>
      fork(createTransaction, id, {
        ...config,
        group: {
          key: 'approveUsers',
          id: meta.id,
          index,
        },
      });

    /*
     * Create all transactions for the group.
     */
    yield all(
      Object.keys(channels).map((id) =>
        createGroupedTransaction(channels[id], {
          context: ClientType.WhitelistClient,
          methodName: 'approveUsers',
          identifier: colonyAddress,
          params: [
            userAddresses.slice(
              channels[id].index * 100,
              channels[id].index * 100 + 100,
            ),
            status,
          ],
        }),
      ),
    );

    /*
     * Wait until all transactions are created.
     */
    yield all(
      Object.keys(channels).map((id) =>
        takeFrom(channels[id].channel, ActionTypes.TRANSACTION_CREATED),
      ),
    );

    /*
     * Wait until all transactions are succeeded.
     */
    yield all(
      Object.keys(channels).map((id) =>
        takeFrom(channels[id].channel, ActionTypes.TRANSACTION_SUCCEEDED),
      ),
    );

    yield put<AllActions>({
      type: ActionTypes.WHITELIST_UPDATE_SUCCESS,
      payload: {},
      meta,
    });
  } catch (error) {
    return yield putError(ActionTypes.WHITELIST_UPDATE_ERROR, error, meta);
  } finally {
    yield apolloClient.query<
      WhitelistedUsersQuery,
      WhitelistedUsersQueryVariables
    >({
      query: WhitelistedUsersDocument,
      variables: {
        colonyAddress,
      },
      fetchPolicy: 'network-only',
    });

    yield refreshExtension(colonyAddress, Extension.Whitelist);

    /*
     * Close all transaction channels.
     */
    yield all(
      Object.keys(channels).map((id) =>
        call([channels[id].channel, channels[id].channel.close]),
      ),
    );
  }
  return null;
}

export default function* updateWhitelistSaga() {
  yield takeEvery(ActionTypes.WHITELIST_UPDATE, updateWhitelist);
}
