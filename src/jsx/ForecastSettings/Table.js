import React from 'react';

export const Table = ({data}) => {
  let {columns, rows} = data
  columns = columns.map(column => ({...column, valueTransformFunction: column.valueTransformFunction || (value => value)}))
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(${columns.length}, 1fr)`,
      gridAutoRows: "minmax(20px, auto)"
    }}>
      {columns.map(({render: columnTitle}, index) =>
        <div style={{border: "1px solid black", padding: "3px", fontWeight: "bold", display: "flex", justifyContent: "center", alignItems: "center", textAlign: "center", gridColumn: index + 1, gridRow: 1}}>
          <div>
            {columnTitle}
          </div>
        </div>
      )}
      {rows.map((row, rowIndex) =>
        <>
          {columns.map((column, columnIndex) => 
            <div style={{border: "1px solid black", padding: "3px", display: "flex", justifyContent: "center", alignItems: "center", textAlign: "center", gridColumn: columnIndex + 1, gridRow: rowIndex + 2}}>
              <div>
                {column.valueTransformFunction(row[column.name])}
              </div>
            </div>
          )}
        </>
        
      )}
    </div>
  )
}

const TableRow = ({row, columns}) => {
  return (
    <div style={{display: "flex"}}>
      {columns.map(({width, name: columnName}) => <div style={{border: "1px solid black", flex: width, padding: "3px", textAlign: "center"}}>{row[columnName]}</div>)}
    </div>
  )
}