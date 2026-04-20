import { all, fork } from 'redux-saga/effects';
import authSaga from './authSaga';
import meetingSaga from './meetingSaga';
import chatSaga from './chatSaga';

export default function* rootSaga() {
  yield all([
    fork(authSaga),
    fork(meetingSaga),
    fork(chatSaga),
  ]);
}
