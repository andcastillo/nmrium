/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { v4 } from '@lukeed/uuid';
import {
  useRef,
  useState,
  useEffect,
  useCallback,
  Fragment,
  useMemo,
  CSSProperties,
  ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Rnd } from 'react-rnd';
import { TransitionGroup } from 'react-transition-group';

import Transition from '../Transition';
import Wrapper from '../Wrapper';
import { positions, transitions } from '../options';

import ConfirmDialog from './ConfirmDialog';
import { ModalProvider } from './Context';
import ModalContent from './ModalContent';

const transitionStyles: any = {
  [transitions.FADE]: {
    entering: { opacity: 0 },
    entered: { opacity: 1 },
  },
  [transitions.SCALE]: {
    entering: { transform: 'scale(0)' },
    entered: { transform: 'scale(1)' },
    exiting: { transform: 'scale(0)' },
    exited: { transform: 'scale(0)' },
  },
};

interface ProviderProps {
  children: ReactNode;
  style?: CSSProperties;
  offset?: string;
  position?: string;
  transition?: string;
  wrapperRef?: HTMLDivElement | null;
}

function Provider({
  children,
  style,
  offset = '0px',
  position = positions.MIDDLE,
  transition = transitions.SCALE,
  wrapperRef = null,
}: ProviderProps) {
  const root = useRef<any>();
  const modalRef = useRef<any>();
  const [modals, setModal] = useState<any>([]);

  useEffect(() => {
    root.current = document.createElement('div');
    const ref = root.current;
    if (wrapperRef) {
      wrapperRef.append(ref);
    }
    return () => {
      if (ref && wrapperRef) {
        ref.remove();
      }
    };
  }, [wrapperRef]);

  const close = useCallback(
    (modal?) => {
      setModal((prevModals) => {
        if (modal) {
          return prevModals.filter((m) => m.id !== modal.id);
        } else {
          return modals.slice(0, -1);
        }
      });
    },
    [modals],
  );
  // todo: optimize this
  const parentStyle = wrapperRef?.getBoundingClientRect() || {
    top: 0,
    left: 0,
    width: window.innerWidth,
    height: window.innerHeight,
  };

  /**
   *
   * @param {*} component  <component />
   * @param {object} options    {onYest:()=>{}, prop1, .... etc}
   * @param {transitions} options.transition
   * @param {positions} options.position
   * @param {boolean} options.isBackgroundBlur
   * @param {boolean} options.enableResizing
   */
  const show = useCallback(
    (component, options = {}) => {
      const _modal: any = {
        id: v4(),
        component,
        options: { isBackgroundBlur: true, enableResizing: false, ...options },
      };

      _modal.close = () => close(_modal);

      setModal((prevModals) => [...prevModals, _modal]);
      if (_modal.options.onOpen) _modal.options.onOpen();
      return _modal;
    },
    [close],
  );

  /**
   * @param {object} dialogOptions
   * @param {object} dialogOptions.message
   * @param {Array<{ handler: Function,text: string,style: object}>} dialogOptions.buttons
   * @param {object} dialogOptions.style
   */
  const showConfirmDialog = useCallback(
    (dialogOptions, options: any = {}) => {
      const { enableResizing = false, ...otherOptions } = options;
      const _modal: any = {
        id: v4(),
        component: <ConfirmDialog {...dialogOptions} />,
        options: { isBackgroundBlur: true, enableResizing, ...otherOptions },
      };

      _modal.close = () => close(_modal);

      setModal((prevModals) => [...prevModals, _modal]);
      if (_modal.options.onOpen) _modal.options.onOpen();

      return _modal;
    },
    [close],
  );

  useEffect(() => {
    function keyHandler(e) {
      if (['Escape', 'Esc'].includes(e.key)) {
        close();
      }
    }
    document.addEventListener('keydown', keyHandler, false);
    return () => document.removeEventListener('keydown', keyHandler, false);
  }, [close, modals]);

  const styles = css`
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: all;

    .handle {
      cursor: move;
    }

    .rnd-container {
      box-sizing: initial;
      background-color: #fff;
      box-shadow:
        0 0 0 0,
        0 8px 16px rgb(0 0 0 / 30%);
      border-radius: 5px;
    }
  `;

  const modalContextValue = useMemo(
    () => ({ show, close, showConfirmDialog }),
    [show, close, showConfirmDialog],
  );

  const contentLayoutHandler = useCallback(
    ({ modal, layout }) => {
      const width =
        modal.options.width ||
        (layout.width > parentStyle.width ? parentStyle.width : layout.width);
      const height =
        modal.options.height ||
        (layout.height > parentStyle.height
          ? parentStyle.height
          : layout.height);

      modalRef.current.updateSize({ width, height });
    },
    [parentStyle.height, parentStyle.width],
  );

  return (
    <ModalProvider value={modalContextValue}>
      {children}
      {root.current &&
        createPortal(
          <Fragment>
            {modals?.length > 0
              ? modals.map((modal) => (
                  <div
                    key={modal.id}
                    css={styles}
                    style={{
                      ...(modal?.options.isBackgroundBlur
                        ? { backgroundColor: 'rgba(255,255,255,0.8)' }
                        : { pointerEvents: 'none' }),
                    }}
                  >
                    <TransitionGroup
                      appear
                      key={positions[modal.options.transition || transition]}
                      options={{
                        position: modal.options.position || position,
                      }}
                      containerStyle={parentStyle}
                      component={Wrapper}
                    >
                      <Transition
                        type={modal.options.transition || transition}
                        transitionStyles={{
                          ...transitionStyles,
                          default: {
                            width: modal.options.width
                              ? `${modal.options.width}px`
                              : 'auto',
                          },
                          height: modal.options.height
                            ? `${modal.options.height}px`
                            : 'auto',
                        }}
                        key={modal.id}
                      >
                        <Rnd
                          maxWidth={parentStyle.width}
                          maxHeight={parentStyle.height}
                          ref={modalRef}
                          default={{
                            width: modal.options.width || 'auto',
                            height: modal.options.height || 'auto',
                            x: 0,
                            y: 0,
                          }}
                          className="rnd-container"
                          style={{
                            ...style,
                            margin: offset,
                            position: 'static',
                            pointerEvents: 'all',
                            userSelect: 'none',
                          }}
                          enableResizing={modal.options.enableResizing}
                          dragHandleClassName="handle"
                          enableUserSelectHack={false}
                        >
                          <ModalContent
                            modal={modal}
                            onClose={() => {
                              close(modal);
                            }}
                            onLayout={contentLayoutHandler}
                          />
                        </Rnd>
                      </Transition>
                    </TransitionGroup>
                  </div>
                ))
              : null}
          </Fragment>,
          root.current,
        )}
    </ModalProvider>
  );
}

export default Provider;
