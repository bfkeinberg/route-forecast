import PropTypes from "prop-types";
import React, { useState } from 'react';

const pickTabIndex = (column) => {
  if (!column.editable) return "-1";
  return "0"
};

const shouldAutoFocus = (row, column) => {
  return (column.name==='name' && row[column.name] === '');
};

export const Table = ({data, onCellValueChanged}) => {
  let {columns, rows} = data
  columns = columns.map(column => ({...column, valueTransformFunction: column.valueTransformFunction || (value => value)}))

  const baseStyle = {
    border: "1px solid black",
    padding: "3px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
  }
  const headerStyle = {...baseStyle, fontWeight: "bold"}

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(${columns.length}, 1fr)`,
      gridAutoRows: "minmax(20px, auto)",
      fontSize: "10px"
    }}>
      {columns.map(({render: columnTitle, name, headerStyle: customHeaderStyle}, index) =>
        <div key={name} style={{...headerStyle, ...customHeaderStyle, gridColumn: index + 1, gridRow: 1}}>
          <div>
            {columnTitle}
          </div>
        </div>
      )}
      {rows.map((row, rowIndex) =>
        <React.Fragment key={rowIndex}>
          {columns.map((column, columnIndex) =>
            <div key={column.name} style={{...baseStyle, ...column.cellStyle, gridColumn: columnIndex + 1, gridRow: rowIndex + 2}}>
              <Cell
                value={row[column.name]}
                transformFunction={column.valueTransformFunction}
                editable={column.editable}
                tabIndex={pickTabIndex(column)}
                autoFocus={shouldAutoFocus(row, column)}
                onCellValueChanged={(value) => onCellValueChanged(rowIndex, column.name, value)}
                editValidateFunction={column.editValidateFunction}
                editTransformFunction={column.editTransformFunction ? column.editTransformFunction : value => value}
                editCompleteFunction={column.editCompleteFunction ? column.editCompleteFunction : value => value}
              />
            </div>
          )}
        </React.Fragment>

      )}
    </div>
  )
}

Table.propTypes = {
  data: PropTypes.object.isRequired,
  onCellValueChanged:PropTypes.func.isRequired
};

const Cell = ({value, transformFunction, editTransformFunction, editCompleteFunction, editable, tabIndex, autoFocus, onCellValueChanged, editValidateFunction}) => {
  const [
    editingValue,
    setEditingValue
    ] = useState(null)
  const beginEditing = () => {
    if (editable) {
      setEditingValue(editTransformFunction(value))
    }
  }

  const endEditing = () => {
    onCellValueChanged(editCompleteFunction(editingValue !== '' ? editingValue : '-----'))
    setEditingValue(null)
  }

  const valueEdited = (value) => {
    if (editValidateFunction === undefined || editValidateFunction(value)) {
      setEditingValue(value)
    }
  }


  return (
    editingValue !== null ?
    <div>
      <input autoFocus value={editingValue} style={{width: "40px"}} onFocus={(event) => event.target.select()} onChange={(event) => valueEdited(event.target.value)} onBlur={endEditing}/>
    </div>    :
    <div autoFocus={autoFocus} ref={field => field && autoFocus && field.focus()} style={{cursor: editable ? "pointer" : "", width: "100%", height: "100%"}} tabIndex={tabIndex} onClick={beginEditing} onFocus={beginEditing}>
      {value !== undefined && transformFunction(value)}
    </div>
  )
}

Cell.propTypes = {
  value:PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.object
  ]),
  transformFunction:PropTypes.func.isRequired,
  editTransformFunction:PropTypes.func.isRequired,
  editCompleteFunction:PropTypes.func.isRequired,
  editable:PropTypes.bool,
  autoFocus:PropTypes.bool,
  onCellValueChanged:PropTypes.func.isRequired,
  editValidateFunction:PropTypes.func,
  tabIndex:PropTypes.string
};
