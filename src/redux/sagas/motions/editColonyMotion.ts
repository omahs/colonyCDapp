import { call, fork, put, takeEvery } from 'redux-saga/effects';
import { ClientType, Id, getChildIndex } from '@colony/colony-js';
import { AddressZero } from '@ethersproject/constants';

import { ActionTypes } from '../../actionTypes';
import { AllActions, Action } from '../../types/actions';
import {
  putError,
  takeFrom,
  routeRedirect,
  uploadIfpsAnnotation,
  getColonyManager,
} from '../utils';

import {
  createTransaction,
  createTransactionChannels,
  getTxChannel,
} from '../transactions';
import { ipfsUpload } from '../ipfs';
import {
  transactionReady,
  transactionPending,
  transactionAddParams,
} from '../../actionCreators';

function* editColonyMotion({
  payload: {
    colonyAddress,
    colonyName,
    colonyDisplayName,
    colonyAvatarImage,
    colonyAvatarHash,
    hasAvatarChanged,
    colonyTokens = [],
    annotationMessage,
  },
  meta: { id: metaId, history },
  meta,
}: Action<ActionTypes.MOTION_EDIT_COLONY>) {
  let txChannel;
  try {
    /*
     * Validate the required values
     */
    if (!colonyDisplayName && colonyDisplayName !== null) {
      throw new Error('A colony name is required in order to edit the colony');
    }

    const context = yield getColonyManager();
    const colonyClient = yield context.getClient(
      ClientType.ColonyClient,
      colonyAddress,
    );

    const childSkillIndex = yield call(
      getChildIndex,
      colonyClient,
      Id.RootDomain,
      Id.RootDomain,
    );

    const { skillId } = yield call(
      [colonyClient, colonyClient.getDomain],
      Id.RootDomain,
    );

    const { key, value, branchMask, siblings } = yield call(
      colonyClient.getReputation,
      skillId,
      AddressZero,
    );

    txChannel = yield call(getTxChannel, metaId);

    // setup batch ids and channels
    const batchKey = 'createMotion';

    const { createMotion, annotateEditColonyMotion } =
      yield createTransactionChannels(metaId, [
        'createMotion',
        'annotateEditColonyMotion',
      ]);

    /*
     * Upload colony metadata to IPFS
     *
     * @NOTE Only (re)upload the avatar if it has changed, otherwise just use
     * the old hash.
     * This cuts down on some transaction signing wait time, since IPFS uplaods
     * tend to be on the slower side :(
     */
    let colonyAvatarIpfsHash = null;
    if (colonyAvatarImage && hasAvatarChanged) {
      colonyAvatarIpfsHash = yield call(
        ipfsUpload,
        JSON.stringify({
          image: colonyAvatarImage,
        }),
      );
    }

    /*
     * Upload colony metadata to IPFS
     */
    let colonyMetadataIpfsHash = null;
    colonyMetadataIpfsHash = yield call(
      ipfsUpload,
      JSON.stringify({
        colonyDisplayName,
        colonyAvatarHash: hasAvatarChanged
          ? colonyAvatarIpfsHash
          : colonyAvatarHash,
        colonyTokens,
      }),
    );

    const encodedAction = colonyClient.interface.encodeFunctionData(
      'editColony',
      [colonyMetadataIpfsHash],
    );

    // create transactions
    yield fork(createTransaction, createMotion.id, {
      context: ClientType.VotingReputationClient,
      methodName: 'createMotion',
      identifier: colonyAddress,
      params: [
        Id.RootDomain,
        childSkillIndex,
        AddressZero,
        encodedAction,
        key,
        value,
        branchMask,
        siblings,
      ],
      group: {
        key: batchKey,
        id: metaId,
        index: 0,
      },
      ready: false,
    });

    if (annotationMessage) {
      yield fork(createTransaction, annotateEditColonyMotion.id, {
        context: ClientType.ColonyClient,
        methodName: 'annotateTransaction',
        identifier: colonyAddress,
        params: [],
        group: {
          key: batchKey,
          id: metaId,
          index: 1,
        },
        ready: false,
      });
    }

    yield takeFrom(createMotion.channel, ActionTypes.TRANSACTION_CREATED);
    if (annotationMessage) {
      yield takeFrom(
        annotateEditColonyMotion.channel,
        ActionTypes.TRANSACTION_CREATED,
      );
    }

    yield put(transactionReady(createMotion.id));

    const {
      payload: { hash: txHash },
    } = yield takeFrom(
      createMotion.channel,
      ActionTypes.TRANSACTION_HASH_RECEIVED,
    );
    yield takeFrom(createMotion.channel, ActionTypes.TRANSACTION_SUCCEEDED);

    if (annotationMessage) {
      const ipfsHash = yield call(uploadIfpsAnnotation, annotationMessage);
      yield put(transactionPending(annotateEditColonyMotion.id));

      yield put(
        transactionAddParams(annotateEditColonyMotion.id, [txHash, ipfsHash]),
      );

      yield put(transactionReady(annotateEditColonyMotion.id));

      yield takeFrom(
        annotateEditColonyMotion.channel,
        ActionTypes.TRANSACTION_SUCCEEDED,
      );
    }
    yield put<AllActions>({
      type: ActionTypes.MOTION_EDIT_COLONY_SUCCESS,
      meta,
    });

    if (colonyName) {
      yield routeRedirect(`/colony/${colonyName}/tx/${txHash}`, history);
    }
  } catch (caughtError) {
    putError(ActionTypes.MOTION_EDIT_COLONY_ERROR, caughtError, meta);
  } finally {
    txChannel.close();
  }
}

export default function* editColonyMotionSaga() {
  yield takeEvery(ActionTypes.MOTION_EDIT_COLONY, editColonyMotion);
}
