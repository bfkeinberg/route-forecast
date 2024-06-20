import React from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const ErrorDisplayer = ({ errorDetails, onClose }) => {
    return (
        <Snackbar open={true} autoHideDuration={6000} onClose={onClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
            <Alert
                severity="error"
                variant="outlined"
                sx={{ width: '100%' }}
            >
                {errorDetails}
            </Alert>
        </Snackbar>
    )
}

const DisplayErrorList = ({errorList, onClose}) => {
    return (
        errorList.length > 0 && <ErrorDisplayer key={Date.now()+Math.random()} errorDetails={errorList[0]} onClose={onClose}/>
    )
}

export default DisplayErrorList