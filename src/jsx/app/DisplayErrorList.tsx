import * as React from 'react';
import Snackbar, {SnackbarCloseReason} from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

type CloseHandler = (event?: React.SyntheticEvent | Event, reason?: SnackbarCloseReason) => void

const ErrorDisplayer = ({ errorDetails, onClose } : {errorDetails : string, onClose: CloseHandler}) => {
    return (
        <Snackbar sx={{ height: "100%" }} open={true} autoHideDuration={3000} onClose={onClose} anchorOrigin={{ vertical: 'top', horizontal: 'left' }}>
            <Alert
                severity="error"
                // variant="outlined"
                sx={{ width: '100%' }}
                onClose={() => {}}  // providing this should result in a close button showing
            >
                {errorDetails}
            </Alert>
        </Snackbar>
    )
}

const DisplayErrorList = ({errorList, onClose} : {errorList : string[], onClose: CloseHandler}) => {
    return (
        errorList.length > 0 && <ErrorDisplayer key={Date.now()+Math.random()} errorDetails={errorList[0]} onClose={onClose}/>
    )
}

export default DisplayErrorList