/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { useEffect, useState } from 'react';

import CloseButton from '../../elements/CloseButton';

const modalContainer = css`
  width: 220px;
  height: 270px;
  padding: 5px;
  text-align: center;

  button {
    flex: 2;
    padding: 5px;
    border: 1px solid gray;
    border-radius: 5px;
    height: 30px;
    margin: 0 auto;
    margin-top: 15px;
    display: block;
    width: 20%;
    color: white;
    background-color: gray;
  }

  button:focus {
    outline: none;
  }

  .header {
    height: 24px;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    align-items: center;

    span {
      color: #464646;
      font-size: 15px;
      flex: 1;
      user-select: none;
    }

    button {
      height: 36px;
      margin: 2px;
      background-color: transparent;
      border: none;

      svg {
        height: 16px;
      }
    }
  }

  table {
    margin-top: 10px;
    width: 100%;

    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
      appearance: none;
    }

    input {
      width: 100px;
      text-align: center;
      border-radius: 5px;
      border: 0.55px solid #c7c7c7;
    }
  }
`;

interface SetShiftToleranceModalProps {
  onClose: () => void;
  onSave?: (element: any) => void;
  previousTolerance: any;
}

export default function SetShiftToleranceModal({
  onClose,
  onSave,
  previousTolerance,
}: SetShiftToleranceModalProps) {
  const [tolerance, setTolerance] = useState<any>();
  const [isValid, setIsValid] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (previousTolerance) {
      setTolerance(previousTolerance);

      setIsValid(
        Object.fromEntries(
          Object.keys(previousTolerance).map((atomType) => [atomType, true]),
        ),
      );
    } else {
      setTolerance(undefined);
    }
  }, [previousTolerance]);

  function onSaveHandler() {
    onSave?.(tolerance);
    onClose?.();
  }

  function onChangeHandler(e, atomType: string) {
    const value: string = e.target.value;
    if (value.trim().length > 0) {
      setTolerance({ ...tolerance, [atomType]: Number(value) });
      setIsValid({ ...isValid, [atomType]: true });
    } else {
      setIsValid({ ...isValid, [atomType]: false });
    }
  }

  return (
    <div css={modalContainer}>
      <div className="header handle">
        <span>Set Shift Tolerances</span>
        <CloseButton onClick={onClose} />
      </div>

      <table>
        <thead>
          <tr>
            <th>Atom</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <Rows
            onChange={onChangeHandler}
            isValid={isValid}
            tolerance={tolerance}
          />
        </tbody>
      </table>
      <button
        type="button"
        onClick={onSaveHandler}
        disabled={Object.keys(isValid).some((atomType) => !isValid[atomType])}
      >
        Set
      </button>
    </div>
  );
}

function Rows({ tolerance, onChange, isValid }) {
  return Object.keys(tolerance).map((atomType) => {
    return (
      <tr key={`tolerance_${atomType}`}>
        <td>{atomType}</td>
        <td>
          <input
            type="number"
            onChange={(e) => onChange(e, atomType)}
            defaultValue={tolerance[atomType]}
            style={!isValid[atomType] ? { backgroundColor: 'orange' } : {}}
          />
        </td>
      </tr>
    );
  });
}
