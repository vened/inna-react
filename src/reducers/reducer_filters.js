import { LOAD_HOTEL_FILTERS } from '../constants/ActionTypes';

export default function reducerFilters(state = null, action = null) {
    switch (action.type) {
        case LOAD_HOTEL_FILTERS:
            return state;
        default:
            return state;
    }
}
