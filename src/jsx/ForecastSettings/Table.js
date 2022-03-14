import React, { useState } from 'react';
import PropTypes from "prop-types";

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
                onCellValueChanged={(value) => onCellValueChanged(rowIndex, column.name, value)}
                editValidateFunction={column.editValidateFunction}
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

const Cell = ({value, transformFunction, editable, onCellValueChanged, editValidateFunction}) => {
  const beginEditing = () => {
    if (editable) {
      setEditingValue(value)
    }
  }

  const endEditing = () => {
    onCellValueChanged(editingValue)
    setEditingValue(null)
  }

  const valueEdited = (value) => {
    if (editValidateFunction === undefined || editValidateFunction(value)) {
      setEditingValue(value)
    }
  }

  const [
editingValue,
setEditingValue
] = useState(null)
  return (
    editingValue !== null ?
    <div>
      <input autoFocus onKeyPress={(event) => {}/*console.log(event.key)*/} value={editingValue} style={{width: "40px"}} onChange={(event) => valueEdited(event.target.value)} onBlur={endEditing}/>
    </div>    :
    <div style={{cursor: editable ? "pointer" : "", width: "100%", height: "100%"}} onClick={beginEditing}>
      {value !== undefined && transformFunction(value)}
    </div>
  )
}

Cell.propTypes = {
  value:PropTypes.string.isRequired,
  transformFunction:PropTypes.func,
  editable:PropTypes.bool.isRequired,
  onCellValueChanged:PropTypes.func.isRequired,
  editValidateFunction:PropTypes.func
};
