import { createStore, applyMiddleware, compose } from "redux";
import thunk from "redux-thunk";
import { changeURLMiddleware } from "../middleware/changeURL";
import rootReducer from "../reducers";
import { loggingMiddleware } from "../middleware/logActions"; // eslint-disable-line no-unused-vars

const configureStore = (initialState) => {
  const middleware = [
    thunk,
    changeURLMiddleware, // eslint-disable-line comma-dangle
    // loggingMiddleware
  ];
  const composedEnhancers = compose(
    applyMiddleware(...middleware),
    window.devToolsExtension ? window.devToolsExtension() : (f) => f
  );
  const store = createStore(rootReducer, initialState, composedEnhancers);
  if (process.env.NODE_ENV !== 'production' && module.hot) {
    // console.log("hot reducer reload"); // eslint-disable-line
    module.hot.accept('../reducers', () => {
      const nextRootReducer = require('../reducers/index');  // eslint-disable-line global-require
      store.replaceReducer(nextRootReducer);
    });
  }
  return store;
};

export default configureStore;  
