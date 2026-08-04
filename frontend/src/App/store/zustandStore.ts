import { create } from 'zustand';

// Domain-style store, mirroring drafter's conventions at demo scale: actions live inside the
// store; components subscribe via the exported *_select selectors (useZustandStore(x_select))
interface ZustandState {
    clickCount: number;
    incrementClickCount: () => void
}

const useZustandStore = create<ZustandState>()(function (set) {
    return {
        clickCount: 0,
        incrementClickCount: function () {
            set(function (state) {
                return { clickCount: state.clickCount + 1 };
            });
        }
    };
});

const clickCount_select = function (state: ZustandState) {
    return state.clickCount;
};

const incrementClickCount_select = function (state: ZustandState) {
    return state.incrementClickCount;
};

export {
    clickCount_select,
    incrementClickCount_select,
    useZustandStore
};
