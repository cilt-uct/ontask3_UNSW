import {
  OPEN_WORKFLOW_MODAL,
  CLOSE_WORKFLOW_MODAL,
  BEGIN_REQUEST_WORKFLOW,
  FAILURE_REQUEST_WORKFLOW,
  SUCCESS_REQUEST_WORKFLOW,

  REQUEST_WORKFLOW,
  RECEIVE_WORKFLOW,

  BEGIN_REQUEST_MODAL,
  FAILURE_REQUEST_MODAL,
  SUCCESS_REQUEST_MODAL,
  REFRESH_FORM_STATE,
  UPDATE_FORM_STATE,

  OPEN_FILTER_MODAL,
  CLOSE_FILTER_MODAL,

  OPEN_CONDITION_GROUP_MODAL,
  CLOSE_CONDITION_GROUP_MODAL,

  // REFRESH_CONDITION_GROUP_FORM_STATE,
  // UPDATE_CONDITION_GROUP_FORM_STATE,
  // BEGIN_REQUEST_CONDITION_GROUP,
  // FAILURE_REQUEST_CONDITION_GROUP,
  // SUCCESS_CREATE_CONDITION_GROUP,
  // SUCCESS_UPDATE_CONDITION_GROUP,
  // SUCCESS_DELETE_CONDITION_GROUP,

  // UPDATE_EDITOR_STATE,
  // BEGIN_REQUEST_CONTENT,
  // FAILURE_REQUEST_CONTENT,
  // SUCCESS_UPDATE_CONTENT,

  // BEGIN_REQUEST_PREVIEW_CONTENT,
  // FAILURE_REQUEST_PREVIEW_CONTENT,
  // SUCCESS_PREVIEW_CONTENT,
  // CLOSE_PREVIEW_CONTENT,

  // FAILURE_CREATE_SCHEDULE,
  // SUCCESS_CREATE_SCHEDULE,

  // BEGIN_SEND_EMAIL,
  // SUCCESS_SEND_EMAIL,
  // FAILURE_SEND_EMAIL,
  // CLEAR_SEND_EMAIL

} from './WorkflowActions';

import _ from 'lodash';


