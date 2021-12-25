import React, { useState } from 'react';

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
      {columns.map(({render: columnTitle, name}, index) =>
        <div key={name} style={{...headerStyle, gridColumn: index + 1, gridRow: 1}}>
          <div>
            {columnTitle}
          </div>
        </div>
      )}
      {rows.map((row, rowIndex) =>
        <React.Fragment key={rowIndex}>
          {columns.map((column, columnIndex) => 
            <div key={column.name} style={{...baseStyle, gridColumn: columnIndex + 1, gridRow: rowIndex + 2}}>
              <Cell value={row[column.name]} transformFunction={column.valueTransformFunction} editable={column.editable} onCellValueChanged={(value) => onCellValueChanged(rowIndex, column.name, value)} />
            </div>
          )}
        </React.Fragment>
        
      )}
    </div>
  )
}

const Cell = ({value, transformFunction, editable, onCellValueChanged}) => {
  const [editing, setEditing] = useState(false)
  return (
    editing ? 
    <div>
      <input autoFocus onKeyPress={(event) => console.log(event.key)} value={value} style={{width: "40px"}} onChange={(event) => onCellValueChanged(event.target.value)} onBlur={() => setEditing(false)}/>
    </div>
    :
    <div style={{cursor: editable ? "pointer" : "", width: "100%", height: "100%"}} onClick={() => { if (editable) { setEditing(true) } }}>
      {transformFunction(value)}
    </div>
  )
}