function workflow(state = {}, action) {
  switch (action.type) {
    case OPEN_WORKFLOW_MODAL:
      return Object.assign({}, state, {
        visible: true,
        containerId: action.containerId,
        views: action.views
      });
    case CLOSE_WORKFLOW_MODAL:
      return Object.assign({}, state, {
        visible: false,
        error: null,
        loading: false,
        containerId: null,
        views: null
      });

    case BEGIN_REQUEST_WORKFLOW:
      return Object.assign({}, state, {
        loading: true
      });
    case FAILURE_REQUEST_WORKFLOW:
      return Object.assign({}, state, {
        loading: false,
        error: action.error
      });
    case SUCCESS_REQUEST_WORKFLOW:
      return Object.assign({}, state, {
        visible: false,
        loading: false,
        error: null,
        containerId: null
      });

    case REQUEST_WORKFLOW:
      return Object.assign({}, state, {
        isFetching: true
      });
    case RECEIVE_WORKFLOW:
      return Object.assign({}, state, {
        isFetching: false,
        workflow: action.workflow,
        editorState: action.editorState
      });

    case BEGIN_REQUEST_MODAL:
      return Object.assign({}, state, {
        modalLoading: true
      });
    case FAILURE_REQUEST_MODAL:
      return Object.assign({}, state, {
        modalLoading: false,
        modalError: action.error
      });
    case SUCCESS_REQUEST_MODAL:
      return Object.assign({}, state, {
        modalLoading: false,
        modalError: null,
        formState: null,
        filterModalVisible: false,
        conditionGroupModalVisible: false
      });

    // Used when a condition or formula is added to a condition group/filter
    case REFRESH_FORM_STATE:
      return Object.assign({}, state, {
        formState: action.payload
      });
    // Used when a field is changed in the condition group/filter form
    case UPDATE_FORM_STATE:
      return Object.assign({}, state, {
        // By design in ant design forms, if a field belonging to a list is updated, then the payload is given by:
        // [null, null, updated_field, null] where null are the unchanged fields in the list
        // Therefore, when updating the form state we must ensure that the null fields do not overwrite the values of those fields in the state
        // This is handled by the merge function from lodash, a third party plugin
        formState: _.merge(state.formState, action.payload)
      });
    
    case OPEN_FILTER_MODAL:
      return Object.assign({}, state, {
        filterModalVisible: true,
        formState: action.formState
      });
    case CLOSE_FILTER_MODAL:
      return Object.assign({}, state, {
        filterModalVisible: false,
        modalError: null,
        modalLoading: false,
        formState: null
      });

    case OPEN_CONDITION_GROUP_MODAL:
      return Object.assign({}, state, {
        conditionGroupModalVisible: true,
        formState: action.formState,
        conditionGroup: action.conditionGroup
      });
    case CLOSE_CONDITION_GROUP_MODAL:
      return Object.assign({}, state, {
        conditionGroupModalVisible: false,
        modalError: null,
        modalLoading: false,
        formState: null,
        conditionGroup: null
      });

    // // Scheduler Actions
    // case FAILURE_CREATE_SCHEDULE:
    //   return Object.assign({}, state, {
    //     scheduleLoading: false,
    //     scheduleError: action.error
    //   });
    // case SUCCESS_CREATE_SCHEDULE:
    //   return Object.assign({}, state, {
    //     scheduleLoading: false,
    //     scheduleError: null
    //   });

    // // Compose actions
    // case UPDATE_EDITOR_STATE:
    //   return Object.assign({}, state, {
    //     actionEditorState: action.payload
    //   });
    // case BEGIN_REQUEST_CONTENT:
    //   return Object.assign({}, state, {
    //     actionContentLoading: true
    //   });
    // case FAILURE_REQUEST_CONTENT:
    //   return Object.assign({}, state, {
    //     actionContentLoading: false,
    //     actionContentError: action.error
    //   });
    // case SUCCESS_UPDATE_CONTENT:
    //   return Object.assign({}, state, {
    //     actionContentLoading: false,
    //     actionContentError: null,
    //     didUpdate: true,
    //     model: 'content'
    //   });
    // case BEGIN_REQUEST_PREVIEW_CONTENT:
    //   return Object.assign({}, state, {
    //     previewContentLoading: true
    //   });
    // case FAILURE_REQUEST_PREVIEW_CONTENT:
    //   return Object.assign({}, state, {
    //     previewContentLoading: false,
    //     actionContentError: action.error
    //   });
    // case SUCCESS_PREVIEW_CONTENT:
    //   return Object.assign({}, state, {
    //     previewContentLoading: false,
    //     actionContentError: null,
    //     previewContentModalVisible: true,
    //     previewContent: action.preview
    //   });
    // case CLOSE_PREVIEW_CONTENT:
    //   return Object.assign({}, state, {
    //     previewContentModalVisible: false,
    //     previewContent: null
    //   });
    
    // // Action actions
    // case BEGIN_SEND_EMAIL:
    //   return Object.assign({}, state, {
    //     emailLoading: true,
    //     emailError: null
    //   });
    // case FAILURE_SEND_EMAIL:
    //   return Object.assign({}, state, {
    //     emailLoading: false,
    //     emailError: action.error
    //   });
    // case SUCCESS_SEND_EMAIL:
    //   return Object.assign({}, state, {
    //     emailLoading: false,
    //     emailError: null,
    //     emailSuccess: true
    //   });
    // case CLEAR_SEND_EMAIL:
    //   return Object.assign({}, state, {
    //     emailSuccess: false
    //   });
    default:
      return state;
  }
};

export default workflow;
